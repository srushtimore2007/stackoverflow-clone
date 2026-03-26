'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Supported languages with their codes - LIMITED TO 6 LANGUAGES
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', code: 'en' },
  hi: { name: 'Hindi', code: 'hi' },
  es: { name: 'Spanish', code: 'es' },
  pt: { name: 'Portuguese', code: 'pt' },
  zh: { name: 'Chinese', code: 'zh' },
  fr: { name: 'French', code: 'fr' },
};

interface TranslationContextType {
  currentLanguage: string;
  translations: Record<string, any>;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  t: (key: string) => string;
  setLanguage: (languageCode: string) => void;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load translations for a specific language
  const loadTranslations = useCallback(async (languageCode: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/locales/${languageCode}.json`);
      if (response.ok) {
        const data = await response.json();
        setTranslations(data);
        // Save to localStorage
        localStorage.setItem('preferredLanguage', languageCode);
      } else {
        console.error(`Failed to load translations for ${languageCode}`);
        // Fallback to English
        if (languageCode !== 'en') {
          await loadTranslations('en');
        }
      }
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to English
      if (languageCode !== 'en') {
        await loadTranslations('en');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Translation function
  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  }, [translations]);

  // Set language function
  const setLanguage = useCallback((languageCode: string) => {
    if (SUPPORTED_LANGUAGES[languageCode as keyof typeof SUPPORTED_LANGUAGES]) {
      setCurrentLanguage(languageCode);
      loadTranslations(languageCode);
    } else {
      console.error('Unsupported language code:', languageCode);
    }
  }, [loadTranslations]);

  // Initialize language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const languageToLoad = savedLanguage && SUPPORTED_LANGUAGES[savedLanguage as keyof typeof SUPPORTED_LANGUAGES] 
      ? savedLanguage 
      : 'en';
    
    setCurrentLanguage(languageToLoad);
    loadTranslations(languageToLoad);
  }, [loadTranslations]);

  const value: TranslationContextType = {
    currentLanguage,
    translations,
    supportedLanguages: SUPPORTED_LANGUAGES,
    t,
    setLanguage,
    isLoading,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};
