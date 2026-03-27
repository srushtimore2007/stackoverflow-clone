// components/DynamicTranslationDemo.tsx
// Comprehensive demo showing how to apply dynamic translations to actual page content

import React, { useState, useEffect, useRef } from 'react';
import { useTranslationManager } from '../hooks/useTranslationManager';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface DynamicContent {
  id: number;
  title: string;
  description: string;
  category: string;
  author: string;
  timestamp: string;
}

/**
 * Dynamic Translation Demo Component
 * 
 * This component demonstrates:
 * 1. Static i18n translations (existing behavior)
 * 2. Dynamic content translation via LibreTranslate
 * 3. DOM manipulation for real-time updates
 * 4. Language switching with immediate content updates
 */
export function DynamicTranslationDemo() {
  const { 
    t,                    // Static translation
    dt,                   // Dynamic translation (async)
    dtSync,               // Dynamic translation (sync, cached)
    translateBatch,        // Batch translation
    locale,               // Current locale
    isLoading,            // Loading state
    hasKey,               // Check if static key exists
    updateElementText,     // Update DOM element
    updateElements         // Update multiple elements
  } = useTranslationManager({ 
    namespace: 'common',
    autoUpdate: true,
    cacheTranslations: true 
  });

  // Sample dynamic content (could come from API)
  const [dynamicContent, setDynamicContent] = useState<DynamicContent[]>([
    {
      id: 1,
      title: "Getting Started with React Hooks",
      description: "Learn how to use React Hooks to manage state and side effects in functional components.",
      category: "Tutorial",
      author: "John Doe",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      title: "Advanced TypeScript Patterns",
      description: "Explore advanced TypeScript patterns for building type-safe applications.",
      category: "Advanced",
      author: "Jane Smith",
      timestamp: "5 hours ago"
    },
    {
      id: 3,
      title: "Building Responsive Layouts",
      description: "Master CSS Grid and Flexbox to create responsive web layouts.",
      category: "CSS",
      author: "Mike Johnson",
      timestamp: "1 day ago"
    }
  ]);

  const [translatedContent, setTranslatedContent] = useState<DynamicContent[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  // Refs for DOM elements we want to update
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Translate dynamic content when language changes
  useEffect(() => {
    const translateContent = async () => {
      setIsTranslating(true);
      
      try {
        const translated = await Promise.all(
          dynamicContent.map(async (item) => {
            const [translatedTitle, translatedDescription, translatedCategory] = await Promise.all([
              dt(item.title),
              dt(item.description),
              dt(item.category)
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
      } catch (error) {
        console.error('Failed to translate content:', error);
        setTranslatedContent(dynamicContent);
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [dynamicContent, locale, dt]);

  // Update specific DOM elements when language changes
  useEffect(() => {
    const updateDOMElements = async () => {
      try {
        // Update heading
        if (titleRef.current) {
          const translatedTitle = await dt("Dynamic Translation Demo");
          updateElementText(titleRef.current, translatedTitle);
        }

        // Update description
        if (descriptionRef.current) {
          const translatedDesc = await dt("This demo shows how dynamic content is automatically translated when you switch languages.");
          updateElementText(descriptionRef.current, translatedDesc);
        }

        // Update button
        if (buttonRef.current) {
          const translatedButton = await dt("Translate All Content");
          updateElementText(buttonRef.current, translatedButton);
        }

        // Update input placeholder
        if (inputRef.current) {
          const translatedPlaceholder = await dt("Enter text to translate...");
          inputRef.current.placeholder = translatedPlaceholder;
        }
      } catch (error) {
        console.error('Failed to update DOM elements:', error);
      }
    };

    updateDOMElements();
  }, [locale, dt, updateElementText]);

  // Handle manual translation of user input
  const handleTranslateInput = async () => {
    if (!inputRef.current?.value) return;

    try {
      const translated = await dt(inputRef.current.value);
      alert(`Translated: ${translated}`);
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  // Add new dynamic content
  const handleAddContent = () => {
    const newContent: DynamicContent = {
      id: Date.now(),
      title: "New Dynamic Content",
      description: "This content was added dynamically and will be translated automatically.",
      category: "New",
      author: "System",
      timestamp: "Just now"
    };

    setDynamicContent(prev => [...prev, newContent]);
  };

  // Use batch translation
  const handleBatchTranslate = async () => {
    try {
      const texts = ["Hello", "World", "Welcome", "Goodbye"];
      const translated = await translateBatch(texts);
      console.log('Batch translation result:', translated);
    } catch (error) {
      console.error('Batch translation failed:', error);
    }
  };

  const displayContent = translatedContent.length > 0 ? translatedContent : dynamicContent;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header with DOM-managed content */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <h1 
            ref={titleRef}
            className="text-3xl font-bold text-blue-900"
            data-translate="Dynamic Translation Demo"
          >
            Dynamic Translation Demo
          </h1>
          <p 
            ref={descriptionRef}
            className="text-blue-700 mt-2"
            data-translate="This demo shows how dynamic content is automatically translated when you switch languages."
          >
            This demo shows how dynamic content is automatically translated when you switch languages.
          </p>
        </CardHeader>
      </Card>

      {/* Status and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Translation Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Current Language:</span>
              <Badge variant="secondary">{locale.toUpperCase()}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Loading:</span>
              <Badge variant={isLoading ? "destructive" : "default"}>
                {isLoading ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Translating Content:</span>
              <Badge variant={isTranslating ? "destructive" : "default"}>
                {isTranslating ? 'Yes' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Static i18n Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 rounded">
              <code className="text-sm">t('welcome')</code>
              <div className="mt-1 font-medium">{t('welcome')}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <code className="text-sm">t('home.askQuestion')</code>
              <div className="mt-1 font-medium">{t('home.askQuestion')}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <code className="text-sm">hasKey('welcome')</code>
              <div className="mt-1 font-medium">{hasKey('welcome') ? '✓ Yes' : '✗ No'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dynamic Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              ref={buttonRef}
              onClick={handleBatchTranslate}
              className="w-full"
              data-translate="Translate All Content"
            >
              Translate All Content
            </Button>
            <Button 
              onClick={handleAddContent}
              variant="outline"
              className="w-full"
            >
              Add Dynamic Content
            </Button>
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter text to translate..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                data-translate-placeholder="Enter text to translate..."
              />
              <Button 
                onClick={handleTranslateInput}
                size="sm"
              >
                Translate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Content List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Dynamic Content (Auto-Translated)</CardTitle>
          <p className="text-sm text-gray-600">
            Content below is automatically translated when language changes. This simulates user-generated content from your database.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayContent.map((item) => (
              <div 
                key={item.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
                
                <p className="text-gray-600 mb-3 leading-relaxed">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>By {item.author}</span>
                    <span>•</span>
                    <span>{item.timestamp}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Translation Instructions */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-lg text-yellow-800">How This Works</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700 space-y-2">
          <p><strong>Static Content:</strong> Uses existing i18n JSON files (t() function)</p>
          <p><strong>Dynamic Content:</strong> Uses LibreTranslate API (dt() function)</p>
          <p><strong>DOM Updates:</strong> Elements are automatically updated when language changes</p>
          <p><strong>To test:</strong> Change language using the dropdown above and watch all content update</p>
        </CardContent>
      </Card>

      {/* Language Switching Indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Updating translations...</span>
          </div>
        </div>
      )}
    </div>
  );
}
