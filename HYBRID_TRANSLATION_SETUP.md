# Hybrid Translation System Setup Guide

This guide explains how to set up and use the comprehensive hybrid translation system that combines static i18n translations with dynamic LibreTranslate API translations.

## 🏗️ System Architecture

### Static Translations (i18n)
- Uses `react-i18next` with JSON translation files
- Located in `src/shared/locales/{lang}/`
- Fast, reliable, works offline
- Best for UI strings, labels, static content

### Dynamic Translations (LibreTranslate)
- Uses LibreTranslate API for real-time translation
- Translates any text not in static files
- Perfect for user-generated content, API responses, dynamic data
- Includes intelligent caching to minimize API calls

## 🚀 Quick Setup

### 1. Backend Setup

#### Install Dependencies
```bash
cd server
npm install axios
```

#### Configure Environment
Add to your `.env` file:
```env
# LibreTranslate Configuration
LIBRETRANSLATE_URL=http://localhost:5001
LIBRETRANSLATE_API_KEY=your-api-key-optional
```

#### Start LibreTranslate (Optional)
If you want to use LibreTranslate locally:
```bash
# Using Docker
docker run -ti --rm -p 5001:5000 libretranslate/libretranslate

# Or install locally
pip install libretranslate
libretranslate --host 0.0.0.0 --port 5001
```

#### Start Backend Server
```bash
cd server
npm start
```

The translation endpoint will be available at: `http://localhost:5000/api/translate`

### 2. Frontend Setup

#### Ensure Dependencies
```bash
cd stack
npm install react-i18next i18next axios
```

#### Translation Files Structure
```
src/shared/locales/
├── en/
│   ├── common.json
│   └── errors.json
├── es/
│   ├── common.json
│   └── errors.json
├── hi/
│   ├── common.json
│   └── errors.json
├── pt/
│   ├── common.json
│   └── errors.json
├── zh/
│   ├── common.json
│   └── errors.json
└── fr/
│   ├── common.json
│   └── errors.json
```

## 📚 Usage Examples

### 1. Basic Component Usage

```tsx
import React from 'react';
import { useTranslationManager } from '../hooks/useTranslationManager';

const MyComponent = () => {
  const { t, dt, locale, isLoading } = useTranslationManager();

  return (
    <div>
      {/* Static translation */}
      <h1>{t('welcome')}</h1>
      
      {/* Dynamic translation */}
      <p>{dt('This is dynamic content from API')}</p>
      
      {/* Conditional rendering */}
      {isLoading && <div>Translating...</div>}
    </div>
  );
};
```

### 2. DOM Element Attributes

```tsx
const Example = () => {
  return (
    <div>
      {/* Static i18n key */}
      <span data-i18n-key="welcome">Welcome</span>
      
      {/* Dynamic text */}
      <span data-i18n-dynamic="This will be translated dynamically">
        This will be translated dynamically
      </span>
      
      {/* Input placeholder */}
      <input 
        data-i18n-placeholder="Enter your email"
        placeholder="Enter your email"
      />
      
      {/* Button text */}
      <button data-i18n-dynamic="Submit Form">
        Submit Form
      </button>
    </div>
  );
};
```

### 3. Language Switcher Integration

```tsx
import LanguageSwitcher from '../components/LanguageSwitcher';

const Layout = () => {
  return (
    <div>
      <header>
        <LanguageSwitcher />
      </header>
      <main>
        {/* Your content */}
      </main>
    </div>
  );
};
```

## 🔧 Advanced Features

### 1. Batch Translation

```tsx
const { translateBatch } = useTranslationManager();

const handleBatchTranslate = async () => {
  const texts = [
    'Hello world',
    'How are you?',
    'Good morning'
  ];
  
  const translated = await translateBatch(texts);
  console.log(translated); // ['Hola mundo', '¿Cómo estás?', 'Buenos días']
};
```

### 2. Cache Management

```tsx
const { clearCache } = useTranslationManager();

const clearTranslations = () => {
  clearCache(); // Clear all translation caches
};
```

### 3. Custom Translation Options

```tsx
const { dt } = useTranslationManager();

// Force dynamic translation even if static key exists
const translated = await dt('some.key', { forceDynamic: true });

// Synchronous translation (cached only)
const syncTranslated = dtSync('some text');
```

## 🎯 Best Practices

### 1. When to Use Static vs Dynamic

**Use Static (i18n) for:**
- UI labels and buttons
- Navigation menus
- Form labels
- Error messages
- Any text that's part of your application UI

**Use Dynamic (LibreTranslate) for:**
- User-generated content
- API responses
- Database content
- Real-time chat messages
- Any content that's not known at build time

### 2. Performance Optimization

- The system automatically caches translations
- Use `dtSync()` for synchronous access to cached translations
- Batch translate multiple texts when possible
- Avoid translating the same text repeatedly

### 3. Error Handling

The system includes comprehensive error handling:
- Falls back to original text if translation fails
- Logs errors for debugging
- Gracefully handles network issues
- Works offline with cached translations

## 🔍 Debugging

### 1. Check Translation Status

```tsx
const { locale, isLoading, hasKey } = useTranslationManager();

console.log('Current locale:', locale);
console.log('Is loading:', isLoading);
console.log('Key exists:', hasKey('welcome'));
```

### 2. Monitor API Calls

Check browser console for:
- Translation API requests
- Cache hits/misses
- Error messages

### 3. Test Different Languages

Use the LanguageSwitcher component to test:
- English (no verification required)
- French (email verification)
- Other languages (mobile verification)

## 🚨 Troubleshooting

### Common Issues

1. **Translations not appearing**
   - Check if LibreTranslate is running
   - Verify API endpoint is accessible
   - Check browser console for errors

2. **Language switcher not working**
   - Ensure LanguageProvider is wrapping your app
   - Check localStorage for language preferences

3. **Performance issues**
   - Check cache size
   - Use batch translation for multiple texts
   - Consider pre-translating common phrases

### API Endpoint Testing

Test the translation endpoint directly:

```bash
curl -X POST http://localhost:5000/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "sourceLanguage": "en",
    "targetLanguage": "es"
  }'
```

## 📁 File Structure

```
stack/src/
├── components/
│   ├── LanguageSwitcher.tsx          # Language switcher component
│   ├── TranslationExample.tsx         # Example implementation
│   └── LanguageVerificationModal.tsx # OTP verification modal
├── contexts/
│   └── language-context.tsx           # Language context provider
├── hooks/
│   ├── useTranslation.ts              # Base translation hook
│   ├── useTranslationManager.ts       # Enhanced translation manager
│   └── useDynamicI18n.ts             # Dynamic DOM scanning hook
├── lib/
│   ├── i18n.ts                       # i18next configuration
│   └── axiosinstance.ts              # Axios configuration
├── shared/
│   ├── lib/
│   │   ├── i18n.ts                   # Locale utilities
│   │   └── cookies.ts                # Cookie management
│   ├── locales/                      # Translation files
│   └── types/
│       └── i18n.ts                   # TypeScript types
└── utils/
    ├── translationUtils.ts            # Translation utilities
    ├── translationManager.ts         # Translation manager
    ├── libreTranslateIntegration.ts   # LibreTranslate integration
    ├── libretranslate.ts              # LibreTranslate client
    └── autoTranslator.ts             # Auto-translation utilities
```

## 🎉 Success Indicators

Your hybrid translation system is working correctly when:

✅ Static translations appear immediately on language change  
✅ Dynamic content is translated via API  
✅ Language switcher updates all content  
✅ DOM elements with data attributes are translated  
✅ Caching reduces API calls for repeated translations  
✅ Error handling provides graceful fallbacks  
✅ Performance remains smooth during translation  

## 📞 Support

For issues or questions:

1. Check the browser console for error messages
2. Verify the backend API is running and accessible
3. Test the translation endpoint directly
4. Review this documentation for configuration details

The system is designed to be robust and user-friendly, with comprehensive error handling and fallback mechanisms to ensure your application remains functional even if translation services are temporarily unavailable.
