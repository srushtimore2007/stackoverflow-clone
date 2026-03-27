// hooks/useDynamicTranslation.ts
// Enhanced translation hook with LibreTranslate integration

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useLanguage } from '../contexts/language-context';
import { useTranslation as useBaseTranslation } from './useTranslation';
import { TranslationNamespace } from '../shared/types/i18n';
import i18n from '../lib/i18n';
import { 
  translateText, 
  isSupportedLanguage, 
  SupportedLanguage,
  TranslationResponse 
} from '../utils/libretranslate';

export interface DynamicTranslationOptions {
  /** Enable dynamic translation for missing keys */
  enableDynamic?: boolean;
  /** Source language for dynamic translation (default: 'en') */
  sourceLang?: SupportedLanguage;
  /** Cache dynamic translations in localStorage */
  cacheDynamic?: boolean;
  /** Show fallback indicators for dynamically translated content */
  showIndicators?: boolean;
}

export interface DynamicTranslationResult {
  /** Enhanced translation function */
  t: (key: string, params?: Record<string, string | number>, options?: DynamicTranslationOptions) => Promise<string>;
  /** Synchronous translation function (static content only) */
  tSync: (key: string, params?: Record<string, string | number>) => string;
  /** Current locale */
  locale: string;
  /** Check if a key exists in i18n */
  hasKey: (key: string) => boolean;
  /** Translate raw text dynamically */
  translateText: (text: string, options?: DynamicTranslationOptions) => Promise<string>;
  /** Loading state for dynamic translations */
  isDynamicLoading: boolean;
}

/**
 * Enhanced translation hook that combines i18n with LibreTranslate
 * 
 * Usage:
 * const { t, tSync, translateText, hasKey } = useDynamicTranslation('common');
 * 
 * // Static content (existing behavior)
 * const staticText = tSync('welcome');
 * 
 * // Dynamic content with fallback to LibreTranslate
 * const dynamicText = await t('some.dynamic.key');
 * 
 * // Direct text translation
 * const translated = await translateText('Hello World');
 */
export function useDynamicTranslation(
  namespace: TranslationNamespace = 'common',
  defaultOptions: DynamicTranslationOptions = {}
): DynamicTranslationResult {
  const { locale } = useLanguage();
  const { t: baseT } = useBaseTranslation(namespace);

  // Default options
  const options: Required<DynamicTranslationOptions> = {
    enableDynamic: true,
    sourceLang: 'en',
    cacheDynamic: true,
    showIndicators: false,
    ...defaultOptions,
  };

  // Check if a translation key exists in i18n resources
  const hasKey = useCallback((key: string): boolean => {
    try {
      const fullKey = `${namespace}:${key}`;
      const value = i18n.t(fullKey);
      return value !== fullKey;
    } catch {
      return false;
    }
  }, [namespace]);

  // Get dynamic translation from localStorage cache
  const getCachedDynamicTranslation = useCallback((text: string, targetLang: string): string | null => {
    if (!options.cacheDynamic) return null;
    
    try {
      const cacheKey = `dynamic_${targetLang}_${text.substring(0, 50)}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { text: translatedText, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        // Cache for 24 hours
        if (age < 24 * 60 * 60 * 1000) {
          return translatedText;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Failed to read dynamic translation cache:', error);
    }
    return null;
  }, [options.cacheDynamic]);

  // Cache dynamic translation in localStorage
  const cacheDynamicTranslation = useCallback((text: string, targetLang: string, result: string): void => {
    if (!options.cacheDynamic) return;
    
    try {
      const cacheKey = `dynamic_${targetLang}_${text.substring(0, 50)}`;
      const cacheData = {
        text: result,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache dynamic translation:', error);
    }
  }, [options.cacheDynamic]);

  // Synchronous translation (static content only)
  const tSync = useCallback((key: string, params?: Record<string, string | number>): string => {
    return baseT(key, params);
  }, [baseT]);

  // Dynamic text translation
  const translateTextFunc = useCallback(async (
    text: string, 
    translateOptions: DynamicTranslationOptions = {}
  ): Promise<string> => {
    const finalOptions = { ...options, ...translateOptions };
    
    if (!finalOptions.enableDynamic || !isSupportedLanguage(locale)) {
      return text;
    }

    // Check cache first
    const cached = getCachedDynamicTranslation(text, locale);
    if (cached) {
      return cached;
    }

    // Perform translation
    const result: TranslationResponse = await translateText(
      text,
      locale as SupportedLanguage,
      finalOptions.sourceLang
    );

    if (result.success && result.translatedText !== text) {
      // Cache successful translation
      cacheDynamicTranslation(text, locale, result.translatedText);
      
      // Add indicator if enabled
      if (finalOptions.showIndicators) {
        return `🌐 ${result.translatedText}`;
      }
      
      return result.translatedText;
    }

    // Log error for debugging
    if (!result.success && result.error) {
      console.warn(`Dynamic translation failed: ${result.error}`);
    }

    return text;
  }, [locale, options, getCachedDynamicTranslation, cacheDynamicTranslation]);

  // Enhanced translation function with dynamic fallback
  const t = useCallback(async (
    key: string, 
    params?: Record<string, string | number>,
    translateOptions: DynamicTranslationOptions = {}
  ): Promise<string> => {
    const finalOptions = { ...options, ...translateOptions };
    
    // First, try static i18n translation
    if (hasKey(key)) {
      return tSync(key, params);
    }

    // If static translation not found and dynamic is enabled
    if (finalOptions.enableDynamic && isSupportedLanguage(locale)) {
      // Extract potential text from key (last part after dot)
      const potentialText = key.split('.').pop()?.replace(/_/g, ' ');
      
      if (potentialText) {
        const translated = await translateTextFunc(potentialText, finalOptions);
        
        // If translation was successful and different from original
        if (translated !== potentialText) {
          return translated;
        }
      }
    }

    // Fallback: return the key itself
    return key;
  }, [hasKey, tSync, locale, options, translateTextFunc]);

  // Memoize the result to prevent unnecessary re-renders
  const result = useMemo(() => ({
    t,
    tSync,
    locale,
    hasKey,
    translateText: translateTextFunc,
    isDynamicLoading: false, // Could be enhanced with loading state if needed
  }), [t, tSync, locale, hasKey, translateTextFunc]);

  return result;
}

/**
 * Component for rendering dynamically translated text
 */
export interface DynamicTextProps {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  options?: DynamicTranslationOptions;
  fallback?: string;
}

export function DynamicText({ 
  text, 
  as: Component = 'span', 
  className = '',
  options = {},
  fallback = text
}: DynamicTextProps): React.ReactElement {
  const { translateText } = useDynamicTranslation('common', options);
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const translate = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await translateText(text, options);
        if (isMounted) {
          setTranslatedText(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Translation failed');
          setTranslatedText(fallback);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    translate();

    return () => {
      isMounted = false;
    };
  }, [text, options, fallback, translateText]);

  if (isLoading) {
    return React.createElement(Component, { className }, fallback);
  }

  if (error && options.showIndicators) {
    return React.createElement(
      Component, 
      { 
        className,
        title: `Translation error: ${error}`
      }, 
      translatedText
    );
  }

  return React.createElement(Component, { className }, translatedText);
}
