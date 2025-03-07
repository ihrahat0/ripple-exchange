// Test script for Mailjet email integration
require('dotenv').config();
const Mailjet = require('node-mailjet');

// Check if API keys are set
const apiKey = process.env.MAILJET_API_KEY;
const secretKey = process.env.MAILJET_SECRET_KEY;
const fromEmail = process.env.EMAIL_FROM || 'Ripple Exchange <official@rippleexchange.org>';

// Get recipient email from command line args or use default
const testEmail = process.argv[2] || 'ihrahat@icloud.com';

console.log('='.repeat(50));
console.log('MAILJET TEST');
console.log('='.repeat(50));

// Check if Mailjet keys are configured
if (!apiKey || apiKey === 'your_mailjet_api_key' || !secretKey || secretKey === 'your_mailjet_secret_key') {
  console.log('❌ Mailjet API keys are not configured.');
  console.log('Please sign up for Mailjet and add your API keys to the .env file:');
  console.log('MAILJET_API_KEY=your_api_key');
  console.log('MAILJET_SECRET_KEY=your_secret_key');
  process.exit(1);
}

// Initialize Mailjet client
console.log('Initializing Mailjet client...');
const mailjet = new Mailjet({
  apiKey: apiKey,
  apiSecret: secretKey
});

async function sendTestEmail() {
  try {
    console.log(`Sending test email to: ${testEmail}`);
    console.log(`From: ${fromEmail}`);
    
    // Prepare verification code email
    const verificationCode = '123456';
    
    const request = mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: fromEmail.includes('<') && fromEmail.includes('>') 
                ? fromEmail.match(/<(.+)>/)[1]
                : fromEmail,
              Name: fromEmail.includes('<') && fromEmail.includes('>') 
                ? fromEmail.split('<')[0].trim()
                : 'Ripple Exchange'
            },
            To: [
              {
                Email: testEmail,
                Name: testEmail.split('@')[0]
              }
            ],
            Subject: 'Verify Your Ripple Exchange Account',
            TextPart: `Your verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
            HTMLPart: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #F7931A; text-align: center;">Welcome to Ripple Exchange!</h2>
                <p>Thank you for registering with Ripple Exchange. To complete your registration, please use the verification code below:</p>
                <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
                  ${verificationCode}
                </div>
                <p>This code will expire in 10 minutes for security reasons.</p>
                <p>If you did not request this verification, please ignore this email.</p>
                <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #777;">
                  &copy; ${new Date().getFullYear()} Ripple Exchange. All rights reserved.
                </p>
                <p style="text-align: center; font-size: 10px; color: #aaa;">
                  This is a test email sent via Mailjet. Timestamp: ${new Date().toISOString()}
                </p>
              </div>
            `,
            CustomID: 'VerificationTest'
          }
        ]
      });
    
    console.log('Sending request to Mailjet API...');
    const response = await request;
    
    console.log('✅ Email sent successfully!');
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    // If we reach here, also send a test password reset email
    console.log('\nSending test password reset email...');
    
    const resetCode = '654321';
    
    const resetRequest = mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: fromEmail.includes('<') && fromEmail.includes('>') 
                ? fromEmail.match(/<(.+)>/)[1]
                : fromEmail,
              Name: fromEmail.includes('<') && fromEmail.includes('>') 
                ? fromEmail.split('<')[0].trim()
                : 'Ripple Exchange'
            },
            To: [
              {
                Email: testEmail,
                Name: testEmail.split('@')[0]
              }
            ],
            Subject: 'Reset Your Ripple Exchange Password',
            TextPart: `Your password reset code is: ${resetCode}. This code will expire in 10 minutes.`,
            HTMLPart: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #F7931A; text-align: center;">Password Reset Request</h2>
                <p>We received a request to reset your Ripple Exchange password. Please use the verification code below to reset your password:</p>
                <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
                  ${resetCode}
                </div>
                <p>This code will expire in 10 minutes for security reasons.</p>
                <p>If you did not request this password reset, please ignore this email and make sure you can still access your account.</p>
                <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #777;">
                  &copy; ${new Date().getFullYear()} Ripple Exchange. All rights reserved.
                </p>
                <p style="text-align: center; font-size: 10px; color: #aaa;">
                  This is a test email sent via Mailjet. Timestamp: ${new Date().toISOString()}
                </p>
              </div>
            `,
            CustomID: 'PasswordResetTest'
          }
        ]
      });
    
    const resetResponse = await resetRequest;
    
    console.log('✅ Password reset email sent successfully!');
    console.log('Response:', JSON.stringify(resetResponse.body, null, 2));
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    
    console.log('\nTROUBLESHOOTING:');
    console.log('1. Verify your Mailjet API keys are correct');
    console.log('2. Make sure your sender email is verified in Mailjet');
    console.log('3. Check the error message for specific details');
    console.log('4. Check Mailjet dashboard for more information');
  }
}

// Run the test
sendTestEmail(); 