const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize the app
const app = express();
const port = process.env.PORT || 3001;

// CORS options
const corsOptions = {
  origin: ['http://localhost:3000', 'https://rippleexchange.org'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Welcome route for testing
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Email Server API is running' });
});

// Add a specific API root endpoint
app.get('/api', (req, res) => {
  res.json({ success: true, message: 'Email API is available' });
});

// Test route for email service
app.get('/api/test-email', async (req, res) => {
  try {
    const result = await transporter.verify();
    res.json({ success: true, message: 'Email server connection successful', result });
  } catch (error) {
    console.error('Email server connection failed:', error);
    res.status(500).json({ success: false, message: 'Email server connection failed', error: error.message });
  }
});

// Test route for sending a test email
app.post('/api/send-test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const mailOptions = {
      from: '"Ripple Exchange" <noreply@rippleexchange.org>',
      to: email,
      subject: 'Ripple Exchange: Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4A6BF3;">Ripple Exchange</h1>
          </div>
          <h2 style="color: #333; text-align: center;">Test Email</h2>
          <p style="color: #666; line-height: 1.5;">Hello,</p>
          <p style="color: #666; line-height: 1.5;">This is a test email from Ripple Exchange. Your test code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 15px; background-color: #f7f7f7; border-radius: 5px; display: inline-block;">${testCode}</div>
          </div>
          <p style="color: #666; line-height: 1.5;">If you did not request this test, please ignore this email.</p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #999; font-size: 12px; text-align: center;">
            <p>© ${new Date().getFullYear()} Ripple Exchange. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent:', info.messageId);
    
    res.status(200).json({ message: 'Test email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email', details: error.message });
  }
});

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'mail.rippleexchange.org',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'noreply@rippleexchange.org',
    pass: 'I2NEZ$nRXok'
  }
});

// Route to send verification code
app.post('/api/send-verification-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }
    
    const mailOptions = {
      from: '"Ripple Exchange" <noreply@rippleexchange.org>',
      to: email,
      subject: 'Ripple Exchange: Your Verification Code',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; background-color: #0c1021; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #2a2a3c;">
            <img src="https://rippleexchange.org/static/media/logo.fb82fbabcd2b7e76a491.png" alt="Ripple Exchange Logo" style="max-width: 200px; height: auto;">
          </div>
          <div style="background-color: #1a1b2a; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid #2a2a3c;">
            <h2 style="color: #fff; text-align: center; margin-bottom: 25px; font-weight: 600;">Security Verification</h2>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">Hello,</p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">Your security verification code for Ripple Exchange is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: linear-gradient(135deg, #4A6BF3, #2a3c82); border-radius: 8px; display: inline-block; color: #fff; box-shadow: 0 4px 10px rgba(74, 107, 243, 0.3);">${code}</div>
            </div>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">This code will expire in 10 minutes.</p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px; margin-top: 25px; background-color: rgba(74, 107, 243, 0.1); padding: 15px; border-left: 4px solid #4A6BF3; border-radius: 4px;">
              <strong style="color: #fff;">Security Tip:</strong> Never share this code with anyone. Ripple Exchange representatives will never ask for this code.
            </p>
            <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">If you did not request this code, please contact our security team immediately.</p>
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
    console.log(`Verification email sent to ${email}`);
    
    res.status(200).json({ message: 'Verification code sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Route to send password change confirmation
app.post('/api/send-password-change-confirmation', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const mailOptions = {
      from: '"Ripple Exchange" <noreply@rippleexchange.org>',
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
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Password change confirmation email sent:', info.messageId);
    
    res.status(200).json({ message: 'Password change confirmation sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending password change confirmation:', error);
    res.status(500).json({ error: 'Failed to send password change confirmation' });
  }
});

// Route to send 2FA status change email
app.post('/api/send-2fa-status-change', async (req, res) => {
  try {
    const { email, enabled } = req.body;
    
    if (!email || enabled === undefined) {
      return res.status(400).json({ error: 'Email and enabled status are required' });
    }
    
    const mailOptions = {
      from: '"Ripple Exchange" <noreply@rippleexchange.org>',
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
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('2FA status change email sent:', info.messageId);
    
    res.status(200).json({ message: '2FA status change email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending 2FA status change email:', error);
    res.status(500).json({ error: 'Failed to send 2FA status change email' });
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
      from: '"Ripple Exchange" <noreply@rippleexchange.org>',
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});