/**
 * Direct SMTP Client for Ripple Exchange
 * Uses raw Net/TLS sockets to communicate with SMTP server
 * Bypasses NodeMailer's password handling issues
 */
require('dotenv').config();
const net = require('net');
const tls = require('tls');
const fs = require('fs');
const { Buffer } = require('buffer');

class DirectSMTPClient {
  constructor(config = {}) {
    this.host = config.host || process.env.EMAIL_HOST || 'smtp.hostinger.com';
    this.port = parseInt(config.port || process.env.EMAIL_PORT || 465);
    this.secure = config.secure !== undefined ? config.secure : (process.env.EMAIL_SECURE === 'true');
    this.user = config.user || process.env.EMAIL_USER || '';
    this.pass = config.pass || process.env.EMAIL_PASS || '';
    this.from = config.from || process.env.EMAIL_FROM || `"Ripple Exchange" <${this.user}>`;
    this.debug = config.debug !== undefined ? config.debug : true;
    
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
  }
  
  /**
   * Log a message if debug is enabled
   */
  log(message) {
    if (this.debug) {
      console.log(`[SMTP] ${message}`);
    }
  }
  
  /**
   * Read response from the SMTP server
   */
  async readResponse() {
    return new Promise((resolve) => {
      const buffer = [];
      
      const onData = (data) => {
        buffer.push(data);
        const response = Buffer.concat(buffer).toString();
        
        // If response ends with newline, it's complete
        if (response.endsWith('\r\n')) {
          this.socket.removeListener('data', onData);
          this.log(`< ${response.trim()}`);
          resolve(response);
        }
      };
      
      this.socket.on('data', onData);
    });
  }
  
  /**
   * Send a command to the SMTP server
   */
  async sendCommand(command) {
    return new Promise((resolve) => {
      // Mask password in logs if command contains it
      const logCommand = command.includes(this.pass) 
        ? command.replace(this.pass, '********') 
        : command;
      
      this.log(`> ${logCommand}`);
      this.socket.write(command + '\r\n');
      this.readResponse().then(resolve);
    });
  }
  
  /**
   * Connect to the SMTP server
   */
  async connect() {
    this.log(`Connecting to ${this.host}:${this.port} (secure: ${this.secure})`);
    
    try {
      if (this.secure) {
        // Create secure connection directly
        this.socket = tls.connect({
          host: this.host,
          port: this.port,
          rejectUnauthorized: false
        });
        
        await new Promise((resolve, reject) => {
          this.socket.once('secureConnect', () => {
            this.log('Connected securely!');
            resolve();
          });
          
          this.socket.once('error', (err) => {
            this.log(`Connection error: ${err.message}`);
            reject(err);
          });
        });
      } else {
        // Create regular connection first
        this.socket = net.connect({
          host: this.host,
          port: this.port
        });
        
        await new Promise((resolve, reject) => {
          this.socket.once('connect', () => {
            this.log('Connected!');
            resolve();
          });
          
          this.socket.once('error', (err) => {
            this.log(`Connection error: ${err.message}`);
            reject(err);
          });
        });
        
        // Upgrade to TLS if needed
        if (this.port === 587) {
          // Read greeting
          await this.readResponse();
          
          // Send EHLO
          await this.sendCommand('EHLO client');
          
          // Start TLS
          const tlsResponse = await this.sendCommand('STARTTLS');
          
          if (!tlsResponse.startsWith('220')) {
            throw new Error('Failed to start TLS');
          }
          
          // Upgrade the connection
          this.log('Upgrading to TLS...');
          const oldSocket = this.socket;
          
          this.socket = await new Promise((resolve, reject) => {
            const tlsOptions = {
              socket: oldSocket,
              rejectUnauthorized: false
            };
            
            const secureSocket = tls.connect(tlsOptions, () => {
              this.log('TLS connection established');
              resolve(secureSocket);
            });
            
            secureSocket.once('error', (err) => {
              this.log(`TLS upgrade error: ${err.message}`);
              reject(err);
            });
          });
        }
      }
      
      // Read server greeting
      await this.readResponse();
      
      // Send EHLO
      await this.sendCommand('EHLO client');
      
      this.connected = true;
      return true;
    } catch (error) {
      this.log(`Connection failed: ${error.message}`);
      if (this.socket) {
        this.socket.end();
      }
      throw error;
    }
  }
  
  /**
   * Authenticate with the SMTP server
   */
  async authenticate() {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    
    try {
      // Try AUTH LOGIN
      const authResponse = await this.sendCommand('AUTH LOGIN');
      
      if (!authResponse.startsWith('334')) {
        throw new Error('Server does not support AUTH LOGIN');
      }
      
      // Send username
      const userEncoded = Buffer.from(this.user).toString('base64');
      const userResponse = await this.sendCommand(userEncoded);
      
      if (!userResponse.startsWith('334')) {
        throw new Error('Username rejected');
      }
      
      // Send password
      const passEncoded = Buffer.from(this.pass).toString('base64');
      this.log(`> [Password base64 encoded, length: ${passEncoded.length}]`);
      const passResponse = await this.sendCommand(passEncoded);
      
      if (!passResponse.startsWith('235')) {
        throw new Error(`Authentication failed: ${passResponse.trim()}`);
      }
      
      this.log('Authentication successful!');
      this.authenticated = true;
      return true;
    } catch (error) {
      this.log(`Authentication failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Send an email
   */
  async sendMail(options) {
    if (!this.connected || !this.authenticated) {
      throw new Error('Not connected or not authenticated');
    }
    
    const { to, subject, text, html } = options;
    
    try {
      // Set sender
      const fromResponse = await this.sendCommand(`MAIL FROM: <${this.extractEmail(this.from)}>`);
      
      if (!fromResponse.startsWith('250')) {
        throw new Error(`Sender rejected: ${fromResponse.trim()}`);
      }
      
      // Set recipient
      const toResponse = await this.sendCommand(`RCPT TO: <${to}>`);
      
      if (!toResponse.startsWith('250')) {
        throw new Error(`Recipient rejected: ${toResponse.trim()}`);
      }
      
      // Start data
      const dataResponse = await this.sendCommand('DATA');
      
      if (!dataResponse.startsWith('354')) {
        throw new Error(`DATA command rejected: ${dataResponse.trim()}`);
      }
      
      // Build message headers
      const messageId = this.generateMessageId();
      const date = new Date().toUTCString();
      const boundary = this.generateBoundary();
      
      // Send message content
      const message = [
        `From: ${this.from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `Message-ID: <${messageId}>`,
        'MIME-Version: 1.0',
        `Date: ${date}`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
        '',
        text || this.htmlToText(html),
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
        '',
        html || `<p>${text}</p>`,
        '',
        `--${boundary}--`,
        '.',
        ''
      ].join('\r\n');
      
      const messageResponse = await this.sendCommand(message);
      
      if (!messageResponse.startsWith('250')) {
        throw new Error(`Message rejected: ${messageResponse.trim()}`);
      }
      
      this.log('Email sent successfully!');
      return { messageId };
    } catch (error) {
      this.log(`Send mail failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Close the connection
   */
  async close() {
    if (this.connected) {
      try {
        await this.sendCommand('QUIT');
      } catch (error) {
        this.log(`Error sending QUIT: ${error.message}`);
      }
      
      this.socket.end();
      this.connected = false;
      this.authenticated = false;
      this.log('Connection closed.');
    }
  }
  
  /**
   * Extract email address from a string like "Name <email@example.com>"
   */
  extractEmail(str) {
    if (str.includes('<') && str.includes('>')) {
      return str.match(/<(.+)>/)[1];
    }
    return str;
  }
  
  /**
   * Generate a random message ID
   */
  generateMessageId() {
    const randomId = Math.random().toString(36).substring(2, 15);
    const domain = this.extractEmail(this.from).split('@')[1];
    return `${randomId}@${domain}`;
  }
  
  /**
   * Generate a random boundary for multipart messages
   */
  generateBoundary() {
    return 'boundary-' + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Convert HTML to plain text
   */
  htmlToText(html) {
    if (!html) return '';
    return html
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<[^>]*>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }
}

// Export the client
module.exports = DirectSMTPClient;

// If this script is run directly, test the client
if (require.main === module) {
  (async () => {
    try {
      const client = new DirectSMTPClient();
      
      console.log('='.repeat(50));
      console.log('DIRECT SMTP CLIENT TEST');
      console.log('='.repeat(50));
      console.log(`Host: ${client.host}`);
      console.log(`Port: ${client.port}`);
      console.log(`Secure: ${client.secure}`);
      console.log(`User: ${client.user}`);
      console.log(`Password length: ${client.pass.length}`);
      console.log(`From: ${client.from}`);
      console.log('='.repeat(50));
      
      const testEmail = process.argv[2] || 'ihrahat@icloud.com';
      console.log(`Sending test email to: ${testEmail}`);
      
      // Connect and authenticate
      await client.connect();
      await client.authenticate();
      
      // Send verification email
      const verificationCode = '123456';
      await client.sendMail({
        to: testEmail,
        subject: 'Verify Your Ripple Exchange Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #F7931A; text-align: center;">Welcome to Ripple Exchange!</h2>
            <p>Thank you for registering with Ripple Exchange. To complete your registration, please use the verification code below:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
              ${verificationCode}
            </div>
            <p>This code will expire in 10 minutes for security reasons.</p>
            <p>If you did not request this verification, please ignore this email.</p>
            <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #777;">
              &copy; ${new Date().getFullYear()} Ripple Exchange. All rights reserved.
            </p>
          </div>
        `
      });
      
      console.log('✅ Test verification email sent successfully!');
      
      // Send password reset email
      const resetCode = '654321';
      await client.sendMail({
        to: testEmail,
        subject: 'Reset Your Ripple Exchange Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #F7931A; text-align: center;">Password Reset Request</h2>
            <p>We received a request to reset your Ripple Exchange password. Please use the verification code below to reset your password:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
              ${resetCode}
            </div>
            <p>This code will expire in 10 minutes for security reasons.</p>
            <p>If you did not request this password reset, please ignore this email and make sure you can still access your account.</p>
            <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #777;">
              &copy; ${new Date().getFullYear()} Ripple Exchange. All rights reserved.
            </p>
          </div>
        `
      });
      
      console.log('✅ Test password reset email sent successfully!');
      
      // Close the connection
      await client.close();
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      
      console.log('\nTROUBLESHOOTING SUGGESTIONS:');
      console.log('1. Verify your email credentials in the .env file');
      console.log('2. Check if SMTP access is enabled in your Hostinger account');
      console.log('3. Try different port/secure combinations (465/true or 587/false)');
      console.log('4. Check if your server/network blocks outgoing SMTP connections');
      console.log('5. Contact Hostinger support for specific SMTP requirements');
    }
  })();
} 