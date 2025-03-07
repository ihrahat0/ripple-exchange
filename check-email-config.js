// Script to diagnose email configuration and connection
require('dotenv').config();
const nodemailer = require('nodemailer');

async function checkEmailConfig() {
  try {
    console.log('='.repeat(50));
    console.log('EMAIL CONFIGURATION DIAGNOSTIC');
    console.log('='.repeat(50));
    
    // Check environment
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`Should use real transport: ${process.env.NODE_ENV === 'production'}`);
    
    // Check SMTP credentials
    console.log('\nSMTP CREDENTIALS:');
    console.log(`Host: ${process.env.EMAIL_HOST}`);
    console.log(`Port: ${process.env.EMAIL_PORT}`);
    console.log(`Secure: ${process.env.EMAIL_SECURE}`);
    console.log(`User: ${process.env.EMAIL_USER}`);
    console.log(`Password: ${'*'.repeat(process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0)}`);
    console.log(`From: ${process.env.EMAIL_FROM}`);
    
    // Create a direct transporter for testing
    console.log('\nCREATING DIRECT SMTP CONNECTION:');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      debug: true,
      logger: true
    });
    
    console.log('\nVERIFYING CONNECTION:');
    try {
      const isVerified = await transporter.verify();
      console.log('Connection verified:', isVerified);
      console.log('✓ SMTP configuration appears correct');
    } catch (verifyError) {
      console.error('Connection verification failed:', verifyError.message);
      console.log('✗ SMTP configuration has issues');
      
      if (verifyError.code === 'EAUTH') {
        console.log('\nAUTHENTICATION ERROR:');
        console.log('• Check if the password is correct');
        console.log('• Check if SMTP access is enabled for this account in Hostinger');
        console.log('• Verify you\'re not using 2FA that requires an app password');
      }
      
      throw verifyError;
    }
    
    // Attempt to send a test email
    console.log('\nSENDING TEST EMAIL:');
    const email = process.argv[2] || 'ihrahat@icloud.com';
    console.log(`Sending to: ${email}`);
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Direct SMTP Test from Ripple Exchange',
      text: 'This is a direct SMTP test email sent using nodemailer.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #F7931A; text-align: center;">Ripple Exchange Email Test</h2>
          <p>This is a direct SMTP test email from Ripple Exchange.</p>
          <p>If you received this email, it means your SMTP configuration is working correctly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('='.repeat(50));
    console.log('DIAGNOSTICS COMPLETE');
    console.log('='.repeat(50));
    
    console.log('\nTROUBLESHOOTING STEPS IF EMAIL NOT RECEIVED:');
    console.log('1. Check your spam/junk folder');
    console.log('2. Verify with Hostinger that outgoing SMTP is enabled for this account');
    console.log('3. Check if your domain has proper SPF/DKIM records');
    console.log('4. Try testing with a Gmail address as recipient');
    console.log('5. Contact Hostinger support with the Message ID for tracking');
    
  } catch (error) {
    console.error('\nDIAGNOSTIC ERROR:');
    console.error(error);
    
    console.log('\nTROUBLESHOOTING SUGGESTIONS:');
    
    if (error.code === 'ETIMEDOUT') {
      console.log('• Port might be blocked by your firewall/network');
      console.log('• Try using alternative port (587 instead of 465 or vice versa)');
    }
    
    if (error.code === 'ESOCKET') {
      console.log('• SSL/TLS configuration might be incorrect');
      console.log('• Try changing EMAIL_SECURE to the opposite value');
    }
    
    console.log('• Verify the EMAIL_HOST is correct (smtp.hostinger.com)');
    console.log('• Check if outbound SMTP traffic is allowed on your network');
    console.log('• Contact Hostinger support for assistance with their SMTP configuration');
  }
}

checkEmailConfig().catch(console.error); 