# OTP System Setup Instructions

## Environment Setup

The OTP system requires RapidAPI credentials to be configured in your Next.js environment.

### Step 1: Create .env.local file

Create a file named `.env.local` in your `stack/` directory with the following content:

```bash
# RapidAPI SMS Service Credentials
RAPIDAPI_KEY=4c25b8daf3msh17918948b11403ep19f9e9jsne69abe50e883
RAPIDAPI_HOST=sms-verify3.p.rapidapi.com

# Email Service (for existing email OTP - optional)
EMAIL_USER=moresrushti200707@gmail.com
EMAIL_PASS=veqfqretmysfkujo

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Restart Development Server

After creating the .env.local file, restart your Next.js development server:

```bash
cd stack
npm run dev
```

### Step 3: Test the OTP System

1. Visit `http://localhost:3000/otp-verification`
2. Enter an Indian mobile number (e.g., 9876543210)
3. Click "Send OTP"
4. Check your mobile for the SMS
5. Enter the OTP and verify

## Troubleshooting

### "SMS service not configured" Error

If you see this error, it means the environment variables are not loaded:

1. Ensure `.env.local` exists in the `stack/` directory
2. Check that the file contains `RAPIDAPI_KEY` and `RAPIDAPI_HOST`
3. Restart the development server
4. Check the server logs for environment variable loading

### API Errors

- **500 Error**: Check server logs for detailed error information
- **Network Error**: Verify RapidAPI credentials and internet connection
- **Invalid Phone Number**: Use valid Indian mobile number formats

## API Endpoints

### Send OTP
```
POST /api/send-otp
Content-Type: application/json

{
  "phoneNumber": "9876543210"
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
- Keep RapidAPI credentials secure
- The OTP expires in 5 minutes
- OTPs are stored in memory (restart clears them)
