// Test script for email functionality
require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a test transporter
const createTransporter = () => {
  console.log('Creating test transporter with:');
  console.log('- Email host:', process.env.EMAIL_HOST || 'smtp.hostinger.com');
  console.log('- Email port:', process.env.EMAIL_PORT || 465);
  console.log('- Email user:', process.env.EMAIL_USER || 'noreply@rippleexchange.org');
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'mail.rippleexchange.org',
    port: process.env.EMAIL_PORT || 465,
    secure: process.env.EMAIL_SECURE === 'true' || true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'noreply@rippleexchange.org',
      pass: process.env.EMAIL_PASS || 'I2NEZ$nRXok',
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Generate a verification code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Test sending a verification email
const testVerificationEmail = async (email) => {
  const transporter = createTransporter();
  const code = generateCode();
  
  console.log(`Sending verification email to ${email} with code ${code}`);
  
  try {
    // Verify connection
    await transporter.verify();
    console.log('Transporter verified successfully');
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ripple Exchange" <noreply@rippleexchange.org>',
      to: email,
      subject: 'TEST - Verify Your Ripple Exchange Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #F7931A; text-align: center;">TEST - Ripple Exchange Email</h2>
          <p>This is a test email to verify email functionality is working correctly.</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
            ${code}
          </div>
          <p>If this test email worked, your email system is configured correctly.</p>
        </div>
      `
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return true;
  } catch (error) {
    console.error('Failed to send test email:', error);
    return false;
  }
};

// Run the test
const runTest = async () => {
  // Check required environment variables
  const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log('Warning: Some recommended environment variables are missing:', missing.join(', '));
    console.log('Using default values from server.js instead.');
  }
  
  // Use provided email or default to the configured email
  const testEmail = process.argv[2] || process.env.EMAIL_USER || 'noreply@rippleexchange.org';
  
  console.log('======== EMAIL TEST ========');
  console.log('Testing email functionality with:');
  console.log(`- Test recipient: ${testEmail}`);
  
  const result = await testVerificationEmail(testEmail);
  
  if (result) {
    console.log('✅ Email test PASSED!');
  } else {
    console.log('❌ Email test FAILED!');
    process.exit(1);
  }
};

// Execute the test
runTest().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
}); 