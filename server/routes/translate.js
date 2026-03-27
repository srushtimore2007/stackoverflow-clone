// routes/translate.js
// Enhanced LibreTranslate API endpoint with robust error handling and fallbacks

import express from 'express';
import axios from 'axios';

const router = express.Router();

// LibreTranslate configuration
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5001';
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY || '';

// Simple in-memory cache for translations to avoid redundant API calls
const translationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Language mapping for LibreTranslate
const LANGUAGE_MAP = {
  'en': 'en',
  'es': 'es', 
  'fr': 'fr',
  'hi': 'hi',
  'pt': 'pt',
  'zh': 'zh'
};

/**
 * Get cache key for translation
 */
function getCacheKey(text, sourceLang, targetLang) {
  return `${sourceLang}-${targetLang}-${text}`;
}

/**
 * Get cached translation if available and not expired
 */
function getCachedTranslation(text, sourceLang, targetLang) {
  const key = getCacheKey(text, sourceLang, targetLang);
  const cached = translationCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.translatedText;
  }
  
  return null;
}

/**
 * Cache translation result
 */
function cacheTranslation(text, sourceLang, targetLang, translatedText) {
  const key = getCacheKey(text, sourceLang, targetLang);
  translationCache.set(key, {
    translatedText,
    timestamp: Date.now()
  });
}

/**
 * Simple fallback translation service (mock translations for development)
 */
function getFallbackTranslation(text, targetLang) {
  // For development, return original text with language indicator
  // In production, you might want to implement a proper fallback service
  const fallbacks = {
    'es': `${text} [ES]`,
    'fr': `${text} [FR]`,
    'hi': `${text} [HI]`,
    'pt': `${text} [PT]`,
    'zh': `${text} [ZH]`
  };
  
  return fallbacks[targetLang] || text;
}

/**
 * POST /api/translate
 * Enhanced translation endpoint with robust error handling
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { text, sourceLanguage = 'en', targetLanguage } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Text is required and must be a string',
        translatedText: text,
        success: false 
      });
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      return res.status(400).json({ 
        error: 'Target language is required and must be a string',
        translatedText: text,
        success: false 
      });
    }

    // Skip translation if source and target are the same
    if (sourceLanguage === targetLanguage) {
      return res.json({ 
        translatedText: text,
        success: true,
        method: 'same-language'
      });
    }

    // Skip translation for empty text
    if (!text.trim()) {
      return res.json({ 
        translatedText: text,
        success: true,
        method: 'empty-text'
      });
    }

    // Check cache first
    const cached = getCachedTranslation(text, sourceLanguage, targetLanguage);
    if (cached) {
      return res.json({ 
        translatedText: cached,
        success: true,
        method: 'cache',
        responseTime: Date.now() - startTime
      });
    }

    // Map language codes to LibreTranslate format
    const mappedSourceLang = LANGUAGE_MAP[sourceLanguage] || sourceLanguage;
    const mappedTargetLang = LANGUAGE_MAP[targetLanguage] || targetLanguage;

    console.log(`🔄 Translating: "${text}" from ${mappedSourceLang} to ${mappedTargetLang}`);

    // Attempt LibreTranslate API call with timeout
    let translatedText;
    let method = 'libretranslate';

    try {
      const translateResponse = await axios.post(`${LIBRETRANSLATE_URL}/translate`, {
        q: text,
        source: mappedSourceLang,
        target: mappedTargetLang,
        format: 'text',
        api_key: LIBRETRANSLATE_API_KEY
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000 // 5 second timeout
      });

      if (translateResponse.data && translateResponse.data.translatedText) {
        translatedText = translateResponse.data.translatedText;
        console.log(`✅ LibreTranslate result: "${translatedText}"`);
      } else {
        throw new Error('Invalid response from LibreTranslate');
      }

    } catch (libreError) {
      console.warn(`⚠️ LibreTranslate failed: ${libreError.message}`);
      
      // Try fallback translation
      translatedText = getFallbackTranslation(text, targetLanguage);
      method = 'fallback';
      
      console.log(`🔄 Using fallback translation: "${translatedText}"`);
    }

    // Cache the result
    cacheTranslation(text, sourceLanguage, targetLanguage, translatedText);

    const responseTime = Date.now() - startTime;
    
    return res.json({ 
      translatedText,
      success: true,
      method,
      responseTime,
      sourceLanguage: mappedSourceLang,
      targetLanguage: mappedTargetLang
    });

  } catch (error) {
    console.error('❌ Translation API error:', error.message);
    
    // Always return the original text as fallback to prevent UI breaking
    return res.status(200).json({ 
      translatedText: req.body.text,
      success: false,
      method: 'error-fallback',
      error: 'Translation service temporarily unavailable',
      responseTime: Date.now() - startTime
    });
  }
});

/**
 * GET /api/translate/health
 * Enhanced health check with LibreTranslate status
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const response = await axios.get(`${LIBRETRANSLATE_URL}/`, {
      timeout: 3000
    });

    return res.json({ 
      status: 'healthy',
      libreTranslateAvailable: true,
      libreTranslateUrl: LIBRETRANSLATE_URL,
      responseTime: Date.now() - startTime,
      cacheSize: translationCache.size,
      success: true 
    });
  } catch (error) {
    return res.json({ 
      status: 'degraded',
      libreTranslateAvailable: false,
      libreTranslateUrl: LIBRETRANSLATE_URL,
      error: error.message,
      cacheSize: translationCache.size,
      fallbackAvailable: true,
      success: false 
    });
  }
});

/**
 * GET /api/translate/cache
 * Get cache statistics (for debugging)
 */
router.get('/cache', (req, res) => {
  const cacheStats = {
    size: translationCache.size,
    entries: Array.from(translationCache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp,
      age: Date.now() - value.timestamp
    }))
  };
  
  return res.json(cacheStats);
});

/**
 * DELETE /api/translate/cache
 * Clear translation cache
 */
router.delete('/cache', (req, res) => {
  translationCache.clear();
  return res.json({ 
    message: 'Translation cache cleared',
    success: true 
  });
});

/**
 * GET /api/translate/languages
 * Get supported languages with fallback
 */
router.get('/languages', async (req, res) => {
  try {
    const response = await axios.get(`${LIBRETRANSLATE_URL}/languages`, {
      timeout: 5000
    });

    if (response.data) {
      return res.json({ 
        languages: response.data,
        success: true 
      });
    } else {
      throw new Error('Invalid response from LibreTranslate');
    }
  } catch (error) {
    console.warn('LibreTranslate languages endpoint failed, using fallback');
    
    // Return fallback languages
    const fallbackLanguages = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'hi', name: 'Hindi' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'zh', name: 'Chinese' }
    ];

    return res.json({ 
      languages: fallbackLanguages,
      success: false,
      error: 'Using fallback language list - LibreTranslate unavailable'
    });
  }
});

export default router;
