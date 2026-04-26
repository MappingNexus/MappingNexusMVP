import type { Request } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { getSupabaseClient } from './auth.js';

describe('auth middleware helpers', () => {
    it('returns the Neon compatibility client', () => {
        // setup
        const req = {} as Request;

        // action
        const client = getSupabaseClient(req);

        // assertion
        expect(client).toBe(supabaseAdmin);
    });
});
