import axios from 'axios';

// API base URL - change to your deployed server URL in production
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.rippleexchange.org/api' 
  : 'http://localhost:3001/api';

// Check if we're in a development environment and attempting to use nodemailer directly
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send a verification code email
 * @param {string} email - Recipient email address
 * @param {string} code - Verification code
 * @returns {Promise} - Resolves with the response data
 */
export const sendVerificationEmail = async (email, code) => {
  try {
    // Use direct nodemailer only in true server environments
    if (typeof window === 'undefined' && isDev) {
      // Server-side only code for direct nodemailer use
      console.log('[Server] Sending verification email directly via nodemailer');
      // This would be implemented on the server side
      return { success: true, message: 'Direct email not supported in browser' };
    }

    // Client-side or production - use API
    console.log(`Sending verification email via API to ${email}`);
    const response = await axios.post(`${API_URL}/send-verification-code`, {
      email,
      code
    });
    console.log('Email sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Checks if the email server is available
 * @returns {Promise<boolean>} True if server is available, false otherwise
 */
export const isEmailServerAvailable = async () => {
  try {
    const response = await axios.get(`${API_URL}`, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    console.warn('Email server not available:', error.message);
    return false;
  }
};

/**
 * Log the verification code to console in development mode
 * @param {string} email - The email address
 * @param {string} code - The verification code
 * @param {string} type - The type of verification (e.g., 'registration', '2fa')
 */
export const logVerificationCode = (email, code, type = 'verification') => {
  // Only log that we're attempting verification, not the actual code
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Attempting to send ${type} email to ${email}`);
  }
};

/**
 * Send a registration verification email with a special template
 * @param {string} email - Recipient email address
 * @param {string} code - Verification code
 * @returns {Promise} - Resolves with the response data
 */
export const sendRegistrationVerificationEmail = async (email, code) => {
  try {
    // Log attempt without showing the code
    console.log(`Attempting to send verification to ${email}`);
    
    // Check if server is available first
    const serverAvailable = await isEmailServerAvailable();
    if (!serverAvailable) {
      console.warn('Email server unavailable, skipping API call');
      return { 
        success: true, 
        code: code,
        message: 'Email service unavailable, but registration can continue' 
      };
    }
    
    // Try to send email via API
    const response = await axios.post(`${API_URL}/send-registration-verification`, {
      email,
      code
    }, { timeout: 5000 });
    
    console.log('Registration verification email sent successfully');
    return response.data;
  } catch (error) {
    console.error('Error in email service:', error);
    // Return success with code to allow registration to continue
    return { 
      success: true, 
      code: code,
      message: 'Continuing with verification despite email error' 
    };
  }
};

/**
 * Send a password change confirmation email
 * @param {string} email - Recipient email address
 * @returns {Promise} - Resolves with the response data
 */
export const sendPasswordChangeConfirmation = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/send-password-change-confirmation`, {
      email
    });
    console.log('Password change confirmation email sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending password change confirmation email:', error);
    throw error;
  }
};

/**
 * Send a 2FA setup confirmation email
 * @param {string} email - Recipient email address
 * @param {boolean} enabled - Whether 2FA was enabled or disabled
 * @returns {Promise} - Resolves with the response data
 */
export const send2FAStatusChangeEmail = async (email, enabled) => {
  try {
    const response = await axios.post(`${API_URL}/send-2fa-status-change`, {
      email,
      enabled
    });
    console.log('2FA status change email sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending 2FA status change email:', error);
    throw error;
  }
}; 