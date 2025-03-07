const nodemailer = require('nodemailer');

async function testDirectSMTP() {
  try {
    console.log('Testing SMTP with direct hard-coded configuration...');
    
    // Create a test transporter with explicit settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: 'ihrahat@pinkyswap.com',
        pass: 'rahatRAHAT$4' // Password directly included for testing
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
      from: '"Ripple Exchange" <ihrahat@pinkyswap.com>',
      to: 'ihrahat@icloud.com',
      subject: 'Direct SMTP Test',
      text: 'This is a direct test email from the SMTP script.',
      html: '<b>This is a direct test email from the SMTP script.</b>'
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('Direct SMTP test failed:');
    console.error(error);
  }
}

// Run the test
testDirectSMTP().catch(console.error); 