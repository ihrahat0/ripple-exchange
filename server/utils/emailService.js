const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Create transporter with configuration from environment
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'verify.rippleexchange@gmail.com',
      pass: process.env.EMAIL_PASS || 'nlob twdl jmqq atux'
    }
  });
};

// Save a copy of emails for debugging (optional for production)
const saveEmailCopy = (to, subject, html) => {
  try {
    const emailsDir = path.join(__dirname, '../../emails');
    
    if (!fs.existsSync(emailsDir)) {
      fs.mkdirSync(emailsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(emailsDir, `${timestamp}-${to.replace('@', '-at-')}.html`);
    
    fs.writeFileSync(filename, html);
    console.log(`Email saved to ${filename}`);
  } catch (err) {
    console.error('Error saving email copy:', err.message);
  }
};

// Send verification email for registration
const sendRegistrationVerificationEmail = async (email, code) => {
  try {
    const transporter = createTransporter();
    
    // Email HTML template
    const html = `
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
        </div>
      </div>
    `;
    
    // Save a copy (for debugging)
    saveEmailCopy(email, 'Verification Code', html);
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ripple Exchange" <verify.rippleexchange@gmail.com>',
      to: email,
      subject: 'Ripple Exchange: Your Verification Code',
      html: html
    });
    
    console.log(`Verification email sent to ${email} (MessageID: ${info.messageId})`);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, code) => {
  try {
    const transporter = createTransporter();
    
    // Email HTML template
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; background-color: #0c1021; color: #fff;">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #2a2a3c;">
          <img src="https://rippleexchange.org/static/media/logo.fb82fbabcd2b7e76a491.png" alt="Ripple Exchange Logo" style="max-width: 200px; height: auto;">
        </div>
        <div style="background-color: #1a1b2a; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid #2a2a3c;">
          <h2 style="color: #fff; text-align: center; margin-bottom: 25px; font-weight: 600;">Password Reset</h2>
          <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">Hello,</p>
          <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">We received a request to reset your password. Your verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: linear-gradient(135deg, #4A6BF3, #2a3c82); border-radius: 8px; display: inline-block; color: #fff; box-shadow: 0 4px 10px rgba(74, 107, 243, 0.3);">${code}</div>
          </div>
          <p style="color: #cccccc; line-height: 1.6; font-size: 16px;">This code will expire in 10 minutes.</p>
          <p style="color: #cccccc; line-height: 1.6; font-size: 16px; margin-top: 25px; background-color: rgba(246, 70, 93, 0.1); padding: 15px; border-left: 4px solid #F6465D; border-radius: 4px;">
            <strong style="color: #fff;">Security Notice:</strong> If you did not request this password reset, please contact our security team immediately.
          </p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; color: #888; font-size: 13px; text-align: center; line-height: 1.5;">
          <p>&copy; ${new Date().getFullYear()} Ripple Exchange. All rights reserved.</p>
          <p>This is a system-generated email. Please do not reply.</p>
        </div>
      </div>
    `;
    
    // Save a copy (for debugging)
    saveEmailCopy(email, 'Password Reset', html);
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ripple Exchange" <verify.rippleexchange@gmail.com>',
      to: email,
      subject: 'Ripple Exchange: Password Reset Request',
      html: html
    });
    
    console.log(`Password reset email sent to ${email} (MessageID: ${info.messageId})`);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send password change confirmation email
const sendPasswordChangeConfirmation = async (email) => {
  try {
    const transporter = createTransporter();
    
    // Email HTML template
    const html = `
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
        </div>
        <div style="margin-top: 30px; padding-top: 20px; color: #888; font-size: 13px; text-align: center; line-height: 1.5;">
          <p>&copy; ${new Date().getFullYear()} Ripple Exchange. All rights reserved.</p>
          <p>This is a system-generated email. Please do not reply.</p>
        </div>
      </div>
    `;
    
    // Save a copy (for debugging)
    saveEmailCopy(email, 'Password Changed', html);
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ripple Exchange" <verify.rippleexchange@gmail.com>',
      to: email,
      subject: 'Ripple Exchange: Password Changed Successfully',
      html: html
    });
    
    console.log(`Password change confirmation email sent to ${email} (MessageID: ${info.messageId})`);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending password change confirmation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send 2FA status change email
const send2FAStatusChangeEmail = async (email, enabled) => {
  try {
    const transporter = createTransporter();
    
    // Email HTML template
    const html = `
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
        </div>
      </div>
    `;
    
    // Save a copy (for debugging)
    saveEmailCopy(email, `2FA ${enabled ? 'Enabled' : 'Disabled'}`, html);
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ripple Exchange" <verify.rippleexchange@gmail.com>',
      to: email,
      subject: `Ripple Exchange: Two-Factor Authentication ${enabled ? 'Enabled' : 'Disabled'}`,
      html: html
    });
    
    console.log(`2FA status change email sent to ${email} (MessageID: ${info.messageId})`);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending 2FA status change email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test if email service is working
const testEmailService = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    return {
      success: true,
      message: 'SMTP connection established successfully'
    };
  } catch (error) {
    console.error('Email service test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendRegistrationVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmation,
  send2FAStatusChangeEmail,
  testEmailService
};