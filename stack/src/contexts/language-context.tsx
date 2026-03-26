// contexts/language-context.tsx

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Locale, LanguageContextType } from '../shared/types/i18n';
import { defaultLocale, isValidLocale } from '../shared/lib/i18n';
import { getLocale, setLocaleCookie, setLocaleStorage } from '../shared/lib/cookies';
import i18n from '../lib/i18n';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize locale from Next.js router (URL) first, then storage/cookie
  useEffect(() => {
    let initialLocale: Locale = defaultLocale;

    const routerLocale = router.locale as string | undefined;
    if (routerLocale && isValidLocale(routerLocale)) {
      initialLocale = routerLocale as Locale;
    } else {
      const savedLocale = getLocale();
      if (isValidLocale(savedLocale)) {
        initialLocale = savedLocale;
      }
    }

    setLocaleState(initialLocale);
    // Sync with i18next
    i18n.changeLanguage(initialLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', initialLocale);
    }
    setMounted(true);
  }, [router.locale]);

  const setLocale = async (newLocale: Locale): Promise<void> => {
    if (!isValidLocale(newLocale)) {
      throw new Error(`Invalid locale: ${newLocale}`);
    }

    setIsChangingLanguage(true);

    try {
      // Update React state so components re-render
      setLocaleState(newLocale);
      // Persist in storage and cookie for future reloads / SSR
      setLocaleStorage(newLocale);
      setLocaleCookie(newLocale);
      // Sync i18next instance so useTranslation() picks the new language
      i18n.changeLanguage(newLocale);
      if (typeof window !== 'undefined') {
        localStorage.setItem('locale', newLocale);
      }
      // Keep Next.js locale-based routing in sync with current language
      if (router.locale !== newLocale) {
        router.replace(router.asPath, undefined, { locale: newLocale, shallow: true });
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    } finally {
      setIsChangingLanguage(false);
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        isChangingLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}