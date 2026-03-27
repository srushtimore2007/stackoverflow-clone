# Dynamic Translation System Documentation

## Overview

This enhanced translation system combines your existing `react-i18next` setup with LibreTranslate API to provide dynamic translation for content that doesn't have static translations. The system automatically falls back to API translation when i18n keys are missing, ensuring comprehensive multilingual support.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Component │───▶│ useDynamicTranslation │───▶│ i18next (static) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                           │
                                ▼                           ▼
                        ┌──────────────────┐    ┌─────────────────┐
                        │  Key not found?  │───▶│ LibreTranslate  │
                        └──────────────────┘    └─────────────────┘
                                │                           │
                                ▼                           ▼
                        ┌──────────────────┐    ┌─────────────────┐
                        │   Return key     │    │  Return translation│
                        └──────────────────┘    └─────────────────┘
```

## Features

- **Seamless Integration**: Works with existing i18n setup without breaking changes
- **Automatic Fallback**: Uses LibreTranslate when static translations are missing
- **Performance Optimized**: Caching system prevents redundant API calls
- **Graceful Degradation**: Falls back to original text if API fails
- **6 Language Support**: English, Spanish, Hindi, Portuguese, Chinese, French
- **React Hooks**: Easy-to-use hooks for components
- **Batch Translation**: Efficiently translate multiple texts

## Setup

### 1. Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
# LibreTranslate API URL
NEXT_PUBLIC_LIBRETRANSLATE_URL=https://libretranslate.de/translate

# Optional: API Key for private instance
# NEXT_PUBLIC_LIBRETRANSLATE_API_KEY=your_api_key_here

# Enable/disable dynamic translation
NEXT_PUBLIC_ENABLE_DYNAMIC_TRANSLATION=true

# Show translation indicators (🌐)
NEXT_PUBLIC_SHOW_TRANSLATION_INDICATORS=false
```

### 2. Supported Languages

The system supports these languages:
- **English (en)** - Default language
- **Spanish (es)**
- **Hindi (hi)**
- **Portuguese (pt)**
- **Chinese (zh)**
- **French (fr)**

## Usage

### Basic Usage with Hook

```tsx
import { useDynamicTranslation } from '../hooks/useDynamicTranslation';

function MyComponent() {
  const { t, tSync, translateText, hasKey } = useDynamicTranslation('common');

  // Static translation (existing behavior)
  const staticText = tSync('welcome'); // Uses i18n

  // Dynamic translation with fallback
  const dynamicText = await t('some.missing.key'); // Uses LibreTranslate if key not found

  // Direct text translation
  const translated = await translateText('Hello World');

  // Check if key exists
  const hasTranslation = hasKey('welcome');

  return (
    <div>
      <h1>{staticText}</h1>
      <p>{dynamicText}</p>
      <p>{translated}</p>
    </div>
  );
}
```

### Dynamic Text Component

```tsx
import { DynamicText } from '../hooks/useDynamicTranslation';

function ProductCard({ title, description }) {
  return (
    <div>
      <h3>
        <DynamicText 
          text={title}
          as="h3"
          className="text-lg font-semibold"
          options={{ showIndicators: true }}
        />
      </h3>
      <p>
        <DynamicText 
          text={description}
          fallback="Description unavailable"
        />
      </p>
    </div>
  );
}
```

### Batch Translation with Hook

```tsx
import { useDynamicContent } from '../components/DynamicTranslationExample';

function ArticleList({ articles }) {
  const { translatedContent, isTranslating } = useDynamicContent(
    articles,
    ['title', 'description'] // Fields to translate
  );

  if (isTranslating) return <div>Loading translations...</div>;

  return (
    <div>
      {translatedContent.map(article => (
        <article key={article.id}>
          <h2>{article.title}</h2>
          <p>{article.description}</p>
        </article>
      ))}
    </div>
  );
}
```

## API Reference

### useDynamicTranslation Hook

```tsx
const {
  t,              // Async translation function with dynamic fallback
  tSync,          // Sync translation function (static only)
  locale,         // Current locale
  hasKey,         // Check if i18n key exists
  translateText,  // Direct text translation
  isDynamicLoading // Loading state
} = useDynamicTranslation(namespace?: string, options?: DynamicTranslationOptions);
```

### DynamicTranslationOptions

```tsx
interface DynamicTranslationOptions {
  enableDynamic?: boolean;     // Enable dynamic translation
  sourceLang?: SupportedLanguage; // Source language (default: 'en')
  cacheDynamic?: boolean;      // Cache dynamic translations
  showIndicators?: boolean;    // Show 🌐 indicators
}
```

### DynamicText Component

```tsx
interface DynamicTextProps {
  text: string;                    // Text to translate
  as?: keyof React.JSX.IntrinsicElements; // HTML element (default: 'span')
  className?: string;              // CSS classes
  options?: DynamicTranslationOptions; // Translation options
  fallback?: string;               // Fallback text
}
```

### LibreTranslate API

```tsx
import { translateText, translateBatch } from '../utils/libretranslate';

// Single translation
const result = await translateText('Hello', 'es', 'en');

// Batch translation
const results = await translateBatch(['Hello', 'World'], 'es', 'en');
```

## Performance Optimization

### Caching Strategy

1. **Memory Cache**: In-memory cache for API responses (30 minutes TTL)
2. **LocalStorage Cache**: Persistent cache for dynamic translations (24 hours TTL)
3. **Request Deduplication**: Prevents duplicate API calls

### Best Practices

1. **Use Static Translations First**: Always prefer static i18n translations for common UI text
2. **Batch Dynamic Content**: Use `useDynamicContent` for lists of items
3. **Cache Wisely**: Enable caching for frequently translated content
4. **Handle Loading States**: Show loading indicators during translation
5. **Test All Languages**: Verify translations work across all supported languages

## Migration Guide

### From Static Translation Only

**Before:**
```tsx
const { t } = useTranslation('common');
const text = t('welcome');
```

**After:**
```tsx
const { tSync, t } = useDynamicTranslation('common');

// Static content (unchanged)
const staticText = tSync('welcome');

// Dynamic content (new capability)
const dynamicText = await t('dynamic.content.key');
```

### Updating Existing Components

1. Replace `useTranslation` with `useDynamicTranslation`
2. Use `tSync` for existing static translations
3. Add `DynamicText` components for user-generated content
4. Implement `useDynamicContent` for lists of dynamic items

## Error Handling

The system provides graceful fallback:

1. **API Unavailable**: Returns original text
2. **Unsupported Language**: Returns original text
3. **Translation Fails**: Returns original text
4. **Network Error**: Returns cached translation or original text

## Debugging

Enable debug mode in `.env.local`:

```bash
NEXT_PUBLIC_TRANSLATION_DEBUG=true
```

This will log:
- Translation requests
- Cache hits/misses
- API errors
- Performance metrics

## Security Considerations

1. **API Keys**: Store LibreTranslate API keys in environment variables
2. **Content Filtering**: Consider implementing content filters for user-generated text
3. **Rate Limiting**: Monitor API usage to avoid rate limits
4. **Privacy**: Be aware that content is sent to external translation service

## Examples

See these files for complete examples:
- `src/components/DynamicTranslationExample.tsx` - Comprehensive examples
- `src/pages/index-enhanced.tsx` - Enhanced home page
- `src/hooks/useDynamicTranslation.ts` - Hook implementation

## Troubleshooting

### Common Issues

1. **Translations Not Working**
   - Check environment variables
   - Verify LibreTranslate URL is accessible
   - Check browser console for errors

2. **Performance Issues**
   - Enable caching
   - Use batch translation for multiple items
   - Monitor API call frequency

3. **Language Not Supported**
   - Verify language code in `SUPPORTED_LANGUAGES`
   - Check LibreTranslate language support

4. **Cache Issues**
   - Clear localStorage: `localStorage.clear()`
   - Restart development server

### Getting Help

1. Check browser console for error messages
2. Verify network requests to LibreTranslate API
3. Test with different languages
4. Review environment configuration

## Future Enhancements

- **Auto-detect Language**: Automatically detect source language
- **Translation Quality**: Add confidence scoring
- **Custom Models**: Support for custom translation models
- **Offline Mode**: Cache-based offline translation
- **Real-time Translation**: WebSocket-based live translation
