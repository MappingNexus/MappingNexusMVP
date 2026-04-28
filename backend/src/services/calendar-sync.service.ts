import crypto from 'crypto';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { decrypt, encrypt } from './encryption.service.js';

export type CalendarProvider = 'google' | 'outlook';

type CalendarWindow = {
    sourceEventId: string;
    startDate: string;
    endDate: string;
};

type ConnectedEmployee = {
    employee_id: string;
    company_id: string;
    google_refresh_token_encrypted: string | null;
    outlook_refresh_token_encrypted: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly'];
const OUTLOOK_SCOPES = ['offline_access', 'User.Read', 'Calendars.Read'];

export function isCalendarProvider(value: string): value is CalendarProvider {
    return value === 'google' || value === 'outlook';
}

export function getCalendarRedirectUri(provider: CalendarProvider, req?: { protocol: string; get(name: string): string | undefined }): string {
    const configured = provider === 'google'
        ? env.GOOGLE_CALENDAR_REDIRECT_URI
        : env.MICROSOFT_CALENDAR_REDIRECT_URI;
    if (configured) return configured;

    if (!req) return '';
    return `${req.protocol}://${req.get('host')}/api/calendar/${provider}/callback`;
}

export function assertProviderConfigured(provider: CalendarProvider) {
    if (provider === 'google') {
        if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID.includes('placeholder') || !env.GOOGLE_CLIENT_SECRET) {
            throw new Error('Google Calendar OAuth is not configured.');
        }
        return;
    }

    if (!env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET) {
        throw new Error('Microsoft Calendar OAuth is not configured.');
    }
}

export function createGoogleOAuthClient(redirectUri: string): OAuth2Client {
    return new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );
}

export function buildGoogleAuthUrl(state: string, redirectUri: string): string {
    assertProviderConfigured('google');
    const oauth2Client = createGoogleOAuthClient(redirectUri);
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: GOOGLE_SCOPES,
        state,
    });
}

export function buildOutlookAuthUrl(state: string, redirectUri: string): string {
    assertProviderConfigured('outlook');
    const params = new URLSearchParams({
        client_id: env.MICROSOFT_CLIENT_ID,
        response_type: 'code',
        redirect_uri: redirectUri,
        response_mode: 'query',
        scope: OUTLOOK_SCOPES.join(' '),
        state,
    });

    return `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeGoogleCodeForRefreshToken(code: string, redirectUri: string): Promise<string> {
    assertProviderConfigured('google');
    const oauth2Client = createGoogleOAuthClient(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
        throw new Error('Google did not return a refresh token. Re-consent may be required.');
    }
    return tokens.refresh_token;
}

export async function exchangeOutlookCodeForRefreshToken(code: string, redirectUri: string): Promise<string> {
    assertProviderConfigured('outlook');
    const response = await fetchMicrosoftToken({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
    });

    if (!response.refresh_token) {
        throw new Error('Microsoft did not return a refresh token. Re-consent may be required.');
    }

    return response.refresh_token;
}

export async function storeCalendarRefreshToken(
    provider: CalendarProvider,
    employeeId: string,
    companyId: string,
    refreshToken: string
) {
    const encryptedToken = await encrypt(refreshToken, companyId);
    const tokenColumn = provider === 'google'
        ? 'google_refresh_token_encrypted'
        : 'outlook_refresh_token_encrypted';
    const connectedColumn = provider === 'google'
        ? 'google_calendar_connected_at'
        : 'outlook_calendar_connected_at';

    await pool.query(
        `UPDATE public.employees
         SET ${tokenColumn} = $1,
             ${connectedColumn} = now(),
             updated_at = now()
         WHERE employee_id = $2 AND company_id = $3`,
        [encryptedToken, employeeId, companyId]
    );
}

export async function disconnectCalendarProvider(provider: CalendarProvider, employeeId: string, companyId: string) {
    const tokenColumn = provider === 'google'
        ? 'google_refresh_token_encrypted'
        : 'outlook_refresh_token_encrypted';
    const connectedColumn = provider === 'google'
        ? 'google_calendar_connected_at'
        : 'outlook_calendar_connected_at';
    const syncedColumn = provider === 'google'
        ? 'google_calendar_last_synced_at'
        : 'outlook_calendar_last_synced_at';
    const errorColumn = provider === 'google'
        ? 'google_calendar_last_sync_error'
        : 'outlook_calendar_last_sync_error';

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `UPDATE public.employees
             SET ${tokenColumn} = NULL,
                 ${connectedColumn} = NULL,
                 ${syncedColumn} = NULL,
                 ${errorColumn} = NULL,
                 updated_at = now()
             WHERE employee_id = $1 AND company_id = $2`,
            [employeeId, companyId]
        );
        await client.query(
            `DELETE FROM public.availability_window
             WHERE employee_id = $1
               AND company_id = $2
               AND source = 'calendar'
               AND source_provider = $3
               AND end_date >= CURRENT_DATE`,
            [employeeId, companyId, provider]
        );
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function getCalendarConnectionStatus(employeeId: string, companyId: string) {
    const result = await pool.query(
        `SELECT
            google_refresh_token_encrypted IS NOT NULL AS google_connected,
            outlook_refresh_token_encrypted IS NOT NULL AS outlook_connected,
            google_calendar_connected_at,
            outlook_calendar_connected_at,
            google_calendar_last_synced_at,
            outlook_calendar_last_synced_at,
            google_calendar_last_sync_error,
            outlook_calendar_last_sync_error
         FROM public.employees
         WHERE employee_id = $1 AND company_id = $2
         LIMIT 1`,
        [employeeId, companyId]
    );

    const row = result.rows[0] || {};
    return {
        google: {
            connected: Boolean(row.google_connected),
            connectedAt: row.google_calendar_connected_at || null,
            lastSyncedAt: row.google_calendar_last_synced_at || null,
            lastSyncError: row.google_calendar_last_sync_error || null,
        },
        outlook: {
            connected: Boolean(row.outlook_connected),
            connectedAt: row.outlook_calendar_connected_at || null,
            lastSyncedAt: row.outlook_calendar_last_synced_at || null,
            lastSyncError: row.outlook_calendar_last_sync_error || null,
        },
    };
}

export async function syncOwnCalendar(provider: CalendarProvider, employeeId: string, companyId: string, days = 30) {
    const tokenColumn = provider === 'google'
        ? 'google_refresh_token_encrypted'
        : 'outlook_refresh_token_encrypted';
    const result = await pool.query(
        `SELECT ${tokenColumn} AS refresh_token_encrypted
         FROM public.employees
         WHERE employee_id = $1 AND company_id = $2
         LIMIT 1`,
        [employeeId, companyId]
    );
    const encryptedToken = result.rows[0]?.refresh_token_encrypted;
    if (!encryptedToken) {
        throw new Error(`${provider} calendar is not connected.`);
    }

    return syncEmployeeCalendar(provider, employeeId, companyId, encryptedToken, days);
}

export async function syncAllConnectedCalendars(days = 30): Promise<{ employeesScanned: number; synced: number; failed: number }> {
    const result = await pool.query<ConnectedEmployee>(
        `SELECT e.employee_id,
                e.company_id,
                e.google_refresh_token_encrypted,
                e.outlook_refresh_token_encrypted
         FROM public.employees e
         JOIN public.users u ON u.user_id = e.user_id
         WHERE e.is_archived IS FALSE
           AND u.status = 'active'
           AND (
                e.google_refresh_token_encrypted IS NOT NULL
                OR e.outlook_refresh_token_encrypted IS NOT NULL
           )`
    );

    let synced = 0;
    let failed = 0;
    for (const employee of result.rows) {
        for (const provider of ['google', 'outlook'] as CalendarProvider[]) {
            const encryptedToken = provider === 'google'
                ? employee.google_refresh_token_encrypted
                : employee.outlook_refresh_token_encrypted;
            if (!encryptedToken) continue;

            try {
                await syncEmployeeCalendar(provider, employee.employee_id, employee.company_id, encryptedToken, days);
                synced += 1;
            } catch (error: any) {
                failed += 1;
                await markProviderSyncFailure(provider, employee.employee_id, employee.company_id, error);
            }
        }
    }

    return { employeesScanned: result.rowCount || 0, synced, failed };
}

export async function syncEmployeeCalendar(
    provider: CalendarProvider,
    employeeId: string,
    companyId: string,
    encryptedRefreshToken: string,
    days = 30
): Promise<{ syncedWindows: number }> {
    const refreshToken = await decrypt(encryptedRefreshToken, companyId);
    const start = new Date();
    const end = new Date(start.getTime() + days * DAY_MS);
    const syncRunId = crypto.randomUUID();

    const { windows, rotatedRefreshToken } = provider === 'google'
        ? { windows: await fetchGoogleAvailabilityWindows(refreshToken, start, end), rotatedRefreshToken: null }
        : await fetchOutlookAvailabilityWindows(refreshToken, start, end);

    await replaceCalendarWindows({
        provider,
        employeeId,
        companyId,
        windows,
        syncRunId,
        rotatedRefreshToken,
    });

    return { syncedWindows: windows.length };
}

async function fetchGoogleAvailabilityWindows(refreshToken: string, start: Date, end: Date): Promise<CalendarWindow[]> {
    assertProviderConfigured('google');
    const oauth2Client = createGoogleOAuthClient(env.GOOGLE_CALENDAR_REDIRECT_URI);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        showDeleted: false,
    });

    return (response.data.items || [])
        .filter(event => event.status !== 'cancelled')
        .filter(event => {
            const range = getGoogleEventRange(event);
            if (!range) return false;
            const isOutOfOffice = event.eventType === 'outOfOffice';
            const isBusy = event.transparency !== 'transparent';
            return isOutOfOffice || (isBusy && range.durationMs > DAY_MS);
        })
        .map(event => {
            const range = getGoogleEventRange(event);
            if (!range) return null;
            return {
                sourceEventId: event.id || crypto.randomUUID(),
                startDate: range.startDate,
                endDate: range.endDate,
            };
        })
        .filter((window): window is CalendarWindow => Boolean(window));
}

async function fetchOutlookAvailabilityWindows(
    refreshToken: string,
    start: Date,
    end: Date
): Promise<{ windows: CalendarWindow[]; rotatedRefreshToken: string | null }> {
    assertProviderConfigured('outlook');
    const tokenResponse = await fetchMicrosoftToken({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    });

    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendarView?${new URLSearchParams({
            startDateTime: start.toISOString(),
            endDateTime: end.toISOString(),
            '$select': 'id,showAs,start,end,isAllDay',
            '$orderby': 'start/dateTime',
            '$top': '250',
        }).toString()}`,
        {
            headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
                Prefer: 'outlook.timezone="UTC"',
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Microsoft Graph calendar request failed with status ${response.status}.`);
    }

    const payload = await response.json() as { value?: any[] };
    const windows = (payload.value || [])
        .filter(event => event.showAs === 'oof' || event.showAs === 'busy')
        .filter(event => {
            const range = getOutlookEventRange(event);
            return event.showAs === 'oof' || Boolean(range && range.durationMs > DAY_MS);
        })
        .map(event => {
            const range = getOutlookEventRange(event);
            if (!range) return null;
            return {
                sourceEventId: event.id || crypto.randomUUID(),
                startDate: range.startDate,
                endDate: range.endDate,
            };
        })
        .filter((window): window is CalendarWindow => Boolean(window));

    return {
        windows,
        rotatedRefreshToken: tokenResponse.refresh_token || null,
    };
}

async function replaceCalendarWindows(params: {
    provider: CalendarProvider;
    employeeId: string;
    companyId: string;
    windows: CalendarWindow[];
    syncRunId: string;
    rotatedRefreshToken: string | null;
}) {
    const { provider, employeeId, companyId, windows, syncRunId, rotatedRefreshToken } = params;
    const syncedColumn = provider === 'google'
        ? 'google_calendar_last_synced_at'
        : 'outlook_calendar_last_synced_at';
    const errorColumn = provider === 'google'
        ? 'google_calendar_last_sync_error'
        : 'outlook_calendar_last_sync_error';
    const tokenColumn = provider === 'google'
        ? 'google_refresh_token_encrypted'
        : 'outlook_refresh_token_encrypted';
    const encryptedRotatedToken = rotatedRefreshToken
        ? await encrypt(rotatedRefreshToken, companyId)
        : null;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `DELETE FROM public.availability_window
             WHERE employee_id = $1
               AND company_id = $2
               AND source = 'calendar'
               AND source_provider = $3
               AND end_date >= CURRENT_DATE`,
            [employeeId, companyId, provider]
        );

        if (windows.length > 0) {
            const values: any[] = [];
            const placeholders = windows.map((window, index) => {
                const offset = index * 9;
                values.push(
                    employeeId,
                    companyId,
                    'holiday',
                    window.startDate,
                    window.endDate,
                    `Synced from ${provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'}`,
                    provider,
                    window.sourceEventId,
                    syncRunId
                );
                return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, 'calendar', $${offset + 7}, $${offset + 8}, $${offset + 9})`;
            });

            await client.query(
                `INSERT INTO public.availability_window
                    (employee_id, company_id, window_type, start_date, end_date, note, source, source_provider, source_event_id, sync_run_id)
                 VALUES ${placeholders.join(', ')}`,
                values
            );
        }

        if (encryptedRotatedToken) {
            await client.query(
                `UPDATE public.employees
                 SET ${tokenColumn} = $1,
                     ${syncedColumn} = now(),
                     ${errorColumn} = NULL,
                     updated_at = now()
                 WHERE employee_id = $2 AND company_id = $3`,
                [encryptedRotatedToken, employeeId, companyId]
            );
        } else {
            await client.query(
                `UPDATE public.employees
                 SET ${syncedColumn} = now(),
                     ${errorColumn} = NULL,
                     updated_at = now()
                 WHERE employee_id = $1 AND company_id = $2`,
                [employeeId, companyId]
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function markProviderSyncFailure(provider: CalendarProvider, employeeId: string, companyId: string, error: any) {
    const errorColumn = provider === 'google'
        ? 'google_calendar_last_sync_error'
        : 'outlook_calendar_last_sync_error';
    const safeMessage = sanitizeSyncError(error);

    await pool.query(
        `UPDATE public.employees
         SET ${errorColumn} = $1,
             updated_at = now()
         WHERE employee_id = $2 AND company_id = $3`,
        [safeMessage, employeeId, companyId]
    );
}

async function fetchMicrosoftToken(params: Record<string, string>): Promise<Record<string, string>> {
    const body = new URLSearchParams({
        client_id: env.MICROSOFT_CLIENT_ID,
        client_secret: env.MICROSOFT_CLIENT_SECRET,
        scope: OUTLOOK_SCOPES.join(' '),
        ...params,
    });

    const response = await fetch(
        `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        }
    );

    const payload = await response.json() as Record<string, string>;
    if (!response.ok) {
        throw new Error(payload.error_description || payload.error || 'Microsoft OAuth token request failed.');
    }

    return payload;
}

function getGoogleEventRange(event: any) {
    const startValue = event.start?.dateTime || event.start?.date;
    const endValue = event.end?.dateTime || event.end?.date;
    return getEventRange(startValue, endValue, Boolean(event.start?.date && !event.start?.dateTime));
}

function getOutlookEventRange(event: any) {
    const startValue = event.start?.dateTime;
    const endValue = event.end?.dateTime;
    return getEventRange(startValue, endValue, Boolean(event.isAllDay));
}

function getEventRange(startValue?: string, endValue?: string, allDay = false) {
    if (!startValue || !endValue) return null;
    const start = parseCalendarDate(startValue);
    const end = parseCalendarDate(endValue);
    if (!start || !end || end.getTime() <= start.getTime()) return null;

    const inclusiveEnd = (allDay || isMidnightUtc(end))
        ? new Date(end.getTime() - 1)
        : end;

    return {
        startDate: formatDateOnly(start),
        endDate: formatDateOnly(inclusiveEnd),
        durationMs: end.getTime() - start.getTime(),
    };
}

function parseCalendarDate(value: string): Date | null {
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00.000Z`
        : value;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function isMidnightUtc(date: Date): boolean {
    return date.getUTCHours() === 0 &&
        date.getUTCMinutes() === 0 &&
        date.getUTCSeconds() === 0 &&
        date.getUTCMilliseconds() === 0;
}

function sanitizeSyncError(error: any): string {
    const raw = typeof error?.message === 'string' ? error.message : 'Calendar sync failed.';
    return raw
        .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
        .replace(/refresh_token[=:]\s*[^\s&]+/gi, 'refresh_token=[REDACTED]')
        .slice(0, 240);
}
