import path from 'path';

const nextI18NextConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'es', 'pt', 'zh', 'fr'],
  },
  localePath: path.resolve('./shared/locales'), // <- points to your folder
};

export default nextI18NextConfig;
