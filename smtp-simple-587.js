const net = require('net');
const tls = require('tls');
const { Buffer } = require('buffer');

async function testSimpleSMTP() {
  // Define credentials
  const host = 'smtp.hostinger.com';
  const port = 587;
  const user = 'ihrahat@pinkyswap.com';
  const pass = 'rahatRAHAT$4';
  
  console.log(`Testing connection to ${host}:${port} with STARTTLS`);
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
    // Create a regular socket first (for STARTTLS)
    console.log('Creating regular socket...');
    const socket = net.connect({
      host,
      port
    });
    
    // Handle connection
    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
    
    // Wait for connection
    await new Promise((resolve) => {
      socket.once('connect', () => {
        console.log('Connected!');
        resolve();
      });
    });
    
    // Read greeting
    await readResponse(socket);
    
    // EHLO
    await sendCommand(socket, 'EHLO client');
    
    // STARTTLS
    const startTlsResponse = await sendCommand(socket, 'STARTTLS');
    if (!startTlsResponse.startsWith('220')) {
      console.error('STARTTLS failed');
      socket.end();
      return;
    }
    
    // Upgrade to TLS
    console.log('Upgrading to TLS...');
    const tlsSocket = await new Promise((resolve) => {
      const tlsOptions = {
        socket,
        rejectUnauthorized: false
      };
      const secureSocket = tls.connect(tlsOptions, () => {
        console.log('TLS connection established');
        resolve(secureSocket);
      });
      secureSocket.on('error', (err) => {
        console.error('TLS Socket error:', err);
      });
    });
    
    // EHLO again
    await sendCommand(tlsSocket, 'EHLO client');
    
    // AUTH LOGIN
    await sendCommand(tlsSocket, 'AUTH LOGIN');
    
    // Send username (base64 encoded)
    const userEncoded = Buffer.from(user).toString('base64');
    await sendCommand(tlsSocket, userEncoded);
    
    // Send password (base64 encoded)
    const passEncoded = Buffer.from(pass).toString('base64');
    const response = await sendCommand(tlsSocket, passEncoded);
    
    if (response.startsWith('235')) {
      console.log('Authentication successful!');
      
      // Send a test email
      await sendCommand(tlsSocket, `MAIL FROM: <${user}>`);
      await sendCommand(tlsSocket, 'RCPT TO: <ihrahat@icloud.com>');
      await sendCommand(tlsSocket, 'DATA');
      
      const message = [
        'From: "Ripple Exchange" <' + user + '>',
        'To: ihrahat@icloud.com',
        'Subject: Simple SMTP Test (587/STARTTLS)',
        'Content-Type: text/plain; charset=utf-8',
        '',
        'This is a test email from the simple SMTP script using port 587 with STARTTLS.',
        '.',
        ''
      ].join('\r\n');
      
      await sendCommand(tlsSocket, message);
      console.log('Email sent!');
      
      // Quit
      await sendCommand(tlsSocket, 'QUIT');
      tlsSocket.end();
    } else {
      console.log('Authentication failed');
      tlsSocket.end();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testSimpleSMTP().catch(console.error); 