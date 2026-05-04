/**
 * Rate Limiting Middleware
 *
 * Different limits for different endpoint categories:
 *   - Auth endpoints: strict (prevent brute force)
 *   - API endpoints: moderate
 *   - Matching engine: tight (expensive LLM calls)
 */
import rateLimit from 'express-rate-limit';

/**
 * Auth rate limiter: 10 requests per 15 minutes per IP.
 * Applies to /api/auth/* endpoints.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
    keyGenerator: (req) => {
        // Use IP + email combo to prevent distributed brute force
        const email = req.body?.email || '';
        return `${req.ip}-${email}`;
    },
});

/**
 * General API rate limiter: 200 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please slow down.',
    },
});

/**
 * Matching engine rate limiter: 5 requests per minute per user.
 * OpenRouter free tier allows 20 req/min globally — keep headroom.
 * Free tier daily limit: 50 req/day (1000/day with $10+ credits).
 */
export const matchingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Matching engine rate limit reached. Please wait before submitting another query.',
    },
    keyGenerator: (req) => {
        // Rate limit per authenticated user (userId set by requireAuth, which runs before this).
        // Fall back to IP if user is somehow not yet attached (shouldn't happen in practice).
        const userId = (req as any).user?.userId;
        return userId ? `match-user-${userId}` : `match-ip-${req.ip}`;
    },
});

/**
 * Password reset limiter: 3 requests per hour per email.
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again in 1 hour.',
    },
    keyGenerator: (req) => `reset-${req.body?.email || req.ip}`,
});
