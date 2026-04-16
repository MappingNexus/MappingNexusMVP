/**
 * Encryption Service — AES-256-GCM with Envelope Encryption
 *
 * ARCHITECTURE:
 *   KEK (Key Encryption Key) → from env var ENCRYPTION_KEK
 *   Legacy company key → deterministic per-company key derived from the KEK
 *   Session key → derived from a company secret supplied at login time
 *   Data → encrypted with AES-256-GCM
 *
 * FLOW:
 *   Encrypt: plaintext → derive session key from company secret → AES-256-GCM → ciphertext
 *   Decrypt: ciphertext → derive session key from company secret → AES-256-GCM → plaintext
 *
 * STORAGE FORMAT:
 *   Encrypted fields store: v2:base64(iv):base64(ciphertext):base64(authTag)
 *
 * SECURITY:
 *   - New PII writes require a volatile company secret supplied at login time
 *   - The backend does not persist the company secret
 *   - Legacy ciphertext remains readable only for backward compatibility
 */
import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;  // 128-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit auth tag
const DEK_LENGTH = 32; // 256-bit DEK
const SESSION_PREFIX = 'v2';

// The fixed dev-only KEK constant from env.ts — used to detect accidental non-dev usage.
const DEV_KEK_SENTINEL = 'deadbeefcafebabedeadbeefcafebabedeadbeefcafebabedeadbeefcafebabe';
const SESSION_KEY_TTL_MS = 15 * 60 * 1000;

// KEK from environment (32 bytes from 64-char hex)
let KEK: Buffer;
try {
    KEK = Buffer.from(env.ENCRYPTION_KEK, 'hex');
    if (KEK.length !== 32) {
        throw new Error('ENCRYPTION_KEK must be exactly 64 hex characters (32 bytes).');
    }
    if (env.ENCRYPTION_KEK === DEV_KEK_SENTINEL && !env.IS_DEV) {
        console.error('❌ FATAL: Dev-only ENCRYPTION_KEK detected in a non-development environment. Set a unique ENCRYPTION_KEK in your production environment variables.');
        process.exit(1);
    }
    if (env.ENCRYPTION_KEK === DEV_KEK_SENTINEL) {
        console.warn('⚠️  Using the dev-only ENCRYPTION_KEK constant. Never use this key in a deployed environment.');
    }
} catch (err: any) {
    if (env.IS_DEV) {
        console.warn('⚠️  Invalid ENCRYPTION_KEK — generating random dev key. Data will NOT persist across restarts.');
        KEK = crypto.randomBytes(32);
    } else {
        console.error(`❌ FATAL: ${err.message}`);
        process.exit(1);
    }
}

// In-memory DEK cache
const dekCache = new Map<string, Buffer>();
const sessionKeyCache = new Map<string, { key: Buffer; expiry: number }>();

/**
 * Derive a deterministic DEK for a company using HMAC-SHA256.
 * Same KEK + company_id always produces the same DEK.
 * Each company gets a unique 32-byte key derived from the master KEK.
 * No storage needed — the DEK is recomputed on demand.
 */
function getCompanyDEK(companyId: string): Buffer {
    const cached = dekCache.get(companyId);
    if (cached) return cached;

    const dek = crypto.createHmac('sha256', KEK)
        .update(`mapping-nexus-dek:${companyId}`)
        .digest(); // 32 bytes

    dekCache.set(companyId, dek);
    return dek;
}

function getCachedSessionKey(cacheKey: string): Buffer | null {
    const entry = sessionKeyCache.get(cacheKey);
    if (entry && entry.expiry > Date.now()) return entry.key;
    sessionKeyCache.delete(cacheKey);
    return null;
}

function setCachedSessionKey(cacheKey: string, key: Buffer) {
    sessionKeyCache.set(cacheKey, { key, expiry: Date.now() + SESSION_KEY_TTL_MS });
}

function buildSessionCacheKey(companyId: string, companySecret: string): string {
    const secretHash = crypto.createHash('sha256').update(companySecret).digest('hex');
    return `${companyId}:${secretHash}`;
}

async function deriveSessionKey(companyId: string, companySecret: string): Promise<Buffer> {
    const cacheKey = buildSessionCacheKey(companyId, companySecret);
    const cached = getCachedSessionKey(cacheKey);
    if (cached) return cached;

    const sessionKey = await new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(
            companySecret,
            `mapping-nexus:${companyId}`,
            DEK_LENGTH,
            (err, derivedKey) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(Buffer.from(derivedKey as Buffer));
            }
        );
    });

    setCachedSessionKey(cacheKey, sessionKey);
    return sessionKey;
}

/**
 * Encrypt plaintext string for a specific company.
 * Returns: "base64(iv):base64(ciphertext):base64(authTag)"
 */
export async function encrypt(plaintext: string, companyId: string, companySecret?: string): Promise<string> {
    const dek = companySecret
        ? await deriveSessionKey(companyId, companySecret)
        : getCompanyDEK(companyId);

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, dek, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    const payload = `${iv.toString('base64')}:${encrypted.toString('base64')}:${tag.toString('base64')}`;
    return companySecret ? `${SESSION_PREFIX}:${payload}` : payload;
}

/**
 * Decrypt ciphertext string for a specific company.
 * Input: "base64(iv):base64(ciphertext):base64(authTag)"
 */
export async function decrypt(ciphertext: string, companyId: string, companySecret?: string): Promise<string> {
    if (!ciphertext) return ''; // null/undefined → safe empty string
    if (!ciphertext.includes(':')) return ciphertext; // Not encrypted

    const isSessionProtected = ciphertext.startsWith(`${SESSION_PREFIX}:`);
    const serialized = isSessionProtected ? ciphertext.slice(`${SESSION_PREFIX}:`.length) : ciphertext;
    let dek: Buffer;
    if (isSessionProtected) {
        if (!companySecret) {
            throw new Error('Company secret required to decrypt protected data.');
        }
        dek = await deriveSessionKey(companyId, companySecret);
    } else {
        dek = getCompanyDEK(companyId);
    }

    const parts = serialized.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format. Expected iv:ciphertext:authTag');
    }

    const [ivB64, encB64, tagB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const encrypted = Buffer.from(encB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, dek, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]).toString('utf8');
}

/**
 * Encrypt multiple fields at once for a company.
 * Convenience wrapper for encrypting employee PII.
 */
export async function encryptFields(
    fields: Record<string, string | number | null | undefined>,
    companyId: string,
    companySecret?: string
): Promise<Record<string, string | null>> {
    const entries = await Promise.all(
        Object.entries(fields).map(async ([key, value]) => {
            if (value === null || value === undefined) {
                return [key, null] as const;
            }

            return [key, await encrypt(String(value), companyId, companySecret)] as const;
        })
    );

    return Object.fromEntries(entries);
}

/**
 * Decrypt multiple fields at once for a company.
 */
export async function decryptFields(
    fields: Record<string, string | null>,
    companyId: string,
    companySecret?: string
): Promise<Record<string, string | null>> {
    const entries = await Promise.all(
        Object.entries(fields).map(async ([key, value]) => {
            if (value == null || !value.includes(':')) {
                return [key, value ?? null] as const;
            }

            try {
                return [key, await decrypt(value, companyId, companySecret)] as const;
            } catch (err: any) {
                console.error(`[encryption] Failed to decrypt field "${key}" for company "${companyId}":`, err.message);
                return [key, null] as const;
            }
        })
    );

    return Object.fromEntries(entries);
}

/**
 * Hash employee_id for display (never show raw UUID to users).
 */
export function hashForDisplay(id: string): string {
    return crypto.createHash('sha256').update(id).digest('hex').substring(0, 12);
}
