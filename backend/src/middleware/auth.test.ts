import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from './auth.js';

describe('auth middleware', () => {
    it('rejects requests with no Authorization header', async () => {
        const req = { headers: {} } as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;
        const next = jest.fn() as NextFunction;

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects requests with a malformed Bearer token', async () => {
        const req = {
            headers: { authorization: 'Bearer not-a-valid-jwt' },
        } as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;
        const next = jest.fn() as NextFunction;

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});
