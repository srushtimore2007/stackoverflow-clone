/**
 * Enhanced Translation Manager
 * Handles both static i18n and dynamic LibreTranslate translations
 * with robust error handling and caching
 */

import axios from 'axios';

// Translation cache for frontend
const translationCache = new Map<string, { text: string; timestamp: number; method: string }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Language mapping
export const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', flag: '🇺🇸' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'Français', flag: '🇫🇷' },
  hi: { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  pt: { code: 'pt', name: 'Português', flag: '🇵🇹' },
  zh: { code: 'zh', name: '中文', flag: '🇨🇳' }
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Translation result interface
export interface TranslationResult {
  translatedText: string;
  success: boolean;
  method: string;
  responseTime?: number;
  error?: string;
}

// API response interfaces
interface TranslateApiResponse {
  translatedText: string;
  success: boolean;
  method: string;
  error?: string;
}

interface HealthCheckResponse {
  libreTranslateAvailable: boolean;
}

// Enhanced translation manager class
export class EnhancedTranslationManager {
  private baseUrl: string;
  private currentLanguage: SupportedLanguage = 'en';
  private isLibreTranslateAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor(baseUrl?: string) { 
   this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
   this.checkLibreTranslateHealth();
  }

  /**
   * Set current language
   */
  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Get cache key for translation
   */
  private getCacheKey(text: string, sourceLang: string, targetLang: string): string {
    return `${sourceLang}-${targetLang}-${text}`;
  }

  /**
   * Get cached translation if available and not expired
   */
  private getCachedTranslation(text: string, sourceLang: string, targetLang: string): TranslationResult | null {
    const key = this.getCacheKey(text, sourceLang, targetLang);
    const cached = translationCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        translatedText: cached.text,
        success: true,
        method: cached.method
      };
    }
    
    return null;
  }

  /**
   * Cache translation result
   */
  private cacheTranslation(text: string, sourceLang: string, targetLang: string, result: TranslationResult): void {
    const key = this.getCacheKey(text, sourceLang, targetLang);
    translationCache.set(key, {
      text: result.translatedText,
      timestamp: Date.now(),
      method: result.method
    });
  }

  /**
   * Check LibreTranslate health status
   */
  private async checkLibreTranslateHealth(): Promise<void> {
    try {
      const response = await axios.get<HealthCheckResponse>(`${this.baseUrl}/api/translate/health`, {
        timeout: 3000
      });
      
      this.isLibreTranslateAvailable = response.data.libreTranslateAvailable;
      this.lastHealthCheck = Date.now();
      
      console.log(`🏥 LibreTranslate health: ${this.isLibreTranslateAvailable ? 'Available' : 'Unavailable'}`);
    } catch (error: any) {
      this.isLibreTranslateAvailable = false;
      this.lastHealthCheck = Date.now();
      console.warn('⚠️ LibreTranslate health check failed:', error?.message || 'Unknown error');
    }
  }

  /**
   * Translate text using enhanced backend
   */
  async translateText(
    text: string, 
    sourceLanguage: string = 'en', 
    targetLanguage?: SupportedLanguage
  ): Promise<TranslationResult> {
    const target = targetLanguage || this.currentLanguage;
    const startTime = Date.now();

    // Validate input
    if (!text || typeof text !== 'string') {
      return {
        translatedText: text,
        success: false,
        method: 'invalid-input',
        error: 'Invalid text input'
      };
    }

    // Skip translation if source and target are the same
    if (sourceLanguage === target) {
      return {
        translatedText: text,
        success: true,
        method: 'same-language',
        responseTime: Date.now() - startTime
      };
    }

    // Skip translation for empty text
    if (!text.trim()) {
      return {
        translatedText: text,
        success: true,
        method: 'empty-text',
        responseTime: Date.now() - startTime
      };
    }

    // Check cache first
    const cached = this.getCachedTranslation(text, sourceLanguage, target);
    if (cached) {
      return {
        ...cached,
        responseTime: Date.now() - startTime
      };
    }

    // Periodic health check
    if (Date.now() - this.lastHealthCheck > this.healthCheckInterval) {
      await this.checkLibreTranslateHealth();
    }

    try {
      const response = await axios.post<TranslateApiResponse>(`${this.baseUrl}/api/translate`, {
        text,
        sourceLanguage,
        targetLanguage: target
      }, {
        timeout: 8000, // 8 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      const result: TranslationResult = {
        translatedText: data.translatedText,
        success: data.success,
        method: data.method || 'unknown',
        responseTime: Date.now() - startTime,
        error: data.error
      };

      // Cache the result
      this.cacheTranslation(text, sourceLanguage, target, result);

      console.log(`✅ Translation (${result.method}): "${text}" -> "${result.translatedText}" (${result.responseTime}ms)`);
      
      return result;

    } catch (error: any) {
      console.error('❌ Translation request failed:', error.message);
      
      // Return fallback result
      const fallbackResult: TranslationResult = {
        translatedText: text,
        success: false,
        method: 'error-fallback',
        responseTime: Date.now() - startTime,
        error: error.message || 'Translation service unavailable'
      };

      // Cache fallback to prevent repeated failed requests
      this.cacheTranslation(text, sourceLanguage, target, fallbackResult);
      
      return fallbackResult;
    }
  }

  /**
   * Translate multiple texts in batch
   */
  async translateBatch(
    texts: string[], 
    sourceLanguage: string = 'en', 
    targetLanguage?: SupportedLanguage
  ): Promise<TranslationResult[]> {
    const target = targetLanguage || this.currentLanguage;
    
    // Check cache for all texts first
    const uncachedTexts: string[] = [];
    const results: TranslationResult[] = [];
    
    texts.forEach(text => {
      const cached = this.getCachedTranslation(text, sourceLanguage, target);
      if (cached) {
        results.push(cached);
      } else {
        uncachedTexts.push(text);
        results.push({ translatedText: text, success: false, method: 'pending' });
      }
    });

    // Translate uncached texts
    if (uncachedTexts.length > 0) {
      const translationPromises = uncachedTexts.map(text => 
        this.translateText(text, sourceLanguage, target)
      );
      
      const translationResults = await Promise.all(translationPromises);
      
      // Merge results
      let uncachedIndex = 0;
      return results.map(result => {
        if (result.method === 'pending') {
          return translationResults[uncachedIndex++];
        }
        return result;
      });
    }
    
    return results;
  }

  /**
   * Get translation service status
   */
  async getServiceStatus(): Promise<{
    libreTranslateAvailable: boolean;
    cacheSize: number;
    supportedLanguages: typeof SUPPORTED_LANGUAGES;
    currentLanguage: SupportedLanguage;
  }> {
    await this.checkLibreTranslateHealth();
    
    return {
      libreTranslateAvailable: this.isLibreTranslateAvailable,
      cacheSize: translationCache.size,
      supportedLanguages: SUPPORTED_LANGUAGES,
      currentLanguage: this.currentLanguage
    };
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    translationCache.clear();
    console.log('🧹 Translation cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; age: number; method: string }>;
  } {
    const entries = Array.from(translationCache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      method: value.method
    }));

    return {
      size: translationCache.size,
      entries
    };
  }
}

// Singleton instance for global use
export const translationManager = new EnhancedTranslationManager();

// Export convenience functions
export const translateText = (text: string, sourceLanguage?: string, targetLanguage?: SupportedLanguage) => 
  translationManager.translateText(text, sourceLanguage, targetLanguage);

export const setTranslationLanguage = (language: SupportedLanguage) => 
  translationManager.setLanguage(language);

export const getTranslationLanguage = () => 
  translationManager.getCurrentLanguage();

export const getTranslationServiceStatus = () => 
  translationManager.getServiceStatus();

export const clearTranslationCache = () => 
  translationManager.clearCache();

export default translationManager;
