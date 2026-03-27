/**
 * Hybrid Translation Hook
 * Combines static i18n translations with dynamic LibreTranslate
 * Provides a unified interface for all translation needs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  translationManager, 
  SupportedLanguage, 
  SUPPORTED_LANGUAGES,
  getTranslationServiceStatus,
  setTranslationLanguage,
  getTranslationLanguage
} from '../utils/enhancedTranslationManager';
import { useEnhancedDynamicTranslation } from './useEnhancedDynamicTranslation';

export interface HybridTranslationState {
  currentLanguage: SupportedLanguage;
  isLoading: boolean;
  isLibreTranslateAvailable: boolean;
  staticTranslationsReady: boolean;
  dynamicTranslationsReady: boolean;
  error?: string;
}

export interface HybridTranslationOptions {
  enableDynamic?: boolean;
  autoTranslate?: boolean;
  fallbackToStatic?: boolean;
  debugMode?: boolean;
}

/**
 * Hybrid Translation Hook
 * Provides both static i18n and dynamic LibreTranslate translations
 * with automatic language switching and error handling
 */
export const useHybridTranslation = (options: HybridTranslationOptions = {}) => {
  const {
    enableDynamic = true,
    autoTranslate = true,
    fallbackToStatic = true,
    debugMode = false
  } = options;

  // Static i18n hook
  const { i18n, t: staticT, ready: staticReady } = useTranslation();
  
  // Dynamic translation hook
  const dynamicTranslation = useEnhancedDynamicTranslation({
    autoScan: enableDynamic && autoTranslate,
    scanInterval: 1000,
    debounceMs: 300,
    retryFailed: true,
    maxRetries: 2
  });

  // Local state
  const [state, setState] = useState<HybridTranslationState>({
    currentLanguage: 'en',
    isLoading: true,
    isLibreTranslateAvailable: false,
    staticTranslationsReady: false,
    dynamicTranslationsReady: false
  });

  const initializedRef = useRef(false);
  const languageChangeTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Initialize translation system
   */
  const initialize = useCallback(async () => {
    if (initializedRef.current) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Get service status
      const serviceStatus = await getTranslationServiceStatus();
      
      // Set current language from i18n or default to English
      const currentLang = (i18n.language as SupportedLanguage) || 'en';
      
      // Update translation manager language
      setTranslationLanguage(currentLang);
      
      setState(prev => ({
        ...prev,
        currentLanguage: currentLang,
        isLibreTranslateAvailable: serviceStatus.libreTranslateAvailable,
        staticTranslationsReady: staticReady,
        dynamicTranslationsReady: !enableDynamic || serviceStatus.libreTranslateAvailable,
        isLoading: false
      }));

      if (debugMode) {
        console.log('🚀 Hybrid Translation initialized:', {
          currentLanguage: currentLang,
          libreTranslateAvailable: serviceStatus.libreTranslateAvailable,
          staticReady: staticReady,
          dynamicEnabled: enableDynamic
        });
      }

      initializedRef.current = true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to initialize hybrid translation:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [i18n, staticReady, enableDynamic, debugMode]);

  /**
   * Change language and update all translations
   */
  const changeLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    if (newLanguage === state.currentLanguage) {
      if (debugMode) {
        console.log(`🔄 Language ${newLanguage} is already active`);
      }
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: undefined }));

      // Change static i18n language
      await i18n.changeLanguage(newLanguage);
      
      // Update translation manager language
      setTranslationLanguage(newLanguage);
      
      // Trigger dynamic translation
      if (enableDynamic) {
        // Debounce dynamic translation to avoid conflicts
        if (languageChangeTimeoutRef.current) {
          clearTimeout(languageChangeTimeoutRef.current);
        }
        
        languageChangeTimeoutRef.current = setTimeout(() => {
          dynamicTranslation.triggerTranslation('en', newLanguage);
        }, 100);
      }

      // Update state
      setState(prev => ({
        ...prev,
        currentLanguage: newLanguage,
        isLoading: false,
        staticTranslationsReady: true,
        dynamicTranslationsReady: !enableDynamic
      }));

      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: newLanguage } 
      }));

      if (debugMode) {
        console.log(`🌐 Language changed to: ${newLanguage}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to change language:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [state.currentLanguage, i18n, enableDynamic, dynamicTranslation, debugMode]);

  /**
   * Enhanced translation function that tries dynamic first, then static
   */
  const t = useCallback((key: string, options?: any): string => {
    try {
      // First try static i18n translation
      const staticTranslation = staticT(key, options);
      
      // If static translation is different from key (i.e., translation exists), use it
      if (typeof staticTranslation === 'string' && staticTranslation !== key) {
        return staticTranslation;
      }

      // If no static translation and dynamic is enabled, try to translate the key
      if (enableDynamic && state.isLibreTranslateAvailable) {
        // This is for cases where the key itself is user-generated content
        // that needs dynamic translation
        return key; // Return original for now, dynamic translation handled by DOM scanning
      }

      // Fallback to key itself
      return key;
      
    } catch (error) {
      console.warn(`⚠️ Translation failed for key: ${key}`, error);
      return key; // Always return something to prevent UI breaking
    }
  }, [staticT, enableDynamic, state.isLibreTranslateAvailable]);

  /**
   * Dynamic translation function for user-generated content
   */
  const dt = useCallback(async (text: string, sourceLanguage?: string): Promise<string> => {
    if (!enableDynamic || !state.isLibreTranslateAvailable) {
      return text; // Return original if dynamic translation is disabled or unavailable
    }

    try {
      const result = await translationManager.translateText(
        text, 
        sourceLanguage || 'en', 
        state.currentLanguage
      );
      
      return result.translatedText;
    } catch (error) {
      console.warn(`⚠️ Dynamic translation failed for: ${text}`, error);
      return text; // Fallback to original text
    }
  }, [enableDynamic, state.isLibreTranslateAvailable, state.currentLanguage]);

  /**
   * Get supported languages
   */
  const getSupportedLanguages = useCallback(() => {
    return SUPPORTED_LANGUAGES;
  }, []);

  /**
   * Get current language info
   */
  const getCurrentLanguageInfo = useCallback(() => {
    return SUPPORTED_LANGUAGES[state.currentLanguage];
  }, [state.currentLanguage]);

  /**
   * Check if a language is supported
   */
  const isLanguageSupported = useCallback((language: string): language is SupportedLanguage => {
    return Object.keys(SUPPORTED_LANGUAGES).includes(language);
  }, []);

  /**
   * Reset all translations
   */
  const resetTranslations = useCallback(() => {
    dynamicTranslation.resetTranslations();
    translationManager.clearCache();
    
    if (debugMode) {
      console.log('🔄 All translations reset');
    }
  }, [dynamicTranslation, debugMode]);

  /**
   * Get service status
   */
  const getServiceStatus = useCallback(async () => {
    return await getTranslationServiceStatus();
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (languageChangeTimeoutRef.current) {
        clearTimeout(languageChangeTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    state,
    currentLanguage: state.currentLanguage,
    isLoading: state.isLoading,
    isLibreTranslateAvailable: state.isLibreTranslateAvailable,
    error: state.error,
    
    // Translation functions
    t, // Static translation (i18n)
    dt, // Dynamic translation (LibreTranslate)
    
    // Language management
    changeLanguage,
    getSupportedLanguages,
    getCurrentLanguageInfo,
    isLanguageSupported,
    
    // Dynamic translation controls
    triggerDynamicTranslation: dynamicTranslation.triggerTranslation,
    resetTranslations,
    
    // Service status
    getServiceStatus,
    
    // Dynamic translation state
    dynamicTranslationState: dynamicTranslation.translationState,
    translatedCount: dynamicTranslation.translatedCount,
    failedCount: dynamicTranslation.failedCount
  };
};

export default useHybridTranslation;
