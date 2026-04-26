/**
 * Email Service — Employee Onboarding & Notifications
 *
 * BEHAVIOR:
 *   NODE_ENV=development → logs delivery metadata only (never log credentials)
 *   NODE_ENV=production  → sends via SMTP (Nodemailer)
 *
 * TODO (post-MVP):
 *   - Wire to actual SMTP provider (SendGrid, AWS SES, Gmail)
 *   - HTML email templates with company branding
 *   - Email verification flow
 *   - Queue-based sending for bulk onboarding
 */
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Create transport based on environment
let transporter: nodemailer.Transporter | null = null;

if (!env.IS_DEV && env.EMAIL_USER && env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: env.EMAIL_USER,
            pass: env.EMAIL_PASSWORD,
        },
    });
    console.log(`📧 Email transport configured: ${env.EMAIL_SERVICE} (${env.EMAIL_USER})`);
} else if (!env.IS_DEV) {
    console.warn('⚠️  Production mode but EMAIL_USER/EMAIL_PASSWORD not configured. Emails will not send.');
}

function maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return '[redacted]';

    const visiblePrefix = localPart.slice(0, 2);
    return `${visiblePrefix}***@${domain}`;
}

/**
 * Send employee onboarding email with temporary credentials.
 */
export async function sendOnboardingEmail(params: {
    recipientEmail: string;
    recipientName: string;
    tempPassword: string;
    companyName: string;
    loginUrl: string;
}): Promise<{ success: boolean; message: string }> {
    const { recipientEmail, recipientName, tempPassword, companyName, loginUrl } = params;

    if (env.IS_DEV) {
        // DEV MODE: Log delivery metadata only. Never log credentials or secrets.
        console.log('\n' + '='.repeat(60));
        console.log('📧 ONBOARDING EMAIL (dev mode — not sent)');
        console.log('='.repeat(60));
        console.log(`  To:       ${maskEmail(recipientEmail)}`);
        console.log(`  Company:  ${companyName}`);
        console.log('  Credentials: [suppressed in dev logs]');
        console.log(`  Login URL: ${loginUrl}`);
        console.log('='.repeat(60) + '\n');
        return { success: true, message: 'Delivery metadata logged to console (dev mode)' };
    }

    if (!transporter) {
        console.error('❌ Email transport not configured');
        return { success: false, message: 'Email service not configured' };
    }

    // TODO (post-MVP): Replace with branded HTML template
    const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Welcome to Mapping Nexus</h2>
            <p>Hi ${recipientName},</p>
            <p>Your employer <strong>${companyName}</strong> has set up your Mapping Nexus account.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Email:</strong> ${recipientEmail}</p>
                <p style="margin: 10px 0 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            <p>Please log in and change your password immediately:</p>
            <a href="${loginUrl}" style="display: inline-block; background: #6C5CE7; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                Log In Now
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated email from Mapping Nexus. Do not reply.
            </p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Mapping Nexus" <${env.EMAIL_FROM}>`,
            to: recipientEmail,
            subject: `Your Mapping Nexus Account — ${companyName}`,
            html: htmlBody,
        });

        return { success: true, message: `Onboarding email sent to ${recipientEmail}` };
    } catch (err: any) {
        console.error('❌ Email send failed:', err.message);
        return { success: false, message: `Failed to send email: ${err.message}` };
    }
}

/**
 * Send a password reset email with the reset URL.
 */
export async function sendPasswordResetEmail(
    recipientEmail: string,
    resetUrl: string
): Promise<void> {
    if (env.IS_DEV) {
        console.log(`\n🔑 PASSWORD RESET (dev — not sent)\n  To: ${recipientEmail}\n  URL: ${resetUrl}\n`);
        return;
    }

    if (!transporter) {
        console.warn('⚠️  Cannot send password reset email: transporter not configured.');
        return;
    }

    try {
        await transporter.sendMail({
            from: `"Mapping Nexus" <${env.EMAIL_FROM}>`,
            to: recipientEmail,
            subject: 'Reset your Mapping Nexus password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a1a2e;">Password Reset</h2>
                    <p>Click the link below to reset your Mapping Nexus password. This link expires in 1 hour and can only be used once.</p>
                    <a href="${resetUrl}" style="display: inline-block; background: #6C5CE7; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                        Reset Password
                    </a>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">If you did not request this, ignore this email. Your password will remain unchanged.</p>
                </div>
            `,
        });
    } catch (err: any) {
        console.error('❌ Password reset email failed:', err.message);
    }
}

/**
 * Send team request notification to HR.
 */
export async function sendTeamRequestNotification(params: {
    hrEmail: string;
    managerName: string;
    employeeRole: string;
    projectContext: string;
}): Promise<void> {
    const { hrEmail, managerName, employeeRole, projectContext } = params;

    if (env.IS_DEV) {
        console.log(`\n📧 TEAM REQUEST NOTIFICATION (dev): HR notification simulated for ${maskEmail(hrEmail)}\n`);
        return;
    }

    if (!transporter) return;

    try {
        await transporter.sendMail({
            from: `"Mapping Nexus" <${env.EMAIL_FROM}>`,
            to: hrEmail,
            subject: `Team Addition Request — ${managerName}`,
            html: `
                <p>Manager <strong>${managerName}</strong> has requested a team member.</p>
                <p><strong>Role requested:</strong> ${employeeRole}</p>
                <p><strong>Reason:</strong> ${projectContext}</p>
                <p>Please review this request in your Mapping Nexus dashboard.</p>
            `,
        });
    } catch (err: any) {
        console.error('Notification email failed:', err.message);
    }
}
