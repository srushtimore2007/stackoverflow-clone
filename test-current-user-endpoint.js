/**
 * Test script for the /api/auth/current-user endpoint
 * Tests both successful authentication and error cases
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace this with a valid JWT token from your login
  validToken: null, // Replace with actual token for testing
  invalidToken: 'invalid.jwt.token',
  noToken: null
};

class CurrentUserEndpointTester {
  constructor() {
    this.results = {
      validToken: null,
      invalidToken: null,
      noToken: null,
      endpointExists: false
    };
  }

  /**
   * Test endpoint with valid token
   */
  async testWithValidToken() {
    console.log('🧪 Testing /api/auth/current-user with valid token...');
    
    if (!TEST_CONFIG.validToken) {
      console.log('⚠️  No valid token provided, skipping this test');
      this.results.validToken = { skipped: true, reason: 'No valid token' };
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/auth/current-user`, {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.validToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      this.results.validToken = {
        success: true,
        status: response.status,
        data: response.data,
        hasUserData: !!response.data?.data,
        userFields: response.data?.data ? Object.keys(response.data.data) : []
      };

      console.log('✅ Valid token test passed:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Has user data: ${this.results.validToken.hasUserData}`);
      console.log(`   User fields: ${this.results.validToken.userFields.join(', ')}`);

    } catch (error) {
      this.results.validToken = {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      };

      console.log('❌ Valid token test failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${this.results.validToken.message}`);
    }
  }

  /**
   * Test endpoint with invalid token
   */
  async testWithInvalidToken() {
    console.log('🧪 Testing /api/auth/current-user with invalid token...');

    try {
      const response = await axios.get(`${BASE_URL}/api/auth/current-user`, {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.invalidToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      this.results.invalidToken = {
        success: false, // Should not succeed with invalid token
        status: response.status,
        message: 'Unexpected success with invalid token'
      };

      console.log('❌ Invalid token test failed (should have failed):');
      console.log(`   Status: ${response.status}`);

    } catch (error) {
      this.results.invalidToken = {
        success: true, // Should fail with invalid token
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        expectedStatus: 401
      };

      console.log('✅ Invalid token test passed (correctly failed):');
      console.log(`   Status: ${error.response?.status} (expected: 401)`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Test endpoint with no token
   */
  async testWithNoToken() {
    console.log('🧪 Testing /api/auth/current-user with no token...');

    try {
      const response = await axios.get(`${BASE_URL}/api/auth/current-user`, {
        timeout: 5000
      });

      this.results.noToken = {
        success: false, // Should not succeed without token
        status: response.status,
        message: 'Unexpected success with no token'
      };

      console.log('❌ No token test failed (should have failed):');
      console.log(`   Status: ${response.status}`);

    } catch (error) {
      this.results.noToken = {
        success: true, // Should fail without token
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        expectedStatus: 401
      };

      console.log('✅ No token test passed (correctly failed):');
      console.log(`   Status: ${error.response?.status} (expected: 401)`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Test if endpoint exists (check for 404 vs other errors)
   */
  async testEndpointExists() {
    console.log('🧪 Testing if /api/auth/current-user endpoint exists...');

    try {
      const response = await axios.get(`${BASE_URL}/api/auth/current-user`, {
        timeout: 5000
      });

      // If we get any response other than 404, the endpoint exists
      this.results.endpointExists = response.status !== 404;
      console.log(`✅ Endpoint exists (status: ${response.status})`);

    } catch (error) {
      if (error.response?.status === 404) {
        this.results.endpointExists = false;
        console.log('❌ Endpoint does not exist (404)');
      } else {
        this.results.endpointExists = true;
        console.log(`✅ Endpoint exists (error status: ${error.response?.status})`);
      }
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Current User Endpoint Tests...\n');

    await this.testEndpointExists();
    
    if (!this.results.endpointExists) {
      console.log('\n❌ Endpoint does not exist. Please check:');
      console.log('   1. The server is running on localhost:5000');
      console.log('   2. The auth routes are properly registered');
      console.log('   3. The getCurrentUser controller function exists');
      return this.generateReport();
    }

    console.log('\n--- Running Authentication Tests ---\n');
    
    await this.testWithNoToken();
    await this.testWithInvalidToken();
    await this.testWithValidToken();

    return this.generateReport();
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CURRENT USER ENDPOINT TEST REPORT');
    console.log('='.repeat(60));

    console.log(`🔗 Endpoint: ${BASE_URL}/api/auth/current-user`);
    console.log(`📋 Endpoint exists: ${this.results.endpointExists ? '✅ YES' : '❌ NO'}`);

    if (!this.results.endpointExists) {
      console.log('\n❌ ENDPOINT NOT FOUND - Fix required:');
      console.log('1. Check server is running on localhost:5000');
      console.log('2. Verify getCurrentUser function exists in controller/auth.js');
      console.log('3. Verify route is registered: router.get("/current-user", auth, getCurrentUser)');
      console.log('4. Check that auth routes are properly mounted in server index.js');
      return { success: false, endpointExists: false };
    }

    console.log('\n🔐 Authentication Tests:');
    
    // No token test
    const noTokenResult = this.results.noToken;
    if (noTokenResult) {
      const status = noTokenResult.success && noTokenResult.status === 401 ? '✅ PASS' : '❌ FAIL';
      console.log(`   No Token: ${status} (Status: ${noTokenResult.status})`);
    }

    // Invalid token test
    const invalidTokenResult = this.results.invalidToken;
    if (invalidTokenResult) {
      const status = invalidTokenResult.success && invalidTokenResult.status === 401 ? '✅ PASS' : '❌ FAIL';
      console.log(`   Invalid Token: ${status} (Status: ${invalidTokenResult.status})`);
    }

    // Valid token test
    const validTokenResult = this.results.validToken;
    if (validTokenResult) {
      if (validTokenResult.skipped) {
        console.log(`   Valid Token: ⚠️  SKIPPED (${validTokenResult.reason})`);
      } else {
        const status = validTokenResult.success && validTokenResult.hasUserData ? '✅ PASS' : '❌ FAIL';
        console.log(`   Valid Token: ${status} (Status: ${validTokenResult.status})`);
        if (validTokenResult.hasUserData) {
          console.log(`      User fields: ${validTokenResult.userFields.join(', ')}`);
        }
      }
    }

    // Overall assessment
    const authTestsPass = 
      (noTokenResult?.success && noTokenResult.status === 401) &&
      (invalidTokenResult?.success && invalidTokenResult.status === 401) &&
      (validTokenResult?.skipped || (validTokenResult?.success && validTokenResult?.hasUserData));

    console.log('\n' + '='.repeat(60));
    console.log(`🎯 Overall Status: ${authTestsPass ? '✅ WORKING' : '❌ NEEDS FIXES'}`);
    
    if (authTestsPass) {
      console.log('🎉 The current-user endpoint is working correctly!');
      console.log('✨ Frontend should be able to fetch user data successfully.');
    } else {
      console.log('⚠️  Some tests failed. Check the details above.');
    }
    
    console.log('='.repeat(60));

    return {
      success: authTestsPass,
      endpointExists: this.results.endpointExists,
      results: this.results
    };
  }
}

// Usage instructions
console.log(`
📖 HOW TO USE THIS TEST:

1. Start your server: npm run dev (in server directory)
2. Get a valid JWT token by logging in to your app
3. Replace TEST_CONFIG.validToken with your actual token
4. Run this test: node test-current-user-endpoint.js

🔧 TROUBLESHOOTING:
- If endpoint doesn't exist (404): Check server routes registration
- If auth fails unexpectedly: Check JWT secret and middleware
- If user data is missing: Check database connection and user model
`);

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new CurrentUserEndpointTester();
  tester.runAllTests()
    .then(report => {
      process.exit(report.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = CurrentUserEndpointTester;
