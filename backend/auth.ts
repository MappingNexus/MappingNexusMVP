import crypto from 'crypto';

export type AccessLevel = 'Standard' | 'VIP' | 'Admin';

export interface AuthTokenPayload {
    sub: string;
    email: string;
    accessLevel: AccessLevel;
    iat: number;
    exp: number;
}

const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

function getAuthSecret() {
    return process.env.JWT_SECRET || process.env.AUTH_SECRET || 'mappingnexus-dev-secret-change-me';
}

function encode(input: string) {
    return Buffer.from(input).toString('base64url');
}

function decode<T>(input: string): T {
    return JSON.parse(Buffer.from(input, 'base64url').toString('utf8')) as T;
}

export function createAuthToken(input: Omit<AuthTokenPayload, 'iat' | 'exp'>) {
    const now = Math.floor(Date.now() / 1000);
    const payload: AuthTokenPayload = {
        ...input,
        iat: now,
        exp: now + TOKEN_LIFETIME_SECONDS,
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = encode(JSON.stringify(header));
    const encodedPayload = encode(JSON.stringify(payload));
    const signature = crypto
        .createHmac('sha256', getAuthSecret())
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string) {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
        throw new Error('Malformed auth token');
    }

    const expectedSignature = crypto
        .createHmac('sha256', getAuthSecret())
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        throw new Error('Invalid auth token signature');
    }

    const payload = decode<AuthTokenPayload>(encodedPayload);

    if (payload.exp * 1000 < Date.now()) {
        throw new Error('Auth token expired');
    }

    return payload;
}
