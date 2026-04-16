/**
 * Password Reset Service — Neon DB
 *
 * Generates reset tokens stored in public.users.
 * Sends reset link via Gmail (nodemailer) in production,
 * or logs to console in development.
 */
import { env } from '../config/env.js';

export function getInviteConfigurationIssue(): string | null {
    // In our Neon setup, invite just creates a user with temp password.
    // No FRONTEND_URL required for basic operation.
    return null;
}

export function getInviteEmailSentMessage(email: string): string {
    return `Account created for ${email}. Share the temporary password with them and ask them to change it on first login.`;
}

export function getInviteEmailFailureMessage(email: string): string {
    return `Account created for ${email}, but the invite email could not be sent. Please share the temporary password manually.`;
}

/**
 * Send a password reset email (delegated to auth routes).
 * This is a no-op placeholder — actual sending is in auth.routes.ts forgot-password.
 */
export async function sendPasswordSetupEmail(email: string, resetUrl?: string) {
    if (env.IS_DEV) {
        console.log(`\n🔑 Password reset link for ${email}:\n   ${resetUrl || '(no URL provided)'}\n`);
        return { error: null };
    }

    try {
        const { sendPasswordResetEmail } = await import('./email.service.js');
        if (resetUrl) {
            await sendPasswordResetEmail(email, resetUrl);
        }
        return { error: null };
    } catch (err: any) {
        return { error: err };
    }
}
