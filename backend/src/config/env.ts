/**
 * Environment configuration — single source of truth for all env vars.
 * In development mode, uses safe fallbacks for missing variables.
 * In production, fails fast on missing required variables.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const IS_DEV = (process.env.NODE_ENV || 'development') === 'development';

function required(key: string, devFallback?: string): string {
    const value = process.env[key];
    if (value) return value;

    if (IS_DEV && devFallback !== undefined) {
        console.warn(`⚠️  Missing env variable: ${key} — using dev fallback`);
        return devFallback;
    }

    console.error(`\n❌ FATAL: Missing required env variable: ${key}`);
    console.error(`   Copy .env.example to .env and fill in all values.\n`);
    process.exit(1);
}

function optional(key: string, fallback: string): string {
    return process.env[key] || fallback;
}

// Fixed dev-only KEK — never changes across restarts, safe to use in development.
const devEncryptionKEK = 'deadbeefcafebabedeadbeefcafebabedeadbeefcafebabedeadbeefcafebabe';

export const env = {
    // Neon DB
    DATABASE_URL: required('DATABASE_URL'),

    // JWT
    JWT_SECRET: required('JWT_SECRET', 'mappingnexus-local-dev-secret-change-in-prod'),

    // OpenRouter (AI matching engine)
    OPENROUTER_API_KEY: required('OPENROUTER_API_KEY', 'sk-or-placeholder'),

    // Encryption
    ENCRYPTION_KEK: required('ENCRYPTION_KEK', devEncryptionKEK),

    // Server
    NODE_ENV: optional('NODE_ENV', 'development'),
    PORT: parseInt(optional('PORT', '3001'), 10),
    IS_DEV,

    // Frontend origin (for CORS + password reset redirect)
    FRONTEND_URL: optional('FRONTEND_URL', ''),

    // Email (Gmail SMTP)
    EMAIL_SERVICE: optional('EMAIL_SERVICE', 'gmail'),
    EMAIL_USER: optional('EMAIL_USER', ''),
    EMAIL_PASSWORD: optional('EMAIL_PASSWORD', ''),
    EMAIL_FROM: optional('EMAIL_FROM', 'noreply@mappingnexus.com'),

    // Ports/origins
    CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:5173,http://localhost:3000'),

    // Google OAuth
    GOOGLE_CLIENT_ID: optional('GOOGLE_CLIENT_ID', 'placeholder-google-client-id.apps.googleusercontent.com'),
} as const;
