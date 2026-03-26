// Simple debug script without external dependencies
require('dotenv').config(); // Load environment variables

console.log('🔍 Simple Debug Test...\n');

// Test 1: Check environment variables
console.log('1. Environment Variables:');
console.log('   RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ SET' : '❌ MISSING');
console.log('   RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ SET' : '❌ MISSING');

// Test 2: Try to load Razorpay module
console.log('\n2. Razorpay Module:');
try {
  const Razorpay = require('razorpay');
  console.log('   ✅ Razorpay module loaded');
  
  // Test instance creation
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('   ✅ Razorpay instance created');
  } else {
    console.log('   ❌ Cannot create instance - missing credentials');
  }
} catch (error) {
  console.log('   ❌ Razorpay module error:', error.message);
}

// Test 3: Check if server files exist
console.log('\n3. File System Check:');
const fs = require('fs');

const filesToCheck = [
  'server/controller/subscriptionController.js',
  'server/lib/utils/razorpay.js',
  'server/config/plans.js',
  'server/models/Subscription.js'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING!`);
  }
});

console.log('\n🎯 Debug Complete!');
console.log('\n💡 Most Common 500 Error Causes:');
console.log('1. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env');
console.log('2. Invalid Razorpay API credentials');
console.log('3. Network connectivity issues with Razorpay API');
console.log('4. Database connection failures');
console.log('5. Mongoose validation errors');

console.log('\n📋 Quick Fix Checklist:');
console.log('□ Add Razorpay test keys to server/.env');
console.log('□ Start MongoDB service');
console.log('□ Restart the server');
console.log('□ Check server console logs for detailed errors');
