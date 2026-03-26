// lib/cookies.ts

import { Locale } from '../types/i18n';
import { defaultLocale, isValidLocale } from './i18n';

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
export const LOCALE_STORAGE_KEY = 'app_locale';

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

export function getLocaleFromStorage(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isValidLocale(stored)) return stored as Locale;
  } catch (_) {}
  return defaultLocale;
}

export function getLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  const fromStorage = getLocaleFromStorage();
  if (fromStorage !== defaultLocale) return fromStorage;
  const fromCookie = getLocaleCookie();
  return isValidLocale(fromCookie) ? fromCookie : defaultLocale;
}

export function setLocaleCookie(locale: Locale): void {
  if (typeof document === 'undefined') return;
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function setLocaleStorage(locale: Locale): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (_) {}
}

export function deleteLocaleCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0`;
}