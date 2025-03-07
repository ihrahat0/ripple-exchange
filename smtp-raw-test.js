/**
 * Raw SMTP Test
 * Uses low-level socket operations to test SMTP connection
 */
require('dotenv').config();
const net = require('net');
const tls = require('tls');
const { Buffer } = require('buffer');

// Get credentials from environment
const host = process.env.EMAIL_HOST || 'smtp.hostinger.com';
const port = parseInt(process.env.EMAIL_PORT || '465');
const secure = process.env.EMAIL_SECURE === 'true';
const user = process.env.EMAIL_USER || '';
const pass = process.env.EMAIL_PASS || '';
const from = process.env.EMAIL_FROM || `"Ripple Exchange" <${user}>`;

// Extract email from format like "Name <email@example.com>"
function extractEmail(str) {
  if (str.includes('<') && str.includes('>')) {
    return str.match(/<(.+)>/)[1];
  }
  return str;
}

// Simple function to wait for a response
function readResponse(socket) {
  return new Promise((resolve) => {
    const buffer = [];
    
    function onData(data) {
      buffer.push(data);
      const response = Buffer.concat(buffer).toString();
      
      // If we see a complete response (ends with newline)
      if (response.endsWith('\r\n')) {
        socket.removeListener('data', onData);
        console.log(`< ${response.trim()}`);
        resolve(response);
      }
    }
    
    socket.on('data', onData);
  });
}

// Send a command and wait for response
function sendCommand(socket, command) {
  return new Promise((resolve) => {
    // Mask password in logs if command contains it
    const logCommand = command.includes(pass) 
      ? command.replace(pass, '********') 
      : command;
    
    console.log(`> ${logCommand}`);
    socket.write(command + '\r\n');
    readResponse(socket).then(resolve);
  });
}

// Main test function
async function testSMTP() {
  console.log('='.repeat(50));
  console.log('RAW SMTP TEST');
  console.log('='.repeat(50));
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Secure: ${secure}`);
  console.log(`User: ${user}`);
  console.log(`Password length: ${pass.length}`);
  console.log(`From: ${from}`);
  console.log('='.repeat(50));
  
  let socket;
  
  try {
    // Create connection
    if (secure) {
      console.log('Creating secure connection...');
      socket = tls.connect({
        host,
        port,
        rejectUnauthorized: false
      });
      
      await new Promise((resolve, reject) => {
        socket.once('secureConnect', () => {
          console.log('Connected securely!');
          resolve();
        });
        
        socket.once('error', (err) => {
          console.error('Connection error:', err);
          reject(err);
        });
      });
    } else {
      console.log('Creating regular connection...');
      socket = net.connect({
        host,
        port
      });
      
      await new Promise((resolve, reject) => {
        socket.once('connect', () => {
          console.log('Connected!');
          resolve();
        });
        
        socket.once('error', (err) => {
          console.error('Connection error:', err);
          reject(err);
        });
      });
    }
    
    // Read greeting
    await readResponse(socket);
    
    // Send EHLO
    await sendCommand(socket, 'EHLO client');
    
    // If not secure and port is 587, start TLS
    if (!secure && port === 587) {
      const tlsResponse = await sendCommand(socket, 'STARTTLS');
      
      if (!tlsResponse.startsWith('220')) {
        throw new Error('Failed to start TLS');
      }
      
      console.log('Upgrading to TLS...');
      const oldSocket = socket;
      
      socket = await new Promise((resolve, reject) => {
        const tlsOptions = {
          socket: oldSocket,
          rejectUnauthorized: false
        };
        
        const secureSocket = tls.connect(tlsOptions, () => {
          console.log('TLS connection established');
          resolve(secureSocket);
        });
        
        secureSocket.once('error', (err) => {
          console.error('TLS upgrade error:', err);
          reject(err);
        });
      });
      
      // Send EHLO again after TLS upgrade
      await sendCommand(socket, 'EHLO client');
    }
    
    // Try AUTH LOGIN
    const authResponse = await sendCommand(socket, 'AUTH LOGIN');
    
    if (!authResponse.startsWith('334')) {
      throw new Error('Server does not support AUTH LOGIN');
    }
    
    // Send username
    const userEncoded = Buffer.from(user).toString('base64');
    const userResponse = await sendCommand(socket, userEncoded);
    
    if (!userResponse.startsWith('334')) {
      throw new Error('Username rejected');
    }
    
    // Send password
    const passEncoded = Buffer.from(pass).toString('base64');
    console.log(`> [Password base64 encoded, length: ${passEncoded.length}]`);
    const passResponse = await sendCommand(socket, passEncoded);
    
    if (!passResponse.startsWith('235')) {
      throw new Error(`Authentication failed: ${passResponse.trim()}`);
    }
    
    console.log('Authentication successful!');
    
    // Try to send a test email
    const testEmail = process.argv[2] || 'ihrahat@icloud.com';
    console.log(`Sending test email to: ${testEmail}`);
    
    // Set sender
    const fromResponse = await sendCommand(socket, `MAIL FROM: <${extractEmail(from)}>`);
    
    if (!fromResponse.startsWith('250')) {
      throw new Error(`Sender rejected: ${fromResponse.trim()}`);
    }
    
    // Set recipient
    const toResponse = await sendCommand(socket, `RCPT TO: <${testEmail}>`);
    
    if (!toResponse.startsWith('250')) {
      throw new Error(`Recipient rejected: ${toResponse.trim()}`);
    }
    
    // Start data
    const dataResponse = await sendCommand(socket, 'DATA');
    
    if (!dataResponse.startsWith('354')) {
      throw new Error(`DATA command rejected: ${dataResponse.trim()}`);
    }
    
    // Send message content
    const message = [
      `From: ${from}`,
      `To: ${testEmail}`,
      'Subject: Raw SMTP Test',
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      '<html>',
      '<body>',
      '<h1>Raw SMTP Test</h1>',
      '<p>This is a test email sent using raw SMTP commands.</p>',
      `<p>Timestamp: ${new Date().toISOString()}</p>`,
      '</body>',
      '</html>',
      '.',
      ''
    ].join('\r\n');
    
    const messageResponse = await sendCommand(socket, message);
    
    if (!messageResponse.startsWith('250')) {
      throw new Error(`Message rejected: ${messageResponse.trim()}`);
    }
    
    console.log('Email sent successfully!');
    
    // Quit
    await sendCommand(socket, 'QUIT');
    socket.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (socket) {
      try {
        socket.end();
      } catch (e) {
        // Ignore
      }
    }
    
    console.log('\nTROUBLESHOOTING SUGGESTIONS:');
    console.log('1. Verify your email credentials in the .env file');
    console.log('2. Check if SMTP access is enabled in your Hostinger account');
    console.log('3. Try different port/secure combinations (465/true or 587/false)');
    console.log('4. Check if your server/network blocks outgoing SMTP connections');
    console.log('5. Contact Hostinger support for specific SMTP requirements');
    console.log('6. Try using a different email account for testing');
  }
}

// Run the test
testSMTP().catch(console.error); 