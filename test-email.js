// Test script for email functionality
require('dotenv').config();
const emailService = require('./server/utils/emailService');

const testEmail = process.argv[2] || process.env.EMAIL_USER;

if (!testEmail) {
  console.error('Please provide an email address as an argument or set EMAIL_USER in .env');
  process.exit(1);
}

console.log('Testing email service with address:', testEmail);
console.log('Using configuration from .env:');

// Check if using SendGrid
if (process.env.SENDGRID_API_KEY) {
  console.log('SendGrid API is enabled.');
  // Check if API key looks valid (just a basic check)
  if (process.env.SENDGRID_API_KEY === 'your-sendgrid-api-key-here') {
    console.warn('⚠️ Warning: You are using the placeholder SendGrid API key. Please replace it with a real key.');
  }
} else {
  console.log('Using SMTP configuration:');
  console.log(`- EMAIL_HOST: ${process.env.EMAIL_HOST}`);
  console.log(`- EMAIL_PORT: ${process.env.EMAIL_PORT}`);
  console.log(`- EMAIL_SECURE: ${process.env.EMAIL_SECURE}`);
  console.log(`- EMAIL_USER: ${process.env.EMAIL_USER}`);
}

async function runTest() {
  try {
    // Test connection
    console.log('\n1. Testing email server connection...');
    console.log('Waiting for connection (this may take a moment)...');
    const connectionResult = await emailService.testEmailService();
    console.log('Connection test result:', connectionResult);
    
    if (!connectionResult.success) {
      console.error('Connection test failed, cannot proceed with sending test emails');
      process.exit(1);
    }
    
    // Test verification email
    console.log('\n2. Sending test verification email...');
    const verificationCode = '123456';
    const verificationResult = await emailService.sendRegistrationVerificationEmail(testEmail, verificationCode);
    console.log('Verification email result:', verificationResult);
    
    // Test password reset email
    console.log('\n3. Sending test password reset email...');
    const resetCode = '654321';
    const resetResult = await emailService.sendPasswordResetEmail(testEmail, resetCode);
    console.log('Password reset email result:', resetResult);
    
    console.log('\n✅ Email tests completed. Check your inbox!');
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

// Set longer timeout for the test
console.log('Setting timeout to 30 seconds for email test...');
runTest().catch(err => {
  console.error('Unhandled error in test:', err);
  process.exit(1);
}); 