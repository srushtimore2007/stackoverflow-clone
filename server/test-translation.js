// Simple test script to verify Google Cloud Translation API
import { Translate } from '@google-cloud/translate/build/src/v2/index.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '.env') });

// Resolve credentials file path
const credentialsPath = join(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS || '');

console.log('🔧 Environment variables loaded:');
console.log('📁 Credentials file:', credentialsPath);
console.log('🏢 Project ID:', process.env.GCLOUD_PROJECT);

async function testTranslation() {
  try {
    console.log('🔍 Testing Google Cloud Translation API...');
    
    // Initialize client
    const translate = new Translate({
      projectId: process.env.GCLOUD_PROJECT,
      keyFilename: credentialsPath
    });

    console.log('✅ Translation client initialized');
    console.log('📁 Credentials file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    console.log('🏢 Project ID:', process.env.GCLOUD_PROJECT);

    // Test translation
    const testText = "Hello, world!";
    const targetLanguage = 'es';

    console.log(`🌍 Translating "${testText}" to ${targetLanguage}...`);

    const [translation] = await translate.translate(testText, targetLanguage);

    console.log(`✅ Translation successful!`);
    console.log(`📝 Original: ${testText}`);
    console.log(`📝 Translated: ${translation}`);

    return true;
  } catch (error) {
    console.error('❌ Translation test failed:', error);
    
    if (error.code === 'ENOENT') {
      console.error('📁 Credentials file not found. Check the path:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    }
    
    if (error.message.includes('PERMISSION_DENIED')) {
      console.error('🔐 Permission denied. Check your Google Cloud credentials and permissions.');
    }
    
    return false;
  }
}

// Run the test
testTranslation().then(success => {
  if (success) {
    console.log('🎉 Translation API is ready to use!');
  } else {
    console.log('💥 Translation API needs configuration.');
  }
  process.exit(success ? 0 : 1);
});
