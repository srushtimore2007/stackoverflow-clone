// Test script to check server environment and dependencies
const path = require('path');
const fs = require('fs');

// Load server package.json and check dependencies
const serverPackagePath = path.join(__dirname, 'server', 'package.json');
const serverPackage = JSON.parse(fs.readFileSync(serverPackagePath, 'utf8'));

console.log('🔍 Server Environment Check...\n');

console.log('1. Server Dependencies:');
console.log('   razorpay:', serverPackage.dependencies.razorpay ? '✅' : '❌');
console.log('   dotenv:', serverPackage.dependencies.dotenv ? '✅' : '❌');

// Try to load server environment
const serverEnvPath = path.join(__dirname, 'server', '.env');
if (fs.existsSync(serverEnvPath)) {
  console.log('2. .env File: ✅ EXISTS');
  
  // Read and parse .env (basic parsing)
  const envContent = fs.readFileSync(serverEnvPath, 'utf8');
  const hasRazorpayKeyId = envContent.includes('RAZORPAY_KEY_ID=');
  const hasRazorpaySecret = envContent.includes('RAZORPAY_KEY_SECRET=');
  
  console.log('   RAZORPAY_KEY_ID:', hasRazorpayKeyId ? '✅ SET' : '❌ MISSING');
  console.log('   RAZORPAY_KEY_SECRET:', hasRazorpaySecret ? '✅ SET' : '❌ MISSING');
} else {
  console.log('2. .env File: ❌ MISSING');
  console.log('   💡 Create server/.env from server/.env.example');
}

// Test Razorpay import from server directory
console.log('\n3. Razorpay Module Test:');
try {
  // Change to server directory and require
  process.chdir(path.join(__dirname, 'server'));
  const Razorpay = require('razorpay');
  console.log('   ✅ Razorpay module loads successfully from server directory');
  
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('   ✅ Razorpay instance created successfully');
  } else {
    console.log('   ❌ Cannot create instance - missing env vars');
  }
} catch (error) {
  console.log('   ❌ Razorpay error:', error.message);
}

console.log('\n🎯 Root Cause Analysis:');
console.log('The 500 error is likely caused by:');
console.log('1. ❌ Missing RAZORPAY_KEY_ID in server/.env');
console.log('2. ❌ Missing RAZORPAY_KEY_SECRET in server/.env');
console.log('3. ❌ Invalid Razorpay API credentials');

console.log('\n🔧 IMMEDIATE FIX:');
console.log('1. Copy server/.env.example to server/.env');
console.log('2. Add your Razorpay test credentials:');
console.log('   RAZORPAY_KEY_ID=rzp_test_...');
console.log('   RAZORPAY_KEY_SECRET=...');

console.log('\n💡 Get test keys from: https://dashboard.razorpay.com/');
