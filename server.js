require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const emailService = require('./server/utils/mockEmailService');
const path = require('path');

// Initialize the app
const app = express();
const port = process.env.PORT || 3001;

// CORS options
const corsOptions = {
  origin: ['http://localhost:3000', 'https://rippleexchange.org', 'http://rippleexchange.org'],
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
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }
    
    const result = await emailService.sendRegistrationVerificationEmail(email, code);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code', details: error.message });
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});