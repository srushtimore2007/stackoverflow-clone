// hooks/useTranslationManager.ts
// React hook that integrates with TranslationManager for dynamic DOM updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/language-context';
import translationManager from '../utils/translationManager';
import { TranslationNamespace } from '../shared/types/i18n';
import { Locale } from '../shared/types/i18n';

export interface UseTranslationManagerOptions {
  namespace?: TranslationNamespace;
  autoUpdate?: boolean; // Auto-update when language changes
  cacheTranslations?: boolean; // Cache translated content
}

export interface TranslationManagerResult {
  // Translation functions
  t: (key: string, params?: Record<string, any>) => string; // Static only
  dt: (text: string, options?: { forceDynamic?: boolean }) => Promise<string>; // Dynamic
  dtSync: (text: string, options?: { forceDynamic?: boolean }) => string; // Dynamic sync (cached)
  
  // Batch translation
  translateBatch: (texts: string[]) => Promise<string[]>;
  
  // State
  locale: string;
  isLoading: boolean;
  
  // Utilities
  hasKey: (key: string) => boolean;
  clearCache: () => void;
  
  // DOM manipulation
  updateElementText: (element: HTMLElement, text: string) => void;
  updateElements: (selector: string, texts: string[]) => void;
}

/**
 * Enhanced translation hook that ensures dynamic content is translated and applied to DOM
 * 
 * Key features:
 * - Automatically re-translates when language changes
 * - Provides both static and dynamic translation functions
 * - Handles DOM updates for dynamic content
 * - Manages caching and performance
 */
export function useTranslationManager(
  options: UseTranslationManagerOptions = {}
): TranslationManagerResult {
  const { namespace = 'common', autoUpdate = true, cacheTranslations = true } = options;
  const { locale, setLocale: setContextLocale } = useLanguage();
  
  // Local state for reactivity
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale as Locale);
  const translationCacheRef = useRef<Map<string, string>>(new Map());
  
  // Refs for DOM tracking
  const trackedElementsRef = useRef<Map<HTMLElement, string>>(new Map());

  /**
   * Static translation function (uses existing i18n)
   */
  const t = useCallback((key: string, params?: Record<string, any>): string => {
    try {
      const fullKey = namespace ? `${namespace}:${key}` : key;
      
      // Try to get from i18n first
      const result = translationManager['getStaticTranslation']?.(key, namespace, params);
      if (result && result !== key) {
        return result;
      }
      
      // Fallback
      return key;
    } catch (error) {
      console.error(`Translation error for key: ${key}`, error);
      return key;
    }
  }, [namespace]);

  /**
   * Dynamic translation function (async)
   */
  const dt = useCallback(async (
    text: string, 
    options: { forceDynamic?: boolean } = {}
  ): Promise<string> => {
    try {
      setIsLoading(true);
      
      const cacheKey = `${currentLocale}:${text}`;
      
      // Check cache first
      if (cacheTranslations && translationCacheRef.current.has(cacheKey)) {
        return translationCacheRef.current.get(cacheKey)!;
      }
      
      // Use translation manager
      const result = await translationManager.translate(text, {
        namespace,
        forceDynamic: options.forceDynamic
      });
      
      // Cache result
      if (cacheTranslations) {
        translationCacheRef.current.set(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error(`Dynamic translation error for: ${text}`, error);
      return text;
    } finally {
      setIsLoading(false);
    }
  }, [currentLocale, namespace, cacheTranslations]);

  /**
   * Synchronous dynamic translation (cached only)
   */
  const dtSync = useCallback((
    text: string, 
    options: { forceDynamic?: boolean } = {}
  ): string => {
    const cacheKey = `${currentLocale}:${text}`;
    
    if (translationCacheRef.current.has(cacheKey)) {
      return translationCacheRef.current.get(cacheKey)!;
    }
    
    // For sync calls, try to get from i18n or return original
    if (!options.forceDynamic) {
      const staticResult = t(text);
      if (staticResult !== text) {
        return staticResult;
      }
    }
    
    return text;
  }, [currentLocale, t]);

  /**
   * Batch translation
   */
  const translateBatch = useCallback(async (texts: string[]): Promise<string[]> => {
    try {
      setIsLoading(true);
      
      const requests = texts.map(text => ({ text }));
      return await translationManager.translateBatch(requests, { namespace });
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts; // Return original texts on error
    } finally {
      setIsLoading(false);
    }
  }, [namespace]);

  /**
   * Check if i18n key exists
   */
  const hasKey = useCallback((key: string): boolean => {
    try {
      const fullKey = namespace ? `${namespace}:${key}` : key;
      const result = translationManager['getStaticTranslation']?.(key, namespace);
      return result !== key;
    } catch {
      return false;
    }
  }, [namespace]);

  /**
   * Clear all caches
   */
  const clearCache = useCallback(() => {
    translationCacheRef.current.clear();
    translationManager.clearCache();
    trackedElementsRef.current.clear();
  }, []);

  /**
   * Update DOM element text with translation
   */
  const updateElementText = useCallback((element: HTMLElement, text: string): void => {
    if (!element) return;
    
    // Track original text for re-translation
    const originalText = element.getAttribute('data-original-text') || text;
    element.setAttribute('data-original-text', originalText);
    trackedElementsRef.current.set(element, originalText);
    
    // Update element text
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      (element as HTMLInputElement | HTMLTextAreaElement).placeholder = text;
    } else {
      element.textContent = text;
    }
  }, []);

  /**
   * Update multiple elements by selector
   */
  const updateElements = useCallback((selector: string, texts: string[]): void => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      if (index < texts.length) {
        updateElementText(element as HTMLElement, texts[index]);
      }
    });
  }, [updateElementText]);

  /**
   * Re-translate all tracked elements when language changes
   */
  const retranslateTrackedElements = useCallback(async () => {
    if (trackedElementsRef.current.size === 0) return;
    
    setIsLoading(true);
    
    try {
      const elements = Array.from(trackedElementsRef.current.entries());
      
      for (const [element, originalText] of elements) {
        try {
          const translatedText = await dt(originalText);
          updateElementText(element, translatedText);
        } catch (error) {
          console.error('Failed to re-translate element:', error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [dt, updateElementText]);

  /**
   * Handle language change
   */
  const handleLanguageChange = useCallback(async (newLocale: string) => {
    if (newLocale === currentLocale) return;
    
    const localeAsLocale = newLocale as Locale;
    setCurrentLocale(localeAsLocale);
    setIsLoading(true);
    
    try {
      // Update translation manager
      await translationManager.setLocale(newLocale);
      
      // Clear translation cache for new locale
      if (cacheTranslations) {
        translationCacheRef.current.clear();
      }
      
      // Re-translate tracked elements
      await retranslateTrackedElements();
      
    } catch (error) {
      console.error('Language change error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLocale, cacheTranslations, retranslateTrackedElements]);

  /**
   * Auto-scan and translate elements with specific attributes
   */
  const scanAndTranslateElements = useCallback(async () => {
    const elements = document.querySelectorAll('[data-translate], [data-translate-key]');
    
    for (const element of elements) {
      const htmlElement = element as HTMLElement;
      const translateKey = htmlElement.getAttribute('data-translate-key');
      const translateText = htmlElement.getAttribute('data-translate');
      
      if (translateKey) {
        // Try static translation first
        const staticTranslation = t(translateKey);
        if (staticTranslation !== translateKey) {
          updateElementText(htmlElement, staticTranslation);
        } else {
          // Use dynamic translation
          const dynamicTranslation = await dt(translateKey);
          updateElementText(htmlElement, dynamicTranslation);
        }
      } else if (translateText) {
        // Direct text translation
        const translated = await dt(translateText);
        updateElementText(htmlElement, translated);
      }
    }
  }, [t, dt, updateElementText]);

  // Listen for language changes
  useEffect(() => {
    if (autoUpdate && locale !== currentLocale) {
      handleLanguageChange(locale);
    }
  }, [locale, currentLocale, autoUpdate, handleLanguageChange]);

  // Initial scan and translation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        scanAndTranslateElements();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [scanAndTranslateElements]);

  // Listen for DOM changes (optional - for dynamic content)
  useEffect(() => {
    if (!autoUpdate) return;

    const observer = new MutationObserver((mutations) => {
      let shouldRescan = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.hasAttribute('data-translate') || 
                  element.hasAttribute('data-translate-key') ||
                  element.querySelector('[data-translate], [data-translate-key]')) {
                shouldRescan = true;
              }
            }
          });
        }
      });
      
      if (shouldRescan) {
        setTimeout(scanAndTranslateElements, 50);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [autoUpdate, scanAndTranslateElements]);

  return {
    t,
    dt,
    dtSync,
    translateBatch,
    locale: currentLocale,
    isLoading,
    hasKey,
    clearCache,
    updateElementText,
    updateElements
  };
}
