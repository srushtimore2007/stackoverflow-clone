// app/test-translations/page.tsx
'use client';

import { useState } from 'react';
import { Locale } from '../../shared/types/i18n';
import { locales } from '../../shared/lib/i18n';

import enCommon from '@/shared/locales/en/common.json';
import enErrors from '@/shared/locales/en/errors.json';
import hiCommon from '@/shared/locales/hi/common.json';
import hiErrors from '@/shared/locales/hi/errors.json';
import esCommon from '@/shared/locales/es/common.json';
import esErrors from '@/shared/locales/es/errors.json';
import ptCommon from '@/shared/locales/pt/common.json';
import ptErrors from '@/shared/locales/pt/errors.json';
import zhCommon from '@/shared/locales/zh/common.json';
import zhErrors from '@/shared/locales/zh/errors.json';
import frCommon from '@/shared/locales/fr/common.json';
import frErrors from '@/shared/locales/fr/errors.json';


const translationsMap: Record<Locale, { common: any; errors: any }> = {
  en: { common: enCommon, errors: enErrors },
  hi: { common: hiCommon, errors: hiErrors },
  es: { common: esCommon, errors: esErrors },
  pt: { common: ptCommon, errors: ptErrors },
  zh: { common: zhCommon, errors: zhErrors },
  fr: { common: frCommon, errors: frErrors },
};


export default function TestTranslations() {
  const [locale, setLocale] = useState<Locale>('en');
  const [translations, setTranslations] = useState<any>({});

 const loadTranslations = (lang: Locale) => {
  const translation = translationsMap[lang];
  if (!translation) {
    console.error(`Translations for ${lang} not found`);
    return;
  }
  setTranslations(translation);
  setLocale(lang);
};


  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Translation Tester</h1>
      <div className="flex gap-2 mb-4">
        {locales.map(lang => (
          <button
            key={lang}
            onClick={() => loadTranslations(lang)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(translations, null, 2)}
      </pre>
    </div>
  );
}