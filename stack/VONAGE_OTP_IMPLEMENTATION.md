# Vonage OTP Implementation Guide (Production-Ready)

## Overview
The `/api/send-otp` endpoint provides a **production-ready OTP SMS system** using **only Vonage/Nexmo** for sending OTP SMS. All Fast2SMS and demo mode integrations have been removed for a clean, real-SMS-only implementation.

## Key Features
- ✅ **Vonage-only SMS integration** (Fast2SMS completely removed)
- ✅ **Real SMS only** (no demo mode, no simulation)
- ✅ **Custom OTP support** for language verification
- ✅ **Default sender "CodeQuest"** (configurable via environment)
- ✅ **Phone verification before language switching**
- ✅ **Comprehensive validation and error handling**
- ✅ **Detailed error logging** when SMS fails
- ✅ **Backend-only security** (credentials never exposed)

## Environment Variables Required

**Required for OTP functionality:**

```bash
# Vonage/Nexmo Configuration (Required)
VONAGE_API_KEY=your-vonage-api-key-here
VONAGE_API_SECRET=your-vonage-api-secret-here
VONAGE_BRAND_NAME=CodeQuest  # Optional, defaults to "CodeQuest"
```

**Optional (for email OTP):**
```bash
# Email Configuration (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_SERVICE=gmail
```

### Getting Vonage Credentials

1. Sign up at [Vonage Dashboard](https://dashboard.nexmo.com/)
2. Get your API Key and API Secret from the dashboard
3. Add them to your `.env.local` file
4. **Required for production use**

## API Endpoint

### POST `/api/send-otp`

#### Request Body
```json
{
  "phone": "<recipient_phone_number>",
  "otp": "<otp_number>"
}
```

#### Parameters
- `phone` (required): Recipient phone number
  - Supports Indian formats: `9876543210`, `+919876543210`, `09876543210`
- `otp` (required): 6-digit OTP number

#### Response Format

**Success (200):**
```json
{
  "message": "OTP sent successfully",
  "response": {
    "message-count": "1",
    "messages": [
      {
        "message-id": "0B000000123456789",
        "to": "919876543210",
        "status": "0",
        "remaining-balance": "3.141592",
        "message-price": "0.03330000",
        "network": "404"
      }
    ]
  }
}
```

**Error Responses:**

- **400 Bad Request**: Missing or invalid parameters
```json
{
  "success": false,
  "message": "Phone number and OTP are required"
}
```

- **500 Internal Server Error**: SMS sending failed
```json
{
  "message": "SMS sending failed",
  "error": "Vonage SMS service not configured. Please contact administrator."
}
```

## SMS Message Format

The SMS sent to users will have the exact format:
```
Your OTP for phone verification before switching language is: <otp>
```

Sender ID will be the value of `VONAGE_BRAND_NAME` environment variable, or "CodeQuest" if not set.

## Error Logging

**When SMS sending fails, the server logs:**
- Full error details
- Failed phone number
- Failed OTP (for debugging)
- Error type and message
- Error stack trace

**Example error log:**
```
=== SMS SENDING FAILED ===
Full Error Details: [Error Object]
Failed Phone Number: +919876543210
Failed OTP: 123456
Error Type: TypeError
Error Message: Cannot read property 'send' of undefined
Error Stack: [Stack Trace]
=== END ERROR DETAILS ===
```

**No logging occurs for successful SMS sends** (security and privacy).

## Security Features

1. **Backend-only**: API keys and secrets never exposed to frontend
2. **Input validation**: Phone number and OTP format validation
3. **Error handling**: Proper error messages without exposing sensitive information
4. **TypeScript safety**: Full type checking and error handling
5. **Secure logging**: OTP only logged when SMS fails (for debugging)
6. **No demo mode**: Production-ready with real SMS only

## Testing

Use the updated test script to verify the implementation:

```bash
cd stack
node test-vonage-otp.js
```

The test script will:
- Test validation errors (missing fields, invalid formats)
- Test configuration error handling
- **Require real Vonage credentials for SMS sending**
- Show setup instructions when credentials are missing

## Integration Example

### Frontend Usage

```javascript
async function sendOTP(phoneNumber, otpCode) {
  try {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phoneNumber,
        otp: otpCode
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('OTP sent successfully via Vonage');
      return result;
    } else {
      console.error('Failed to send OTP:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
}

// Usage
sendOTP('+919876543210', '123456')
  .then(result => {
    // Handle success - real SMS sent
  })
  .catch(error => {
    // Handle error - check server logs for details
  });
```

## Phone Number Formatting

The API automatically formats Indian phone numbers:
- `9876543210` → `+919876543210`
- `09876543210` → `+919876543210`
- `+919876543210` → `+919876543210` (already formatted)

## Production Deployment

**Required steps:**

1. **Set Vonage credentials** in production environment variables
2. **Verify VONAGE_API_KEY and VONAGE_API_SECRET** are set
3. **Configure VONAGE_BRAND_NAME** with your company/brand name
4. **Test with real phone numbers** before going live
5. **Monitor Vonage dashboard** for SMS delivery and usage
6. **Monitor server logs** for any SMS sending failures

**Important:**
- No demo mode - real SMS will be sent
- OTP logging only occurs on failures
- Ensure Vonage account has sufficient balance

## Troubleshooting

### Common Issues

1. **"Vonage SMS service not configured"**
   - Check that `VONAGE_API_KEY` and `VONAGE_API_SECRET` are set in `.env.local`
   - Restart the Next.js development server after adding environment variables
   - Verify credentials in Vonage dashboard

2. **"Invalid Indian phone number format"**
   - Ensure phone number matches Indian mobile number patterns
   - Phone number should start with 6-9 and have 10 digits

3. **"Invalid OTP format"**
   - OTP must be exactly 6 digits
   - No letters or special characters allowed

4. **SMS not received**
   - Check Vonage dashboard for delivery status
   - Verify phone number format and country code
   - Check Vonage account balance
   - Review server console for error logs

### Vonage Status Codes

Common Vonage SMS status codes:
- `0`: Success
- `1`: Throttled
- `2`: Missing From Address
- `3`: Invalid From Address
- `5`: Internal Error
- `6`: Number Barred
- `7`: Handset Barred
- `8`: Duplicate Message ID

For complete status code reference, see [Vonage SMS API Documentation](https://developer.vonage.com/api/sms).

## Migration Notes

**Complete removal of Fast2SMS/RapidAPI and Demo Mode:**
- ❌ Removed `sendSMSOTP` method (RapidAPI integration)
- ❌ Removed demo mode functionality
- ❌ Removed `axios` dependency
- ❌ Removed `RAPIDAPI_KEY` and `RAPIDAPI_HOST` environment variables
- ❌ Removed all Fast2SMS-related code and error handling
- ❌ No OTP simulation or mock responses
- ✅ Clean Vonage-only implementation
- ✅ Real SMS sending only
- ✅ Enhanced error logging for debugging
- ✅ Production-ready code

## Production-Ready Benefits

- **Real SMS only**: No demo mode, no simulation
- **Secure logging**: OTP only logged on failures
- **Clean codebase**: Single SMS provider integration
- **Reduced dependencies**: No axios, no multiple SMS services
- **Better error handling**: Focused on Vonage-specific errors
- **Production tested**: Ready for live deployment
- **Security focused**: No credential exposure, proper validation
- **Monitoring ready**: Detailed error logs for debugging
