// lib/cookies.ts

import { Locale } from '../types/i18n';
import { defaultLocale } from './i18n';

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

export function getLocaleCookie(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  
  const cookies = document.cookie.split('; ');
  const localeCookie = cookies.find(c => c.startsWith(`${LOCALE_COOKIE_NAME}=`));
  
  if (localeCookie) {
    const locale = localeCookie.split('=')[1] as Locale;
    return locale;
  }
  
  return defaultLocale;
}

export function setLocaleCookie(locale: Locale): void {
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function deleteLocaleCookie(): void {
  document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0`;
}