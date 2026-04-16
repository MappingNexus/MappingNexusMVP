import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request } from 'express';
import { getSupabaseClient } from './auth.js';

test('getSupabaseClient throws when auth middleware did not attach a client', () => {
    assert.throws(
        () => getSupabaseClient({} as Request),
        /Supabase client missing from authenticated request/
    );
});

test('getSupabaseClient returns the request-scoped client when present', () => {
    const fakeClient = { marker: 'scoped-client' };

    const client = getSupabaseClient({
        supabase: fakeClient,
    } as unknown as Request);

    assert.equal(client, fakeClient);
});