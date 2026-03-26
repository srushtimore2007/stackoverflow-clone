# OTP System Setup Instructions

## Environment Setup

The OTP system requires Vonage/Nexmo credentials to be configured in your Next.js environment for sending SMS OTPs.

### Step 1: Create .env.local file

Create a file named `.env.local` in your `stack/` directory with the following content:

```bash
# Vonage/Nexmo SMS Service Credentials (Required)
VONAGE_API_KEY=your-vonage-api-key-here
VONAGE_API_SECRET=your-vonage-api-secret-here
VONAGE_BRAND_NAME=CodeQuest

# Email Service (for existing email OTP - optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_SERVICE=gmail

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Get Vonage Credentials

1. Sign up at [Vonage Dashboard](https://dashboard.nexmo.com/)
2. Get your API Key and API Secret from the dashboard
3. Add them to your `.env.local` file

### Step 3: Restart Development Server

After creating the .env.local file, restart your Next.js development server:

```bash
cd stack
npm run dev
```

### Step 4: Test the OTP System

1. Visit `http://localhost:3000/otp-verification`
2. Enter an Indian mobile number (e.g., 9876543210)
3. Click "Send OTP"
4. Check your mobile for the SMS
5. Enter the OTP and verify

## Troubleshooting

### "Vonage SMS service not configured" Error

If you see this error, it means the environment variables are not loaded:

1. Ensure `.env.local` exists in the `stack/` directory
2. Check that the file contains `VONAGE_API_KEY` and `VONAGE_API_SECRET`
3. Restart the development server
4. Check the server logs for environment variable loading

### API Errors

- **500 Error**: Check server logs for detailed error information
- **Network Error**: Verify Vonage credentials and internet connection
- **Invalid Phone Number**: Use valid Indian mobile number formats

### SMS Not Received

1. Check Vonage dashboard for delivery status
2. Verify phone number format and country code
3. Check Vonage account balance
4. Review server console for error logs

## API Endpoints

### Send OTP
```
POST /api/send-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

### Verify OTP
```
POST /api/verify-otp
Content-Type: application/json

{
  "phoneNumber": "9876543210",
  "otp": "123456"
}
```

## Security Notes

- Never commit `.env.local` to version control
- Keep Vonage credentials secure
- The OTP expires in 5 minutes
- OTPs are stored in memory (restart clears them)
- No OTP logging for successful sends (only logged on failures)

## Production Deployment

1. Set Vonage credentials in production environment variables
2. Configure VONAGE_BRAND_NAME with your company/brand name
3. Test with real phone numbers before going live
4. Monitor Vonage dashboard for SMS delivery and usage
5. Monitor server logs for any SMS sending failures
