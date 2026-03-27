// pages/test-dynamic-translation.tsx
// Test page for dynamic translation functionality

import React, { useState } from 'react';
import Mainlayout from '../layout/Mainlayout';
import { useDynamicTranslation, DynamicText } from '../hooks/useDynamicTranslation';
import { DynamicTranslationExample } from '../components/DynamicTranslationExample';
import { translateText, translateBatch, getCacheStats, clearTranslationCache } from '../utils/libretranslate';

const TestDynamicTranslation: React.FC = () => {
  const { t, tSync, translateText: hookTranslateText, hasKey, locale } = useDynamicTranslation('common');
  const [testText, setTestText] = useState('Hello, this is a test message for translation!');
  const [translationResult, setTranslationResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState({ size: 0, keys: [] as string[] });

  // Test direct API translation
  const testDirectTranslation = async () => {
    setIsLoading(true);
    try {
      const result = await translateText(testText, locale as any, 'en');
      setTranslationResult(result.success ? result.translatedText : `Error: ${result.error}`);
    } catch (error) {
      setTranslationResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test batch translation
  const testBatchTranslation = async () => {
    setIsLoading(true);
    try {
      const texts = [
        'Welcome to our platform',
        'How can we help you today?',
        'Thank you for using our service'
      ];
      const results = await translateBatch(texts, locale as any, 'en');
      setTranslationResult(
        results.map((r, i) => `${texts[i]} → ${r.translatedText}`).join('\n')
      );
    } catch (error) {
      setTranslationResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update cache stats
  const updateCacheStats = () => {
    setCacheStats(getCacheStats());
  };

  React.useEffect(() => {
    updateCacheStats();
  }, [translationResult]);

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dynamic Translation Test Suite
          </h1>
          <p className="text-gray-600">
            Test and verify the LibreTranslate integration with your existing i18n setup
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded border">
              <div className="text-sm text-gray-500">Current Language</div>
              <div className="text-lg font-bold text-gray-900">{locale.toUpperCase()}</div>
            </div>
            <div className="bg-white p-4 rounded border">
              <div className="text-sm text-gray-500">Static i18n Working</div>
              <div className={`text-lg font-bold ${hasKey('welcome') ? 'text-green-600' : 'text-red-600'}`}>
                {hasKey('welcome') ? '✓ Yes' : '✗ No'}
              </div>
            </div>
            <div className="bg-white p-4 rounded border">
              <div className="text-sm text-gray-500">Cache Size</div>
              <div className="text-lg font-bold text-gray-900">{cacheStats.size}</div>
            </div>
            <div className="bg-white p-4 rounded border">
              <div className="text-sm text-gray-500">Dynamic Enabled</div>
              <div className="text-lg font-bold text-green-600">✓ Yes</div>
            </div>
          </div>
        </div>

        {/* Static Translation Test */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Static Translation Test</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-mono text-sm">tSync('welcome')</span>
              <span className="text-green-600 font-medium">{tSync('welcome')}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-mono text-sm">tSync('home.askQuestion')</span>
              <span className="text-green-600 font-medium">{tSync('home.askQuestion')}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-mono text-sm">hasKey('welcome')</span>
              <span className={`font-medium ${hasKey('welcome') ? 'text-green-600' : 'text-red-600'}`}>
                {hasKey('welcome').toString()}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Translation Test */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Dynamic Translation Test</h2>
          
          {/* Test Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Text to Translate:
            </label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter text to translate..."
            />
          </div>

          {/* Test Buttons */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={testDirectTranslation}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Translating...' : 'Test Direct Translation'}
            </button>
            <button
              onClick={testBatchTranslation}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Translating...' : 'Test Batch Translation'}
            </button>
            <button
              onClick={updateCacheStats}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Update Cache Stats
            </button>
            <button
              onClick={clearTranslationCache}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Clear Cache
            </button>
          </div>

          {/* Translation Result */}
          {translationResult && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-blue-900 mb-2">Translation Result:</h3>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap">
                {translationResult}
              </pre>
            </div>
          )}
        </div>

        {/* DynamicText Component Test */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">DynamicText Component Test</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-700 mb-2">Basic Usage:</h3>
              <DynamicText 
                text="This text is dynamically translated using the DynamicText component"
                className="text-gray-900"
              />
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-700 mb-2">With Indicators:</h3>
              <DynamicText 
                text="This translation shows an indicator when translated"
                className="text-gray-900"
                options={{ showIndicators: true }}
              />
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-700 mb-2">As Heading:</h3>
              <DynamicText 
                text="Dynamic Heading Text"
                as="h4"
                className="text-lg font-semibold text-gray-900"
              />
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-700 mb-2">With Fallback:</h3>
              <DynamicText 
                text="This text will have a fallback if translation fails"
                className="text-gray-900"
                fallback="Fallback text if translation fails"
              />
            </div>
          </div>
        </div>

        {/* Hook Translation Test */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Hook Translation Test</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-700 mb-2">Hook translateText:</h3>
              <p className="text-gray-900">
                Result: <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                  [Use test buttons above to see result]
                </span>
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-700 mb-2">Missing Key Test:</h3>
              <p className="text-gray-900">
                This should fall back to dynamic translation:
              </p>
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <code className="text-sm">t('non.existent.key')</code> → 
                <span className="ml-2 text-yellow-800">
                  [Will attempt dynamic translation]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Example */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Comprehensive Example</h2>
          <DynamicTranslationExample />
        </div>

        {/* Cache Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Cache Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cache Size:</span>
              <span className="font-medium">{cacheStats.size} items</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cache Keys:</span>
              <span className="font-medium">{cacheStats.keys.length} keys</span>
            </div>
            {cacheStats.keys.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Cache Keys:</h4>
                <div className="max-h-32 overflow-y-auto bg-gray-50 p-3 rounded">
                  {cacheStats.keys.slice(-10).map((key, index) => (
                    <div key={index} className="text-xs font-mono text-gray-600 truncate">
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">How to Use This Test Page</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Change the language using the language switcher in the navigation</li>
            <li>Test static translations to verify i18n is working</li>
            <li>Test dynamic translations with custom text</li>
            <li>Observe how missing keys fall back to dynamic translation</li>
            <li>Monitor cache statistics and performance</li>
            <li>Check the comprehensive example for real-world usage</li>
          </ol>
        </div>
      </div>
    </Mainlayout>
  );
};

export default TestDynamicTranslation;
