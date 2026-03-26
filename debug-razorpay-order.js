// Debug script to identify the exact cause of 500 error in Razorpay order creation
// Run this to pinpoint the issue step by step

const axios = require('axios');

async function debugRazorpayOrderCreation() {
  console.log('🔍 Debugging Razorpay Order Creation...\n');

  // Test 1: Check environment variables
  console.log('1. Checking environment variables...');
  console.log('   RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT SET');
  console.log('   RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

  // Test 2: Test API connectivity
  console.log('\n2. Testing API connectivity...');
  try {
    const response = await axios.get('http://localhost:5000/api/subscription/status', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    }).catch(err => {
      if (err.code === 'ECONNREFUSED') {
        return { status: 'SERVER_DOWN', error: 'Server not running' };
      }
      return { status: 'AUTH_ERROR', error: err.message };
    });
    
    if (response.status === 200) {
      console.log('   ✅ Server is running and responding');
    } else {
      console.log('   ⚠️  Server responded with:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Server connectivity failed:', error.message);
  }

  // Test 3: Test order creation with minimal payload
  console.log('\n3. Testing order creation...');
  
  const testPayloads = [
    {
      name: 'Valid Bronze Plan',
      data: { plan: 'BRONZE' }
    },
    {
      name: 'Valid Silver Plan', 
      data: { plan: 'SILVER' }
    },
    {
      name: 'Valid Gold Plan',
      data: { plan: 'GOLD' }
    },
    {
      name: 'Invalid Plan',
      data: { plan: 'INVALID' }
    },
    {
      name: 'Missing Plan',
      data: {}
    },
    {
      name: 'Invalid Body',
      data: 'invalid'
    }
  ];

  for (const test of testPayloads) {
    console.log(`\n   Testing: ${test.name}`);
    console.log(`   Payload:`, JSON.stringify(test.data, null, 2));
    
    try {
      const response = await axios.post('http://localhost:5000/api/subscription/create-order', test.data, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.status === 200) {
        console.log(`   ✅ Success: Order ID ${response.data.order?.id || 'N/A'}`);
      } else if (response.status === 400) {
        console.log(`   ⚠️  Bad Request: ${response.data?.message || 'No message'}`);
      } else if (response.status === 401) {
        console.log(`   🔐 Unauthorized: ${response.data?.message || 'No message'}`);
      } else if (response.status === 404) {
        console.log(`   ❌ Not Found: ${response.data?.message || 'No message'}`);
      } else if (response.status === 500) {
        console.log(`   💥 Server Error: ${response.data?.message || 'No message'}`);
        console.log(`   🔍 This is the error we need to debug!`);
      } else {
        console.log(`   ❓ Unexpected Status: ${response.status}`);
        console.log(`   Response:`, response.data);
      }
    } catch (error) {
      if (error.code === 'ECONNRESET') {
        console.log(`   🔄 Connection Reset: Server closed connection`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ⏰ Timeout: Request took too long`);
      } else {
        console.log(`   ❌ Request Failed: ${error.message}`);
      }
    }
  }

  // Test 4: Check if Razorpay module loads
  console.log('\n4. Testing Razorpay module loading...');
  try {
    const Razorpay = require('razorpay');
    console.log('   ✅ Razorpay module loaded successfully');
    
    // Test instance creation (this might fail if env vars are missing)
    try {
      const testInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'test_key',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret'
      });
      console.log('   ✅ Razorpay instance created successfully');
    } catch (instanceError) {
      console.log(`   ❌ Razorpay instance creation failed: ${instanceError.message}`);
    }
  } catch (moduleError) {
    console.log(`   ❌ Razorpay module loading failed: ${moduleError.message}`);
  }

  // Test 5: Database connectivity check
  console.log('\n5. Testing database connectivity...');
  try {
    // This would require the actual mongoose connection
    // For now, just check if we can require the models
    const User = require('./server/models/auth.js');
    const Subscription = require('./server/models/Subscription.js');
    console.log('   ✅ Database models loaded successfully');
  } catch (dbError) {
    console.log(`   ❌ Database model loading failed: ${dbError.message}`);
  }

  console.log('\n🎯 Debugging Complete!');
  console.log('\n📋 Most Likely Issues (check server logs for these):');
  console.log('• Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env');
  console.log('• Invalid Razorpay credentials (wrong API keys)');
  console.log('• Database connection failure');
  console.log('• Mongoose schema validation error');
  console.log('• Network connectivity issues with Razorpay API');
  console.log('• Amount/currency validation issues');
  
  console.log('\n💡 Next Steps:');
  console.log('1. Check server console logs for detailed error messages');
  console.log('2. Verify .env file has correct Razorpay credentials');
  console.log('3. Ensure MongoDB is running and accessible');
  console.log('4. Test with valid Razorpay test keys from dashboard');
}

// Run debug test
debugRazorpayOrderCreation();
