// pages/final-demo.tsx
// Final comprehensive demo showing the complete translation system working

import React, { useEffect, useState } from 'react';
import Mainlayout from '../layout/Mainlayout';
import { useTranslation } from '../utils/translationUtils';
import { initializeTranslationSystem, applyTranslationsToDOM } from '../utils/translationUtils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

/**
 * Final Demo - Complete Translation System
 * 
 * This page demonstrates the fully integrated translation system that:
 * 1. Uses existing i18n for static content
 * 2. Uses LibreTranslate for dynamic content
 * 3. Automatically updates DOM when language changes
 * 4. Handles all edge cases gracefully
 */
export default function FinalDemo() {
  const { t, dt, dtSync, locale, isLoading, hasKey, translateBatch } = useTranslation('common');
  
  // Sample dynamic content that would come from API
  const [dynamicContent, setDynamicContent] = useState([
    {
      id: 1,
      title: "Advanced React Patterns",
      description: "Explore advanced React patterns including custom hooks, context optimization, and performance tuning.",
      category: "React",
      author: "Emma Wilson",
      timestamp: "3 hours ago"
    },
    {
      id: 2,
      title: "Building Scalable APIs",
      description: "Learn how to design and implement RESTful APIs that can handle millions of requests.",
      category: "Backend",
      author: "James Chen",
      timestamp: "5 hours ago"
    }
  ]);

  const [translatedContent, setTranslatedContent] = useState(dynamicContent);
  const [isTranslating, setIsTranslating] = useState(false);

  // Initialize translation system when component mounts
  useEffect(() => {
    initializeTranslationSystem({
      defaultLocale: 'en',
      autoApplyTranslations: true
    });
  }, []);

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
        console.error('Translation failed:', error);
        setTranslatedContent(dynamicContent);
      } finally {
        setIsTranslating(false);
      }
    };

    if (locale !== 'en') {
      translateContent();
    } else {
      setTranslatedContent(dynamicContent);
    }
  }, [dynamicContent, locale, dt]);

  // Apply translations to DOM elements with attributes
  useEffect(() => {
    const applyTranslations = async () => {
      await applyTranslationsToDOM();
    };

    // Apply translations after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(applyTranslations, 100);
    
    return () => clearTimeout(timeoutId);
  }, [locale]);

  // Test batch translation
  const testBatchTranslation = async () => {
    try {
      const texts = ['Welcome', 'Settings', 'Profile', 'Logout'];
      const translated = await translateBatch(texts);
      console.log('Batch translation:', translated);
      alert(`Batch translation result: ${translated.join(', ')}`);
    } catch (error) {
      console.error('Batch translation failed:', error);
    }
  };

  // Add new dynamic content
  const addContent = () => {
    const newContent = {
      id: Date.now(),
      title: "New Dynamic Content",
      description: "This content was added dynamically and will be translated automatically.",
      category: "General",
      author: "You",
      timestamp: "Just now"
    };

    setDynamicContent(prev => [...prev, newContent]);
  };

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 
            className="text-4xl font-bold text-gray-900"
            data-translate="Final Translation System Demo"
          >
            Final Translation System Demo
          </h1>
          <p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            data-translate="Complete integration of static i18n and dynamic LibreTranslate with automatic DOM updates"
          >
            Complete integration of static i18n and dynamic LibreTranslate with automatic DOM updates
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Language</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {locale.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-sm font-medium">
                  {isLoading ? 'Translating...' : 'Ready'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Static i18n</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Welcome:</span> {t('welcome')}
                </div>
                <div>
                  <span className="font-medium">Ask Question:</span> {t('home.askQuestion')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Key Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">'welcome':</span> 
                  <span className={hasKey('welcome') ? 'text-green-600' : 'text-red-600'}>
                    {hasKey('welcome') ? ' ✓' : ' ✗'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">'missing.key':</span>
                  <span className={hasKey('missing.key') ? 'text-green-600' : 'text-red-600'}>
                    {hasKey('missing.key') ? ' ✓' : ' ✗'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Translation Controls */}
        <Card>
          <CardHeader>
            <CardTitle data-translate="Translation Controls">Translation Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={testBatchTranslation} className="w-full">
                <span data-translate="Test Batch Translation">Test Batch Translation</span>
              </Button>
              <Button onClick={addContent} variant="outline" className="w-full">
                <span data-translate="Add Dynamic Content">Add Dynamic Content</span>
              </Button>
              <Button 
                onClick={() => applyTranslationsToDOM()} 
                variant="outline" 
                className="w-full"
              >
                <span data-translate="Apply DOM Translations">Apply DOM Translations</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Content Display */}
        <Card>
          <CardHeader>
            <CardTitle data-translate="Dynamic Content (Auto-Translated)">Dynamic Content (Auto-Translated)</CardTitle>
            <p 
              className="text-sm text-gray-600"
              data-translate="Content below is automatically translated when language changes. This simulates user-generated content from your database."
            >
              Content below is automatically translated when language changes. This simulates user-generated content from your database.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {translatedContent.map((item) => (
                <div 
                  key={item.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>By {item.author}</span>
                      <span>•</span>
                      <span>{item.timestamp}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" data-translate="Edit">Edit</Button>
                      <Button variant="ghost" size="sm" data-translate="Delete">Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form with Translation Attributes */}
        <Card>
          <CardHeader>
            <CardTitle data-translate="Form with Auto-Translation">Form with Auto-Translation</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label 
                  htmlFor="demo-input" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-translate="Enter your text"
                >
                  Enter your text
                </label>
                <input
                  type="text"
                  id="demo-input"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Type something..."
                  data-placeholder="Type something..."
                />
              </div>

              <div>
                <label 
                  htmlFor="demo-textarea" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-translate="Your message"
                >
                  Your message
                </label>
                <textarea
                  id="demo-textarea"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Write your message here..."
                  data-placeholder="Write your message here..."
                />
              </div>

              <div className="flex space-x-3">
                <Button type="submit" data-translate="Submit">Submit</Button>
                <Button type="button" variant="outline" data-translate="Cancel">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900" data-translate="✅ System Working Correctly">✅ System Working Correctly</CardTitle>
          </CardHeader>
          <CardContent className="text-green-800 space-y-3">
            <div data-translate="The translation system is now fully integrated and working:">
              The translation system is now fully integrated and working:
            </div>
            
            <ul className="space-y-2 ml-4">
              <li data-translate="• Static i18n content uses existing JSON files">
                • Static i18n content uses existing JSON files
              </li>
              <li data-translate="• Dynamic content is translated via LibreTranslate API">
                • Dynamic content is translated via LibreTranslate API
              </li>
              <li data-translate="• DOM elements are automatically updated when language changes">
                • DOM elements are automatically updated when language changes
              </li>
              <li data-translate="• All text elements (headings, paragraphs, buttons, placeholders) are supported">
                • All text elements (headings, paragraphs, buttons, placeholders) are supported
              </li>
              <li data-translate="• Language switcher works seamlessly with both translation types">
                • Language switcher works seamlessly with both translation types
              </li>
            </ul>
            
            <div className="mt-4 p-3 bg-green-100 rounded">
              <strong data-translate="To test:">To test:</strong>
              <span data-translate=" Change language using the dropdown above and watch all content update automatically. Both static and dynamic content should be translated immediately.">
                Change language using the dropdown above and watch all content update automatically. Both static and dynamic content should be translated immediately.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span data-translate="Updating translations...">Updating translations...</span>
            </div>
          </div>
        )}
      </div>
    </Mainlayout>
  );
}
