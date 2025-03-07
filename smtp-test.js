const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTP() {
  try {
    console.log('Testing SMTP connection with direct configuration...');
    console.log('Email: ' + process.env.EMAIL_USER);
    console.log('Password length: ' + (process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0));
    
    // Create a test transporter with explicit settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      debug: true,
      logger: true
    });
    
    console.log('Testing SMTP connection...');
    
    // Verify the connection
    const verifyResult = await transporter.verify();
    console.log('Connection verified:', verifyResult);
    
    // Try to send a test email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Test" <${process.env.EMAIL_USER}>`,
      to: process.argv[2] || 'ihrahat@icloud.com',
      subject: 'SMTP Test Email',
      text: 'This is a test email from the SMTP test script.',
      html: '<b>This is a test email from the SMTP test script.</b>'
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
  } catch (error) {
    console.error('SMTP test failed:');
    console.error(error);
    
    if (error.code === 'EAUTH') {
      // Try alternative auth methods
      console.log('\nTrying alternative auth method...');
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.hostinger.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          authMethod: 'PLAIN', // Try PLAIN instead of LOGIN
          debug: true,
          logger: true
        });
        
        const verifyResult = await transporter.verify();
        console.log('Connection with PLAIN auth verified:', verifyResult);
        
        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM || `"Test" <${process.env.EMAIL_USER}>`,
          to: process.argv[2] || 'ihrahat@icloud.com',
          subject: 'SMTP Test Email (PLAIN auth)',
          text: 'This is a test email using PLAIN auth.',
          html: '<b>This is a test email using PLAIN auth.</b>'
        });
        
        console.log('Email sent successfully with PLAIN auth!');
        console.log('Message ID:', info.messageId);
      } catch (err) {
        console.error('Alternative auth method failed:', err.message);
      }
    }
  }
}

// Run the test
testSMTP().catch(console.error); 