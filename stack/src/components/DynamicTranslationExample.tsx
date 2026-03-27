// components/DynamicTranslationExample.tsx
// Example component demonstrating dynamic translation usage

import React, { useState, useEffect } from 'react';
import { useDynamicTranslation, DynamicText } from '../hooks/useDynamicTranslation';

interface ExampleContent {
  id: string;
  title: string;
  description: string;
  category: string;
}

/**
 * Example component showing how to use dynamic translation
 * This demonstrates both static i18n content and dynamic content translation
 */
export function DynamicTranslationExample() {
  const { t, tSync, translateText, hasKey, locale } = useDynamicTranslation('common');
  
  // Sample dynamic content that might come from an API
  const [dynamicContent, setDynamicContent] = useState<ExampleContent[]>([
    {
      id: '1',
      title: 'Getting Started with React',
      description: 'Learn the fundamentals of React including components, props, and state management.',
      category: 'Programming'
    },
    {
      id: '2', 
      title: 'Advanced TypeScript Techniques',
      description: 'Master advanced TypeScript patterns for better type safety and code quality.',
      category: 'Development'
    },
    {
      id: '3',
      title: 'Building Scalable Applications',
      description: 'Best practices for designing and implementing scalable web applications.',
      category: 'Architecture'
    }
  ]);

  const [translatedContent, setTranslatedContent] = useState<ExampleContent[]>([]);

  // Example of batch translation for dynamic content
  useEffect(() => {
    const translateContent = async () => {
      if (locale === 'en') {
        setTranslatedContent(dynamicContent);
        return;
      }

      const translated = await Promise.all(
        dynamicContent.map(async (item) => {
          const [translatedTitle, translatedDescription, translatedCategory] = await Promise.all([
            translateText(item.title),
            translateText(item.description),
            translateText(item.category)
          ]);

          return {
            ...item,
            title: translatedTitle,
            description: translatedDescription,
            category: translatedCategory
          };
        })
      );

      setTranslatedContent(translated);
    };

    translateContent();
  }, [dynamicContent, locale, translateText]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Static Content Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {tSync('welcome')} {/* Static i18n translation */}
        </h2>
        <p className="text-gray-600">
          {tSync('home.topQuestions')} {/* Static i18n translation */}
        </p>
      </section>

      {/* Dynamic Content Examples */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Dynamic Content Translation
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Current language: <strong>{locale.toUpperCase()}</strong>
          </p>
          <p className="text-sm text-blue-800">
            Content below is dynamically translated using LibreTranslate API
          </p>
        </div>

        {/* Individual Dynamic Text Example */}
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-gray-700">Individual Text Translation</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded p-4">
              <p className="text-sm text-gray-500 mb-2">Direct translation:</p>
              <DynamicText 
                text="This text is translated dynamically"
                className="text-gray-900 font-medium"
                options={{ showIndicators: true }}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded p-4">
              <p className="text-sm text-gray-500 mb-2">With fallback:</p>
              <DynamicText 
                text="Complex technical content that might not translate perfectly"
                className="text-gray-900"
                fallback="Content translation unavailable"
              />
            </div>
          </div>
        </div>

        {/* Batch Translated Content */}
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-gray-700">Batch Translated Articles</h4>
          <div className="space-y-4">
            {translatedContent.map((item) => (
              <article key={item.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <h5 className="text-lg font-semibold text-gray-900">
                    {item.title}
                  </h5>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {item.category}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
                <div className="mt-4 flex items-center space-x-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Read More
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 text-sm">
                    Save for Later
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Mixed Static and Dynamic Example */}
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-gray-700">Mixed Content Example</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h5 className="text-lg font-semibold text-gray-900 mb-3">
              {tSync('home.askQuestion')} {/* Static */}
            </h5>
            <p className="text-gray-600 mb-4">
              <DynamicText 
                text="Ask questions and get answers from the community. Dynamic content helps reach a global audience."
                className="inline"
              />
            </p>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                {tSync('home.askQuestion')} {/* Static */}
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                <DynamicText 
                  text="Browse Questions"
                  className="inline"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Translation Status */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-700 mb-3">Translation Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Static translation available:</span>
              <span className={hasKey('welcome') ? 'text-green-600' : 'text-red-600'}>
                {hasKey('welcome') ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dynamic translation enabled:</span>
              <span className="text-green-600">Yes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current locale:</span>
              <span className="text-gray-900 font-medium">{locale}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Hook for managing dynamic content with automatic translation
 */
export function useDynamicContent<T extends Record<string, any>>(
  content: T[],
  textFields: (keyof T)[]
) {
  const { translateText, locale } = useDynamicTranslation('common');
  const [translatedContent, setTranslatedContent] = useState<T[]>(content);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateAll = async () => {
      if (locale === 'en') {
        setTranslatedContent(content);
        return;
      }

      setIsTranslating(true);
      
      try {
        const translated = await Promise.all(
          content.map(async (item) => {
            const translatedItem = { ...item };
            
            for (const field of textFields) {
              const fieldValue = item[field];
              if (typeof fieldValue === 'string') {
                translatedItem[field] = await translateText(fieldValue) as any;
              }
            }
            
            return translatedItem;
          })
        );

        setTranslatedContent(translated);
      } catch (error) {
        console.error('Failed to translate content:', error);
        setTranslatedContent(content);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();
  }, [content, locale, textFields, translateText]);

  return { translatedContent, isTranslating };
}
