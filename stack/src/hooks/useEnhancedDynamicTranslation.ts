/**
 * Enhanced Dynamic Translation Hook
 * Scans DOM for elements with data-i18n-dynamic and translates them
 * using the enhanced translation manager with robust error handling
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { translationManager, TranslationResult, SupportedLanguage } from '../utils/enhancedTranslationManager';

export interface EnhancedDynamicTranslationOptions {
  autoScan?: boolean;
  scanInterval?: number;
  debounceMs?: number;
  retryFailed?: boolean;
  maxRetries?: number;
}

interface TranslationState {
  isTranslating: boolean;
  translatedCount: number;
  failedCount: number;
  lastError?: string;
}

/**
 * Enhanced Dynamic Translation Hook
 * Provides automatic DOM scanning and translation with performance optimization
 */
export const useEnhancedDynamicTranslation = (options: EnhancedDynamicTranslationOptions = {}) => {
  const {
    autoScan = true,
    scanInterval = 1000,
    debounceMs = 300,
    retryFailed = true,
    maxRetries = 2
  } = options;

  const [translationState, setTranslationState] = useState<TranslationState>({
    isTranslating: false,
    translatedCount: 0,
    failedCount: 0
  });

  const scanTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef<Map<string, number>>(new Map());
  const isScanningRef = useRef(false);
  const lastScanRef = useRef<number>(0);

  /**
   * Find all elements with data-i18n-dynamic attribute
   */
  const findDynamicElements = useCallback((): Element[] => {
    return Array.from(document.querySelectorAll('[data-i18n-dynamic]'));
  }, []);

  /**
   * Get translation text from element
   */
  const getElementText = useCallback((element: Element): string => {
    const text = element.getAttribute('data-i18n-dynamic');
    if (text) return text;
    
    // Fallback to element's text content
    return element.textContent?.trim() || '';
  }, []);

  /**
   * Update element with translated text
   */
  const updateElementText = useCallback((element: Element, translatedText: string): void => {
    if (element instanceof HTMLElement) {
      // Preserve original text in data attribute for future reference
      const originalText = getElementText(element);
      element.setAttribute('data-i18n-original', originalText);
      
      // Update element content
      element.textContent = translatedText;
      
      // Add translation class for styling
      element.classList.add('i18n-translated');
    }
  }, [getElementText]);

  /**
   * Translate a single element
   */
  const translateElement = useCallback(async (
    element: Element, 
    sourceLanguage: string = 'en',
    targetLanguage?: SupportedLanguage
  ): Promise<TranslationResult> => {
    const text = getElementText(element);
    const elementId = `${element.tagName}-${text.slice(0, 20)}`;
    
    if (!text) {
      return {
        translatedText: text,
        success: false,
        method: 'empty-text',
        error: 'No text to translate'
      };
    }

    try {
      const result = await translationManager.translateText(text, sourceLanguage, targetLanguage);
      
      if (result.success && result.translatedText !== text) {
        updateElementText(element, result.translatedText);
        retryCountRef.current.delete(elementId); // Reset retry count on success
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle retry logic
      if (retryFailed) {
        const currentRetries = retryCountRef.current.get(elementId) || 0;
        if (currentRetries < maxRetries) {
          retryCountRef.current.set(elementId, currentRetries + 1);
          
          // Retry after a delay
          setTimeout(() => {
            translateElement(element, sourceLanguage, targetLanguage);
          }, 1000 * (currentRetries + 1)); // Exponential backoff
        }
      }
      
      return {
        translatedText: text,
        success: false,
        method: 'error',
        error: errorMessage
      };
    }
  }, [getElementText, updateElementText, retryFailed, maxRetries]);

  /**
   * Translate all dynamic elements
   */
  const translateAll = useCallback(async (
    sourceLanguage: string = 'en',
    targetLanguage?: SupportedLanguage
  ): Promise<void> => {
    if (isScanningRef.current) {
      console.log('🔄 Translation already in progress, skipping...');
      return;
    }

    isScanningRef.current = true;
    setTranslationState(prev => ({ ...prev, isTranslating: true }));

    try {
      const elements = findDynamicElements();
      console.log(`🔍 Found ${elements.length} elements to translate`);

      if (elements.length === 0) {
        setTranslationState(prev => ({ ...prev, isTranslating: false }));
        return;
      }

      // Collect unique texts to translate (batch optimization)
      const textToElementMap = new Map<string, Element[]>();
      
      elements.forEach(element => {
        const text = getElementText(element);
        if (text && text.trim()) {
          if (!textToElementMap.has(text)) {
            textToElementMap.set(text, []);
          }
          textToElementMap.get(text)!.push(element);
        }
      });

      // Translate unique texts
      const uniqueTexts = Array.from(textToElementMap.keys());
      const target = targetLanguage || translationManager.getCurrentLanguage();
      
      const translationResults = await translationManager.translateBatch(
        uniqueTexts, 
        sourceLanguage, 
        target
      );

      // Apply translations to all elements
      let translatedCount = 0;
      let failedCount = 0;

      translationResults.forEach((result, index) => {
        const text = uniqueTexts[index];
        const elements = textToElementMap.get(text) || [];
        
        if (result.success && result.translatedText !== text) {
          elements.forEach(element => updateElementText(element, result.translatedText));
          translatedCount += elements.length;
        } else if (!result.success) {
          failedCount += elements.length;
        }
      });

      setTranslationState({
        isTranslating: false,
        translatedCount,
        failedCount,
        lastError: failedCount > 0 ? 'Some translations failed' : undefined
      });

      console.log(`✅ Translation complete: ${translatedCount} translated, ${failedCount} failed`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Translation batch failed:', errorMessage);
      
      setTranslationState(prev => ({
        ...prev,
        isTranslating: false,
        lastError: errorMessage
      }));
    } finally {
      isScanningRef.current = false;
      lastScanRef.current = Date.now();
    }
  }, [findDynamicElements, getElementText, updateElementText, translationManager]);

  /**
   * Debounced translate function
   */
  const debouncedTranslate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (...args: Parameters<typeof translateAll>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => translateAll(...args), debounceMs);
      };
    })(),
    [translateAll, debounceMs]
  );

  /**
   * Manual translation trigger
   */
  const triggerTranslation = useCallback((
    sourceLanguage?: string,
    targetLanguage?: SupportedLanguage
  ) => {
    debouncedTranslate(sourceLanguage, targetLanguage);
  }, [debouncedTranslate]);

  /**
   * Clear translation cache and reset elements
   */
  const resetTranslations = useCallback(() => {
    translationManager.clearCache();
    retryCountRef.current.clear();
    
    // Reset all translated elements to original text
    const elements = document.querySelectorAll('[data-i18n-original]');
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        const originalText = element.getAttribute('data-i18n-original');
        if (originalText) {
          element.textContent = originalText;
          element.removeAttribute('data-i18n-original');
          element.classList.remove('i18n-translated');
        }
      }
    });
    
    setTranslationState({
      isTranslating: false,
      translatedCount: 0,
      failedCount: 0
    });
    
    console.log('🔄 Translations reset');
  }, []);

  /**
   * Auto-scan effect
   */
  useEffect(() => {
    if (!autoScan) return;

    const scanAndTranslate = () => {
      const now = Date.now();
      // Only scan if enough time has passed since last scan
      if (now - lastScanRef.current > scanInterval) {
        translateAll();
      }
    };

    // Initial scan
    scanAndTranslate();

    // Set up interval for periodic scanning
    const interval = setInterval(scanAndTranslate, scanInterval);

    return () => {
      clearInterval(interval);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [autoScan, scanInterval, translateAll]);

  /**
   * Listen for language changes
   */
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('🌐 Language changed, triggering translation...');
      translateAll();
    };

    // Listen for custom language change event
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, [translateAll]);

  return {
    // State
    translationState,
    
    // Actions
    translateAll,
    triggerTranslation,
    resetTranslations,
    
    // Utilities
    findDynamicElements,
    isTranslating: translationState.isTranslating,
    translatedCount: translationState.translatedCount,
    failedCount: translationState.failedCount,
    lastError: translationState.lastError
  };
};

export default useEnhancedDynamicTranslation;
