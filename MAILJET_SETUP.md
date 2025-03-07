# Mailjet Setup Guide for Ripple Exchange

## Why Use Mailjet?
Mailjet is a reliable email service provider that offers:
- A free tier with 200 emails per day (6,000 per month)
- High deliverability rates
- Detailed tracking and analytics
- Easy API integration
- GDPR compliance

## Setup Steps

### 1. Create a Mailjet Account
1. Go to [Mailjet](https://www.mailjet.com/) and sign up for a free account
2. Verify your email address and complete the account setup
3. Verify your domain (recommended for better deliverability)

### 2. Get Your API Keys
1. After signing in, go to **Account Settings**
2. Navigate to **REST API** in the left sidebar
3. Find your **API Key** and **Secret Key**

### 3. Update Your `.env` File
Add the following to your `.env` file:

```
# Mailjet Configuration
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key
EMAIL_FROM="Ripple Exchange <your-verified-email@rippleexchange.org>"
```

Replace `your_mailjet_api_key` and `your_mailjet_secret_key` with the keys from your Mailjet account.

### 4. Verify Your Sender Email
1. In Mailjet, go to **Senders & Domains**
2. Add a new sender email (ideally using your own domain)
3. Complete the verification process
4. Update the `EMAIL_FROM` in your `.env` file with this verified email

## Testing Your Mailjet Integration

Run the `mailjet-test.js` script to verify your setup:

```
node mailjet-test.js [test-email-address]
```

## Implementation Notes

- Mailjet has excellent deliverability, but emails may still go to spam if your domain is new
- For production use, complete the domain verification process in Mailjet
- Monitor your sending limits (200 emails/day on free tier)
- Configure SPF and DKIM records for your domain to improve deliverability

## Support
If you encounter any issues, Mailjet has excellent documentation at https://dev.mailjet.com/ and responsive customer support. 