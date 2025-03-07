const net = require('net');
const tls = require('tls');
const { Buffer } = require('buffer');
require('dotenv').config();

/**
 * Direct SMTP Test without using NodeMailer
 * This bypasses any issues with NodeMailer's credential handling
 */
async function testDirectSMTP() {
  // Get credentials from .env file
  const host = process.env.EMAIL_HOST || 'smtp.hostinger.com';
  const port = process.env.EMAIL_PORT || 465;
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';
  
  console.log('='.repeat(50));
  console.log('DIRECT SMTP TEST');
  console.log('='.repeat(50));
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Password length: ${pass.length}`);
  console.log('='.repeat(50));
  
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
    // Create a secure socket for direct SSL connection
    console.log('\nConnecting directly to SSL port...');
    const socket = tls.connect({
      host,
      port,
      rejectUnauthorized: false
    });
    
    // Handle connection errors
    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
    
    // Wait for secure connection
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
    
    // Try LOGIN authentication method
    console.log('\nUsing LOGIN authentication...');
    await sendCommand(socket, 'AUTH LOGIN');
    
    // Send username (base64 encoded)
    const userEncoded = Buffer.from(user).toString('base64');
    await sendCommand(socket, userEncoded);
    
    // Send password (base64 encoded) - directly create the Base64 string
    // This bypasses any NodeMailer masking
    const passEncoded = Buffer.from(pass).toString('base64');
    console.log(`> [password base64 encoded, length: ${passEncoded.length}]`);
    
    // Log the first few characters of the encoded password to verify it's correct
    console.log(`> First few chars: ${passEncoded.substring(0, 5)}***`);
    
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
        'Content-Type: text/plain; charset=utf-8',
        '',
        'This is a test email sent directly using the TLS Socket API.',
        'If you receive this email, it means the direct SMTP approach works!',
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
      
      console.log('\nTrying PLAIN authentication...');
      // Close the current connection
      socket.end();
      
      // Create a new connection
      const newSocket = tls.connect({
        host,
        port,
        rejectUnauthorized: false
      });
      
      await new Promise((resolve) => {
        newSocket.once('secureConnect', () => {
          console.log('Connected securely for PLAIN auth!');
          resolve();
        });
      });
      
      // Read greeting
      await readResponse(newSocket);
      
      // EHLO
      await sendCommand(newSocket, 'EHLO client');
      
      // For PLAIN auth, we need to send \0username\0password in one command
      const plainAuthStr = `\0${user}\0${pass}`;
      const plainAuthEncoded = Buffer.from(plainAuthStr).toString('base64');
      console.log(`> AUTH PLAIN [base64 encoded credentials]`);
      console.log(`> First few chars: ${plainAuthEncoded.substring(0, 5)}***`);
      
      const plainAuthResponse = await sendCommand(newSocket, `AUTH PLAIN ${plainAuthEncoded}`);
      
      if (plainAuthResponse.startsWith('235')) {
        console.log('PLAIN Authentication successful!');
        
        // Try to send a test email
        await sendCommand(newSocket, `MAIL FROM: <${user}>`);
        await sendCommand(newSocket, 'RCPT TO: <ihrahat@icloud.com>');
        await sendCommand(newSocket, 'DATA');
        
        const message = [
          'From: "Ripple Exchange" <' + user + '>',
          'To: ihrahat@icloud.com',
          'Subject: Direct SMTP Test (PLAIN auth)',
          'Content-Type: text/plain; charset=utf-8',
          '',
          'This is a test email sent directly using the TLS Socket API with PLAIN auth.',
          'If you receive this email, it means the direct SMTP approach with PLAIN auth works!',
          '.',
          ''
        ].join('\r\n');
        
        await sendCommand(newSocket, message);
        console.log('Email sent with PLAIN auth!');
        
        // Quit
        await sendCommand(newSocket, 'QUIT');
        newSocket.end();
      } else {
        console.log('PLAIN Authentication failed as well');
        console.log('\nContact Hostinger support with the above test results.');
        newSocket.end();
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testDirectSMTP().catch(console.error); 