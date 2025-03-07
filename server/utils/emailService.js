const axios = require('axios');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

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
 */
const isEmailServerAvailable = async () => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/check-email-server`);
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
  initializeTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ripple Exchange" <noreply@rippleexchange.org>',
      to: email,
      subject: 'Ripple Exchange: Password Changed Successfully',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; background-color: #0c1021; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #2a2a3c;">
            <img src="https://rippleexchange.org/static/media/logo.fb82fbabcd2b7e76a491.png" alt="Ripple Exchange Logo" style="max-width: 200px; height: auto;">
          </div>
          <div style="background-color: #1a1b2a; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid #2a2a3c;">
            <h2 style="color: #fff; text-align: center; margin-bottom: 25px; font-weight: 600;">Password Updated</h2>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">Hello,</p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">Your password for Ripple Exchange has been successfully changed.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 16px; padding: 15px 25px; background: linear-gradient(135deg, #0ECB81, #05854f); border-radius: 8px; display: inline-block; color: white; box-shadow: 0 4px 10px rgba(14, 203, 129, 0.3);">
                ✓ Password Changed Successfully
              </div>
            </div>
            
            <div style="color: #cccccc; line-height: 1.6; font-size: 16px; padding: 20px; border-radius: 8px; background-color: rgba(74, 107, 243, 0.1); margin-bottom: 20px;">
              <p style="margin: 0; margin-bottom: 10px;">
                <strong style="color: #fff;">Security Notice:</strong>
              </p>
              <ul style="margin-top: 5px; padding-left: 20px;">
                <li style="margin-bottom: 8px;">This change was made on ${new Date().toUTCString()}</li>
                <li style="margin-bottom: 8px;">If you recently changed your password, no further action is needed.</li>
                <li>If you did not make this change, please contact our security team immediately.</li>
              </ul>
            </div>
            
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">For enhanced security, we recommend enabling two-factor authentication on your account.</p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; color: #888; font-size: 13px; text-align: center; line-height: 1.5;">
            <p>&copy; ${new Date().getFullYear()} Ripple Exchange. All rights reserved.</p>
            <p>This is a system-generated email. Please do not reply.</p>
            <div style="margin-top: 15px; display: flex; justify-content: center; gap: 20px;">
              <a href="https://rippleexchange.org/terms" style="color: #4A6BF3; text-decoration: none;">Terms of Service</a>
              <a href="https://rippleexchange.org/privacy" style="color: #4A6BF3; text-decoration: none;">Privacy Policy</a>
              <a href="https://rippleexchange.org/help" style="color: #4A6BF3; text-decoration: none;">Help Center</a>
            </div>
          </div>
        </div>
      `
    });
    
    console.log('Password change confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send password change confirmation:', error);
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
  initializeTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ripple Exchange" <noreply@rippleexchange.org>',
      to: email,
      subject: `Ripple Exchange: Two-Factor Authentication ${enabled ? 'Enabled' : 'Disabled'}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; background-color: #0c1021; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #2a2a3c;">
            <img src="https://rippleexchange.org/static/media/logo.fb82fbabcd2b7e76a491.png" alt="Ripple Exchange Logo" style="max-width: 200px; height: auto;">
          </div>
          <div style="background-color: #1a1b2a; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid #2a2a3c;">
            <h2 style="color: #fff; text-align: center; margin-bottom: 25px; font-weight: 600;">Security Update</h2>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">Hello,</p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">This email confirms that Two-Factor Authentication (2FA) has been ${enabled ? 'enabled' : 'disabled'} on your Ripple Exchange account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 16px; padding: 15px 25px; background: ${enabled ? 'linear-gradient(135deg, #0ECB81, #05854f)' : 'linear-gradient(135deg, #F6465D, #a01b2d)'}; border-radius: 8px; display: inline-block; color: white; box-shadow: ${enabled ? '0 4px 10px rgba(14, 203, 129, 0.3)' : '0 4px 10px rgba(246, 70, 93, 0.3)'};">
                ${enabled ? '✓ 2FA ENABLED' : '✗ 2FA DISABLED'}
              </div>
            </div>
            
            <div style="color: #cccccc; line-height: 1.6; font-size: 16px; padding: 20px; border-radius: 8px; background-color: rgba(74, 107, 243, 0.1); margin-bottom: 20px;">
              <p style="margin: 0; margin-bottom: 10px;">
                <strong style="color: #fff;">${enabled ? 'Your account is now protected' : 'Security level changed'}:</strong>
              </p>
              <p style="margin: 0;">
                ${enabled 
                  ? 'Your account is now protected with an additional layer of security. Two-factor authentication helps prevent unauthorized access by requiring a verification code in addition to your password.' 
                  : 'Your account is now less secure without 2FA protection. We strongly recommend enabling 2FA again to protect your account from unauthorized access.'}
              </p>
            </div>
            
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">If you did not make this change, please contact our security team immediately.</p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; color: #888; font-size: 13px; text-align: center; line-height: 1.5;">
            <p>&copy; ${new Date().getFullYear()} Ripple Exchange. All rights reserved.</p>
            <p>This is a system-generated email. Please do not reply.</p>
            <div style="margin-top: 15px; display: flex; justify-content: center; gap: 20px;">
              <a href="https://rippleexchange.org/terms" style="color: #4A6BF3; text-decoration: none;">Terms of Service</a>
              <a href="https://rippleexchange.org/privacy" style="color: #4A6BF3; text-decoration: none;">Privacy Policy</a>
              <a href="https://rippleexchange.org/help" style="color: #4A6BF3; text-decoration: none;">Help Center</a>
            </div>
          </div>
        </div>
      `
    });
    
    console.log('2FA status change email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send 2FA status change email:', error);
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