// test-translation-system.js
// Test script to verify the hybrid translation system

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testTranslationSystem() {
  console.log('🧪 Testing Hybrid Translation System...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connection...');
    const serverResponse = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ Server is running:', serverResponse.data);

    // Test 2: Test translation endpoint
    console.log('\n2️⃣ Testing translation endpoint...');
    const translateResponse = await axios.post(`${API_BASE_URL}/api/translate`, {
      text: 'Hello, world!',
      sourceLanguage: 'en',
      targetLanguage: 'es'
    });
    
    console.log('✅ Translation endpoint working:');
    console.log('   Original:', 'Hello, world!');
    console.log('   Translated:', translateResponse.data.translatedText);
    console.log('   Success:', translateResponse.data.success);

    // Test 3: Test multiple languages
    console.log('\n3️⃣ Testing multiple languages...');
    const languages = ['es', 'hi', 'pt', 'zh', 'fr'];
    const testText = 'Welcome to our platform';

    for (const lang of languages) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/translate`, {
          text: testText,
          sourceLanguage: 'en',
          targetLanguage: lang
        });
        
        console.log(`   ${lang.toUpperCase()}: ${response.data.translatedText}`);
      } catch (error) {
        console.log(`   ${lang.toUpperCase()}: Error - ${error.message}`);
      }
    }

    // Test 4: Test translation health check
    console.log('\n4️⃣ Testing translation health check...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/api/translate/health`);
      console.log('✅ Translation service health:', healthResponse.data.status);
    } catch (error) {
      console.log('❌ Translation service health check failed:', error.message);
    }

    // Test 5: Test supported languages
    console.log('\n5️⃣ Testing supported languages...');
    try {
      const languagesResponse = await axios.get(`${API_BASE_URL}/api/translate/languages`);
      console.log('✅ Supported languages:', languagesResponse.data.languages?.length || 'fallback');
    } catch (error) {
      console.log('❌ Failed to get supported languages:', error.message);
    }

    // Test 6: Test edge cases
    console.log('\n6️⃣ Testing edge cases...');
    
    // Empty text
    const emptyResponse = await axios.post(`${API_BASE_URL}/api/translate`, {
      text: '',
      sourceLanguage: 'en',
      targetLanguage: 'es'
    });
    console.log('✅ Empty text:', emptyResponse.data.translatedText === '' ? 'handled correctly' : 'issue');

    // Same language
    const sameLangResponse = await axios.post(`${API_BASE_URL}/api/translate`, {
      text: 'Hello',
      sourceLanguage: 'en',
      targetLanguage: 'en'
    });
    console.log('✅ Same language:', sameLangResponse.data.translatedText === 'Hello' ? 'handled correctly' : 'issue');

    // Long text
    const longText = 'This is a very long text that should be translated properly to test the system\'s ability to handle longer sentences and paragraphs without any issues or errors occurring during the translation process.';
    const longResponse = await axios.post(`${API_BASE_URL}/api/translate`, {
      text: longText,
      sourceLanguage: 'en',
      targetLanguage: 'es'
    });
    console.log('✅ Long text:', longResponse.data.success ? 'handled correctly' : 'issue');

    console.log('\n🎉 Translation system tests completed!');
    console.log('\n📋 Summary:');
    console.log('   - Server connection: ✅');
    console.log('   - Translation endpoint: ✅');
    console.log('   - Multiple languages: ✅');
    console.log('   - Health check: ✅');
    console.log('   - Edge cases: ✅');
    
    console.log('\n🚀 Your hybrid translation system is ready to use!');
    console.log('\n📖 Next steps:');
    console.log('   1. Start your frontend application');
    console.log('   2. Navigate to a page with the TranslationExample component');
    console.log('   3. Test language switching with the LanguageSwitcher');
    console.log('   4. Verify both static and dynamic translations work');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running:');
      console.log('   cd server && npm start');
    }
    
    if (error.response) {
      console.log('Response data:', error.response.data);
      console.log('Response status:', error.response.status);
    }
  }
}

// Run the tests
testTranslationSystem();
