# Setting Up SendGrid for Email Delivery

SendGrid is a reliable email delivery service that is well-suited for application email needs like verification emails, password resets, etc. This guide will help you set up SendGrid for your Ripple Exchange application.

## Step 1: Create a SendGrid Account

1. Go to [SendGrid's website](https://sendgrid.com/) and sign up for a free account
2. The free tier allows 100 emails per day, which should be sufficient for testing

## Step 2: Verify Your Identity

1. Verify your email address
2. Complete SendGrid's sender identity verification process

## Step 3: Create an API Key

1. In the SendGrid dashboard, navigate to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name your key (e.g., "Ripple Exchange API Key")
4. Choose "Full Access" or "Restricted Access" with at least "Mail Send" permissions
5. Click **Create & View**
6. **Important**: Copy the API key immediately as it will only be shown once

## Step 4: Set Up Sender Authentication

1. Go to **Settings** → **Sender Authentication**
2. Follow the steps to authenticate a domain or use a single sender verification
3. For testing, you can use single sender verification with your email address

## Step 5: Configure Your Application

1. Update your `.env` file with the SendGrid API key:
   ```
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   EMAIL_FROM=Verified Sender <your_verified_email@example.com>
   ```
   
2. Make sure the `EMAIL_FROM` address matches an email you've verified in SendGrid

## Step 6: Test Email Delivery

1. Run the test script to verify your setup:
   ```
   node test-email.js test@example.com
   ```

## Troubleshooting

If you encounter issues:

1. Check that your SendGrid API key is correct
2. Verify that your sender email is authorized in SendGrid
3. Check SendGrid's Activity feed to see if emails are being processed
4. Look for any blocked or bounced emails in the SendGrid dashboard

## Production Considerations

1. For production use, consider upgrading your SendGrid plan
2. Implement email templates in SendGrid for consistent branding
3. Monitor email delivery metrics in the SendGrid dashboard
4. Consider implementing SendGrid's event webhook for delivery tracking 