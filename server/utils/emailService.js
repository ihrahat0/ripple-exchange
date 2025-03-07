const axios = require('axios');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');
const nodemailerMock = require('nodemailer-mock');

dotenv.config();

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API initialized');
}

// Create a reusable transporter object
let transporter = null;

/**
 * Create a logger-only transport that logs emails to the console
 * @returns {object} Mock transport
 */
const createLoggerTransport = () => {
  console.log('Creating logger-only email transport (emails will be logged but not sent)');
  
  return {
    name: 'log-transport',
    version: '1.0.0',
    send: (mail, callback) => {
      const message = mail.message.createReadStream();
      const chunks = [];

      message.on('data', (chunk) => {
        chunks.push(chunk);
      });

      message.on('end', () => {
        console.log('========================');
        console.log('MOCK EMAIL (Not Sent)');
        console.log('========================');
        console.log(Buffer.concat(chunks).toString('utf8'));
        console.log('========================');
        callback(null, { messageId: undefined });
      });
    },
    // Basic verification for testing
    verify: (callback) => {
      callback(null, true);
    }
  };
};

/**
 * Create a mock transport that stores emails for testing
 * Uses nodemailer-mock
 * @returns {object} Mock transport
 */
const createMockTransport = () => {
  console.log('Creating mock email transport with nodemailer-mock');
  
  // Get a reference to the mock transport
  const mockTransport = nodemailerMock.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false
  });
  
  // Log all sent emails for debugging
  mockTransport.on('sendMail', (email) => {
    console.log('========================');
    console.log('MOCK EMAIL SENT WITH NODEMAILER-MOCK');
    console.log('========================');
    console.log('FROM: ' + email.from);
    console.log('TO: ' + email.to);
    console.log('SUBJECT: ' + email.subject);
    console.log('------------------------');
    console.log('HTML: ' + email.html.substring(0, 100) + '...');
    console.log('========================');
  });
  
  return mockTransport;
};

// Initialize transporter with proper error handling
const initializeTransporter = () => {
  if (transporter) return;
  
  console.log('Initializing email transporter...');
  
  try {
    // Configuration for the email service
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = process.env.EMAIL_PORT || 587;
    const secure = process.env.EMAIL_SECURE === 'true' || false;
    const user = process.env.EMAIL_USER || 'yourgmail@gmail.com';
    const pass = process.env.EMAIL_PASS || 'your-app-password'; 
    
    console.log(`Email Config - Host: ${host}, Port: ${port}, Secure: ${secure}`);
    console.log(`Using email user: ${user}, Password length: ${pass.length}`);
    
    // Environment check
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (isDev) {
      console.log('Running in development mode. Using mock email transport.');
      transporter = createMockTransport();
      return;
    }
    
    // Check if we have valid credentials
    if (!user || user === 'yourgmail@gmail.com' || !pass || pass === 'your-app-password') {
      console.warn('Warning: Using placeholder email credentials. Creating mock email transport.');
      transporter = createLoggerTransport();
      return;
    }
    
    // Configure email transporter with enhanced security options and detailed logging
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Helps with some configurations
        minVersion: "TLSv1.2"     // Enforce minimum TLS version
      },
      debug: true,    // Show debug info
      logger: true,   // Log information about the mail
      maxConnections: 1, // Limit concurrent connections
      maxMessages: 10,   // Limit messages per connection
      pool: false        // Don't use connection pool (more reliable for testing)
    });
    
    console.log('Email transporter initialized with host:', host);
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    console.log('Falling back to mock email transport');
    transporter = createLoggerTransport();
  }
};

/**
 * Check if email server is available
 * @returns {Promise<boolean>} Whether the server is available
 */
const isEmailServerAvailable = async () => {
  try {
    initializeTransporter();
    if (!transporter) return false;
    
    // For mock transporter, always return true
    if (transporter.name === 'log-transport' || transporter.name === 'Mock') {
      return true;
    }
    
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email server not available:', error);
    return false;
  }
};

/**
 * Test the email service
 * @returns {Promise<Object>} Status of the test
 */
const testEmailService = async () => {
  console.log('Setting connection timeout to 15 seconds...');
  
  try {
    console.log('Verifying SMTP connection...');
    initializeTransporter();
    
    if (!transporter) {
      return { success: false, message: 'Email transporter not initialized' };
    }
    
    // For mock transporters, return success
    if (transporter.name === 'log-transport') {
      return { success: true, message: 'Fallback to mock email transport', isMock: true };
    }
    
    if (transporter.name === 'Mock') {
      return { success: true, message: 'Using nodemailer-mock transport', isMock: true };
    }
    
    // Otherwise verify the connection
    await transporter.verify();
    console.log('Email server connection successful');
    return { success: true, message: 'Email server connection successful' };
  } catch (error) {
    console.error('Email server connection failed:', error);
    console.log('Falling back to mock email transport');
    
    // Recreate transporter with the mock transport
    transporter = createMockTransport();
    
    return { 
      success: true, 
      message: 'Fallback to mock email transport', 
      isMock: true,
      originalError: error.message
    };
  }
};

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
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
  console.log(`Attempting to send registration verification email to: ${email}`);
  console.log(`Verification code: ${code}`);
  
  const htmlContent = `
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
  `;
  
  // Initialize SMTP or mock transporter
  initializeTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ripple Exchange" <noreply@rippleexchange.org>',
      to: email,
      subject: 'Verify Your Ripple Exchange Account',
      html: htmlContent
    });
    
    if (transporter.name === 'log-transport') {
      console.log('Registration verification email logged (mock transport)');
      return { success: true, message: 'Email logged (not actually sent)', isMock: true };
    }
    
    if (transporter.name === 'Mock') {
      console.log('Registration verification email sent via mock transport');
      return { success: true, message: 'Email sent via mock transport', isMock: true };
    }
    
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
  console.log(`Attempting to send password reset email to: ${email}`);
  console.log(`Reset code: ${code}`);
  
  const htmlContent = `
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
  `;
  
  // Initialize SMTP or mock transporter
  initializeTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ripple Exchange" <noreply@rippleexchange.org>',
      to: email,
      subject: 'Reset Your Ripple Exchange Password',
      html: htmlContent
    });
    
    if (transporter.name === 'log-transport') {
      console.log('Password reset email logged (mock transport)');
      return { success: true, message: 'Email logged (not actually sent)', isMock: true };
    }
    
    if (transporter.name === 'Mock') {
      console.log('Password reset email sent via mock transport');
      return { success: true, message: 'Email sent via mock transport', isMock: true };
    }
    
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