/**
 * Hostinger-specific SMTP Test
 * Using various approaches to solve authentication issues
 */
require('dotenv').config();
const net = require('net');
const tls = require('tls');
const { Buffer } = require('buffer');

// Get credentials from environment
const host = process.env.EMAIL_HOST || 'smtp.hostinger.com';
const port = parseInt(process.env.EMAIL_PORT || '587');
const secure = process.env.EMAIL_SECURE === 'true';
const user = process.env.EMAIL_USER || '';
const pass = process.env.EMAIL_PASS || '';
const from = process.env.EMAIL_FROM || `"Ripple Exchange" <${user}>`;

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

async function testHostingerSMTP() {
  console.log('='.repeat(50));
  console.log('HOSTINGER SMTP TEST');
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
    // Create connection based on settings
    if (port === 465 && secure) {
      console.log('Creating direct SSL connection on port 465...');
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
    } else if (port === 587 && !secure) {
      console.log('Creating standard connection on port 587 for STARTTLS...');
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
    } else {
      throw new Error('Unsupported port/secure combination');
    }
    
    // Read greeting
    await readResponse(socket);
    
    // Send EHLO
    await sendCommand(socket, `EHLO ${host}`);
    
    // Start TLS if using port 587
    if (port === 587 && !secure) {
      const tlsResponse = await sendCommand(socket, 'STARTTLS');
      
      if (!tlsResponse.startsWith('220')) {
        throw new Error('Failed to start TLS');
      }
      
      console.log('Upgrading to TLS...');
      const oldSocket = socket;
      
      socket = await new Promise((resolve, reject) => {
        const tlsOptions = {
          host,
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
      await sendCommand(socket, `EHLO ${host}`);
    }
    
    // Test PLAIN auth - some servers prefer this format
    console.log('Attempting AUTH PLAIN authentication...');
    const authString = `\0${user}\0${pass}`;
    const authEncoded = Buffer.from(authString).toString('base64');
    
    try {
      const plainAuthResponse = await sendCommand(socket, `AUTH PLAIN ${authEncoded}`);
      
      if (plainAuthResponse.startsWith('235')) {
        console.log('AUTH PLAIN authentication successful!');
        // Continue with email sending...
        await sendEmail(socket);
        return;
      } else {
        console.log('AUTH PLAIN authentication failed, trying LOGIN method...');
      }
    } catch (e) {
      console.log('AUTH PLAIN error:', e.message);
      console.log('Trying AUTH LOGIN instead...');
    }
    
    // Try AUTH LOGIN
    const authResponse = await sendCommand(socket, 'AUTH LOGIN');
    
    if (!authResponse.startsWith('334')) {
      throw new Error('Server does not support AUTH LOGIN');
    }
    
    // Send username (base64 encoded)
    const userEncoded = Buffer.from(user).toString('base64');
    const userResponse = await sendCommand(socket, userEncoded);
    
    if (!userResponse.startsWith('334')) {
      throw new Error('Username rejected');
    }
    
    // Send password (base64 encoded)
    const passEncoded = Buffer.from(pass).toString('base64');
    console.log(`> [Password base64 encoded, length: ${passEncoded.length}]`);
    console.log(`> First few chars: ${passEncoded.substring(0, 5)}...`);
    const passResponse = await sendCommand(socket, passEncoded);
    
    if (!passResponse.startsWith('235')) {
      throw new Error(`Authentication failed: ${passResponse.trim()}`);
    }
    
    console.log('Authentication successful!');
    
    // Send the email
    await sendEmail(socket);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (socket) {
      try {
        socket.end();
      } catch (e) {
        // Ignore
      }
    }
    
    console.log('\nTROUBLESHOOTING SUGGESTIONS FOR HOSTINGER:');
    console.log('1. Ensure you\'re using the correct email account settings:');
    console.log('   • SMTP Host: smtp.hostinger.com');
    console.log('   • SMTP Port: 587 with STARTTLS or 465 with SSL');
    console.log('   • Username: Your full email address (official@rippleexchange.org)');
    console.log('   • Password: The actual email password (not cPanel or hosting password)');
    console.log('2. Check if outgoing SMTP is enabled in your Hostinger email settings');
    console.log('3. The email account may need to be "warmed up" before sending');
    console.log('4. Try creating an app-specific password if available');
    console.log('5. Contact Hostinger support with this error for assistance');
  }
}

// Helper function to send an email once authenticated
async function sendEmail(socket) {
  const testEmail = process.argv[2] || 'ihrahat@icloud.com';
  console.log(`Sending test email to: ${testEmail}`);
  
  // Extract email from format like "Name <email@example.com>"
  function extractEmail(str) {
    if (str.includes('<') && str.includes('>')) {
      return str.match(/<(.+)>/)[1];
    }
    return str;
  }
  
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
  
  // Generate a unique message ID and date
  const messageId = `${Math.random().toString(36).substring(2)}@rippleexchange.org`;
  const date = new Date().toUTCString();
  
  // Send message content
  const message = [
    `From: ${from}`,
    `To: ${testEmail}`,
    'Subject: Hostinger SMTP Test',
    `Message-ID: <${messageId}>`,
    `Date: ${date}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    '<html>',
    '<body>',
    '<h1>Hostinger SMTP Test Success!</h1>',
    '<p>This is a test email sent directly using SMTP commands to Hostinger.</p>',
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
  
  console.log('✅ Email sent successfully!');
  
  // Quit
  await sendCommand(socket, 'QUIT');
  socket.end();
}

// Run the test
testHostingerSMTP().catch(console.error); 