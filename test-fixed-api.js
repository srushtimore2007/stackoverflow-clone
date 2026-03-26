// Test script to verify the fixed Razorpay order creation API
const http = require('http');

function testFixedAPI() {
  console.log('🧪 Testing Fixed Razorpay Order Creation API...\n');

  const testData = [
    {
      name: 'Valid Bronze Plan Request',
      payload: JSON.stringify({ plan: 'BRONZE' }),
      expectedStatus: 200
    },
    {
      name: 'Valid Silver Plan Request', 
      payload: JSON.stringify({ plan: 'SILVER' }),
      expectedStatus: 200
    },
    {
      name: 'Valid Gold Plan Request',
      payload: JSON.stringify({ plan: 'GOLD' }),
      expectedStatus: 200
    },
    {
      name: 'Invalid Plan Request',
      payload: JSON.stringify({ plan: 'INVALID' }),
      expectedStatus: 400
    },
    {
      name: 'Missing Plan Request',
      payload: JSON.stringify({}),
      expectedStatus: 400
    },
    {
      name: 'Invalid JSON Request',
      payload: 'invalid json',
      expectedStatus: 400
    }
  ];

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/subscription/create-order',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  };

  let testCount = 0;
  
  function runTest(test) {
    return new Promise((resolve) => {
      testCount++;
      console.log(`${testCount}. Testing: ${test.name}`);
      console.log(`   Payload: ${test.payload}`);
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === test.expectedStatus) {
              console.log(`   ✅ Status: ${res.statusCode}`);
              
              if (response.success && response.order?.id) {
                console.log(`   ✅ Order ID: ${response.order.id}`);
                console.log(`   ✅ Amount: ${response.order.amount} ${response.order.currency}`);
                console.log(`   ✅ Subscription ID: ${response.subscriptionId}`);
              } else if (!response.success) {
                console.log(`   ⚠️  Error: ${response.message}`);
              }
            } else {
              console.log(`   ❌ Expected status: ${test.expectedStatus}, Got: ${res.statusCode}`);
              console.log(`   Response: ${data}`);
            }
          } catch (parseError) {
            console.log(`   ❌ JSON Parse Error: ${parseError.message}`);
            console.log(`   Raw Response: ${data}`);
          }
          
          console.log(''); // Empty line for readability
          resolve();
        });
      });

      req.on('error', (error) => {
        console.log(`   ❌ Request Error: ${error.message}`);
        console.log('   💡 Make sure server is running on port 5000');
        console.log('');
        resolve();
      });

      req.write(test.payload);
      req.end();
    });
  }

  // Run all tests sequentially
  testData.reduce((promise, test) => {
    return promise.then(() => runTest(test));
  }, Promise.resolve()).then(() => {
    console.log('🎯 Test Suite Complete!');
    console.log('\n📋 Expected Results:');
    console.log('• Bronze/Silver/Gold plans should return 200 with order_id');
    console.log('• Invalid plans should return 400 with clear error message');
    console.log('• No more 500 Internal Server Errors');
    
    console.log('\n🔧 If tests fail:');
    console.log('1. Check server console logs for detailed errors');
    console.log('2. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env');
    console.log('3. Ensure MongoDB is running');
    console.log('4. Check if server was restarted after changes');
  });
}

// Run tests
testFixedAPI();
