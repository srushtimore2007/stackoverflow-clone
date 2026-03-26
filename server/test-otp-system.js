// Test script for OTP-based language switching
async function testOTPSystem() {
  console.log('🧪 Testing OTP-based Language Switching System\n');

  const baseURL = 'http://localhost:5000';

  try {
    // Test 1: Get language requirements
    console.log('📋 Test 1: Getting language requirements...');
    
    const languages = ['en', 'fr', 'hi', 'es', 'pt', 'zh'];
    
    for (const lang of languages) {
      const response = await fetch(`${baseURL}/api/otp/requirements/${lang}`);
      const data = await response.json();
      
      console.log(`${data.success ? '✅' : '❌'} ${lang.toUpperCase()}:`, data.requirements);
    }

    // Test 2: Send Email OTP (French)
    console.log('\n📧 Test 2: Sending Email OTP for French...');
    
    const emailResponse = await fetch(`${baseURL}/api/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email',
        value: 'test@example.com',
        language: 'fr'
      })
    });
    
    const emailData = await emailResponse.json();
    console.log(`${emailData.success ? '✅' : '❌'} Email OTP:`, emailData);

    // Test 3: Send Phone OTP (Hindi)
    console.log('\n📱 Test 3: Sending Phone OTP for Hindi...');
    
    const phoneResponse = await fetch(`${baseURL}/api/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'phone',
        value: '+1234567890',
        language: 'hi'
      })
    });
    
    const phoneData = await phoneResponse.json();
    console.log(`${phoneData.success ? '✅' : '❌'} Phone OTP:`, phoneData);

    // Test 4: Verify OTP (using debug OTP from phone test)
    if (phoneData.success && phoneData.debugOTP) {
      console.log('\n🔐 Test 4: Verifying OTP...');
      
      const verifyResponse = await fetch(`${baseURL}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: '+1234567890',
          otp: phoneData.debugOTP
        })
      });
      
      const verifyData = await verifyResponse.json();
      console.log(`${verifyData.success ? '✅' : '❌'} OTP Verification:`, verifyData);
    }

    // Test 5: Test invalid scenarios
    console.log('\n🚫 Test 5: Testing invalid scenarios...');
    
    // Invalid OTP
    const invalidVerifyResponse = await fetch(`${baseURL}/api/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: '+1234567890',
        otp: '999999'
      })
    });
    
    const invalidVerifyData = await invalidVerifyResponse.json();
    console.log(`${!invalidVerifyData.success ? '✅' : '❌'} Invalid OTP rejected:`, invalidVerifyData.error);

    console.log('\n🎉 OTP System Tests Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test translation API still works
async function testTranslationAPI() {
  console.log('\n🌐 Testing Translation API...');
  
  try {
    const response = await fetch('http://localhost:5000/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world',
        target: 'es'
      })
    });
    
    const data = await response.json();
    console.log(`${data.success ? '✅' : '❌'} Translation:`, data);
    
  } catch (error) {
    console.error('❌ Translation test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testOTPSystem();
  await testTranslationAPI();
  console.log('\n🚀 All tests completed!');
}

runAllTests();
