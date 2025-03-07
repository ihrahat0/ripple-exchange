# Mock Email Service for Ripple Exchange

This document explains how to use the mock email service implemented in the Ripple Exchange application.

## Overview

The mock email service is a fallback solution for when SMTP email services are unavailable or experiencing issues. Instead of sending actual emails, it saves them as HTML files in the `emails` directory, allowing you to view them in a browser.

## How It Works

1. When an email would normally be sent (registration verification, password reset, etc.), the mock service:
   - Creates an HTML file with the email content
   - Saves it to the `emails` directory with a timestamp and recipient information in the filename
   - Returns a success response to the application

2. The saved emails include:
   - Email metadata (recipient, subject, date)
   - The full HTML content of the email

## Using the Mock Email Service

### Viewing Saved Emails

1. Emails are saved in the `emails` directory at the root of the project
2. Each email is saved as an HTML file with a filename format: `[timestamp]-[recipient]-[subject].html`
3. To view an email, open the HTML file in any web browser

### Testing Email Functionality

You can test the email functionality using the provided test script:

```bash
node test-email.js test@example.com
```

This will:
- Test the email service connection
- Send a test verification email
- Send a test password reset email
- Save all emails to the `emails` directory

### API Endpoints

The following API endpoints use the mock email service:

- `GET /api/test-email` - Tests the email service and sends a test email
- `POST /api/send-verification-code` - Sends a verification code email
- `POST /api/send-password-reset` - Sends a password reset email
- `POST /api/send-password-change-confirmation` - Sends a password change confirmation
- `POST /api/send-2fa-status-change` - Sends a 2FA status change notification

## Implementation Details

The mock email service is implemented in `server/utils/mockEmailService.js` and includes:

- `testEmailService()` - Tests the email service connection
- `generateVerificationCode()` - Generates a random 6-digit verification code
- `sendRegistrationVerificationEmail()` - Sends a registration verification email
- `sendPasswordResetEmail()` - Sends a password reset email
- `sendPasswordChangeConfirmation()` - Sends a password change confirmation
- `send2FAStatusChangeEmail()` - Sends a 2FA status change notification

## Switching Back to Real Email Service

To switch back to the real email service:

1. Update the import in `server.js`:
   ```javascript
   // Change from
   const emailService = require('./server/utils/mockEmailService');
   // To
   const emailService = require('./server/utils/emailService');
   ```

2. Ensure your `.env` file has valid SMTP credentials:
   ```
   EMAIL_HOST=your-smtp-host
   EMAIL_PORT=your-smtp-port
   EMAIL_SECURE=true/false
   EMAIL_USER=your-email
   EMAIL_PASS=your-password
   ```

## Troubleshooting

If you encounter issues with the mock email service:

1. Ensure the `emails` directory exists at the root of the project
2. Check that the application has write permissions to the directory
3. Verify that the server is running and accessible
4. Check the server logs for any error messages 