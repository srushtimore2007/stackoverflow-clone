# Dynamic Translation Quick Start

## 🚀 Quick Setup

1. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your LibreTranslate settings
   ```

2. **Install Dependencies** (if needed)
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Test the System**
   - Visit: `http://localhost:3000/test-dynamic-translation`
   - Change language using the language switcher
   - Test various translation scenarios

## 📁 Files Created/Modified

### New Files
- `src/utils/libretranslate.ts` - LibreTranslate API integration
- `src/hooks/useDynamicTranslation.ts` - Enhanced translation hook
- `src/components/DynamicTranslationExample.tsx` - Usage examples
- `src/pages/test-dynamic-translation.tsx` - Test page
- `src/pages/index-enhanced.tsx` - Enhanced home page example
- `DYNAMIC_TRANSLATION.md` - Full documentation

### Modified Files
- `.env.example` - Added LibreTranslate configuration

## 🎯 Usage Examples

### Basic Hook Usage
```tsx
import { useDynamicTranslation } from '../hooks/useDynamicTranslation';

function MyComponent() {
  const { t, tSync, translateText } = useDynamicTranslation('common');
  
  // Static translation (existing behavior)
  const welcome = tSync('welcome');
  
  // Dynamic translation
  const dynamic = await translateText('Hello World');
  
  return <div>{welcome} - {dynamic}</div>;
}
```

### Dynamic Text Component
```tsx
import { DynamicText } from '../hooks/useDynamicTranslation';

<DynamicText 
  text="This will be translated dynamically"
  className="text-red-500"
  options={{ showIndicators: true }}
/>
```

### Batch Translation
```tsx
import { useDynamicContent } from '../components/DynamicTranslationExample';

const { translatedContent } = useDynamicContent(
  articles,
  ['title', 'description']
);
```

## 🌍 Supported Languages

- English (en) - Default
- Spanish (es)
- Hindi (hi)
- Portuguese (pt)
- Chinese (zh)
- French (fr)

## ⚡ Performance Features

- ✅ Automatic caching (30 min memory, 24h localStorage)
- ✅ Request deduplication
- ✅ Graceful fallback to original text
- ✅ Batch translation support
- ✅ Loading states and error handling

## 🔧 Configuration

Key environment variables:

```bash
NEXT_PUBLIC_LIBRETRANSLATE_URL=https://libretranslate.de/translate
NEXT_PUBLIC_ENABLE_DYNAMIC_TRANSLATION=true
NEXT_PUBLIC_SHOW_TRANSLATION_INDICATORS=false
```

## 🧪 Testing

The test page (`/test-dynamic-translation`) provides:
- Static translation verification
- Dynamic translation testing
- Cache statistics
- Performance monitoring
- Real-world examples

## 📚 Documentation

See `DYNAMIC_TRANSLATION.md` for comprehensive documentation including:
- Architecture overview
- API reference
- Migration guide
- Troubleshooting
- Security considerations

## 🚨 Important Notes

- **Static content first**: Always use static i18n for common UI text
- **API dependency**: Requires LibreTranslate service to be accessible
- **Privacy**: User content is sent to external translation service
- **Rate limits**: Monitor API usage to avoid limits

## 🔍 Verification Checklist

- [ ] Environment variables configured
- [ ] Static i18n translations working
- [ ] Dynamic translations working for missing keys
- [ ] Language switcher functions correctly
- [ ] Cache system working
- [ ] Error handling graceful
- [ ] Performance acceptable

## 🆘 Troubleshooting

1. **Translations not working**: Check browser console and network tab
2. **API errors**: Verify LibreTranslate URL is accessible
3. **Performance issues**: Enable caching and use batch translation
4. **Missing languages**: Check supported language configuration

For detailed troubleshooting, see the full documentation.
