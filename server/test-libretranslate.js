// Test script for LibreTranslate API
async function testLibreTranslate() {
  try {
    console.log('🔍 Testing LibreTranslate API...');
    
    const testText = "Hello, world!";
    const targetLanguage = 'es';

    console.log(`🌍 Translating "${testText}" to ${targetLanguage}...`);

    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: testText,
        source: 'en',
        target: targetLanguage,
        format: 'text'
      })
    });

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();

    console.log('✅ Translation successful!');
    console.log(`📝 Original: ${testText}`);
    console.log(`📝 Translated: ${data.translatedText}`);
    console.log(`📄 Full Response:`, data);

    return true;
  } catch (error) {
    console.error('❌ Translation test failed:', error);
    return false;
  }
}

// Test supported languages
async function testSupportedLanguages() {
  try {
    console.log('\n🔍 Testing supported languages...');
    
    const response = await fetch('https://libretranslate.de/languages');
    const languages = await response.json();
    
    console.log('✅ Supported languages:', languages);
    
    // Check if our required languages are supported
    const requiredLanguages = ['en', 'hi', 'es', 'pt', 'zh', 'fr'];
    const supportedCodes = languages.map(lang => lang.code);
    
    console.log('\n📋 Language Support Check:');
    requiredLanguages.forEach(code => {
      const supported = supportedCodes.includes(code);
      const status = supported ? '✅' : '❌';
      const language = languages.find(lang => lang.code === code);
      const name = language ? language.name : code;
      console.log(`${status} ${code} (${name})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to fetch supported languages:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 LibreTranslate Integration Tests\n');
  
  const translationTest = await testLibreTranslate();
  const languagesTest = await testSupportedLanguages();
  
  if (translationTest && languagesTest) {
    console.log('\n🎉 All tests passed! LibreTranslate is ready to use.');
  } else {
    console.log('\n💥 Some tests failed. Check the errors above.');
  }
}

runTests();
