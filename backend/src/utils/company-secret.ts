import { Request } from 'express';

export function getCompanySecret(req: Request): string | undefined {
    const raw = req.header('x-company-secret') || req.header('X-Company-Secret');
    const normalized = raw?.trim();
    return normalized ? normalized : undefined;
}

export function requireCompanySecret(req: Request): string {
    const secret = getCompanySecret(req);
    if (!secret) {
        throw new Error('Company secret is required for protected PII operations.');
    }
    return secret;
}
