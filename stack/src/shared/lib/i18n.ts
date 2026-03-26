// lib/i18n.ts

import { Locale, LocaleConfig } from '../types/i18n';

export const locales: Locale[] = ['en', 'hi', 'es', 'pt', 'zh', 'fr'];
export const defaultLocale: Locale = 'en';

export const localeConfigs: Record<Locale, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    otpMethod: 'mobile',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    otpMethod: 'mobile',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    otpMethod: 'mobile',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    otpMethod: 'mobile',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    otpMethod: 'mobile',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    otpMethod: 'email',
  },
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleConfig(locale: Locale): LocaleConfig {
  return localeConfigs[locale];
}

export function getOTPMethod(locale: Locale): 'email' | 'mobile' {
  return localeConfigs[locale].otpMethod;
}