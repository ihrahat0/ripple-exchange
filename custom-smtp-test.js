// Custom SMTP test with direct authentication
require('dotenv').config();
const nodemailer = require('nodemailer');
const net = require('net');
const tls = require('tls');
const { Buffer } = require('buffer');

async function customSmtpTest() {
  console.log('='.repeat(50));
  console.log('CUSTOM SMTP TEST WITH DIRECT AUTH');
  console.log('='.repeat(50));
  
  // Get credentials from environment
  const host = process.env.EMAIL_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.EMAIL_PORT || '465');
  const secure = process.env.EMAIL_SECURE === 'true';
  const user = process.env.EMAIL_USER || 'official@rippleexchange.org';
  const pass = process.env.EMAIL_PASS || '';
  const from = process.env.EMAIL_FROM || `"Ripple Exchange" <${user}>`;
  
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Secure: ${secure}`);
  console.log(`User: ${user}`);
  console.log(`Password length: ${pass.length}`);
  console.log(`From: ${from}`);
  
  // Custom handler for authentication - creates our own base64 encoding directly
  const customAuthHandler = async (auth, session) => {
    console.log('Using custom auth handler...');
    
    // If AUTH LOGIN is available (which Hostinger supports)
    if (session.allowsAuth && session.authMethods.includes('LOGIN')) {
      console.log('Using AUTH LOGIN method...');
      
      return new Promise((resolve, reject) => {
        // Prepare custom auth steps
        let currentStep = 0;
        
        // When the server sends something to us
        session.authReady = (challenge) => {
          if (currentStep === 0) {
            // First step is to initiate LOGIN auth
            session.sendCommand('AUTH LOGIN');
            currentStep++;
            return;
          } else if (currentStep === 1) {
            // Second step - username
            const userEncoded = Buffer.from(user).toString('base64');
            console.log(`Sending username (${user})`);
            session.sendCommand(userEncoded);
            currentStep++;
            return;
          } else if (currentStep === 2) {
            // Third step - password
            const passEncoded = Buffer.from(pass).toString('base64');
            console.log(`Sending password (masked)`);
            session.sendCommand(passEncoded);
            currentStep++;
            return;
          }
        };
        
        // When server signals we're done
        session.authSuccess = () => {
          console.log('Authentication successful!');
          resolve();
        };
        
        // When server signals auth failed
        session.authError = (err) => {
          console.error('Authentication failed:', err.message);
          reject(err);
        };
        
        // Start the process
        session.authReady();
      });
    } else {
      // Fall back to built-in auth
      console.log('Falling back to default auth method...');
      return false;
    }
  };
  
  try {
    // Create a custom transport
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        type: 'custom',
        method: 'CUSTOM',
        user,
        pass
      },
      customAuth: {
        CUSTOM: customAuthHandler
      },
      debug: true,
      logger: true
    });
    
    // Try to send an email
    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from: from,
      to: 'ihrahat@icloud.com',
      subject: 'Custom SMTP Auth Test',
      text: 'This is a test email sent using custom SMTP authentication.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #F7931A; text-align: center;">Custom SMTP Test</h2>
          <p>This is a test email sent using custom SMTP authentication.</p>
          <p>If you received this email, it means our custom authentication worked!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Try an alternative method with direct socket connection
    console.log('\n='.repeat(50));
    console.log('TRYING ALTERNATIVE DIRECT CONNECTION');
    console.log('='.repeat(50));
    
    await directSmtpTest();
  }
}

// Direct SMTP test as fallback
async function directSmtpTest() {
  const host = process.env.EMAIL_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.EMAIL_PORT || '465');
  const user = process.env.EMAIL_USER || 'official@rippleexchange.org';
  const pass = process.env.EMAIL_PASS || '';
  
  console.log(`Connecting directly to ${host}:${port}`);
  
  // Simple function to wait for a response
  const readResponse = (socket) => {
    return new Promise((resolve) => {
      const buffer = [];
      const onData = (data) => {
        buffer.push(data);
        const response = Buffer.concat(buffer).toString();
        
        // If we see a complete response (ends with newline)
        if (response.endsWith('\r\n')) {
          socket.removeListener('data', onData);
          console.log(`< ${response.trim()}`);
          resolve(response);
        }
      };
      
      socket.on('data', onData);
    });
  };
  
  // Send a command and wait for response
  const sendCommand = (socket, command) => {
    return new Promise((resolve) => {
      console.log(`> ${command}`);
      socket.write(command + '\r\n');
      readResponse(socket).then(resolve);
    });
  };
  
  try {
    // Create a secure socket
    const socket = tls.connect({
      host,
      port,
      rejectUnauthorized: false
    });
    
    // Handle connection
    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
    
    // Wait for connection
    await new Promise((resolve) => {
      socket.once('secureConnect', () => {
        console.log('Connected securely!');
        resolve();
      });
    });
    
    // Read greeting
    await readResponse(socket);
    
    // EHLO
    await sendCommand(socket, 'EHLO client');
    
    // AUTH LOGIN
    await sendCommand(socket, 'AUTH LOGIN');
    
    // Send username (base64 encoded)
    const userEncoded = Buffer.from(user).toString('base64');
    await sendCommand(socket, userEncoded);
    
    // Send password (base64 encoded)
    const passEncoded = Buffer.from(pass).toString('base64');
    console.log(`> [password base64 encoded, length: ${passEncoded.length}]`);
    const authResponse = await sendCommand(socket, passEncoded);
    
    if (authResponse.startsWith('235')) {
      console.log('Authentication successful!');
      
      // Try to send a test email
      await sendCommand(socket, `MAIL FROM: <${user}>`);
      await sendCommand(socket, 'RCPT TO: <ihrahat@icloud.com>');
      await sendCommand(socket, 'DATA');
      
      const message = [
        'From: "Ripple Exchange" <' + user + '>',
        'To: ihrahat@icloud.com',
        'Subject: Direct SMTP Test',
        'Content-Type: text/html; charset=utf-8',
        '',
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">',
        '  <h2 style="color: #F7931A; text-align: center;">Direct SMTP Test</h2>',
        '  <p>This is a test email sent directly using raw SMTP commands.</p>',
        '  <p>If you received this email, it means direct SMTP connection works!</p>',
        `  <p>Timestamp: ${new Date().toISOString()}</p>`,
        '</div>',
        '.',
        ''
      ].join('\r\n');
      
      await sendCommand(socket, message);
      console.log('Email sent!');
      
      // Quit
      await sendCommand(socket, 'QUIT');
      socket.end();
    } else {
      console.log('Authentication failed');
      socket.end();
      
      console.log('\nTROUBLESHOOTING SUGGESTIONS:');
      console.log('1. Verify the password is correct in your .env file');
      console.log('2. Check with Hostinger if SMTP access is enabled for this account');
      console.log('3. Try creating an app-specific password in Hostinger (if available)');
      console.log('4. Contact Hostinger support for assistance with SMTP access');
    }
  } catch (error) {
    console.error('Error in direct SMTP test:', error);
  }
}

customSmtpTest().catch(console.error); 