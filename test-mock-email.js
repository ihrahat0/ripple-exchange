/**
 * Test script for the mock email service
 */
const mockEmailService = require('./server/utils/mockEmailService');

// Get test email address from command line arguments
const testEmail = process.argv[2] || 'ihrahat@icloud.com';

async function runTests() {
  console.log('='.repeat(50));
  console.log('MOCK EMAIL SERVICE TEST');
  console.log('='.repeat(50));
  console.log(`Target email: ${testEmail}`);
  console.log('='.repeat(50));
  
  // Test verification email
  console.log('\n1. Sending test verification email...');
  const verificationResult = await mockEmailService.sendRegistrationVerificationEmail(testEmail, '123456');
  console.log('Verification email result:', verificationResult);
  
  // Test password reset email
  console.log('\n2. Sending test password reset email...');
  const resetResult = await mockEmailService.sendPasswordResetEmail(testEmail, '654321');
  console.log('Password reset email result:', resetResult);
  
  // Test password change confirmation
  console.log('\n3. Sending test password change confirmation...');
  const changeResult = await mockEmailService.sendPasswordChangeConfirmation(testEmail);
  console.log('Password change confirmation result:', changeResult);
  
  // Test 2FA enabled notification
  console.log('\n4. Sending test 2FA enabled notification...');
  const enableResult = await mockEmailService.send2FAStatusChangeEmail(testEmail, true);
  console.log('2FA enabled notification result:', enableResult);
  
  // List all sent emails
  console.log('\n='.repeat(50));
  console.log('SENT EMAILS SUMMARY');
  console.log('='.repeat(50));
  
  const emails = mockEmailService.getSentEmails();
  
  emails.forEach((email, index) => {
    console.log(`Email ${index + 1}:`);
    console.log(`- To: ${email.to}`);
    console.log(`- Subject: ${email.subject}`);
    console.log(`- Saved at: ${email.filepath}`);
    console.log(`- Sent at: ${email.timestamp.toLocaleString()}`);
    console.log('-'.repeat(50));
  });
  
  console.log('\n✅ All tests completed successfully!');
  console.log('\nTo view the emails:');
  console.log('1. Open the "emails" directory in your project root');
  console.log('2. Open any of the HTML files in a web browser');
  console.log('\nIn your application code:');
  console.log('1. Replace the import in your routes/controllers:');
  console.log('   const emailService = require(\'../utils/mockEmailService\');');
}

runTests().catch(console.error); 