require('dotenv').config();
const nodemailer = require('nodemailer');

// Different provider configurations to test
const providers = [
  {
    name: "Hostinger (SSL)",
    config: {
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: "Hostinger (TLS)",
    config: {
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: "Gmail",
    config: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'your-gmail@gmail.com', // replace with your Gmail
        pass: 'your-app-password'     // replace with your Gmail app password
      }
    }
  }
];

async function testProvider(provider) {
  console.log(`\nTesting ${provider.name}...`);
  console.log(JSON.stringify(provider.config, null, 2));

  try {
    const transporter = nodemailer.createTransport(provider.config);
    
    console.log('Verifying connection...');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout after 10 seconds'));
      }, 10000);
      
      transporter.verify()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timeout);
          reject(err);
        });
    });
    
    console.log(`✅ ${provider.name} connection successful!`);
    return { success: true, provider: provider.name };
  } catch (error) {
    console.error(`❌ ${provider.name} connection failed:`, error.message);
    return { success: false, provider: provider.name, error: error.message };
  }
}

async function runTests() {
  console.log('Testing different mail providers to find what works...');
  
  const results = [];
  for (const provider of providers) {
    const result = await testProvider(provider);
    results.push(result);
  }
  
  console.log('\n=== TEST RESULTS ===');
  for (const result of results) {
    console.log(`${result.provider}: ${result.success ? '✅ Success' : '❌ Failed'}`);
  }
  
  const successfulProvider = results.find(r => r.success);
  if (successfulProvider) {
    console.log(`\n✅ Found a working provider: ${successfulProvider.provider}`);
    console.log('Update your .env file with these settings.');
  } else {
    console.log('\n❌ No provider worked. Check your credentials and network.');
  }
}

runTests().catch(err => {
  console.error('Test failed unexpectedly:', err);
}); 