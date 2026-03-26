// Test script for Vonage OTP API endpoint (production-ready implementation)
const axios = require('axios');

async function testVonageOTP() {
  const testData = {
    phone: '+919876543210', // Test phone number
    otp: '123456' // Test OTP
  };

  try {
    console.log('Testing Vonage OTP API endpoint (production-ready)...');
    console.log('Request data:', testData);
    
    const response = await axios.post('http://localhost:3000/api/send-otp', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success:', response.data);
    console.log('ℹ️ Real SMS sent via Vonage (no demo mode)');
  } catch (error) {
    if (error.response) {
      console.error('❌ Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      // Check if it's a configuration error
      if (error.response.data.message?.includes('not configured')) {
        console.log('💡 Setup Required: Add VONAGE_API_KEY and VONAGE_API_SECRET to .env.local');
      }
    } else if (error.request) {
      console.error('❌ No response received:', error.message);
    } else {
      console.error('❌ Request setup error:', error.message);
    }
  }
}

// Test validation errors
async function testValidationErrors() {
  console.log('\n=== Testing Validation Errors ===');
  
  // Test missing phone
  try {
    await axios.post('http://localhost:3000/api/send-otp', { otp: '123456' });
  } catch (error) {
    console.log('✅ Missing phone validation:', error.response?.data?.message);
  }

  // Test missing OTP
  try {
    await axios.post('http://localhost:3000/api/send-otp', { phone: '+919876543210' });
  } catch (error) {
    console.log('✅ Missing OTP validation:', error.response?.data?.message);
  }

  // Test invalid phone format
  try {
    await axios.post('http://localhost:3000/api/send-otp', { phone: '12345', otp: '123456' });
  } catch (error) {
    console.log('✅ Invalid phone validation:', error.response?.data?.message);
  }

  // Test invalid OTP format
  try {
    await axios.post('http://localhost:3000/api/send-otp', { phone: '+919876543210', otp: 'abc' });
  } catch (error) {
    console.log('✅ Invalid OTP validation:', error.response?.data?.message);
  }
}

// Test configuration error (no Vonage credentials)
async function testConfigurationError() {
  console.log('\n=== Testing Configuration Error (No Vonage Credentials) ===');
  
  const testData = {
    phone: '9876543210', // Indian format without +
    otp: '654321'
  };

  try {
    const response = await axios.post('http://localhost:3000/api/send-otp', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('ℹ️ Vonage credentials configured - real SMS sent');
  } catch (error) {
    if (error.response?.status === 500) {
      console.log('✅ Configuration error working correctly:', error.response.data.message);
      console.log('� To fix: Add VONAGE_API_KEY and VONAGE_API_SECRET to .env.local');
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

// Run tests
if (require.main === module) {
  console.log('🚀 Vonage OTP API Test Suite (Production-Ready)');
  console.log('⚠️  Note: This implementation requires real Vonage credentials');
  console.log('📱 Real SMS will be sent when credentials are configured\n');
  
  testVonageOTP();
  testValidationErrors();
  testConfigurationError();
  
  console.log('\n📋 Test Summary:');
  console.log('- ✅ Validation tests should pass');
  console.log('- 📱 Real SMS requires Vonage credentials');
  console.log('- 🔍 Check server console for detailed error logs');
  console.log('- 📖 See VONAGE_OTP_IMPLEMENTATION.md for setup guide');
}

module.exports = { testVonageOTP, testValidationErrors, testConfigurationError };
