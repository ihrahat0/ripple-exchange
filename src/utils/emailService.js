const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

// API base URL - change to your deployed server URL in production
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Check if we're in a development environment and attempting to use nodemailer directly
const isDev = process.env.NODE_ENV !== 'production';

// Create a reusable transporter object
let transporter = null;

// Initialize transporter with proper error handling
const initializeTransporter = () => {
  if (transporter) return;
  
  console.log('Initializing email transporter...');
  
  try {
    // Configure email transporter using SMTP settings
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'mail.rippleexchange.org',
      port: process.env.EMAIL_PORT || 465,
      secure: process.env.EMAIL_SECURE === 'true' || true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || 'noreply@rippleexchange.org',
        pass: process.env.EMAIL_PASS || 'I2NEZ$nRXok',
      },
      tls: {
        rejectUnauthorized: false // Helps with some VPS configurations
      }
    });
    
    console.log('Email transporter initialized with host:', process.env.EMAIL_HOST || 'mail.rippleexchange.org');
    console.log('Using email account:', process.env.EMAIL_USER || 'noreply@rippleexchange.org');
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    throw error;
  }
};

/**
 * Check if the email server is available
 * This is used to gracefully handle environments where email might not be available
 */
const isEmailServerAvailable = async () => {
  if (isDev) {
    // Always return true in development - we'll handle errors within the email functions
    return true;
  }
  
  try {
    // Try connecting to the email server
    const response = await axios.get(`${API_URL}/check-email-server`, { timeout: 2000 });
    return response.data && response.data.available;
  } catch (error) {
    console.warn('Could not connect to email server:', error.message);
    return false;
  }
};

/**
 * Generate a verification code
 * @returns {string} 6-digit verification code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send registration verification email
 * @param {string} email - User's email
 * @param {string} code - Verification code
 * @returns {Promise<Object>} Status of the email send operation
 */
const sendRegistrationVerificationEmail = async (email, code) => {
  initializeTransporter();
  
  console.log(`Attempting to send registration verification email to: ${email}`);
  console.log(`Verification code: ${code}`);
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ripple Exchange" <noreply@rippleexchange.org>',
      to: email,
      subject: 'Verify Your Ripple Exchange Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #F7931A; text-align: center;">Welcome to Ripple Exchange!</h2>
          <p>Thank you for registering with Ripple Exchange. To complete your registration, please use the verification code below:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes for security reasons.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #777;">
            &copy; ${new Date().getFullYear()} Ripple Exchange. All rights reserved.
          </p>
        </div>
      `
    });
    
    console.log('Registration verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send registration verification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} code - Reset verification code
 * @returns {Promise<Object>} Status of the email send operation
 */
const sendPasswordResetEmail = async (email, code) => {
  initializeTransporter();
  
  console.log(`Attempting to send password reset email to: ${email}`);
  console.log(`Reset code: ${code}`);
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ripple Exchange" <noreply@rippleexchange.org>',
      to: email,
      subject: 'Reset Your Ripple Exchange Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #F7931A; text-align: center;">Password Reset Request</h2>
          <p>We received a request to reset your Ripple Exchange password. Please use the verification code below to reset your password:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes for security reasons.</p>
          <p>If you did not request this password reset, please ignore this email and make sure you can still access your account.</p>
          <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #777;">
            &copy; ${new Date().getFullYear()} Ripple Exchange. All rights reserved.
          </p>
        </div>
      `
    });
    
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password change confirmation email
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Status of the email send operation
 */
const sendPasswordChangeConfirmation = async (email) => {
  try {
    // Implementation goes here
    return { success: true };
  } catch (error) {
    console.error('Error in password change confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send 2FA status change email
 * @param {string} email - User's email address
 * @param {boolean} enabled - Whether 2FA was enabled or disabled
 * @returns {Promise<Object>} Status of the email send operation
 */
const send2FAStatusChangeEmail = async (email, enabled) => {
  try {
    // Implementation goes here
    return { success: true };
  } catch (error) {
    console.error('Error in 2FA status change email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test the email service connection
 * @returns {Promise<Object>} Status of the connection test
 */
const testEmailService = async () => {
  initializeTransporter();
  
  try {
    await transporter.verify();
    console.log('Email service connection verified successfully');
    return { success: true };
  } catch (error) {
    console.error('Email service connection failed:', error);
    return { success: false, error: error.message };
  }
};

// Export all functions with CommonJS
module.exports = {
  initializeTransporter,
  isEmailServerAvailable,
  generateVerificationCode,
  sendRegistrationVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmation,
  send2FAStatusChangeEmail,
  testEmailService
}; 