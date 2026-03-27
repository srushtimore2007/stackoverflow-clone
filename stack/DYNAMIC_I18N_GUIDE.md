# Dynamic Translation System - Complete Implementation Guide

## 🎯 Overview

This system provides seamless integration between your existing `react-i18next` setup and LibreTranslate API for dynamic content translation. It automatically detects language changes, translates content, and updates DOM elements in real-time.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Hook    │───▶│  Language Mapping  │───▶│ LibreTranslate    │
│ useDynamicI18n │    │  Locale → Code   │    │ API Integration   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                           │                   │
         ▼                           ▼                   ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Static i18n   │    │   DOM Scanner    │    │  Cache System   │
│ (JSON files)   │    │ data-i18n-*    │    │ Memory + Local  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Files Created

### Core System
- **`src/utils/libreTranslateIntegration.ts`** - LibreTranslate API integration with caching
- **`src/hooks/useDynamicI18n.ts`** - React hook for automatic DOM translation
- **`src/pages/dynamic-translation-demo.tsx`** - Complete working example

### Language Mapping
```typescript
export const LIBRETRANSLATE_LANGUAGE_MAP: Record<Locale, string> = {
  en: 'en',    // English (default)
  es: 'es',    // Spanish
  hi: 'hi',    // Hindi
  pt: 'pt',    // Portuguese
  zh: 'zh',    // Chinese (Simplified)
  fr: 'fr',    // French
} as const;
```

## 🚀 Quick Start

### 1. Basic Usage in Components

```tsx
import { useDynamicI18n } from '../hooks/useDynamicI18n';

function MyComponent() {
  const { 
    t,                    // Static translation (existing i18n)
    dt,                   // Dynamic translation (LibreTranslate)
    currentLanguage,        // Current language code
    isTranslating          // Loading state
  } = useDynamicI18n({ namespace: 'common' });

  return (
    <div>
      {/* Static i18n content */}
      <h1>{t('welcome')}</h1>
      
      {/* Dynamic content */}
      <p data-i18n-dynamic="This text will be translated automatically">
        This text will be translated automatically
      </p>
      
      {/* Manual dynamic translation */}
      <button onClick={() => dt('Translate me')}>
        {dtSync('Translate me')}
      </button>
    </div>
  );
}
```

### 2. HTML Attributes for Automatic Translation

```html
<!-- Direct text translation -->
<h1 data-i18n-dynamic="Welcome to our platform">Welcome to our platform</h1>

<!-- i18n key with fallback to dynamic -->
<p data-i18n-key="welcome.message">Hello there!</p>

<!-- Placeholder translation -->
<input data-i18n-placeholder="Enter your email" />

<!-- All elements are automatically scanned and translated when language changes -->
```

### 3. Language Detection and Mapping

The system automatically:
- Detects current language from `i18n.language`
- Maps your `Locale` type to LibreTranslate language codes
- Uses English as default source language
- Falls back gracefully if API fails

## 🔧 Advanced Usage

### Manual Element Translation

```tsx
const { translateElement } = useDynamicI18n();

const handleTranslate = async () => {
  const element = document.getElementById('my-element');
  if (element) {
    await translateElement(element);
  }
};
```

### Batch Translation

```tsx
const { translateAll } = useDynamicI18n();

const handleTranslateAll = async () => {
  await translateAll(); // Scans and translates all elements
};
```

### Cache Management

```tsx
const { clearCache } = useDynamicI18n();

const handleClearCache = () => {
  clearCache(); // Clears both memory and localStorage cache
};
```

## 🎨 Component Examples

### Static + Dynamic Mixed Content

```tsx
function ProductCard({ product }) {
  const { t, dt } = useDynamicI18n();

  return (
    <div className="card">
      {/* Static title from i18n */}
      <h2>{t('product.title')}</h2>
      
      {/* Dynamic description from API */}
      <p data-i18n-dynamic={product.description}>
        {product.description}
      </p>
      
      {/* Mixed content */}
      <button>
        <span data-i18n-dynamic="Add to Cart">Add to Cart</span>
        <span className="price">{product.price}</span>
      </button>
    </div>
  );
}
```

### Form with Dynamic Placeholders

```tsx
function ContactForm() {
  const { t, dt } = useDynamicI18n();

  return (
    <form>
      <label data-i18n-dynamic="Full Name">Full Name</label>
      <input 
        type="text"
        data-i18n-placeholder="Enter your full name"
      />
      
      <label data-i18n-dynamic="Email Address">Email Address</label>
      <input 
        type="email"
        data-i18n-placeholder="Enter your email address"
      />
      
      <button type="submit" data-i18n-dynamic="Send Message">
        Send Message
      </button>
    </form>
  );
}
```

## 🌐 Language Support

| Language | i18n Code | LibreTranslate Code | Status |
|----------|-------------|-------------------|--------|
| English | `en` | `en` | Default (no translation) |
| Spanish | `es` | `es` | ✅ Supported |
| Hindi | `hi` | `hi` | ✅ Supported |
| Portuguese | `pt` | `pt` | ✅ Supported |
| Chinese | `zh` | `zh` | ✅ Supported |
| French | `fr` | `fr` | ✅ Supported |

## ⚡ Performance Features

### Caching System
- **Memory Cache**: 30 minutes TTL for frequently accessed translations
- **LocalStorage Cache**: 24 hours TTL for persistent storage
- **Request Deduplication**: Prevents duplicate API calls
- **Intelligent Invalidation**: Clears cache when language changes

### Optimization Strategies
```tsx
// Enable caching (default: true)
const { dt } = useDynamicI18n({ 
  namespace: 'common',
  autoScan: true,
  preserveOriginal: true 
});

// Force refresh translation
const translated = await dt('Hello', { forceRefresh: true });
```

## 🛡️ Error Handling

### Graceful Fallbacks
1. **API Unavailable**: Returns original text
2. **Network Error**: Uses cached translation or original text
3. **Unsupported Language**: Falls back to English
4. **Invalid Response**: Logs error and returns original text

### Debug Mode
```typescript
// Enable console logging
const { dt } = useDynamicI18n({ 
  namespace: 'common',
  autoScan: true 
});

// Check browser console for:
// - Translation requests
// - Cache hits/misses
// - API errors
// - Performance metrics
```

## 🔄 Integration with Existing System

### Preserves Existing Functionality
- ✅ **Language Switcher**: Your existing dropdown works unchanged
- ✅ **OTP Verification**: French email OTP, other languages mobile OTP preserved
- ✅ **Static i18n**: All existing JSON translations continue to work
- ✅ **Routing**: Next.js i18n routing maintained

### No Breaking Changes
- Existing `useTranslation` hooks continue to work
- Static `t('key')` calls unchanged
- Language context and providers preserved
- All existing components work without modification

## 🧪 Testing

### Demo Page
Visit `/dynamic-translation-demo` to see:
- Static i18n translations
- Dynamic content translation
- Real-time language switching
- DOM element scanning
- Cache performance
- Error handling

### Manual Testing Steps
1. **Open demo page**
2. **Change language** using existing dropdown
3. **Observe**: All content updates automatically
4. **Test**: Add dynamic content, translate manually
5. **Verify**: Both static and dynamic content work

## 📋 Implementation Checklist

### For Developers Adding New Content

#### Static Content (Recommended for UI text)
```tsx
// Add to JSON files
// src/shared/locales/en/common.json: { "new.key": "New text" }
// src/shared/locales/es/common.json: { "new.key": "Texto nuevo" }

// Use in components
const { t } = useDynamicI18n();
<h1>{t('new.key')}</h1>
```

#### Dynamic Content (For user-generated content)
```tsx
// Add data-i18n-dynamic attribute
<p data-i18n-dynamic="User generated content">User generated content</p>

// Or use dt() function
const { dt } = useDynamicI18n();
const translated = await dt('Dynamic text');
```

### Performance Optimization
- [ ] Use static i18n for frequent UI text
- [ ] Use dynamic translation for user-generated content
- [ ] Enable caching for better performance
- [ ] Batch translate multiple texts when possible
- [ ] Handle loading states appropriately

## 🔍 Troubleshooting

### Common Issues

#### Translations Not Working
1. **Check browser console** for API errors
2. **Verify backend endpoint** `/api/translate` is accessible
3. **Check language mapping** in `LIBRETRANSLATE_LANGUAGE_MAP`
4. **Ensure attributes** are correctly applied to elements

#### Performance Issues
1. **Clear cache** if translations seem stale
2. **Check network tab** for excessive API calls
3. **Enable auto-scan** only for dynamic content pages
4. **Use batch translation** for multiple texts

#### TypeScript Errors
1. **Check imports** are correct paths
2. **Verify language types** match your Locale type
3. **Ensure async/await** is used for dynamic translations

## 🚀 Production Deployment

### Environment Variables
```bash
# Backend API endpoint
NEXT_PUBLIC_LIBRETRANSLATE_URL=https://your-libretranslate-instance.com/translate

# Optional: API key for private instance
NEXT_PUBLIC_LIBRETRANSLATE_API_KEY=your-api-key

# Performance settings
NEXT_PUBLIC_TRANSLATION_CACHE_TTL=1800000  # 30 minutes
NEXT_PUBLIC_TRANSLATION_BATCH_SIZE=10
```

### Monitoring
- **API Response Times**: Monitor LibreTranslate API performance
- **Cache Hit Rates**: Ensure caching is effective
- **Error Rates**: Track translation failures
- **Language Switch Frequency**: User behavior analytics

## 📚 API Reference

### useDynamicI18n Hook

```typescript
interface UseDynamicI18nResult {
  t: (key: string, params?: Record<string, any>) => string;
  dt: (text: string, options?: { forceRefresh?: boolean }) => Promise<string>;
  dtSync: (text: string) => string;
  currentLanguage: string;
  isTranslating: boolean;
  translateElement: (element: HTMLElement) => Promise<void>;
  translateAll: () => Promise<void>;
  clearCache: () => void;
  hasStaticTranslation: (key: string) => boolean;
}
```

### LibreTranslate Integration

```typescript
interface LibreTranslateResponse {
  translatedText: string;
  success: boolean;
  error?: string;
}

// Direct API usage
import { translateText, translateBatch } from '../utils/libreTranslateIntegration';

const result = await translateText('Hello World', { targetLanguage: 'es' });
const results = await translateBatch(['Hello', 'World'], { targetLanguage: 'es' });
```

## 🎉 Success Criteria

Your implementation is successful when:

- ✅ **Static i18n works**: All existing `t('key') calls function
- ✅ **Dynamic translation works**: `data-i18n-dynamic` elements are translated
- ✅ **Language switching works**: Content updates when dropdown changes
- ✅ **Performance is good**: Caching prevents redundant API calls
- ✅ **Error handling works**: Graceful fallbacks when API fails
- ✅ **No breaking changes**: Existing functionality preserved
- ✅ **TypeScript safe**: All types are properly defined

## 🔄 Future Enhancements

- **Auto-detect source language** for mixed-language content
- **Translation quality scoring** for better user experience
- **Offline translation mode** using cached translations only
- **Real-time collaboration translation** for multi-user editing
- **Custom translation models** integration support
