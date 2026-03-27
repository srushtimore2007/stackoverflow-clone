// hooks/useDynamicI18n.ts
// React hook for automatic dynamic translation with DOM scanning

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/language-context';
import { useTranslation as useBaseTranslation } from '../hooks/useTranslation';
import { TranslationNamespace } from '../shared/types/i18n';
import i18n from '../lib/i18n';
import { 
  libreTranslateIntegration, 
  translateText, 
  getCurrentLanguage,
  clearTranslationCache 
} from '../utils/libreTranslateIntegration';

/**
 * Dynamic element interface for tracking
 */
interface DynamicElement {
  element: HTMLElement;
  originalText: string;
  attribute: 'data-i18n-dynamic' | 'data-i18n-key' | 'data-i18n-placeholder';
  translatedText?: string;
}

/**
 * Hook options
 */
export interface UseDynamicI18nOptions {
  namespace?: TranslationNamespace;
  autoScan?: boolean;
  scanInterval?: number;
  preserveOriginal?: boolean;
}

/**
 * Hook result interface
 */
export interface UseDynamicI18nResult {
  // Static translation (existing i18n)
  t: (key: string, params?: Record<string, any>) => string;
  
  // Dynamic translation (LibreTranslate)
  dt: (text: string, options?: { forceRefresh?: boolean }) => Promise<string>;
  dtSync: (text: string) => string;
  
  // Language info
  currentLanguage: string;
  isTranslating: boolean;
  
  // DOM manipulation
  translateElement: (element: HTMLElement) => Promise<void>;
  translateAll: () => Promise<void>;
  clearCache: () => void;
  
  // Utility
  hasStaticTranslation: (key: string) => boolean;
}

/**
 * Dynamic i18n hook that:
 * 1. Detects current language from i18n
 * 2. Maps to LibreTranslate language codes
 * 3. Scans DOM for elements with data-i18n-dynamic
 * 4. Translates content via LibreTranslate API
 * 5. Updates DOM automatically when language changes
 * 6. Preserves original text as fallback
 */
export function useDynamicI18n(
  options: UseDynamicI18nOptions = {}
): UseDynamicI18nResult {
  const { 
    namespace = 'common', 
    autoScan = true, 
    scanInterval = 1000,
    preserveOriginal = true 
  } = options;

  // Existing hooks
  const { locale, setLocale } = useLanguage();
  const { t: staticT } = useBaseTranslation(namespace);
  
  // State
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [dynamicElements, setDynamicElements] = useState<DynamicElement[]>([]);

  // Refs
  const observerRef = useRef<MutationObserver | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const translationQueueRef = useRef<Map<string, Promise<string>>>(new Map());

  /**
   * Check if static i18n key exists
   */
  const hasStaticTranslation = useCallback((key: string): boolean => {
    try {
      const fullKey = `${namespace}:${key}`;
      const result = staticT(fullKey);
      return result !== fullKey;
    } catch {
      return false;
    }
  }, [namespace, staticT]);

  /**
   * Static translation function (existing behavior)
   */
  const t = useCallback((key: string, params?: Record<string, any>): string => {
    return staticT(key, params);
  }, [staticT]);

  /**
   * Dynamic translation via LibreTranslate
   */
  const dt = useCallback(async (
    text: string, 
    options: { forceRefresh?: boolean } = {}
  ): Promise<string> => {
    // Check if already translating
    const cacheKey = `${currentLanguage}-${text}`;
    if (translationQueueRef.current.has(cacheKey)) {
      return translationQueueRef.current.get(cacheKey)!;
    }

    // Create translation promise
    const translationPromise = (async () => {
      setIsTranslating(true);
      
      try {
        const result = await translateText(text, {
          targetLanguage: getCurrentLanguage() as any,
          forceRefresh: options.forceRefresh
        });
        
        return result.success ? result.translatedText : text;
      } catch (error) {
        console.error('Dynamic translation failed:', error);
        return text;
      } finally {
        setIsTranslating(false);
      }
    })();

    // Cache the promise
    translationQueueRef.current.set(cacheKey, translationPromise);
    
    try {
      const result = await translationPromise;
      return result;
    } finally {
      translationQueueRef.current.delete(cacheKey);
    }
  }, [currentLanguage]);

  /**
   * Synchronous dynamic translation (cached only)
   */
  const dtSync = useCallback((text: string): string => {
    // Return original text for sync calls
    return text;
  }, []);

  /**
   * Scan DOM for elements with translation attributes
   */
  const scanDynamicElements = useCallback((): HTMLElement[] => {
    const selector = [
      '[data-i18n-dynamic]',
      '[data-i18n-key]',
      '[data-i18n-placeholder]'
    ].join(', ');
    
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }, []);

  /**
   * Extract translation info from element
   */
  const extractTranslationInfo = useCallback((element: HTMLElement): DynamicElement | null => {
    let attribute: DynamicElement['attribute'] | null = null;
    let text = '';

    // Check for dynamic text attribute
    const dynamicText = element.getAttribute('data-i18n-dynamic');
    if (dynamicText) {
      attribute = 'data-i18n-dynamic';
      text = dynamicText;
    }

    // Check for i18n key attribute
    const i18nKey = element.getAttribute('data-i18n-key');
    if (i18nKey) {
      attribute = 'data-i18n-key';
      text = i18nKey;
    }

    // Check for placeholder attribute
    const placeholderText = element.getAttribute('data-i18n-placeholder');
    if (placeholderText) {
      attribute = 'data-i18n-placeholder';
      text = placeholderText;
    }

    if (!attribute || !text) {
      return null;
    }

    // Store original text if needed
    if (preserveOriginal && !element.hasAttribute('data-original-text')) {
      element.setAttribute('data-original-text', 
        element.textContent || element.getAttribute('placeholder') || ''
      );
    }

    return {
      element,
      originalText: text,
      attribute,
      translatedText: element.textContent || element.getAttribute('placeholder') || ''
    };
  }, [preserveOriginal]);

  /**
   * Translate a single element
   */
  const translateElement = useCallback(async (element: HTMLElement): Promise<void> => {
    const elementInfo = extractTranslationInfo(element);
    if (!elementInfo) return;

    try {
      let translatedText: string;

      // If it's an i18n key, try static translation first
      if (elementInfo.attribute === 'data-i18n-key') {
        if (hasStaticTranslation(elementInfo.originalText)) {
          translatedText = t(elementInfo.originalText);
        } else {
          // Fallback to dynamic translation
          translatedText = await dt(elementInfo.originalText);
        }
      } else {
        // Direct dynamic translation
        translatedText = await dt(elementInfo.originalText);
      }

      // Update element content
      if (elementInfo.attribute === 'data-i18n-placeholder') {
        (element as HTMLInputElement | HTMLTextAreaElement).placeholder = translatedText;
      } else {
        element.textContent = translatedText;
      }

      // Update tracked element
      setDynamicElements(prev => 
        prev.map(el => 
          el.element === element 
            ? { ...el, translatedText }
            : el
        )
      );

    } catch (error) {
      console.error('Failed to translate element:', element, error);
    }
  }, [extractTranslationInfo, hasStaticTranslation, t, dt]);

  /**
   * Translate all dynamic elements
   */
  const translateAll = useCallback(async (): Promise<void> => {
    const elements = scanDynamicElements();
    const newDynamicElements = elements
      .map(extractTranslationInfo)
      .filter((info): info is DynamicElement => info !== null);

    setDynamicElements(newDynamicElements);

    // Translate all elements
    const translationPromises = newDynamicElements.map(info => 
      translateElement(info.element)
    );

    await Promise.all(translationPromises);
  }, [scanDynamicElements, extractTranslationInfo, translateElement]);

  /**
   * Handle language change
   */
  const handleLanguageChange = useCallback(async (newLocale: string) => {
    const typedLocale = newLocale as any;
    if (typedLocale === currentLanguage) return;

    setCurrentLanguage(typedLocale);
    setIsTranslating(true);

    try {
      // Clear translation cache for new language
      clearTranslationCache();
      
      // Re-translate all dynamic elements
      await translateAll();
      
    } catch (error) {
      console.error('Language change error:', error);
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage, translateAll]);

  /**
   * Set up DOM observer for dynamic content
   */
  const setupObserver = useCallback(() => {
    if (!autoScan) return;

    observerRef.current = new MutationObserver((mutations) => {
      let shouldRescan = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.hasAttribute('data-i18n-dynamic') ||
                  element.hasAttribute('data-i18n-key') ||
                  element.hasAttribute('data-i18n-placeholder') ||
                  element.querySelector('[data-i18n-dynamic], [data-i18n-key], [data-i18n-placeholder]')) {
                shouldRescan = true;
              }
            }
          });
        }
      });

      if (shouldRescan) {
        // Debounce rescan
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
        
        scanTimeoutRef.current = setTimeout(() => {
          translateAll();
        }, 100);
      }
    });

    // Start observing
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true
    });
  }, [autoScan, translateAll]);

  // Initialize and set up observers
  useEffect(() => {
    // Initial scan
    translateAll();

    // Set up observer
    setupObserver();

    // Listen for language changes via i18n
    const handleI18nChange = () => {
      const newLang = getCurrentLanguage();
      handleLanguageChange(newLang);
    };

    // i18next language change event
    i18n.on('languageChanged', handleI18nChange);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      // Clean up i18next listener
      i18n.off('languageChanged', handleI18nChange);
    };
  }, [handleLanguageChange, setupObserver, translateAll]);

  return {
    t,                    // Static translation
    dt,                   // Dynamic translation (async)
    dtSync,               // Dynamic translation (sync)
    currentLanguage,        // Current language code
    isTranslating,         // Translation loading state
    translateElement,        // Translate single element
    translateAll,           // Translate all elements
    clearCache: clearTranslationCache, // Clear cache
    hasStaticTranslation    // Check if static key exists
  };
}
