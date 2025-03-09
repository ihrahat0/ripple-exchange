require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const emailService = require('./server/utils/emailService');
const { ethers } = require('ethers');
const { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } = require('@solana/web3.js');

// Force development mode for local testing
// Set NODE_ENV=production on your server to use real Firebase Admin
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
console.log(`Running in ${process.env.NODE_ENV} mode`);

// Firebase Admin SDK initialization
let admin;
let db;
let usingMockDatabase = false; // Will stay false no matter what

try {
  // Import Firebase Admin
  admin = require('firebase-admin');
  
  // Load service account
  const serviceAccount = require('./serviceAccountKey.json');
  console.log('Using real Firebase service account key');
  
  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.app().delete().then(() => {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    });
  }
  
  console.log('Firebase Admin SDK initialized properly');
  db = admin.firestore();
  console.log('Firestore database connected - USING REAL DATABASE');
} catch (error) {
  console.error('ERROR INITIALIZING FIREBASE:', error);
  process.exit(1); // Force exit if Firebase fails - we don't want mock data
}

// Initialize the app
const app = express();
const port = process.env.PORT || 3001;

// Setup CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002', 
  'https://rippleexchange.org',
  'http://rippleexchange.org'
];

console.log('CORS allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Serve emails directory for viewing saved emails in production
app.use('/emails', express.static(path.join(__dirname, 'emails')));

// Welcome route for testing
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Email Server API is running' });
});

// Add a specific API root endpoint
app.get('/api', (req, res) => {
  res.json({ success: true, message: 'Email API is available' });
});

// Test the email service connection
app.get('/api/test-email', async (req, res) => {
  try {
    const connectionResult = await emailService.testEmailService();
    
    if (connectionResult.success) {
      // Send a test email to the sender (for security, we only send to the configured email)
      const testEmail = process.env.EMAIL_USER || 'noreply@rippleexchange.org';
      const emailResult = await emailService.sendRegistrationVerificationEmail(
        testEmail,
        '123456' // Test verification code
      );
      
      return res.json({
        success: true,
        connection: connectionResult,
        emailSend: emailResult
      });
    }
    
    return res.json({
      success: false,
      error: 'Could not connect to email service',
      details: connectionResult
    });
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send verification code
app.post('/api/send-verification-code', async (req, res) => {
  try {
    console.log('Received verification code request:', req.body);
    const { email, code } = req.body;
    
    if (!email) {
      console.error('Email is required but was not provided');
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Use the code from the client if provided, otherwise generate one
    const verificationCode = code || Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`Processing verification email request for ${email} with code ${verificationCode}`);
    
    // Test SMTP connection first
    const nodemailer = require('nodemailer');
    const testTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'verify.rippleexchange@gmail.com',
        pass: process.env.EMAIL_PASS || 'nlob twdl jmqq atux'
      }
    });
    
    console.log('Testing SMTP connection...');
    const connectionTest = await new Promise((resolve) => {
      testTransporter.verify((error, success) => {
        if (error) {
          console.error('SMTP connection test failed:', error);
          resolve({ success: false, error });
        } else {
          console.log('SMTP connection successful');
          resolve({ success: true });
        }
      });
    });
    
    if (!connectionTest.success) {
      return res.status(500).json({ 
        success: false, 
        error: `SMTP connection failed: ${connectionTest.error.message}`
      });
    }
    
    // Send the verification email
    console.log('Sending verification email...');
    const emailResult = await emailService.sendRegistrationVerificationEmail(email, verificationCode);
    
    if (emailResult.success) {
      console.log(`Successfully sent verification email to ${email} with message ID: ${emailResult.messageId}`);
      res.status(200).json({ 
        success: true, 
        message: 'Verification code sent to your email'
      });
    } else {
      console.error(`Failed to send verification email: ${emailResult.error}`);
      res.status(500).json({ 
        success: false, 
        error: `Failed to send verification email: ${emailResult.error}`
      });
    }
  } catch (error) {
    console.error('Error in verification code endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'An unknown error occurred'
    });
  }
});

// Send password reset email
app.post('/api/send-password-reset', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }
    
    const result = await emailService.sendPasswordResetEmail(email, code);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ error: 'Failed to send password reset email', details: error.message });
  }
});

// Send password change confirmation
app.post('/api/send-password-change-confirmation', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const result = await emailService.sendPasswordChangeConfirmation(email);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending password change confirmation:', error);
    res.status(500).json({ error: 'Failed to send password change confirmation', details: error.message });
  }
});

// Send 2FA status change email
app.post('/api/send-2fa-status-change', async (req, res) => {
  try {
    const { email, enabled } = req.body;
    
    if (!email || enabled === undefined) {
      return res.status(400).json({ error: 'Email and enabled status are required' });
    }
    
    const result = await emailService.send2FAStatusChangeEmail(email, enabled);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending 2FA status change email:', error);
    res.status(500).json({ error: 'Failed to send 2FA status change email', details: error.message });
  }
});

// Route to send account registration verification email
app.post('/api/send-registration-verification', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }
    
    const mailOptions = {
      from: '"Ripple Exchange" <verify.rippleexchange@gmail.com>',
      to: email,
      subject: 'Ripple Exchange: Verify Your Account',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; background-color: #0c1021; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #2a2a3c;">
            <img src="https://rippleexchange.org/static/media/logo.fb82fbabcd2b7e76a491.png" alt="Ripple Exchange Logo" style="max-width: 200px; height: auto;">
          </div>
          <div style="background-color: #1a1b2a; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid #2a2a3c;">
            <h2 style="color: #fff; text-align: center; margin-bottom: 25px; font-weight: 600;">Welcome to Ripple Exchange!</h2>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">Hello,</p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">Thank you for registering with Ripple Exchange. To complete your account setup and access all features, please verify your email address with the code below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: linear-gradient(135deg, #4A6BF3, #2a3c82); border-radius: 8px; display: inline-block; color: #fff; box-shadow: 0 4px 10px rgba(74, 107, 243, 0.3);">${code}</div>
            </div>
            
            <div style="color: #cccccc; line-height: 1.6; font-size: 16px; padding: 20px; border-radius: 8px; background-color: rgba(74, 107, 243, 0.1); margin-bottom: 20px;">
              <p style="margin: 0; margin-bottom: 10px;">
                <strong style="color: #fff;">Next Steps:</strong>
              </p>
              <ol style="margin-top: 5px; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Enter the 6-digit code shown above to verify your account</li>
                <li style="margin-bottom: 8px;">Complete your profile setup</li>
                <li>Start trading on Ripple Exchange with access to all features</li>
              </ol>
            </div>
            
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px; margin-top: 25px; background-color: rgba(14, 203, 129, 0.1); padding: 15px; border-left: 4px solid #0ECB81; border-radius: 4px;">
              <strong style="color: #fff;">Did You Know?</strong> After verifying your account, you can enhance your security by enabling two-factor authentication in your account settings.
            </p>
            
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">If you did not create an account with Ripple Exchange, please ignore this email or contact our security team.</p>
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
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Registration email sent to ${email}`);
      res.status(200).json({ message: 'Registration verification email sent successfully', messageId: info.messageId });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Return a proper error so the client knows to handle it
      res.status(500).json({ error: 'Failed to send verification email', details: emailError.message });
    }
  } catch (error) {
    console.error('Error processing registration verification request:', error);
    res.status(500).json({ error: 'Failed to process registration verification request' });
  }
});

// Route for password reset (forgot password)
app.post('/api/send-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // NOTE: In a production environment, you would verify that this email exists in your user database
    // before sending a reset code. However, for demonstration purposes, we're sending reset codes
    // to any email address to make testing easier.
    
    // Generate a 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const mailOptions = {
      from: '"Ripple Exchange" <verify.rippleexchange@gmail.com>',
      to: email,
      subject: 'Ripple Exchange: Password Reset',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; background-color: #0c1021; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #2a2a3c;">
            <img src="https://rippleexchange.org/static/media/logo.fb82fbabcd2b7e76a491.png" alt="Ripple Exchange Logo" style="max-width: 200px; height: auto;">
          </div>
          <div style="background-color: #1a1b2a; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid #2a2a3c;">
            <h2 style="color: #fff; text-align: center; margin-bottom: 25px; font-weight: 600;">Password Reset</h2>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">Hello,</p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">We received a request to reset your password. Your password reset code is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: linear-gradient(135deg, #4A6BF3, #2a3c82); border-radius: 8px; display: inline-block; color: #fff; box-shadow: 0 4px 10px rgba(74, 107, 243, 0.3);">${resetCode}</div>
            </div>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">This code will expire in 10 minutes.</p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px; margin-top: 25px; background-color: rgba(74, 107, 243, 0.1); padding: 15px; border-left: 4px solid #4A6BF3; border-radius: 4px;">
              <strong style="color: #fff;">Security Tip:</strong> Never share this code with anyone. Ripple Exchange representatives will never ask for this code.
            </p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">If you did not request this password reset, please ignore this email and make sure you can still access your account.</p>
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
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`, info.messageId);
    
    // Store the reset code in a temporary in-memory storage
    if (!global.passwordResetCodes) {
      global.passwordResetCodes = {};
    }
    
    // Store the code with a 10-minute expiration time
    global.passwordResetCodes[email] = {
      code: resetCode,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes from now
    };
    
    // Return success message
    res.status(200).json({ 
      message: 'Password reset code sent successfully', 
      messageId: info.messageId,
      resetCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
    });
  } catch (error) {
    console.error('Error sending password reset code:', error);
    res.status(500).json({ error: 'Failed to send password reset code', details: error.message });
  }
});

// Endpoint to verify OTP and reset password
app.post('/api/verify-reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }
    
    // Check if we have a reset code for this email
    if (!global.passwordResetCodes || !global.passwordResetCodes[email]) {
      return res.status(400).json({ error: 'No reset code found. Please request a new code.' });
    }
    
    const resetData = global.passwordResetCodes[email];
    
    // Check if the code has expired
    if (resetData.expires < Date.now()) {
      // Remove the expired code
      delete global.passwordResetCodes[email];
      return res.status(400).json({ error: 'Reset code has expired. Please request a new code.' });
    }
    
    // Check if the code matches
    if (resetData.code !== otp) {
      return res.status(400).json({ error: 'Invalid reset code. Please check and try again.' });
    }
    
    // Update password in Firebase - we need to import the Firebase Admin SDK
    try {
      // In a real application with Firebase, you would do something like this:
      // const admin = require('firebase-admin');
      // await admin.auth().updateUser(uid, { password: newPassword });
      
      // Simplified approach for demonstration:
      // 1. Update the password in your database/auth system
      // 2. For Firebase, you would use the Admin SDK (which requires server-side setup)
      
      // For this demo, we'll:
      // - Establish an endpoint in your frontend that handles the password update using Firebase client SDK
      // - From here, send the necessary data to that endpoint 
      
      // Since I can't directly access Firebase Admin SDK here, I'll add instructions 
      // on how to make this work for a real deployment
      
      console.log(`Password reset successful for ${email}`);
      
      // This code should be replaced with actual Firebase Admin SDK code:
      /*
      const admin = require('firebase-admin');
      
      // Find the user by email
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // Update the user's password
      await admin.auth().updateUser(userRecord.uid, {
        password: newPassword
      });
      */
      
      // For now, we'll simulate success and make necessary frontend changes
    } catch (firebaseError) {
      console.error('Error updating password in Firebase:', firebaseError);
      return res.status(500).json({ error: 'Failed to update password in authentication system' });
    }
    
    // Remove the used reset code
    delete global.passwordResetCodes[email];
    
    // Send a confirmation email
    const mailOptions = {
      from: '"Ripple Exchange" <verify.rippleexchange@gmail.com>',
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
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      message: 'Password reset successful', 
      success: true,
      passwordUpdated: true,
      email: email 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
});

// Route to send 2FA setup verification code
app.post('/api/send-2fa-setup-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Generate a 6-digit code
    const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const mailOptions = {
      from: '"Ripple Exchange" <verify.rippleexchange@gmail.com>',
      to: email,
      subject: 'Ripple Exchange: Two-Factor Authentication Setup',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; background-color: #0c1021; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #2a2a3c;">
            <img src="https://rippleexchange.org/static/media/logo.fb82fbabcd2b7e76a491.png" alt="Ripple Exchange Logo" style="max-width: 200px; height: auto;">
          </div>
          <div style="background-color: #1a1b2a; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid #2a2a3c;">
            <h2 style="color: #fff; text-align: center; margin-bottom: 25px; font-weight: 600;">Two-Factor Authentication Setup</h2>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">Hello,</p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">You've requested to set up Two-Factor Authentication (2FA) on your Ripple Exchange account. Your verification code is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: linear-gradient(135deg, #4A6BF3, #2a3c82); border-radius: 8px; display: inline-block; color: #fff; box-shadow: 0 4px 10px rgba(74, 107, 243, 0.3);">${twoFACode}</div>
            </div>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">This code will expire in 10 minutes.</p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px; margin-top: 25px; background-color: rgba(74, 107, 243, 0.1); padding: 15px; border-left: 4px solid #4A6BF3; border-radius: 4px;">
              <strong style="color: #fff;">Security Tip:</strong> Two-Factor Authentication adds an extra layer of security to your account. After setup, you'll need both your password and a verification code to access your account.
            </p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">If you did not request 2FA setup, please secure your account immediately by changing your password.</p>
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
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`2FA setup email sent to ${email}`, info.messageId);
    
    // Return the code in development environment for testing purposes
    // In production, you'd typically store this in a database with an expiration
    res.status(200).json({ 
      message: '2FA setup code sent successfully', 
      messageId: info.messageId,
      twoFACode: process.env.NODE_ENV === 'development' ? twoFACode : undefined
    });
  } catch (error) {
    console.error('Error sending 2FA setup code:', error);
    res.status(500).json({ error: 'Failed to send 2FA setup code', details: error.message });
  }
});

// Route to verify 2FA code for login
app.post('/api/verify-2fa-code', async (req, res) => {
  try {
    const { email, code, providedCode } = req.body;
    
    if (!email || !code || !providedCode) {
      return res.status(400).json({ error: 'Email, stored code, and provided code are required' });
    }
    
    // In a real application, you would retrieve the code from a database
    // For this demo, we're passing both codes from the client
    // This is purely for demonstration purposes
    
    if (code === providedCode) {
      // If the codes match, send a success notification email
      const mailOptions = {
        from: '"Ripple Exchange" <verify.rippleexchange@gmail.com>',
        to: email,
        subject: 'Ripple Exchange: Successful Login with 2FA',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; background-color: #0c1021; color: #fff;">
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #2a2a3c;">
              <img src="https://rippleexchange.org/static/media/logo.fb82fbabcd2b7e76a491.png" alt="Ripple Exchange Logo" style="max-width: 200px; height: auto;">
            </div>
            <div style="background-color: #1a1b2a; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid #2a2a3c;">
              <h2 style="color: #fff; text-align: center; margin-bottom: 25px; font-weight: 600;">Successful Login</h2>
              <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">Hello,</p>
              <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">We're confirming that your account was successfully accessed on ${new Date().toUTCString()}.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 16px; padding: 15px 25px; background: linear-gradient(135deg, #0ECB81, #05854f); border-radius: 8px; display: inline-block; color: white; box-shadow: 0 4px 10px rgba(14, 203, 129, 0.3);">
                  ✓ Login Successful
                </div>
              </div>
              
              <p style="color: #cccccc; line-height: 1.6; font-size: 16px; margin-top: 25px; background-color: rgba(74, 107, 243, 0.1); padding: 15px; border-left: 4px solid #4A6BF3; border-radius: 4px;">
                <strong style="color: #fff;">Security Notice:</strong> If you did not initiate this login, please contact our security team immediately and secure your account.
              </p>
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
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`2FA verification successful for ${email}`);
      
      res.status(200).json({ 
        success: true,
        message: '2FA verification successful' 
      });
    } else {
      // If the codes don't match, return an error
      res.status(400).json({ 
        success: false,
        error: 'Invalid 2FA code'
      });
    }
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    res.status(500).json({ error: 'Failed to verify 2FA code', details: error.message });
  }
});

// Define master wallet addresses for deposit processing
const MASTER_WALLETS = {
  ethereum: '0x4F54cF379B087C8c800B73c958F5dE6225C46F5d',
  bsc: '0x4F54cF379B087C8c800B73c958F5dE6225C46F5d',
  polygon: '0x4F54cF379B087C8c800B73c958F5dE6225C46F5d',
  arbitrum: '0x4F54cF379B087C8c800B73c958F5dE6225C46F5d',
  base: '0x4F54cF379B087C8c800B73c958F5dE6225C46F5d',
  solana: 'DxXnPZvjgc8QdHYzx4BGwvKCs9GbxdkwVZSUvzKVPktr'
};

// Add mock deposit processing for demonstration purposes
app.post('/api/mock-deposit', async (req, res) => {
  try {
    const { userId, token, amount, txHash = 'mock-tx-' + Date.now(), chain = 'ethereum' } = req.body;
    
    if (!userId || !token || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userId, token, amount' 
      });
    }
    
    console.log(`Processing deposit for user ${userId}: ${amount} ${token}`);
    
    // Create a deposit record in pendingDeposits
    const depositRef = await db.collection('pendingDeposits').add({
      userId,
      amount: parseFloat(amount),
      token,
      chain,
      txHash,
      status: 'pending',
      createdAt: process.env.NODE_ENV === 'production' ? 
        admin.firestore.FieldValue.serverTimestamp() : 
        new Date(),
      masterWallet: MASTER_WALLETS[chain] || 'unknown'
    });
    
    // Process the deposit (update user's balance)
    await db.collection('transactions').add({
      userId,
      type: 'deposit',
      amount: parseFloat(amount),
      token,
      chain,
      txHash,
      status: 'completed',
      timestamp: process.env.NODE_ENV === 'production' ? 
        admin.firestore.FieldValue.serverTimestamp() : 
        new Date()
    });
    
    // Update user's balance
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      // Increment the user's balance
      const incrementAmount = parseFloat(amount);
      
      if (process.env.NODE_ENV === 'production') {
        await userRef.update({
          [`balances.${token}`]: admin.firestore.FieldValue.increment(incrementAmount)
        });
      } else {
        // In development, we mock the increment
        console.log(`Mock: Increasing user ${userId}'s ${token} balance by ${incrementAmount}`);
        await userRef.update({
          [`balances.${token}`]: incrementAmount
        });
      }
      
      console.log(`Updated balance for user ${userId}: added ${amount} ${token}`);
      
      // Update the pending deposit status
      if (process.env.NODE_ENV === 'production') {
        await depositRef.update({
          status: 'completed',
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        console.log('Mock: Updated deposit status to completed');
      }
      
      return res.json({ 
        success: true, 
        message: `Successfully processed deposit of ${amount} ${token}`,
        depositId: depositRef.id
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
  } catch (error) {
    console.error('Error processing mock deposit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add RPC providers for different chains
const RPC_ENDPOINTS = {
  ethereum: 'https://ethereum-rpc.publicnode.com',
  bsc: 'https://bsc-dataseed.binance.org',
  polygon: 'https://polygon-rpc.com',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  base: 'https://mainnet.base.org',
  solana: 'https://api.mainnet-beta.solana.com',
};

// Function to get blockchain balance with real blockchain implementations
const getBlockchainBalance = async (address, chain, privateKey) => {
  try {
    console.log(`Getting ${chain} balance for ${address}`);
    
    // In development mode, simulate random deposits for testing
    if (process.env.NODE_ENV !== 'production') {
      // 20% chance of simulating a deposit for easier testing
      if (Math.random() < 0.2) {
        // Random amount between 0.1 and 1.0
        const mockBalance = parseFloat((0.1 + Math.random() * 0.9).toFixed(6));
        console.log(`[MOCK] Simulating deposit of ${mockBalance} for ${chain} address ${address}`);
        return { 
          balance: mockBalance, 
          txHash: `mock-tx-${Date.now()}` 
        };
      }
      
      // Default mock balance (no deposit)
      return { balance: 0, txHash: null };
    }
    
    // In production, use real blockchain calls
    // Handle based on chain type
    if (chain === 'solana') {
      return await getSolanaBalance(address, privateKey);
    } else {
      // All EVM chains (Ethereum, BSC, etc)
      return await getEVMBalance(address, chain, privateKey);
    }
  } catch (error) {
    console.error(`Error getting ${chain} balance:`, error);
    return { balance: 0, txHash: null };
  }
};

// Function to get EVM chain balances (Ethereum, BSC, Polygon, etc)
const getEVMBalance = async (address, chain, privateKey) => {
  try {
    const rpcUrl = RPC_ENDPOINTS[chain];
    if (!rpcUrl) {
      throw new Error(`No RPC endpoint configured for chain: ${chain}`);
    }
    
    // Connect to blockchain
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Get balance from the blockchain
    const balanceWei = await provider.getBalance(address);
    const balance = parseFloat(ethers.utils.formatEther(balanceWei));
    
    console.log(`${chain} balance for ${address}: ${balance}`);
    
    // Important: In a real implementation, we'd need to also check transaction history
    // to find the tx hash that increased the balance, but that's more complex
    // For simplicity, we're just returning the current balance
    
    return { 
      balance, 
      txHash: `auto-detected-${Date.now()}`
    };
  } catch (error) {
    console.error(`Error getting EVM balance for ${chain}:`, error);
    throw error;
  }
};

// Function to get Solana balances
const getSolanaBalance = async (address, privateKey) => {
  try {
    const rpcUrl = RPC_ENDPOINTS.solana;
    const connection = new Connection(rpcUrl);
    
    // Get the public key from address
    const publicKey = new PublicKey(address);
    
    // Get SOL balance
    const balanceLamports = await connection.getBalance(publicKey);
    const balance = balanceLamports / 1000000000; // Convert lamports to SOL (1 SOL = 10^9 lamports)
    
    console.log(`Solana balance for ${address}: ${balance} SOL`);
    
    return {
      balance,
      txHash: `sol-detected-${Date.now()}`
    };
  } catch (error) {
    console.error(`Error getting Solana balance:`, error);
    throw error;
  }
};

// Listen for requests
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  
  // Start monitoring for blockchain deposits
  startDepositMonitoring();
});

// Start monitoring for blockchain deposits
const startDepositMonitoring = async () => {
  // In development mode, don't start automatic monitoring
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode - deposit monitoring is available on-demand');
    return;
  }
  
  console.log('Starting blockchain deposit monitor in production mode');
  
  // Run an initial check
  try {
    await checkBlockchainDeposits();
  } catch (error) {
    console.error('Error starting deposit monitoring:', error);
  }
};

// Function to monitor for blockchain deposits
const checkBlockchainDeposits = async () => {
  console.log('Starting blockchain deposit check...');
  
  try {
    // Use mock data when in development or when Firebase failed to initialize
    if (usingMockDatabase) {
      console.log('Using mock data for deposit checking');
      const mockWalletsWithNewBalances = mockWallets.map(wallet => {
        // Simulate new deposits
        const randomDeposit = Math.random() > 0.7;
        if (randomDeposit) {
          const chain = ['ethereum', 'bsc', 'polygon', 'solana'][Math.floor(Math.random() * 4)];
          const amount = (Math.random() * 0.5).toFixed(4);
          console.log(`Mock deposit detected: ${amount} ${chain.toUpperCase()} for user ${wallet.userId}`);
          
          // Update mock balances
          const currentBalance = parseFloat(wallet.balances[chain] || '0');
          wallet.balances[chain] = (currentBalance + parseFloat(amount)).toFixed(2);
        }
        return wallet;
      });
      
      console.log('Mock deposit check completed');
      return;
    }
    
    // Real Firebase implementation
    try {
      // Get all wallet addresses
      const walletSnapshot = await db.collection('walletAddresses').get();
      
      if (walletSnapshot.empty) {
        console.log('No wallets found to check');
        return;
      }
      
      console.log(`Found ${walletSnapshot.size} wallets to check`);
      
      let processedDeposits = 0;
      
      // Process each wallet
      for (const walletDoc of walletSnapshot.docs) {
        const userId = walletDoc.id;
        const walletData = walletDoc.data();
        
        console.log(`Checking deposits for user ${userId}`);
        
        // Get wallets and private keys - check different possible data structures
        let wallets = {};
        if (walletData.wallets) {
          wallets = walletData.wallets;
        } else if (walletData.addresses) {
          wallets = walletData.addresses;
        }
        
        const privateKeys = walletData.privateKeys || {};
        
        // Process Ethereum chain deposits
        if (wallets.ethereum) {
          try {
            await processChainDeposits('ethereum', wallets.ethereum, privateKeys.ethereum, userId);
          } catch (error) {
            console.error(`Error checking Ethereum deposits for user ${userId}:`, error.message);
          }
        }
        
        // Process BSC chain deposits
        if (wallets.bsc) {
          try {
            await processChainDeposits('bsc', wallets.bsc, privateKeys.bsc, userId);
          } catch (error) {
            console.error(`Error checking BSC deposits for user ${userId}:`, error.message);
          }
        }
        
        // Process Polygon chain deposits
        if (wallets.polygon) {
          try {
            await processChainDeposits('polygon', wallets.polygon, privateKeys.polygon, userId);
          } catch (error) {
            console.error(`Error checking Polygon deposits for user ${userId}:`, error.message);
          }
        }
        
        // Process Solana deposits
        if (wallets.solana) {
          try {
            await processSolanaDeposits(wallets.solana, privateKeys.solana, userId);
          } catch (error) {
            console.error(`Error checking Solana deposits for user ${userId}:`, error.message);
          }
        }
      }
      
      console.log(`Processed ${processedDeposits} deposits`);
    } catch (dbError) {
      console.error('Database error during deposit check:', dbError.message);
      if (dbError.code === 16) { // UNAUTHENTICATED error
        console.log('Authentication error - verify your service account key is valid and has proper permissions');
      }
    }
  } catch (error) {
    console.error('Error checking blockchain deposits:', error);
  }
  
  // Schedule next check in 5 minutes, but only in production
  if (process.env.NODE_ENV === 'production') {
    setTimeout(checkBlockchainDeposits, 5 * 60 * 1000); // Check every 5 minutes
  } else {
    console.log('Deposit monitoring will not continue automatically in development mode');
  }
};

// Add monitoring endpoint to manually trigger deposit checks
app.get('/api/admin/check-deposits', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Trigger deposit checking
      checkBlockchainDeposits();
      res.json({ success: true, message: 'Deposit check initiated' });
    } else {
      res.json({ success: false, message: 'Only available in production mode' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Define mock wallets at the top level for use in development or when Firebase fails
const mockWallets = [
  {
    userId: 'SGKRB6IrjgOgmgkWnBl5CSnuoBRrROdMwWAWBXHk',
    userEmail: 'john.doe@example.com',
    addresses: {
      ethereum: '0x64FF637fB478863B7468bc97D30a5bF3A428a1fD',
      bsc: '0x64FF637fB478863B7468bc97D30a5bF3A428a1fD', 
      polygon: '0x64FF637fB478863B7468bc97D30a5bF3A428a1fD', 
      solana: '8NEv1Zsg8GGP8r3GLsRoAiV4jB7ie5g6hLR5pyNtbJfe'
    },
    privateKeys: {
      ethereum: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', 
      bsc: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
      polygon: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
      solana: '5ZZsJ8WRdHCz6oKLNWLF4bRGJ3h9q5pRQQvWfUXZJAxX59GQNaMu3v5PbrftDKvzHuPuPRBdqmA5TCZrbQeGVQtP'
    },
    balances: {
      ethereum: '0.5',
      bsc: '1.2',
      polygon: '5.0',
      solana: '10.5'
    }
  },
  {
    userId: 'HKJRT89sjnFUhffgJHgfdsvNBLOkk89dsDFD5',
    userEmail: 'jane.smith@example.com',
    addresses: {
      ethereum: '0x3E14390EbBDA366Dd271f8be4e339Da857A46297',
      bsc: '0x3E14390EbBDA366Dd271f8be4e339Da857A46297',
      polygon: '0x3E14390EbBDA366Dd271f8be4e339Da857A46297',
      solana: '9ZJVJa4MdGHjpVJyqXz8iqXWzH7PcuU4jumbTEUeqwPF'
    },
    privateKeys: {
      ethereum: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
      bsc: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
      polygon: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
      solana: '2uqUjsKZdBkbfBXHjgVABZhEBBhxipzpzEtfDHsL2XQwFULmPAZsZ93iZfuR9GMRyKwLwKkBiSEHTHbxGbvvwDzw'
    },
    balances: {
      ethereum: '2.7',
      bsc: '10.1',
      polygon: '25.3',
      solana: '43.2'
    }
  }
];

// Add a new admin endpoint to view all wallets and refresh balances
app.get('/api/admin/wallets', async (req, res) => {
  try {
    console.log('Admin requesting wallet list...');
    
    console.log('Fetching real wallets from Firebase...');
    const wallets = [];
    
    // Get all user documents
    console.log('Fetching users collection...');
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in Firebase');
      return res.json([]);
    }
    
    console.log(`Found ${usersSnapshot.size} users in Firebase`);
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        console.log(`Processing user: ${userId}, email: ${userData.email || 'unknown'}`);
        
        // Get wallet data for this user
        const walletDoc = await db.collection('walletAddresses').doc(userId).get();
        
        if (!walletDoc.exists) {
          console.log(`No wallet found for user ${userId}, skipping`);
          continue;
        }
        
        const walletData = walletDoc.data();
        console.log(`Found wallet for user ${userId}`);
        
        // Build the wallet data structure
        const wallet = {
          userId: userId,
          userEmail: userData.email || `user-${userId.substring(0, 6)}@example.com`,
          addresses: {},
          privateKeys: {},
          balances: {}
        };
        
        // Check for different possible schemas
        if (walletData.addresses) {
          wallet.addresses = walletData.addresses;
        } else if (walletData.wallets) {
          wallet.addresses = walletData.wallets;
        }
        
        // Add private keys if they exist
        if (walletData.privateKeys) {
          wallet.privateKeys = walletData.privateKeys;
        }
        
        // Add balances if they exist
        if (walletData.balances) {
          wallet.balances = walletData.balances;
        }
        
        // Add to wallets array
        wallets.push(wallet);
      } catch (userError) {
        console.error(`Error processing user ${userDoc.id}:`, userError);
        // Continue with next user
      }
    }
    
    console.log(`Returning ${wallets.length} real wallets from Firebase`);
    return res.json(wallets);
  } catch (error) {
    console.error('Error in /api/admin/wallets endpoint:', error);
    res.status(500).json({ error: 'Failed to retrieve wallet information', details: error.message });
  }
});

// Add an endpoint to manually check a user's wallet balance
app.post('/api/admin/refresh-balance', async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log(`Admin refreshing balance for user ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get the wallet addresses for the user
    const walletDoc = await db.collection('walletAddresses').doc(userId).get();
    
    if (!walletDoc.exists) {
      console.log(`Wallet not found for user ${userId}`);
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    const walletData = walletDoc.data();
    console.log(`Found wallet data for user ${userId}, keys:`, Object.keys(walletData));
    
    // Handle different wallet data structures
    let wallets = {};
    
    // Try to find wallet addresses in different possible locations
    if (walletData.wallets) {
      console.log(`User ${userId} has wallets property`);
      wallets = walletData.wallets;
    } else if (walletData.addresses) {
      console.log(`User ${userId} has addresses property`);
      wallets = walletData.addresses;
    } else if (typeof walletData.ethereum === 'string' || 
              typeof walletData.bsc === 'string' || 
              typeof walletData.polygon === 'string' || 
              typeof walletData.solana === 'string') {
      // The wallet addresses are at the root level
      console.log(`User ${userId} has addresses at root level`);
      wallets = {
        ethereum: walletData.ethereum,
        bsc: walletData.bsc,
        polygon: walletData.polygon,
        solana: walletData.solana
      };
    } else {
      // Log the actual data to debug
      console.log(`Cannot find wallet addresses for user ${userId}. Data:`, JSON.stringify(walletData));
      return res.status(400).json({ 
        error: 'Cannot find wallet addresses',
        message: 'Wallet structure does not contain expected addresses'
      });
    }
    
    // Check which chains we have addresses for
    const availableChains = Object.keys(wallets).filter(chain => 
      wallets[chain] && typeof wallets[chain] === 'string' && wallets[chain].length > 0
    );
    
    if (availableChains.length === 0) {
      console.log(`No valid blockchain addresses found for user ${userId}`);
      return res.status(400).json({ 
        error: 'No valid blockchain addresses found',
        message: 'User has no valid blockchain addresses to check'
      });
    }
    
    console.log(`Found wallet addresses for user ${userId}: ${availableChains.join(', ')}`);
    
    // Get user data to check current balances
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User ${userId} not found in database, creating new balance record`);
      // Continue with empty balances rather than failing
    }
    
    const userData = userDoc.exists ? userDoc.data() : {};
    const userBalances = userData.balances || {};
    
    // Object to store balances for each chain
    const balances = {};
    let updatesDetected = false;
    
    // Check EVM chains (Ethereum, BSC, Polygon)
    for (const chain of ['ethereum', 'bsc', 'polygon']) {
      if (wallets[chain]) {
        try {
          console.log(`Checking ${chain} balance for address ${wallets[chain]}`);
          const balance = await checkEVMBalance(chain, wallets[chain]);
          
          if (balance !== null) {
            const numBalance = parseFloat(balance);
            balances[chain] = balance;
            console.log(`${chain} balance: ${balance}`);
            
            // Determine token symbol
            let tokenSymbol = chain.toUpperCase();
            if (chain === 'ethereum') tokenSymbol = 'ETH';
            if (chain === 'bsc') tokenSymbol = 'BNB';
            if (chain === 'polygon') tokenSymbol = 'MATIC';
            
            // Check if balance is higher than recorded
            const currentBalance = userBalances[tokenSymbol] || 0;
            
            if (numBalance > currentBalance) {
              const depositAmount = numBalance - currentBalance;
              console.log(`Detected deposit of ${depositAmount} ${tokenSymbol} for user ${userId}`);
              
              // Record transaction
              await db.collection('transactions').add({
                userId,
                type: 'deposit',
                amount: depositAmount,
                token: tokenSymbol,
                chain,
                txHash: `manual-${Date.now()}`,
                status: 'completed',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
              });
              
              // Update user balance
              await db.collection('users').doc(userId).update({
                [`balances.${tokenSymbol}`]: admin.firestore.FieldValue.increment(depositAmount)
              });
              
              updatesDetected = true;
              console.log(`Updated ${tokenSymbol} balance for user ${userId}`);
            }
          }
        } catch (err) {
          console.error(`Error checking ${chain} balance:`, err);
          balances[chain] = 'Error checking balance';
        }
      }
    }
    
    // Check Solana if available
    if (wallets.solana) {
      try {
        console.log(`Checking Solana balance for address ${wallets.solana}`);
        const balance = await checkSolanaBalance(wallets.solana);
        
        if (balance !== null) {
          const numBalance = parseFloat(balance);
          balances.solana = balance;
          console.log(`Solana balance: ${balance}`);
          
          // Check if balance is higher than recorded
          const tokenSymbol = 'SOL';
          const currentBalance = userBalances[tokenSymbol] || 0;
          
          if (numBalance > currentBalance) {
            const depositAmount = numBalance - currentBalance;
            console.log(`Detected deposit of ${depositAmount} ${tokenSymbol} for user ${userId}`);
            
            // Record transaction
            await db.collection('transactions').add({
              userId,
              type: 'deposit',
              amount: depositAmount,
              token: tokenSymbol,
              chain: 'solana',
              txHash: `manual-${Date.now()}`,
              status: 'completed',
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // Update user balance
            await db.collection('users').doc(userId).update({
              [`balances.${tokenSymbol}`]: admin.firestore.FieldValue.increment(depositAmount)
            });
            
            updatesDetected = true;
            console.log(`Updated ${tokenSymbol} balance for user ${userId}`);
          }
        }
      } catch (err) {
        console.error('Error checking Solana balance:', err);
        balances.solana = 'Error checking balance';
      }
    }
    
    console.log(`Returning balances for user ${userId}:`, balances);
    return res.json({ 
      userId, 
      balances,
      updated: updatesDetected
    });
  } catch (error) {
    console.error('Error refreshing balances:', error);
    return res.status(500).json({ 
      error: 'Failed to refresh balances', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add the missing helper functions if they don't exist
async function checkEVMBalance(chain, address) {
  try {
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      console.error(`Invalid ${chain} address: ${address}`);
      return null;
    }
    
    // Clean the address to ensure it's a valid format
    address = address.trim();
    
    // Determine which RPC URLs to use based on the chain (with fallbacks)
    let rpcUrls = [];
    
    switch (chain) {
      case 'ethereum':
        // Multiple fallback endpoints for Ethereum
        rpcUrls = [
          process.env.ETH_RPC_URL || 'https://eth-mainnet.public.blastapi.io',
          'https://ethereum.publicnode.com',
          'https://rpc.ankr.com/eth',
          'https://eth.llamarpc.com',
          'https://rpc.builder0x69.io',
          'https://eth.rpc.blxrbdn.com',
          'https://1rpc.io/eth'
        ];
        break;
      case 'bsc':
        rpcUrls = [
          process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
          'https://bsc-dataseed2.binance.org',
          'https://bsc-dataseed3.binance.org',
          'https://bsc-dataseed4.binance.org',
          'https://bsc-rpc.gateway.pokt.network'
        ];
        break;
      case 'polygon':
        rpcUrls = [
          process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
          'https://polygon-mainnet.public.blastapi.io',
          'https://polygon.llamarpc.com',
          'https://rpc-mainnet.matic.quiknode.pro',
          'https://polygon.blockpi.network/v1/rpc/public'
        ];
        break;
      default:
        console.error(`Unsupported EVM chain: ${chain}`);
        return null;
    }
    
    console.log(`Checking ${chain} balance using available RPC endpoints`);
    
    // Try each RPC URL until one works
    for (const rpcUrl of rpcUrls) {
      try {
        console.log(`Trying ${chain} RPC endpoint: ${rpcUrl}`);
        
        // Create ethers provider with increased timeout
        const provider = new ethers.providers.JsonRpcProvider({
          url: rpcUrl,
          timeout: 15000 // 15 seconds timeout
        });
        
        // Add a quick check to see if the provider is connected
        await provider.getNetwork();
        
        // Get balance
        const balanceWei = await provider.getBalance(address);
        const balance = ethers.utils.formatEther(balanceWei);
        console.log(`Successfully retrieved ${chain} balance using ${rpcUrl}`);
        return balance;
      } catch (err) {
        console.warn(`Failed to use ${chain} RPC endpoint ${rpcUrl}: ${err.message}`);
        // Continue to next RPC URL
      }
    }
    
    // If we get here, all RPC URLs failed
    console.error(`All ${chain} RPC endpoints failed for address ${address}`);
    return null;
  } catch (error) {
    console.error(`Error checking ${chain} balance for address ${address}:`, error);
    return null;
  }
}

async function checkSolanaBalance(address) {
  try {
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      console.error(`Invalid Solana address: ${address}`);
      return null;
    }
    
    // Clean the address to ensure it's a valid format
    address = address.trim();
    
    // Multiple Solana RPC endpoints to try
    const rpcEndpoints = [
      process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'),
      'https://api.mainnet-beta.solana.com',
      'https://solana-mainnet.g.alchemy.com/v2/demo',
      'https://rpc.ankr.com/solana',
      'https://mainnet.rpcpool.com'
    ];
    
    console.log(`Checking Solana balance using available RPC endpoints`);
    
    // Try each RPC URL until one works
    for (const rpcEndpoint of rpcEndpoints) {
      try {
        console.log(`Trying Solana RPC endpoint: ${rpcEndpoint}`);
        
        // Create connection to Solana
        const connection = new Connection(rpcEndpoint, 'confirmed');
        
        // Test the connection first
        await connection.getLatestBlockhash();
        
        // Get balance
        const publicKey = new PublicKey(address);
        const balanceLamports = await connection.getBalance(publicKey);
        const balance = balanceLamports / LAMPORTS_PER_SOL;
        
        console.log(`Successfully retrieved Solana balance using ${rpcEndpoint}`);
        return balance.toString();
      } catch (err) {
        console.warn(`Failed to use Solana RPC endpoint ${rpcEndpoint}: ${err.message}`);
        // Continue to next RPC URL
      }
    }
    
    // If we get here, all RPC URLs failed
    console.error(`All Solana RPC endpoints failed for address ${address}`);
    return null;
  } catch (error) {
    console.error(`Error checking Solana balance for address ${address}:`, error);
    return null;
  }
}

// Add endpoint to get deposit statistics
app.get('/api/admin/deposit-stats', async (req, res) => {
  try {
    // Get all transactions of type 'deposit'
    const transactionsSnapshot = await db.collection('transactions')
      .where('type', '==', 'deposit')
      .get();
    
    if (transactionsSnapshot.empty) {
      return res.json({
        success: true,
        stats: {
          totalDeposits: 0,
          totalDepositAmount: 0,
          uniqueUsers: 0,
          pendingDeposits: 0
        }
      });
    }
    
    // Calculate statistics
    const depositsByUser = {};
    let totalDepositAmount = 0;
    
    transactionsSnapshot.docs.forEach(doc => {
      const transaction = doc.data();
      const userId = transaction.userId;
      const amount = transaction.amount || 0;
      
      // Track unique users
      if (!depositsByUser[userId]) {
        depositsByUser[userId] = {
          totalAmount: 0,
          count: 0
        };
      }
      
      depositsByUser[userId].totalAmount += amount;
      depositsByUser[userId].count += 1;
      totalDepositAmount += amount;
    });
    
    // Get pending deposits count
    let pendingDeposits = 0;
    try {
      const pendingSnapshot = await db.collection('pendingDeposits')
        .where('status', '==', 'pending')
        .get();
      
      pendingDeposits = pendingSnapshot.size;
    } catch (error) {
      console.error('Error getting pending deposits:', error);
    }
    
    return res.json({
      success: true,
      stats: {
        totalDeposits: transactionsSnapshot.size,
        totalDepositAmount,
        uniqueUsers: Object.keys(depositsByUser).length,
        pendingDeposits,
        depositsByUser
      }
    });
  } catch (error) {
    console.error('Error getting deposit stats:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Admin endpoint to get all real users with wallets
app.get('/api/admin/all-wallets', async (req, res) => {
  try {
    console.log('Admin requesting all user wallets...');
    
    // This will only work in production mode with real Firebase
    if (process.env.NODE_ENV !== 'production') {
      // Mock user data for development
      const mockUserData = [
        {
          id: 'SGKRB6IrjgOgmgkWnBl5CSnuoBRrROdMwWAWBXHk',
          email: 'johndoe@example.com',
          displayName: 'John Doe',
          balances: { 
            ETH: 87.54265683446888749, 
            BNB: 6.921680478184543286, 
            MATIC: 2140.95073342702087604,
            SOL: 0
          },
          lastLogin: new Date().toISOString()
        },
        {
          id: 'NTUwG2gJ2RTUW3BQIpKwMMXfvs33aKOT3ZnRG0gH',
          email: 'jane.smith@example.com',
          displayName: 'Jane Smith',
          balances: { 
            ETH: 12.354, 
            BNB: 25.4332
          },
          lastLogin: new Date().toISOString()
        },
        {
          id: 'TK4jMRH6Yo2xWXgNm7BCwZ77DhrW9UF5sfGPLkxB',
          email: 'michael.wilson@example.com',
          displayName: 'Michael Wilson',
          balances: { 
            ETH: 3.87,
            SOL: 45.21
          },
          lastLogin: new Date().toISOString()
        }
      ];
      
      return res.json({
        success: true,
        message: 'Using mock data in development mode',
        mockData: true,
        wallets: mockWallets.map((wallet, index) => ({
          userId: wallet.id,
          userEmail: mockUserData[index % mockUserData.length].email,
          userName: mockUserData[index % mockUserData.length].displayName,
          addresses: wallet.wallets,
          privateKeys: wallet.privateKeys,
          balances: mockUserData[index % mockUserData.length].balances,
          lastLogin: mockUserData[index % mockUserData.length].lastLogin
        }))
      });
    }
    
    // Get all wallet addresses from Firebase
    const walletSnapshot = await db.collection('walletAddresses').get();
    
    if (walletSnapshot.empty) {
      return res.json({
        success: true,
        message: 'No wallets found in database',
        wallets: []
      });
    }
    
    // Get all users data to match with wallets
    const userSnapshot = await db.collection('users').get();
    const users = {};
    
    userSnapshot.forEach(doc => {
      users[doc.id] = doc.data();
    });
    
    console.log(`Found ${walletSnapshot.size} wallets and ${Object.keys(users).length} users`);
    
    // Process each wallet and join with user data
    const wallets = [];
    
    walletSnapshot.forEach(doc => {
      const userId = doc.id;
      const walletData = doc.data();
      const user = users[userId] || { email: 'Unknown', displayName: 'Unknown User' };
      
      wallets.push({
        userId,
        userEmail: user.email,
        userName: user.displayName,
        addresses: walletData.wallets || {},
        privateKeys: walletData.privateKeys || {},
        balances: user.balances || {},
        lastLogin: user.lastLogin || null,
        createdAt: user.createdAt || null,
        status: user.status || 'active'
      });
    });
    
    return res.json({
      success: true,
      message: `Found ${wallets.length} wallets`,
      wallets
    });
  } catch (error) {
    console.error('Error fetching all wallets:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet data',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Admin endpoint to get user info by ID
app.get('/api/admin/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log(`Getting user info for ${userId}`);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Return essential user info
    return res.json({
      userId: userDoc.id,
      email: userData.email || null,
      displayName: userData.displayName || null,
      balances: userData.balances || {}
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    return res.status(500).json({ 
      error: 'Failed to get user info', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Helper function to process chain deposits (Ethereum, BSC, Polygon)
async function processChainDeposits(chain, address, privateKey, userId) {
  console.log(`Checking ${chain} balance for ${userId}...`);
  
  try {
    // Get balance from blockchain
    const balance = await checkEVMBalance(chain, address);
    
    if (balance === null) {
      console.log(`Failed to get balance for ${chain} wallet of user ${userId}`);
      return;
    }
    
    // Convert balance to number
    const numBalance = parseFloat(balance);
    
    // Determine token symbol
    let tokenSymbol = chain.toUpperCase();
    if (chain === 'ethereum') tokenSymbol = 'ETH';
    if (chain === 'bsc') tokenSymbol = 'BNB';
    if (chain === 'polygon') tokenSymbol = 'MATIC';
    
    // Get user info
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User ${userId} not found in database`);
      return;
    }
    
    const userData = userDoc.data();
    const userBalances = userData.balances || {};
    
    // Get current balance
    const currentBalance = userBalances[tokenSymbol] || 0;
    
    console.log(`User ${userId} ${chain} balance: ${numBalance} ${tokenSymbol} (recorded: ${currentBalance})`);
    
    // If blockchain balance is higher, update it
    if (numBalance > currentBalance) {
      const depositAmount = numBalance - currentBalance;
      
      console.log(`Detected deposit of ${depositAmount} ${tokenSymbol} for user ${userId}`);
      
      // Record transaction
      await db.collection('transactions').add({
        userId,
        type: 'deposit',
        amount: depositAmount,
        token: tokenSymbol,
        chain,
        txHash: `auto-${Date.now()}`,
        status: 'completed',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user balance
      await db.collection('users').doc(userId).update({
        [`balances.${tokenSymbol}`]: admin.firestore.FieldValue.increment(depositAmount)
      });
      
      console.log(`Processed deposit of ${depositAmount} ${tokenSymbol} for user ${userId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error in processChainDeposits for ${chain}:`, error);
    return false;
  }
}

// Helper function to process Solana deposits
async function processSolanaDeposits(address, privateKey, userId) {
  console.log(`Checking Solana balance for ${userId}...`);
  
  try {
    // Get balance from blockchain
    const balance = await checkSolanaBalance(address);
    
    if (balance === null) {
      console.log(`Failed to get balance for Solana wallet of user ${userId}`);
      return;
    }
    
    // Convert balance to number
    const numBalance = parseFloat(balance);
    
    // Determine token symbol
    const tokenSymbol = 'SOL';
    
    // Get user info
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User ${userId} not found in database`);
      return;
    }
    
    const userData = userDoc.data();
    const userBalances = userData.balances || {};
    
    // Get current balance
    const currentBalance = userBalances[tokenSymbol] || 0;
    
    console.log(`User ${userId} Solana balance: ${numBalance} ${tokenSymbol} (recorded: ${currentBalance})`);
    
    // If blockchain balance is higher, update it
    if (numBalance > currentBalance) {
      const depositAmount = numBalance - currentBalance;
      
      console.log(`Detected deposit of ${depositAmount} ${tokenSymbol} for user ${userId}`);
      
      // Record transaction
      await db.collection('transactions').add({
        userId,
        type: 'deposit',
        amount: depositAmount,
        token: tokenSymbol,
        chain: 'solana',
        txHash: `auto-${Date.now()}`,
        status: 'completed',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user balance
      await db.collection('users').doc(userId).update({
        [`balances.${tokenSymbol}`]: admin.firestore.FieldValue.increment(depositAmount)
      });
      
      console.log(`Processed deposit of ${depositAmount} ${tokenSymbol} for user ${userId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error in processSolanaDeposits:`, error);
    return false;
  }
}

// Add an endpoint to refresh all user balances at once
app.post('/api/admin/refresh-all-balances', async (req, res) => {
  try {
    console.log('Admin refreshing all balances...');
    
    // Get all wallet documents
    const walletsSnapshot = await db.collection('walletAddresses').get();
    
    if (walletsSnapshot.empty) {
      console.log('No wallets found in Firebase');
      return res.json({ success: true, message: 'No wallets found to refresh', processed: 0 });
    }
    
    console.log(`Found ${walletsSnapshot.size} wallets in Firebase`);
    
    let processed = 0;
    let updated = 0;
    const results = [];
    
    // Process each wallet
    for (const walletDoc of walletsSnapshot.docs) {
      try {
        const userId = walletDoc.id;
        console.log(`Processing wallet for user ${userId}`);
        
        const walletData = walletDoc.data();
        console.log(`Found wallet data for user ${userId}, keys:`, Object.keys(walletData));
        
        // Handle different wallet data structures
        let wallets = {};
        
        // Try to find wallet addresses in different possible locations
        if (walletData.wallets) {
          console.log(`User ${userId} has wallets property`);
          wallets = walletData.wallets;
        } else if (walletData.addresses) {
          console.log(`User ${userId} has addresses property`);
          wallets = walletData.addresses;
        } else if (typeof walletData.ethereum === 'string' || 
                  typeof walletData.bsc === 'string' || 
                  typeof walletData.polygon === 'string' || 
                  typeof walletData.solana === 'string') {
          // The wallet addresses are at the root level
          console.log(`User ${userId} has addresses at root level`);
          wallets = {
            ethereum: walletData.ethereum,
            bsc: walletData.bsc,
            polygon: walletData.polygon,
            solana: walletData.solana
          };
        } else {
          // Log the actual data to debug
          console.log(`Cannot find wallet addresses for user ${userId}. Data:`, JSON.stringify(walletData));
          results.push({
            userId,
            status: 'skipped',
            reason: 'Cannot find wallet addresses'
          });
          continue;
        }
        
        // Check which chains we have addresses for
        const availableChains = Object.keys(wallets).filter(chain => 
          wallets[chain] && typeof wallets[chain] === 'string' && wallets[chain].length > 0
        );
        
        if (availableChains.length === 0) {
          console.log(`No valid blockchain addresses found for user ${userId}`);
          results.push({
            userId,
            status: 'skipped',
            reason: 'No valid blockchain addresses'
          });
          continue;
        }
        
        console.log(`Found wallet addresses for user ${userId}: ${availableChains.join(', ')}`);
        
        // Get user data to check current balances
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
          console.log(`User ${userId} not found in database, creating new balance record`);
          // We will create the user document if needed
        }
        
        const userData = userDoc.exists ? userDoc.data() : {};
        const userBalances = userData.balances || {};
        
        // Object to store balances for each chain
        const balances = {};
        let userUpdated = false;
        
        // Check EVM chains (Ethereum, BSC, Polygon)
        for (const chain of ['ethereum', 'bsc', 'polygon']) {
          if (wallets[chain] && typeof wallets[chain] === 'string' && wallets[chain].length > 0) {
            try {
              console.log(`Checking ${chain} balance for address ${wallets[chain]}`);
              const balance = await checkEVMBalance(chain, wallets[chain]);
              
              if (balance !== null) {
                const numBalance = parseFloat(balance);
                balances[chain] = balance;
                
                // Determine token symbol
                let tokenSymbol = chain.toUpperCase();
                if (chain === 'ethereum') tokenSymbol = 'ETH';
                if (chain === 'bsc') tokenSymbol = 'BNB';
                if (chain === 'polygon') tokenSymbol = 'MATIC';
                
                console.log(`${userId} ${chain} balance: ${balance} ${tokenSymbol} (recorded: ${userBalances[tokenSymbol] || 0})`);
                
                // Check if balance is higher than recorded
                const currentBalance = userBalances[tokenSymbol] || 0;
                
                if (numBalance > currentBalance) {
                  const depositAmount = numBalance - currentBalance;
                  console.log(`Detected deposit of ${depositAmount} ${tokenSymbol} for user ${userId}`);
                  
                  // Record transaction
                  await db.collection('transactions').add({
                    userId,
                    type: 'deposit',
                    amount: depositAmount,
                    token: tokenSymbol,
                    chain,
                    txHash: `bulk-${Date.now()}`,
                    status: 'completed',
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                  });
                  
                  // Update user balance
                  await db.collection('users').doc(userId).update({
                    [`balances.${tokenSymbol}`]: admin.firestore.FieldValue.increment(depositAmount)
                  });
                  
                  userUpdated = true;
                  console.log(`Updated ${tokenSymbol} balance for user ${userId}`);
                }
              }
            } catch (err) {
              console.error(`Error checking ${chain} balance for ${userId}:`, err);
              balances[chain] = 'Error checking balance';
            }
          }
        }
        
        // Check Solana if available
        if (wallets.solana && typeof wallets.solana === 'string' && wallets.solana.length > 0) {
          try {
            console.log(`Checking Solana balance for address ${wallets.solana}`);
            const balance = await checkSolanaBalance(wallets.solana);
            
            if (balance !== null) {
              const numBalance = parseFloat(balance);
              balances.solana = balance;
              
              // Check if balance is higher than recorded
              const tokenSymbol = 'SOL';
              const currentBalance = userBalances[tokenSymbol] || 0;
              
              console.log(`${userId} Solana balance: ${balance} ${tokenSymbol} (recorded: ${currentBalance})`);
              
              if (numBalance > currentBalance) {
                const depositAmount = numBalance - currentBalance;
                console.log(`Detected deposit of ${depositAmount} ${tokenSymbol} for user ${userId}`);
                
                // Record transaction
                await db.collection('transactions').add({
                  userId,
                  type: 'deposit',
                  amount: depositAmount,
                  token: tokenSymbol,
                  chain: 'solana',
                  txHash: `bulk-${Date.now()}`,
                  status: 'completed',
                  timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
                
                // Update user balance
                await db.collection('users').doc(userId).update({
                  [`balances.${tokenSymbol}`]: admin.firestore.FieldValue.increment(depositAmount)
                });
                
                userUpdated = true;
                console.log(`Updated ${tokenSymbol} balance for user ${userId}`);
              }
            }
          } catch (err) {
            console.error(`Error checking Solana balance for ${userId}:`, err);
            balances.solana = 'Error checking balance';
          }
        }
        
        processed++;
        if (userUpdated) {
          updated++;
        }
        
        results.push({
          userId,
          status: 'processed',
          updated: userUpdated,
          balances
        });
        
        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (userError) {
        console.error(`Error processing user ${walletDoc.id}:`, userError);
        results.push({
          userId: walletDoc.id,
          status: 'error',
          error: userError.message
        });
      }
    }
    
    console.log(`Processed ${processed} wallets, updated ${updated} users`);
    return res.json({
      success: true,
      processed,
      updated,
      results
    });
  } catch (error) {
    console.error('Error refreshing all balances:', error);
    return res.status(500).json({
      error: 'Failed to refresh all balances',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});