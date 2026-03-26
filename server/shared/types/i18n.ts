// types/i18n.ts

export type Locale = 'en' | 'hi' | 'es' | 'pt' | 'zh' | 'fr';

export type OTPMethod = 'email' | 'mobile';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  otpMethod: OTPMethod;
}

export interface TranslationKeys {
  common: {
    welcome: string;
    logout: string;
    submit: string;
    cancel: string;
    loading: string;
    // Add more keys as needed
  };
  errors: {
    invalidOTP: string;
    expiredOTP: string;
    maxAttemptsReached: string;
    networkError: string;
    // Add more keys as needed
  };
}

export type TranslationNamespace = keyof TranslationKeys;
export type TranslationKey<T extends TranslationNamespace> = keyof TranslationKeys[T];

export interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  isChangingLanguage: boolean;
}