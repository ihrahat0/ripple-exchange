import axios from 'axios';

// Use a reliable API URL based on the current environment
const API_URL = window.location.hostname === 'localhost' 
  ? `http://localhost:3001/api` 
  : 'https://rippleexchange.org/api';

console.log('Using API URL base:', API_URL);

/**
 * Generate a verification code
 * @returns {string} 6-digit verification code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send registration verification email via API
 * @param {string} email - User's email
 * @param {string} code - Verification code
 * @returns {Promise<Object>} Status of the email send operation
 */
export const sendRegistrationVerificationEmail = async (email, code) => {
  try {
    // Don't log the actual code for security reasons
    console.log(`Sending verification email to ${email}`);
    console.log(`Using API URL: ${API_URL}/send-verification-code`);
    
    // Configure axios with timeout and better error handling
    const axiosConfig = {
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await axios.post(`${API_URL}/send-verification-code`, { email, code }, axiosConfig);
    console.log('Email API response:', response.data);
    return response.data;
  } catch (error) {
    // Create a more detailed error object
    let errorMessage = 'Failed to send registration verification email';
    let errorDetails = {};
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Email API error response:', {
        status: error.response.status,
        data: error.response.data
      });
      errorMessage = error.response.data?.error || errorMessage;
      errorDetails = {
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Email API no response:', error.request);
      errorMessage = 'No response from server. Please check your network connection.';
      errorDetails = {
        request: 'Request was sent but no response received'
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Email API request setup error:', error.message);
      errorMessage = error.message;
    }
    
    console.error('Failed to send registration verification email:', errorMessage);
    
    return { 
      success: false, 
      error: errorMessage,
      details: errorDetails
    };
  }
};

/**
 * Send password reset email via API
 * @param {string} email - User's email address
 * @param {string} code - Reset verification code
 * @returns {Promise<Object>} Status of the email send operation
 */
export const sendPasswordResetEmail = async (email, code) => {
  try {
    console.log(`Sending password reset email to ${email} with code ${code}`);
    console.log(`Using API URL: ${API_URL}/send-password-reset`);
    
    const response = await axios.post(`${API_URL}/send-password-reset`, { email, code });
    console.log('Password reset email API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

/**
 * Send password change confirmation email via API
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Status of the email send operation
 */
export const sendPasswordChangeConfirmation = async (email) => {
  try {
    console.log(`Sending password change confirmation to ${email}`);
    
    const response = await axios.post(`${API_URL}/send-password-change-confirmation`, { email });
    return response.data;
  } catch (error) {
    console.error('Failed to send password change confirmation:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

/**
 * Send 2FA status change email via API
 * @param {string} email - User's email address
 * @param {boolean} enabled - Whether 2FA was enabled or disabled
 * @returns {Promise<Object>} Status of the email send operation
 */
export const send2FAStatusChangeEmail = async (email, enabled) => {
  try {
    const response = await axios.post(`${API_URL}/send-2fa-status-change`, { email, enabled });
    return response.data;
  } catch (error) {
    console.error('Failed to send 2FA status change email:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

/**
 * For compatibility with older code
 */
export const sendVerificationEmail = sendRegistrationVerificationEmail; 