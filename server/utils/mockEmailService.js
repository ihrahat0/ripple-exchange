/**
 * Mock Email Service
 * A fallback email service that saves emails as HTML files instead of sending them.
 * This is useful for testing or when SMTP is not available.
 */

const fs = require('fs');
const path = require('path');

// Get domain from environment
const domain = process.env.FRONTEND_URL || 'http://localhost:3001';

// Create emails directory if it doesn't exist
const emailsDir = path.join(process.cwd(), 'emails');
if (!fs.existsSync(emailsDir)) {
  fs.mkdirSync(emailsDir, { recursive: true });
  console.log(`Created emails directory at ${emailsDir}`);
}

/**
 * Save an email as an HTML file
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @returns {Promise<Object>} - Success status and filename
 */
async function saveEmailAsFile(options) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedSubject = options.subject.replace(/[^a-z0-9]/gi, '-').substring(0, 30);
  const sanitizedTo = options.to.replace(/[^a-z0-9@.]/gi, '-');
  
  const filename = `${timestamp}-${sanitizedTo}-${sanitizedSubject}.html`;
  const filepath = path.join(emailsDir, filename);
  
  // Get the relative URL for accessing this email
  const emailUrl = `${domain}/emails/${filename}`;
  
  // Create a full HTML document with metadata
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${options.subject}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .email-metadata { background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
    .email-metadata p { margin: 5px 0; }
    .email-content { padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="email-metadata">
    <p><strong>To:</strong> ${options.to}</p>
    <p><strong>Subject:</strong> ${options.subject}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
  </div>
  <div class="email-content">
    ${options.html}
  </div>
</body>
</html>`;
  
  try {
    fs.writeFileSync(filepath, fullHtml);
    console.log(`Email saved to: ${filepath}`);
    console.log(`Email accessible at: ${emailUrl}`);
    return { success: true, filepath, url: emailUrl };
  } catch (error) {
    console.error('Error saving email:', error);
    return { success: false, error };
  }
}

/**
 * Test the email service connection
 * @returns {Promise<Object>} - Always returns success for mock service
 */
async function testEmailService() {
  console.log('Using mock email service - emails will be saved as HTML files');
  return { success: true, message: 'Mock email service is ready' };
}

/**
 * Generate a random verification code
 * @returns {string} - 6 digit verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send a registration verification email
 * @param {string} email - Recipient email
 * @param {string} verificationCode - Verification code
 * @returns {Promise<Object>} - Email send result
 */
async function sendRegistrationVerificationEmail(email, verificationCode) {
  console.log(`Preparing to save registration verification email to ${email}`);
  
  const emailOptions = {
    to: email,
    subject: 'Verify Your Ripple Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Ripple</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering! Please use the verification code below to complete your registration:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0; color: #4F46E5; letter-spacing: 5px;">${verificationCode}</h2>
          </div>
          <p>This code will expire in 1 hour.</p>
          <p>If you didn't request this email, you can safely ignore it.</p>
          <p>Best regards,<br>The Ripple Team</p>
        </div>
      </div>
    `
  };
  
  return await saveEmailAsFile(emailOptions);
}

/**
 * Send a password reset email
 * @param {string} email - Recipient email
 * @param {string} resetCode - Password reset code
 * @returns {Promise<Object>} - Email send result
 */
async function sendPasswordResetEmail(email, resetCode) {
  console.log(`Preparing to save password reset email to ${email}`);
  
  const emailOptions = {
    to: email,
    subject: 'Reset Your Ripple Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Ripple</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password. Please use the code below to reset your password:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0; color: #4F46E5; letter-spacing: 5px;">${resetCode}</h2>
          </div>
          <p>This code will expire in 1 hour.</p>
          <p>If you didn't request this email, please secure your account immediately.</p>
          <p>Best regards,<br>The Ripple Team</p>
        </div>
      </div>
    `
  };
  
  return await saveEmailAsFile(emailOptions);
}

/**
 * Send a password change confirmation email
 * @param {string} email - Recipient email
 * @returns {Promise<Object>} - Email send result
 */
async function sendPasswordChangeConfirmation(email) {
  console.log(`Preparing to save password change confirmation email to ${email}`);
  
  const emailOptions = {
    to: email,
    subject: 'Your Ripple Password Was Changed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Ripple</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Password Changed Successfully</h2>
          <p>Your Ripple account password has been changed successfully.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <p>Best regards,<br>The Ripple Team</p>
        </div>
      </div>
    `
  };
  
  return await saveEmailAsFile(emailOptions);
}

/**
 * Send a 2FA status change email
 * @param {string} email - Recipient email
 * @param {boolean} enabled - Whether 2FA was enabled or disabled
 * @returns {Promise<Object>} - Email send result
 */
async function send2FAStatusChangeEmail(email, enabled) {
  const action = enabled ? 'enabled' : 'disabled';
  console.log(`Preparing to save 2FA ${action} notification to ${email}`);
  
  const emailOptions = {
    to: email,
    subject: `Two-Factor Authentication ${enabled ? 'Enabled' : 'Disabled'} - Ripple`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Ripple</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Two-Factor Authentication ${enabled ? 'Enabled' : 'Disabled'}</h2>
          <p>Two-factor authentication has been ${action} for your Ripple account.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <p>Best regards,<br>The Ripple Team</p>
        </div>
      </div>
    `
  };
  
  return await saveEmailAsFile(emailOptions);
}

module.exports = {
  testEmailService,
  generateVerificationCode,
  sendRegistrationVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmation,
  send2FAStatusChangeEmail
}; 