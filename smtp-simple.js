const net = require('net');
const tls = require('tls');
const { Buffer } = require('buffer');

async function testSimpleSMTP() {
  // Define credentials
  const host = 'smtp.hostinger.com';
  const port = 465;
  const user = 'ihrahat@pinkyswap.com';
  const pass = 'rahatRAHAT123';
  
  console.log(`Testing connection to ${host}:${port}`);
  console.log(`User: ${user}`);
  console.log(`Password: ${pass.replace(/./g, '*')}`);
  
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
    const response = await sendCommand(socket, passEncoded);
    
    if (response.startsWith('235')) {
      console.log('Authentication successful!');
      
      // Send a test email
      await sendCommand(socket, `MAIL FROM: <${user}>`);
      await sendCommand(socket, 'RCPT TO: <ihrahat@icloud.com>');
      await sendCommand(socket, 'DATA');
      
      const message = [
        'From: "Ripple Exchange" <' + user + '>',
        'To: ihrahat@icloud.com',
        'Subject: Simple SMTP Test',
        'Content-Type: text/plain; charset=utf-8',
        '',
        'This is a test email from the simple SMTP script.',
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
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testSimpleSMTP().catch(console.error); 