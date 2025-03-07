const nodemailer = require('nodemailer');
require('dotenv').config();

async function testHostingerSMTP() {
  try {
    // Get credentials from .env file
    const host = process.env.EMAIL_HOST || 'smtp.hostinger.com';
    const port = process.env.EMAIL_PORT || 465;
    const secure = process.env.EMAIL_SECURE === 'true' || true;
    const user = process.env.EMAIL_USER || '';
    const pass = process.env.EMAIL_PASS || ''; 
    
    console.log('='.repeat(50));
    console.log('HOSTINGER SMTP CONNECTION TEST');
    console.log('='.repeat(50));
    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`Secure: ${secure}`);
    console.log(`User: ${user}`);
    console.log(`Password length: ${pass.length}`);
    console.log(`Password (first 2 chars): ${pass.substring(0, 2)}***`);
    console.log('='.repeat(50));
    
    // Configuration for SSL/465
    console.log('\nTest 1: Trying with SSL/465...');
    const transporter1 = nodemailer.createTransport({
      host: host,
      port: 465,
      secure: true,
      auth: {
        user: user,
        pass: pass
      },
      debug: true,
      logger: true
    });
    
    try {
      console.log('Verifying connection...');
      await transporter1.verify();
      console.log('TEST 1 SUCCESSFUL: SSL/465 connection verified!');
      
      // Try sending a test email
      const info = await transporter1.sendMail({
        from: `"Ripple Exchange" <${user}>`,
        to: "ihrahat@icloud.com",
        subject: "Test Email from Hostinger SMTP (SSL/465)",
        text: "This is a test email sent using Hostinger SMTP with SSL/465.",
        html: "<b>This is a test email sent using Hostinger SMTP with SSL/465.</b>"
      });
      
      console.log('Email sent successfully!');
      console.log('Message ID:', info.messageId);
      console.log('='.repeat(50));
      
      return; // If successful, no need to try other methods
    } catch (error) {
      console.error('TEST 1 FAILED:', error.message);
      console.log('Stack trace:', error.stack);
      console.log('Error details:', JSON.stringify(error, null, 2));
      console.log('='.repeat(50));
    }
    
    // Configuration for STARTTLS/587
    console.log('\nTest 2: Trying with STARTTLS/587...');
    const transporter2 = nodemailer.createTransport({
      host: host,
      port: 587,
      secure: false,
      auth: {
        user: user,
        pass: pass
      },
      debug: true,
      logger: true
    });
    
    try {
      console.log('Verifying connection...');
      await transporter2.verify();
      console.log('TEST 2 SUCCESSFUL: STARTTLS/587 connection verified!');
      
      // Try sending a test email
      const info = await transporter2.sendMail({
        from: `"Ripple Exchange" <${user}>`,
        to: "ihrahat@icloud.com",
        subject: "Test Email from Hostinger SMTP (STARTTLS/587)",
        text: "This is a test email sent using Hostinger SMTP with STARTTLS/587.",
        html: "<b>This is a test email sent using Hostinger SMTP with STARTTLS/587.</b>"
      });
      
      console.log('Email sent successfully!');
      console.log('Message ID:', info.messageId);
      console.log('='.repeat(50));
      
      return; // If successful, no need to try other methods
    } catch (error) {
      console.error('TEST 2 FAILED:', error.message);
      console.log('Stack trace:', error.stack);
      console.log('Error details:', JSON.stringify(error, null, 2));
      console.log('='.repeat(50));
    }
    
    // Try with alternative authentication method
    console.log('\nTest 3: Trying alternative auth method...');
    const transporter3 = nodemailer.createTransport({
      host: host,
      port: 465,
      secure: true,
      auth: {
        user: user,
        pass: pass
      },
      authMethod: 'PLAIN',
      debug: true,
      logger: true
    });
    
    try {
      console.log('Verifying connection...');
      await transporter3.verify();
      console.log('TEST 3 SUCCESSFUL: Alternative auth method verified!');
      
      // Try sending a test email
      const info = await transporter3.sendMail({
        from: `"Ripple Exchange" <${user}>`,
        to: "ihrahat@icloud.com",
        subject: "Test Email from Hostinger SMTP (Alternative Auth)",
        text: "This is a test email sent using Hostinger SMTP with alternative authentication.",
        html: "<b>This is a test email sent using Hostinger SMTP with alternative authentication.</b>"
      });
      
      console.log('Email sent successfully!');
      console.log('Message ID:', info.messageId);
      console.log('='.repeat(50));
    } catch (error) {
      console.error('TEST 3 FAILED:', error.message);
      console.log('Stack trace:', error.stack);
      console.log('Error details:', JSON.stringify(error, null, 2));
      console.log('='.repeat(50));
    }
    
    console.log('\nContact Hostinger support with the above test results.');
    console.log('Possible issues:');
    console.log('1. Email account not properly set up in Hostinger');
    console.log('2. Incorrect password');
    console.log('3. SMTP access not enabled for your account');
    console.log('4. Hostinger\'s anti-spam protection blocking connections');
    
  } catch (error) {
    console.error('General error:', error);
  }
}

testHostingerSMTP().catch(console.error); 