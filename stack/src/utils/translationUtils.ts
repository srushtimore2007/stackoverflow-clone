// utils/translationUtils.ts
// Utility functions for comprehensive translation management

import { useTranslationManager } from '../hooks/useTranslationManager';
import { TranslationNamespace } from '../shared/types/i18n';
import translationManager from './translationManager';

/**
 * Comprehensive translation utility that checks i18n first, then uses LibreTranslate
 * This is the main utility function that should be used throughout the app
 */
export async function translateText(
  textOrKey: string,
  options: {
    namespace?: string;
    params?: Record<string, any>;
    forceDynamic?: boolean;
    fallbackText?: string;
  } = {}
): Promise<string> {
  const { namespace = 'common', params, forceDynamic = false, fallbackText } = options;

  try {
    // If it's forced dynamic or doesn't look like an i18n key, use LibreTranslate
    if (forceDynamic || !textOrKey.includes('.')) {
      const result = await translationManager.translate(textOrKey, {
        namespace,
        forceDynamic: true
      });
      return result;
    }

    // Try static i18n first
    const staticResult = await translationManager.translate(textOrKey, {
      namespace,
      forceDynamic: false
    });

    // If static translation is different from the key, it was found
    if (staticResult !== textOrKey) {
      return staticResult;
    }

    // Fallback to dynamic translation
    const dynamicResult = await translationManager.translate(textOrKey, {
      namespace,
      forceDynamic: true
    });

    return dynamicResult;

  } catch (error) {
    console.error('Translation error:', error);
    return fallbackText || textOrKey;
  }
}

/**
 * Synchronous version for cases where async is not possible
 * Uses cached translations or returns original text
 */
export function translateTextSync(
  textOrKey: string,
  options: {
    namespace?: string;
    params?: Record<string, any>;
    fallbackText?: string;
  } = {}
): string {
  const { namespace = 'common', params, fallbackText } = options;

  try {
    // Try static i18n first
    const staticResult = translationManager['getStaticTranslation']?.(textOrKey, namespace, params);
    
    if (staticResult && staticResult !== textOrKey) {
      return staticResult;
    }

    // Try to get from cache
    const currentLocale = translationManager.getCurrentLocale();
    const cacheKey = `${currentLocale}:${textOrKey}`;
    
    // Check if we have a cached translation
    const cached = translationManager['getCachedTranslation']?.(textOrKey, currentLocale);
    if (cached && cached !== textOrKey) {
      return cached;
    }

    // Return fallback
    return fallbackText || textOrKey;

  } catch (error) {
    console.error('Sync translation error:', error);
    return fallbackText || textOrKey;
  }
}

/**
 * Batch translate multiple texts
 */
export async function translateBatch(
  texts: string[],
  options: {
    namespace?: string;
    forceDynamic?: boolean;
  } = {}
): Promise<string[]> {
  const { namespace = 'common', forceDynamic = false } = options;

  try {
    const requests = texts.map(text => ({ 
      text, 
      namespace,
      key: text 
    }));

    return await translationManager.translateBatch(requests, {
      namespace,
      forceDynamic
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts; // Return original texts on error
  }
}

/**
 * Check if a translation key exists in i18n
 */
export function hasTranslationKey(
  key: string,
  namespace: string = 'common'
): boolean {
  try {
    const fullKey = namespace ? `${namespace}:${key}` : key;
    const result = translationManager['getStaticTranslation']?.(key, namespace);
    return result !== key;
  } catch {
    return false;
  }
}

/**
 * Apply translations to DOM elements with specific attributes
 * This function can be called to ensure all elements are translated
 */
export async function applyTranslationsToDOM(
  selector: string = '[data-translate], [data-translate-key], [data-placeholder]'
): Promise<void> {
  const elements = document.querySelectorAll(selector);
  
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i] as HTMLElement;
    
    try {
      // Check for direct text translation
      const translateTextAttr = element.getAttribute('data-translate');
      if (translateTextAttr) {
        const translated = await translateText(translateTextAttr);
        updateElementContent(element, translated);
        continue;
      }

      // Check for i18n key translation
      const translateKey = element.getAttribute('data-translate-key');
      if (translateKey) {
        const translated = await translateText(translateKey);
        updateElementContent(element, translated);
        continue;
      }

      // Check for placeholder translation
      const placeholderText = element.getAttribute('data-placeholder');
      if (placeholderText) {
        const translated = await translateText(placeholderText);
        updateElementPlaceholder(element, translated);
        continue;
      }

      // Check for title attribute translation
      const titleText = element.getAttribute('data-title');
      if (titleText) {
        const translated = await translateText(titleText);
        element.setAttribute('title', translated);
        continue;
      }

      // Check for alt attribute translation (for images)
      const altText = element.getAttribute('data-alt');
      if (altText) {
        const translated = await translateText(altText);
        element.setAttribute('alt', translated);
        continue;
      }

    } catch (error) {
      console.error('Failed to translate element:', element, error);
    }
  }
}

/**
 * Update element content (text or placeholder)
 */
function updateElementContent(element: HTMLElement, text: string): void {
  // Store original text for re-translation
  if (!element.hasAttribute('data-original-text')) {
    element.setAttribute('data-original-text', 
      element.textContent || element.getAttribute('placeholder') || ''
    );
  }

  // Update based on element type
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
    if (inputElement.type === 'submit' || inputElement.type === 'button') {
      inputElement.value = text;
    } else {
      inputElement.placeholder = text;
    }
  } else if (element.tagName === 'BUTTON') {
    // Handle button content carefully
    if (element.textContent) {
      element.textContent = text;
    } else {
      // For buttons with HTML content, we need to be more careful
      const textNode = document.createTextNode(text);
      element.innerHTML = '';
      element.appendChild(textNode);
    }
  } else {
    element.textContent = text;
  }
}

/**
 * Update element placeholder
 */
function updateElementPlaceholder(element: HTMLElement, text: string): void {
  if (!element.hasAttribute('data-original-placeholder')) {
    element.setAttribute('data-original-placeholder', 
      element.getAttribute('placeholder') || ''
    );
  }

  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    (element as HTMLInputElement | HTMLTextAreaElement).placeholder = text;
  }
}

/**
 * React hook for easy translation usage
 */
export function useTranslation(
  namespace: TranslationNamespace = 'common'
) {
  const translationManagerResult = useTranslationManager({ namespace });

  return {
    // Static translation
    t: (key: string, params?: Record<string, any>) => translationManagerResult.t(key, params),
    
    // Dynamic translation
    dt: (text: string, options?: { forceDynamic?: boolean }) => 
      translationManagerResult.dt(text, options),
    
    // Dynamic sync translation
    dtSync: (text: string, options?: { forceDynamic?: boolean }) => 
      translationManagerResult.dtSync(text, options),
    
    // Batch translation
    translateBatch: (texts: string[]) => translationManagerResult.translateBatch(texts),
    
    // Utilities
    hasKey: (key: string) => translationManagerResult.hasKey(key),
    locale: translationManagerResult.locale,
    isLoading: translationManagerResult.isLoading,
    
    // DOM manipulation
    updateElement: translationManagerResult.updateElementText,
    updateElements: translationManagerResult.updateElements
  };
}

/**
 * Initialize translation system
 * Call this once when your app starts
 */
export async function initializeTranslationSystem(
  options: {
    defaultLocale?: string;
    autoApplyTranslations?: boolean;
  } = {}
): Promise<void> {
  const { defaultLocale = 'en', autoApplyTranslations = true } = options;

  try {
    // Initialize translation manager
    translationManager.initialize();
    
    // Set default locale if provided
    if (defaultLocale !== 'en') {
      await translationManager.setLocale(defaultLocale);
    }

    // Apply translations to DOM if enabled
    if (autoApplyTranslations && typeof window !== 'undefined') {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(applyTranslationsToDOM, 100);
        });
      } else {
        setTimeout(applyTranslationsToDOM, 100);
      }
    }

    console.log('Translation system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize translation system:', error);
  }
}

/**
 * Global function to retranslate all content
 * Useful when language changes
 */
export async function retranslateAllContent(): Promise<void> {
  try {
    // Get current locale
    const currentLocale = translationManager.getCurrentLocale();
    
    // Update translation manager
    await translationManager.setLocale(currentLocale);
    
    // Re-apply translations to DOM
    await applyTranslationsToDOM();
    
    console.log('All content retranslated for locale:', currentLocale);
  } catch (error) {
    console.error('Failed to retranslate content:', error);
  }
}

// Export the main translation manager for advanced usage
export { translationManager };
