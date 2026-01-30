/**
 * Email Service - Handles OTP sending for password reset
 * This service integrates with the backend API to send emails
 */

interface SendOTPRequest {
  email: string;
  type: 'password_reset' | 'email_verification';
}

interface SendOTPResponse {
  success: boolean;
  message: string;
  otpId?: string;
  expiresIn?: number; // seconds
}

interface VerifyOTPRequest {
  email: string;
  otp: string;
  otpId: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
  valid: boolean;
}

// In Vite, environment variables are exposed via import.meta.env with VITE_ prefix
// Backend URL should be configured as VITE_API_URL in the deployment environment
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  '/api';

/**
 * Send OTP to user's email
 * @param email User's email address
 * @param type Type of OTP (password_reset or email_verification)
 */
export async function sendOTP(
  email: string,
  type: 'password_reset' | 'email_verification' = 'password_reset'
): Promise<SendOTPResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        type,
      } as SendOTPRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to send OTP. Please try again.',
      };
    }

    const data = (await response.json()) as SendOTPResponse;
    return {
      success: true,
      message: `OTP sent to ${email}. Please check your inbox (and spam folder).`,
      otpId: data.otpId,
      expiresIn: data.expiresIn,
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'Unable to send OTP. Please check your internet connection and try again.',
    };
  }
}

/**
 * Verify OTP code
 * @param email User's email address
 * @param otp 6-digit OTP code
 * @param otpId OTP session ID
 */
export async function verifyOTP(
  email: string,
  otp: string,
  otpId: string
): Promise<VerifyOTPResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        otp,
        otpId,
      } as VerifyOTPRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Invalid OTP',
        valid: false,
      };
    }

    const data = (await response.json()) as VerifyOTPResponse;
    return {
      success: true,
      message: 'OTP verified successfully',
      valid: data.valid,
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Unable to verify OTP. Please try again.',
      valid: false,
    };
  }
}

/**
 * Reset password with verified OTP
 */
export async function resetPassword(
  email: string,
  newPassword: string,
  otpId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        newPassword,
        otpId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to reset password',
      };
    }

    return {
      success: true,
      message: 'Password reset successfully',
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      message: 'Unable to reset password. Please try again.',
    };
  }
}

/**
 * Resend OTP code
 */
export async function resendOTP(email: string): Promise<SendOTPResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to resend OTP',
      };
    }

    const data = (await response.json()) as SendOTPResponse;
    return {
      success: true,
      message: `OTP resent to ${email}`,
      otpId: data.otpId,
      expiresIn: data.expiresIn,
    };
  } catch (error) {
    console.error('Error resending OTP:', error);
    return {
      success: false,
      message: 'Unable to resend OTP. Please try again.',
    };
  }
}
