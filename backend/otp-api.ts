/**
 * Backend API Server - Password Reset & OTP Management
 * This file should be run as a separate Node.js server
 * 
 * Installation:
 * npm install express dotenv nodemailer cors body-parser
 * 
 * Environment variables needed (.env file):
 * PORT=3001
 * EMAIL_SERVICE=gmail (or your email service)
 * EMAIL_USER=your-email@gmail.com
 * EMAIL_PASSWORD=your-app-password
 * OTP_EXPIRY=300 (seconds)
 * NODE_ENV=development
 */

import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory OTP storage (use Redis or database in production)
interface OTPRecord {
  email: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  verified: boolean;
  attempts: number;
}

const otpStore = new Map<string, OTPRecord>();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Generate 6-digit OTP code
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP email
 */
async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset - One Time Password (OTP)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Nexus - Password Reset</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9; border: 1px solid #e0e0e0;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              You requested to reset your password. Use the code below to proceed:
            </p>
            
            <div style="background: white; border: 2px solid #667eea; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 12px; color: #666; margin: 0 0 10px 0;">YOUR ONE-TIME PASSWORD (OTP)</p>
              <h2 style="font-size: 32px; letter-spacing: 8px; color: #667eea; margin: 10px 0; font-weight: bold; font-family: 'Courier New', monospace;">
                ${otp}
              </h2>
              <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">
                Valid for 5 minutes
              </p>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Notice:</strong> Never share this code with anyone. 
                The Nexus team will never ask you for your OTP.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px; line-height: 1.6;">
              If you didn't request a password reset, please ignore this email or contact our support team immediately.
            </p>
          </div>
          
          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #999; font-size: 12px;">
            <p style="margin: 0;">© 2026 Nexus Mapping. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to send OTP email to ${email}:`, error);
    return false;
  }
}

/**
 * POST /api/auth/send-otp
 * Send OTP to user's email
 */
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address',
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpId = `${email}-${Date.now()}`;
    const expiryTime = parseInt(process.env.OTP_EXPIRY || '300', 10) * 1000; // 5 minutes default

    // Send email
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please check if email configuration is correct.',
      });
    }

    // Store OTP
    otpStore.set(otpId, {
      email,
      code: otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiryTime,
      verified: false,
      attempts: 0,
    });

    // Clean up old OTPs for this email
    const now = Date.now();
    for (const [id, record] of otpStore.entries()) {
      if (record.email === email && now > record.expiresAt) {
        otpStore.delete(id);
      }
    }

    res.json({
      success: true,
      message: `OTP sent to ${email}. Please check your inbox (and spam folder).`,
      otpId,
      expiresIn: parseInt(process.env.OTP_EXPIRY || '300', 10),
    });
  } catch (error) {
    console.error('Error in send-otp endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending OTP',
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP code
 */
app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp, otpId } = req.body;

    // Validate inputs
    if (!email || !otp || !otpId) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and OTP ID are required',
        valid: false,
      });
    }

    // Get OTP record
    const otpRecord = otpStore.get(otpId);

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or invalid. Please request a new one.',
        valid: false,
      });
    }

    // Check if expired
    if (Date.now() > otpRecord.expiresAt) {
      otpStore.delete(otpId);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
        valid: false,
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      otpStore.delete(otpId);
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.',
        valid: false,
      });
    }

    // Verify OTP
    if (otpRecord.code !== otp) {
      otpRecord.attempts++;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`,
        valid: false,
      });
    }

    // Mark as verified
    otpRecord.verified = true;

    res.json({
      success: true,
      message: 'OTP verified successfully',
      valid: true,
    });
  } catch (error) {
    console.error('Error in verify-otp endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying OTP',
      valid: false,
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with verified OTP
 */
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword, otpId } = req.body;

    // Validate inputs
    if (!email || !newPassword || !otpId) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and OTP ID are required',
      });
    }

    // Get OTP record
    const otpRecord = otpStore.get(otpId);

    if (!otpRecord || !otpRecord.verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP not verified. Please verify your OTP first.',
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, and numbers',
      });
    }

    // TODO: Update password in your database
    // Example: await updateUserPassword(email, hashPassword(newPassword));
    console.log(`✓ Password reset for ${email}`);

    // Clean up OTP
    otpStore.delete(otpId);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error in reset-password endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting password',
    });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP code
 */
app.post('/api/auth/resend-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if recent OTP exists for this email
    for (const [, record] of otpStore.entries()) {
      if (record.email === email && !record.verified) {
        break;
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpId = `${email}-${Date.now()}`;
    const expiryTime = parseInt(process.env.OTP_EXPIRY || '300', 10) * 1000;

    // Send email
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP',
      });
    }

    // Store new OTP
    otpStore.set(otpId, {
      email,
      code: otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiryTime,
      verified: false,
      attempts: 0,
    });

    res.json({
      success: true,
      message: `OTP resent to ${email}`,
      otpId,
      expiresIn: parseInt(process.env.OTP_EXPIRY || '300', 10),
    });
  } catch (error) {
    console.error('Error in resend-otp endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resending OTP',
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    emailConfigured: !!process.env.EMAIL_USER,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Password Reset API Server running on http://localhost:${PORT}`);
  console.log(`\n⚙️  Configuration:`);
  console.log(`   - Email Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
  console.log(`   - Email User: ${process.env.EMAIL_USER ? '✓ Configured' : '✗ NOT CONFIGURED'}`);
  console.log(`   - OTP Expiry: ${process.env.OTP_EXPIRY || '300'} seconds`);
  console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log(`\n⚠️  WARNING: Email configuration not complete!`);
    console.log(`   Create a .env file with:`);
    console.log(`   EMAIL_USER=your-email@gmail.com`);
    console.log(`   EMAIL_PASSWORD=your-app-password`);
  }
  console.log('\n');
});

export default app;
