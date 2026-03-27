// utils/libretranslate.ts
// LibreTranslate API integration utility for dynamic translation

/**
 * LibreTranslate configuration and API integration
 * Handles dynamic translation for missing i18n keys
 */

export interface LibreTranslateConfig {
  apiUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export interface TranslationResponse {
  translatedText: string;
  success: boolean;
  error?: string;
}

// Default configuration - update with your LibreTranslate instance
const DEFAULT_CONFIG: LibreTranslateConfig = {
  apiUrl: process.env.NEXT_PUBLIC_LIBRETRANSLATE_URL || 'https://libretranslate.de/translate',
  apiKey: process.env.NEXT_PUBLIC_LIBRETRANSLATE_API_KEY,
  timeout: 10000, // 10 seconds
  retryAttempts: 2,
  retryDelay: 1000, // 1 second
};

// Translation cache to avoid redundant API calls
const translationCache = new Map<string, string>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Supported languages mapping (ISO codes)
export const SUPPORTED_LANGUAGES = {
  en: 'en',
  es: 'es', 
  hi: 'hi',
  pt: 'pt',
  zh: 'zh',
  fr: 'fr',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Check if a language is supported for dynamic translation
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return lang in SUPPORTED_LANGUAGES;
}

/**
 * Generate cache key for translation
 */
function getCacheKey(text: string, sourceLang: string, targetLang: string): string {
  return `${sourceLang}-${targetLang}-${text.substring(0, 100)}`;
}

/**
 * Check if cached translation is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

/**
 * Get cached translation if available and valid
 */
function getCachedTranslation(text: string, sourceLang: string, targetLang: string): string | null {
  const key = getCacheKey(text, sourceLang, targetLang);
  const cached = translationCache.get(key);
  
  if (cached && isCacheValid(Date.now())) {
    return cached;
  }
  
  return null;
}

/**
 * Cache a translation result
 */
function cacheTranslation(text: string, sourceLang: string, targetLang: string, result: string): void {
  const key = getCacheKey(text, sourceLang, targetLang);
  translationCache.set(key, result);
}

/**
 * Make API call to LibreTranslate with retry logic
 */
async function callLibreTranslateAPI(
  request: TranslationRequest,
  config: LibreTranslateConfig,
  attempt: number = 1
): Promise<TranslationResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify({
        q: request.text,
        source: request.sourceLang,
        target: request.targetLang,
        format: 'text',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      translatedText: data.translatedText,
      success: true,
    };
  } catch (error) {
    console.error(`LibreTranslate API attempt ${attempt} failed:`, error);
    
    if (attempt < config.retryAttempts) {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
      return callLibreTranslateAPI(request, config, attempt + 1);
    }
    
    return {
      translatedText: request.text, // Fallback to original text
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Translate text using LibreTranslate API
 */
export async function translateText(
  text: string,
  targetLang: SupportedLanguage,
  sourceLang: SupportedLanguage = 'en',
  config: Partial<LibreTranslateConfig> = {}
): Promise<TranslationResponse> {
  // Validate inputs
  if (!text || !text.trim()) {
    return {
      translatedText: text,
      success: true,
    };
  }

  if (!isSupportedLanguage(targetLang) || !isSupportedLanguage(sourceLang)) {
    return {
      translatedText: text,
      success: false,
      error: 'Unsupported language',
    };
  }

  // Skip translation if source and target are the same
  if (sourceLang === targetLang) {
    return {
      translatedText: text,
      success: true,
    };
  }

  // Check cache first
  const cached = getCachedTranslation(text, sourceLang, targetLang);
  if (cached) {
    return {
      translatedText: cached,
      success: true,
    };
  }

  // Merge config with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Make API call
  const result = await callLibreTranslateAPI(
    {
      text,
      sourceLang: SUPPORTED_LANGUAGES[sourceLang],
      targetLang: SUPPORTED_LANGUAGES[targetLang],
    },
    finalConfig
  );

  // Cache successful translations
  if (result.success) {
    cacheTranslation(text, sourceLang, targetLang, result.translatedText);
  }

  return result;
}

/**
 * Batch translate multiple texts
 */
export async function translateBatch(
  texts: string[],
  targetLang: SupportedLanguage,
  sourceLang: SupportedLanguage = 'en',
  config: Partial<LibreTranslateConfig> = {}
): Promise<TranslationResponse[]> {
  const promises = texts.map(text => 
    translateText(text, targetLang, sourceLang, config)
  );
  
  return Promise.all(promises);
}

/**
 * Clear translation cache (useful for testing or manual refresh)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: translationCache.size,
    keys: Array.from(translationCache.keys()),
  };
}
