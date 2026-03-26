// hooks/useTranslation.ts

import { useLanguage } from '../contexts/language-context';
import { TranslationNamespace } from '../shared/types/i18n';
import i18n from '../lib/i18n';

type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

export function useTranslation(namespace: TranslationNamespace = 'common'): {
  t: TranslationFunction;
  locale: string;
} {
  const { locale } = useLanguage();

  const t: TranslationFunction = (key: string, params?: Record<string, string | number>) => {
    try {
      // Use i18next for translation
      const fullKey = `${namespace}:${key}`;
      const value = i18n.t(fullKey, params || {});
      
      // If translation not found, i18next returns the key
      if (value === fullKey) {
        console.warn(`Translation not found: ${namespace}.${key} for locale ${locale}`);
        return key;
      }

      return value;
    } catch (error) {
      console.error(`Error loading translation: ${namespace}.${key}`, error);
      return key;
    }
  };

  return { t, locale };
}