// Test script for email functionality
require('dotenv').config();
const emailService = require('./server/utils/emailService');

const testEmail = process.argv[2] || process.env.EMAIL_USER;

if (!testEmail) {
  console.error('Please provide an email address as an argument or set EMAIL_USER in .env');
  process.exit(1);
}

console.log('Testing email service with address:', testEmail);
console.log('Using mock transport since SMTP credentials cannot be verified');

// Set environment to development to force mock transport
process.env.NODE_ENV = 'development';

async function runTest() {
  try {
    console.log('\nSetting timeout to 30 seconds for email test...');
    
    // Test 1: Test the email server connection
    console.log('\n1. Testing email server connection...');
    console.log('Waiting for connection (this may take a moment)...');
    const connectionTest = await emailService.testEmailService();
    console.log('Connection test result:', connectionTest);
    
    // Test 2: Send a verification email
    console.log('\n2. Sending test verification email...');
    const verificationResult = await emailService.sendRegistrationVerificationEmail(
      testEmail,
      '123456'
    );
    console.log('Verification email result:', verificationResult);
    
    // Test 3: Send a password reset email
    console.log('\n3. Sending test password reset email...');
    const resetResult = await emailService.sendPasswordResetEmail(
      testEmail,
      '654321'
    );
    console.log('Password reset email result:', resetResult);
    
    console.log('\n✅ Email tests completed using mock transport.');
    console.log('The emails were not actually sent but logged to the console.');
    console.log('To send real emails, fix the SMTP credentials in .env or contact your email provider.');
  } catch (error) {
    console.error('Error during email testing:', error);
  }
}

// Run the test with a longer timeout
setTimeout(() => {
  console.log('Email test timed out after 30 seconds.');
  process.exit(1);
}, 30000);

runTest(); 