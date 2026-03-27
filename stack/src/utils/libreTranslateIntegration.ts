// utils/libreTranslateIntegration.ts
// TypeScript utility for LibreTranslate integration with existing i18n setup

import axiosInstance from '../lib/axiosinstance';
import i18n from '../lib/i18n';
import { Locale } from '../shared/types/i18n';

/**
 * Language mapping from project Locale to LibreTranslate language codes
 * This maps your existing i18n locales to LibreTranslate API codes
 */
export const LIBRETRANSLATE_LANGUAGE_MAP: Record<Locale, string> = {
  en: 'en',    // English
  es: 'es',    // Spanish
  hi: 'hi',    // Hindi
  pt: 'pt',    // Portuguese
  zh: 'zh',    // Chinese (Simplified)
  fr: 'fr',    // French
} as const;

/**
 * Default language for the project (from i18n configuration)
 */
export const DEFAULT_SOURCE_LANGUAGE: Locale = 'en';

/**
 * Translation cache to avoid redundant API calls
 */
interface TranslationCache {
  [key: string]: {
    translatedText: string;
    timestamp: number;
    sourceLanguage: string;
    targetLanguage: string;
  };
}

class LibreTranslateCache {
  private cache: TranslationCache = {};
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Generate cache key for translation
   */
  private getCacheKey(text: string, sourceLang: string, targetLang: string): string {
    return `${sourceLang}-${targetLang}-${text.substring(0, 100)}`;
  }

  /**
   * Get cached translation if valid
   */
  get(text: string, sourceLang: string, targetLang: string): string | null {
    const key = this.getCacheKey(text, sourceLang, targetLang);
    const cached = this.cache[key];
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.translatedText;
    }
    
    return null;
  }

  /**
   * Cache translation result
   */
  set(text: string, sourceLang: string, targetLang: string, translatedText: string): void {
    const key = this.getCacheKey(text, sourceLang, targetLang);
    this.cache[key] = {
      translatedText,
      timestamp: Date.now(),
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    };

    // Also persist to localStorage for longer cache
    try {
      const persistentCache = JSON.parse(localStorage.getItem('libreTranslateCache') || '{}');
      persistentCache[key] = this.cache[key];
      localStorage.setItem('libreTranslateCache', JSON.stringify(persistentCache));
    } catch (error) {
      console.warn('Failed to persist translation cache:', error);
    }
  }

  /**
   * Load persistent cache from localStorage
   */
  loadPersistentCache(): void {
    try {
      const persistentCache = JSON.parse(localStorage.getItem('libreTranslateCache') || '{}');
      this.cache = { ...this.cache, ...persistentCache };
    } catch (error) {
      console.warn('Failed to load persistent cache:', error);
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache = {};
    localStorage.removeItem('libreTranslateCache');
  }
}

// Create singleton cache instance
const translationCache = new LibreTranslateCache();

// Initialize cache on client side
if (typeof window !== 'undefined') {
  translationCache.loadPersistentCache();
}

/**
 * LibreTranslate API response interface
 */
export interface LibreTranslateResponse {
  translatedText: string;
  success: boolean;
  error?: string;
}

/**
 * Main LibreTranslate integration utility
 * 
 * This utility provides:
 * - Language detection and mapping
 * - API integration with caching
 * - Fallback handling
 * - TypeScript safety
 */
export class LibreTranslateIntegration {
  private static instance: LibreTranslateIntegration;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): LibreTranslateIntegration {
    if (!LibreTranslateIntegration.instance) {
      LibreTranslateIntegration.instance = new LibreTranslateIntegration();
    }
    return LibreTranslateIntegration.instance;
  }

  /**
   * Get current language from i18n
   */
  getCurrentLanguage(): Locale {
    return (i18n.language as Locale) || DEFAULT_SOURCE_LANGUAGE;
  }

  /**
   * Get LibreTranslate language code for current locale
   */
  getCurrentLibreTranslateCode(): string {
    const currentLocale = this.getCurrentLanguage();
    return LIBRETRANSLATE_LANGUAGE_MAP[currentLocale];
  }

  /**
   * Get default source language code
   */
  getDefaultSourceCode(): string {
    return LIBRETRANSLATE_LANGUAGE_MAP[DEFAULT_SOURCE_LANGUAGE];
  }

  /**
   * Check if translation is needed (source != target)
   */
  needsTranslation(sourceText: string, targetLanguage?: Locale): boolean {
    const currentLang = targetLanguage || this.getCurrentLanguage();
    const sourceCode = this.getDefaultSourceCode();
    const targetCode = LIBRETRANSLATE_LANGUAGE_MAP[currentLang];
    
    const hasValidText = Boolean(sourceText && sourceText.trim().length > 0);
    const differentLanguages = sourceCode !== targetCode;
    
    return hasValidText && differentLanguages;
  }

  /**
   * Translate text using LibreTranslate API
   */
  async translateText(
    text: string,
    options: {
      sourceLanguage?: Locale;
      targetLanguage?: Locale;
      forceRefresh?: boolean;
    } = {}
  ): Promise<LibreTranslateResponse> {
    const { 
      sourceLanguage = DEFAULT_SOURCE_LANGUAGE,
      targetLanguage,
      forceRefresh = false 
    } = options;

    const currentTargetLang = targetLanguage || this.getCurrentLanguage();
    const sourceCode = LIBRETRANSLATE_LANGUAGE_MAP[sourceLanguage];
    const targetCode = LIBRETRANSLATE_LANGUAGE_MAP[currentTargetLang];

    // Check if translation is needed
    if (!sourceCode || !targetCode) {
      return {
        translatedText: text,
        success: false,
        error: 'Unsupported language'
      };
    }

    const needsTranslation = sourceCode !== targetCode && text && text.trim().length > 0;
    
    // Check if translation is needed
    if (!needsTranslation) {
      return {
        translatedText: text,
        success: true
      };
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = translationCache.get(text, sourceCode, targetCode);
      if (cached) {
        return {
          translatedText: cached,
          success: true
        };
      }
    }

    try {
      // Call LibreTranslate API
      const response = await axiosInstance.post('/api/translate', {
        text: text.trim(),
        sourceLanguage: sourceCode,
        targetLanguage: targetCode
      });

      if (response.data && response.data.translatedText) {
        const translatedText = response.data.translatedText;
        
        // Cache the result
        translationCache.set(text, sourceCode, targetCode, translatedText);
        
        return {
          translatedText,
          success: true
        };
      } else {
        throw new Error('Invalid API response');
      }

    } catch (error) {
      console.error('LibreTranslate API error:', error);
      
      return {
        translatedText: text, // Fallback to original text
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch translate multiple texts
   */
  async translateBatch(
    texts: string[],
    options: {
      sourceLanguage?: Locale;
      targetLanguage?: Locale;
    } = {}
  ): Promise<LibreTranslateResponse[]> {
    const { sourceLanguage = DEFAULT_SOURCE_LANGUAGE, targetLanguage } = options;
    
    const promises = texts.map(text => 
      this.translateText(text, { sourceLanguage, targetLanguage })
    );
    
    return Promise.all(promises);
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    translationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: Object.keys(translationCache['cache']).length,
      keys: Object.keys(translationCache['cache'])
    };
  }
}

// Export singleton instance
export const libreTranslateIntegration = LibreTranslateIntegration.getInstance();

// Export convenience functions
export const translateText = (text: string, options?: Parameters<LibreTranslateIntegration['translateText']>[1]) => 
  libreTranslateIntegration.translateText(text, options);

export const translateBatch = (texts: string[], options?: Parameters<LibreTranslateIntegration['translateBatch']>[1]) => 
  libreTranslateIntegration.translateBatch(texts, options);

export const getCurrentLanguage = (): Locale => 
  libreTranslateIntegration.getCurrentLanguage();

export const getCurrentLibreTranslateCode = (): string => 
  libreTranslateIntegration.getCurrentLibreTranslateCode();

export const clearTranslationCache = (): void => 
  libreTranslateIntegration.clearCache();
