// Test script for email functionality
require('dotenv').config();
const emailService = require('./server/utils/emailService');

const testEmail = process.argv[2] || process.env.EMAIL_USER;

if (!testEmail) {
  console.error('Please provide an email address as an argument or set EMAIL_USER in .env');
  process.exit(1);
}

console.log('Testing email service with address:', testEmail);

async function runTest() {
  try {
    // Test connection
    console.log('\n1. Testing email server connection...');
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

runTest(); 