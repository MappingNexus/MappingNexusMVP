import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { logAction } from '../services/audit.service.js';
import {
    buildGoogleAuthUrl,
    buildOutlookAuthUrl,
    disconnectCalendarProvider,
    exchangeGoogleCodeForRefreshToken,
    exchangeOutlookCodeForRefreshToken,
    getCalendarConnectionStatus,
    getCalendarRedirectUri,
    isCalendarProvider,
    storeCalendarRefreshToken,
    syncOwnCalendar,
    type CalendarProvider,
} from '../services/calendar-sync.service.js';

const router = Router();
const providerParamsSchema = z.object({
    provider: z.enum(['google', 'outlook']),
});

type CalendarState = {
    provider: CalendarProvider;
    userId: string;
    companyId: string;
    employeeId: string;
    exp: number;
};

router.get('/status', requireAuth, requireRole('employee'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const employee = await getEmployeeForUser(user.userId, user.companyId);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee profile not found.' });
        }

        const status = await getCalendarConnectionStatus(employee.employee_id, user.companyId);
        res.json({ success: true, status });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Unable to load calendar status.' });
    }
});

router.get('/:provider/auth-url', requireAuth, requireRole('employee'), async (req: Request, res: Response) => {
    try {
        const parsed = providerParamsSchema.safeParse(req.params);
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: 'Unsupported calendar provider.' });
        }

        const user = (req as AuthenticatedRequest).user;
        const provider = parsed.data.provider;
        const employee = await getEmployeeForUser(user.userId, user.companyId);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee profile not found.' });
        }

        const state = signCalendarState({
            provider,
            userId: user.userId,
            companyId: user.companyId,
            employeeId: employee.employee_id,
            exp: Date.now() + 10 * 60 * 1000,
        });
        const redirectUri = getCalendarRedirectUri(provider, req);
        const authorizationUrl = provider === 'google'
            ? buildGoogleAuthUrl(state, redirectUri)
            : buildOutlookAuthUrl(state, redirectUri);

        res.json({ success: true, authorizationUrl });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Unable to start calendar authorization.',
        });
    }
});

router.get('/:provider/callback', async (req: Request, res: Response) => {
    const provider = String(req.params.provider || '');
    if (!isCalendarProvider(provider)) {
        return redirectCalendarResult(res, 'error');
    }

    try {
        const code = typeof req.query.code === 'string' ? req.query.code : '';
        const stateValue = typeof req.query.state === 'string' ? req.query.state : '';
        if (!code || !stateValue) {
            return redirectCalendarResult(res, `${provider}-error`);
        }

        const state = verifyCalendarState(stateValue);
        if (state.provider !== provider) {
            return redirectCalendarResult(res, `${provider}-error`);
        }

        const redirectUri = getCalendarRedirectUri(provider, req);
        const refreshToken = provider === 'google'
            ? await exchangeGoogleCodeForRefreshToken(code, redirectUri)
            : await exchangeOutlookCodeForRefreshToken(code, redirectUri);

        await storeCalendarRefreshToken(provider, state.employeeId, state.companyId, refreshToken);
        await logAction({
            actorId: state.userId,
            actorRole: 'employee',
            action: 'calendar_connected',
            targetId: state.employeeId,
            companyId: state.companyId,
            metadata: { provider },
        });

        return redirectCalendarResult(res, `${provider}-connected`);
    } catch {
        return redirectCalendarResult(res, `${provider}-error`);
    }
});

router.post('/:provider/sync', requireAuth, requireRole('employee'), async (req: Request, res: Response) => {
    try {
        const parsed = providerParamsSchema.safeParse(req.params);
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: 'Unsupported calendar provider.' });
        }

        const user = (req as AuthenticatedRequest).user;
        const employee = await getEmployeeForUser(user.userId, user.companyId);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee profile not found.' });
        }

        const result = await syncOwnCalendar(parsed.data.provider, employee.employee_id, user.companyId, 30);
        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: 'calendar_synced',
            targetId: employee.employee_id,
            companyId: user.companyId,
            metadata: { provider: parsed.data.provider, count: result.syncedWindows },
        });

        res.json({ success: true, ...result });
    } catch (error: any) {
        // Always log the real error server-side so it's visible in backend logs
        console.error('[calendar/sync] Error syncing calendar:', error?.message || error);
        const publicMessage = publicCalendarError(error);
        // In development, surface the raw error message to the frontend for easier debugging
        const devMessage = env.IS_DEV ? (error?.message || publicMessage) : publicMessage;
        res.status(400).json({ success: false, message: devMessage });
    }
});

router.delete('/:provider', requireAuth, requireRole('employee'), async (req: Request, res: Response) => {
    try {
        const parsed = providerParamsSchema.safeParse(req.params);
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: 'Unsupported calendar provider.' });
        }

        const user = (req as AuthenticatedRequest).user;
        const employee = await getEmployeeForUser(user.userId, user.companyId);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee profile not found.' });
        }

        await disconnectCalendarProvider(parsed.data.provider, employee.employee_id, user.companyId);
        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: 'calendar_disconnected',
            targetId: employee.employee_id,
            companyId: user.companyId,
            metadata: { provider: parsed.data.provider },
        });

        res.json({ success: true, message: 'Calendar disconnected.' });
    } catch {
        res.status(500).json({ success: false, message: 'Unable to disconnect calendar.' });
    }
});

async function getEmployeeForUser(userId: string, companyId: string) {
    const result = await pool.query(
        `SELECT employee_id
         FROM public.employees
         WHERE user_id = $1
           AND company_id = $2
           AND is_archived IS FALSE
         LIMIT 1`,
        [userId, companyId]
    );

    return result.rows[0] || null;
}

function signCalendarState(state: CalendarState): string {
    const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', env.JWT_SECRET)
        .update(payload)
        .digest('base64url');
    return `${payload}.${signature}`;
}

function verifyCalendarState(value: string): CalendarState {
    const [payload, signature] = value.split('.');
    if (!payload || !signature) {
        throw new Error('Invalid OAuth state.');
    }

    const expected = crypto
        .createHmac('sha256', env.JWT_SECRET)
        .update(payload)
        .digest('base64url');
    if (signature.length !== expected.length) {
        throw new Error('Invalid OAuth state signature.');
    }
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        throw new Error('Invalid OAuth state signature.');
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as CalendarState;
    if (!isCalendarProvider(decoded.provider) || decoded.exp < Date.now()) {
        throw new Error('Expired OAuth state.');
    }

    return decoded;
}

function redirectCalendarResult(res: Response, result: string) {
    const frontend = env.FRONTEND_URL || 'http://localhost:5173';
    const url = new URL('/employee/profile', frontend);
    url.searchParams.set('calendar', result);
    return res.redirect(url.toString());
}

function publicCalendarError(error: any): string {
    const message = typeof error?.message === 'string' ? error.message : '';
    if (message.includes('not connected') || message.includes('not configured')) {
        return message;
    }
    return 'Calendar sync failed. Please reconnect your calendar or try again later.';
}

export default router;
