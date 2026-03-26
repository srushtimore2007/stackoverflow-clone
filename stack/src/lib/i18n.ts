// i18next configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../shared/locales/en/common.json';
import enErrors from '../shared/locales/en/errors.json';
import hiCommon from '../shared/locales/hi/common.json';
import hiErrors from '../shared/locales/hi/errors.json';
import esCommon from '../shared/locales/es/common.json';
import esErrors from '../shared/locales/es/errors.json';
import ptCommon from '../shared/locales/pt/common.json';
import ptErrors from '../shared/locales/pt/errors.json';
import zhCommon from '../shared/locales/zh/common.json';
import zhErrors from '../shared/locales/zh/errors.json';
import frCommon from '../shared/locales/fr/common.json';
import frErrors from '../shared/locales/fr/errors.json';

const resources = {
  en: {
    common: enCommon,
    errors: enErrors,
  },
  hi: {
    common: hiCommon,
    errors: hiErrors,
  },
  es: {
    common: esCommon,
    errors: esErrors,
  },
  pt: {
    common: ptCommon,
    errors: ptErrors,
  },
  zh: {
    common: zhCommon,
    errors: zhErrors,
  },
  fr: {
    common: frCommon,
    errors: frErrors,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: typeof window !== 'undefined' ? localStorage.getItem('locale') || 'en' : 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'errors'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
  });

// Sync i18next language with localStorage changes
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'locale' && e.newValue) {
      i18n.changeLanguage(e.newValue);
    }
  });
}

export default i18n;
