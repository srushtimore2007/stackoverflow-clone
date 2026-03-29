// utils/translationManager.ts
// Central translation manager that applies LibreTranslate translations to the DOM

import { useLanguage } from '../contexts/language-context';
import { useTranslation as useBaseTranslation } from '../hooks/useTranslation';
import { TranslationNamespace } from '../shared/types/i18n';
import i18n from '../lib/i18n';
import axiosInstance from '../lib/axiosinstance';

export interface TranslationRequest {
  text: string;
  key?: string; // Optional i18n key
  namespace?: string;
}

export interface TranslationResponse {
  translatedText: string;
  success: boolean;
  method?: string;
  responseTime?: number;
  sourceLanguage?: string;
  targetLanguage?: string;
  error?: string;
}

export interface TranslationCache {
  [key: string]: {
    text: string;
    timestamp: number;
    locale: string;
  };
}

/**
 * Translation Manager - Handles both static i18n and dynamic LibreTranslate translations
 * Ensures translations are applied to DOM when language changes
 */
class TranslationManager {
  private cache: TranslationCache = {};
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private listeners: Set<() => void> = new Set();
  private currentLocale: string = 'en';
  private translationQueue: Map<string, TranslationRequest[]> = new Map();

  constructor() {
    // Initialize with current locale
    if (typeof window !== 'undefined') {
      this.currentLocale = localStorage.getItem('locale') || 'en';
    }
  }

  /**
   * Add listener for translation changes
   */
  addListener(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners that translations have changed
   */
  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  /**
   * Generate cache key for translations
   */
  private getCacheKey(text: string, locale: string): string {
    return `${locale}:${text.substring(0, 100)}`;
  }

  /**
   * Check if cached translation is valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Get cached translation if available and valid
   */
  private getCachedTranslation(text: string, locale: string): string | null {
    const key = this.getCacheKey(text, locale);
    const cached = this.cache[key];
    
    if (cached && this.isCacheValid(cached.timestamp) && cached.locale === locale) {
      return cached.text;
    }
    
    return null;
  }

  /**
   * Cache a translation
   */
  private cacheTranslation(text: string, locale: string, translatedText: string): void {
    const key = this.getCacheKey(text, locale);
    this.cache[key] = {
      text: translatedText,
      timestamp: Date.now(),
      locale
    };

    // Also persist to localStorage for longer cache
    try {
      const persistentCache = JSON.parse(localStorage.getItem('translationCache') || '{}');
      persistentCache[key] = this.cache[key];
      localStorage.setItem('translationCache', JSON.stringify(persistentCache));
    } catch (error) {
      console.warn('Failed to persist translation cache:', error);
    }
  }

  /**
   * Load persistent cache from localStorage
   */
  private loadPersistentCache(): void {
    try {
      const persistentCache = JSON.parse(localStorage.getItem('translationCache') || '{}');
      this.cache = { ...this.cache, ...persistentCache };
    } catch (error) {
      console.warn('Failed to load persistent cache:', error);
    }
  }

  /**
   * Check if i18n key exists
   */
  private hasI18nKey(key: string, namespace: string = 'common'): boolean {
    try {
      const fullKey = `${namespace}:${key}`;
      const value = i18n.t(fullKey);
      return value !== fullKey;
    } catch {
      return false;
    }
  }

  /**
   * Get static i18n translation
   */
  private getStaticTranslation(key: string, namespace: string = 'common', params?: Record<string, any>): string {
    try {
      const fullKey = `${namespace}:${key}`;
      const value = i18n.t(fullKey, params || {});
      
      // Type guard to ensure we return a string
      const stringValue = typeof value === 'string' ? value : String(value);
      
      if (stringValue === fullKey) {
        console.warn(`Static translation not found: ${namespace}.${key}`);
        return key;
      }
      
      return stringValue;
    } catch (error) {
      console.error(`Error getting static translation: ${namespace}.${key}`, error);
      return key;
    }
  }

  /**
   * Translate text using LibreTranslate API
   */
  private async translateWithLibre(text: string, targetLocale: string): Promise<string> {
    // Skip translation if target is English or text is empty
    if (targetLocale === 'en' || !text || !text.trim()) {
      return text;
    }

    // Check cache first
    const cached = this.getCachedTranslation(text, targetLocale);
    if (cached) {
      return cached;
    }

    try {
      const response = await axiosInstance.post<TranslationResponse>('/api/translate', {
        text,
        targetLanguage: targetLocale,
        sourceLanguage: 'en'
      });

      if (response.data && response.data.translatedText) {
        const translatedText = response.data.translatedText;
        this.cacheTranslation(text, targetLocale, translatedText);
        return translatedText;
      }
    } catch (error) {
      console.error('LibreTranslate API error:', error);
    }

    // Fallback to original text
    return text;
  }

  /**
   * Main translation function - checks i18n first, then uses LibreTranslate
   */
  async translate(
    textOrKey: string, 
    options: {
      namespace?: string;
      params?: Record<string, any>;
      forceDynamic?: boolean;
    } = {}
  ): Promise<string> {
    const { namespace = 'common', params, forceDynamic = false } = options;

    // If it's an i18n key and not forced dynamic, try static translation first
    if (!forceDynamic && this.hasI18nKey(textOrKey, namespace)) {
      return this.getStaticTranslation(textOrKey, namespace, params);
    }

    // For dynamic content, use LibreTranslate
    let textToTranslate = textOrKey;
    
    // If it looks like an i18n key (contains dots), convert to readable text
    if (textOrKey.includes('.')) {
      textToTranslate = textOrKey.split('.').pop()?.replace(/_/g, ' ') || textOrKey;
    }

    return this.translateWithLibre(textToTranslate, this.currentLocale);
  }

  /**
   * Batch translate multiple texts
   */
  async translateBatch(
    requests: TranslationRequest[],
    options: { namespace?: string; forceDynamic?: boolean } = {}
  ): Promise<string[]> {
    const { namespace = 'common', forceDynamic = false } = options;
    
    const translations = await Promise.all(
      requests.map(({ text, key, namespace: reqNamespace = namespace }) =>
        this.translate(text, { namespace: reqNamespace, forceDynamic })
      )
    );

    return translations;
  }

  /**
   * Update current locale and trigger re-translation
   */
  async setLocale(newLocale: string): Promise<void> {
    if (this.currentLocale === newLocale) return;

    this.currentLocale = newLocale;
    
    // Update i18next
    await i18n.changeLanguage(newLocale);
    
    // Notify listeners to trigger re-render
    this.notifyListeners();
  }

  /**
   * Get current locale
   */
  getCurrentLocale(): string {
    return this.currentLocale;
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem('translationCache');
    }
    this.notifyListeners();
  }

  /**
   * Initialize the translation manager
   */
  initialize(): void {
    if (typeof window !== 'undefined') {
      this.loadPersistentCache();
      this.currentLocale = localStorage.getItem('locale') || 'en';
    }
  }
}

// Create singleton instance
const translationManager = new TranslationManager();

// Initialize on client side
if (typeof window !== 'undefined') {
  translationManager.initialize();
}

export default translationManager;
