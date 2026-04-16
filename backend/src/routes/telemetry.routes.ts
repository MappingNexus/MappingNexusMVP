import { supabaseAdmin } from '../config/supabase.js';
/**
 * Telemetry Routes — Opt-in anonymised quality signals
 * POST /api/telemetry — Log an event (any authenticated user)
 * GET  /api/telemetry — HR reads telemetry for their company
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../utils/validation.js';

const router = Router();
const telemetrySchema = z.object({
    eventType: z.string().trim().min(1).max(80),
    latencyMs: z.coerce.number().int().min(0).max(600000).optional(),
    feedback: z.enum(['thumbs_up', 'thumbs_down']).optional(),
    modelVersion: z.string().trim().max(80).optional(),
    metadata: z.record(z.any()).optional(),
});

router.post('/', requireAuth, validate(telemetrySchema), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { eventType, latencyMs, feedback, modelVersion, metadata } = req.body;

        const { error } = await db.from('telemetry_events').insert({
            company_id: user.companyId,
            event_type: eventType,
            latency_ms: latencyMs || null,
            feedback: feedback || null,
            model_version: modelVersion || null,
            metadata: metadata || {},
        });

        if (error) return res.status(500).json({ success: false, message: error.message });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/', requireAuth, requireRole('hr'), async (req: Request, res: Response) => {
    try {
        const db = supabaseAdmin;
        const { data, error } = await db
            .from('telemetry_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) return res.status(500).json({ success: false, message: error.message });
        res.json({ success: true, events: data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
