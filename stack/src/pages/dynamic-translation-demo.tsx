// pages/dynamic-translation-demo.tsx
// Comprehensive demo showing static i18n + dynamic LibreTranslate working together

import React, { useState, useEffect } from 'react';
import Mainlayout from '../layout/Mainlayout';
import { useDynamicI18n } from '../hooks/useDynamicI18n';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

/**
 * Dynamic Translation Demo
 * 
 * This page demonstrates:
 * 1. Static i18n translations using existing JSON files
 * 2. Dynamic translations via LibreTranslate API
 * 3. Automatic DOM scanning for data-i18n-dynamic attributes
 * 4. Real-time updates when language switches
 * 5. Fallback handling for API failures
 */
export default function DynamicTranslationDemo() {
  const { 
    t,                    // Static translation (existing i18n)
    dt,                   // Dynamic translation (LibreTranslate)
    dtSync,               // Dynamic sync translation
    currentLanguage,        // Current language code
    isTranslating,         // Loading state
    translateElement,        // Translate single element
    translateAll,           // Translate all elements
    clearCache,            // Clear translation cache
    hasStaticTranslation    // Check if static key exists
  } = useDynamicI18n({ 
    namespace: 'common',
    autoScan: true,
    preserveOriginal: true 
  });

  // Sample dynamic content (simulates API data)
  const [dynamicContent, setDynamicContent] = useState([
    {
      id: 1,
      title: "Advanced React Patterns",
      description: "Learn advanced React patterns including custom hooks, context optimization, and performance tuning.",
      category: "React Tutorial",
      author: "Sarah Chen",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      title: "Building Scalable APIs",
      description: "Master the art of designing RESTful APIs that can handle millions of requests efficiently.",
      category: "Backend Development",
      author: "Michael Rodriguez",
      timestamp: "5 hours ago"
    },
    {
      id: 3,
      title: "CSS Grid Mastery",
      description: "Create responsive layouts with CSS Grid and Flexbox like a professional.",
      category: "Frontend Design",
      author: "Emma Wilson",
      timestamp: "1 day ago"
    }
  ]);

  const [translatedContent, setTranslatedContent] = useState(dynamicContent);
  const [userInput, setUserInput] = useState('');

  // Translate dynamic content when language changes
  useEffect(() => {
    const translateContent = async () => {
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
      }
    };

    // Only translate if not English
    if (currentLanguage !== 'en') {
      translateContent();
    } else {
      setTranslatedContent(dynamicContent);
    }
  }, [dynamicContent, currentLanguage, dt]);

  // Handle manual translation
  const handleTranslateInput = async () => {
    if (!userInput.trim()) return;

    try {
      const translated = await dt(userInput);
      alert(`Translated: ${translated}`);
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  // Add new dynamic content
  const handleAddContent = () => {
    const newContent = {
      id: Date.now(),
      title: "New Dynamic Content",
      description: "This content was added dynamically and demonstrates automatic translation.",
      category: "Example",
      author: "You",
      timestamp: "Just now"
    };

    setDynamicContent(prev => [...prev, newContent]);
  };

  // Test element translation
  const testElementTranslation = async () => {
    const testElement = document.getElementById('test-element');
    if (testElement) {
      await translateElement(testElement);
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 
            className="text-4xl font-bold text-gray-900"
            data-i18n-dynamic="Dynamic Translation System Demo"
          >
            Dynamic Translation System Demo
          </h1>
          <p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            data-i18n-dynamic="This demonstrates how static i18n and dynamic LibreTranslate work together seamlessly."
          >
            This demonstrates how static i18n and dynamic LibreTranslate work together seamlessly.
          </p>
        </div>

        {/* Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Current Language</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{currentLanguage.toUpperCase()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Translation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isTranslating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-sm">Translating: {isTranslating ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${currentLanguage !== 'en' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm">Dynamic Mode: {currentLanguage !== 'en' ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Static i18n Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-2 bg-gray-50 rounded">
                  <code className="text-xs">t('welcome')</code>
                  <div className="mt-1 font-medium">{t('welcome')}</div>
                  <div className="text-xs text-green-600">✓ Static key exists</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <code className="text-xs">t('home.askQuestion')</code>
                  <div className="mt-1 font-medium">{t('home.askQuestion')}</div>
                  <div className="text-xs text-green-600">✓ Static key exists</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <code className="text-xs">hasStaticTranslation('nonexistent.key')</code>
                  <div className="mt-1 font-medium">{hasStaticTranslation('nonexistent.key') ? '✓' : '✗'}</div>
                  <div className="text-xs text-orange-600">Static key missing</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={translateAll} size="sm" className="w-full">
                Scan & Translate All
              </Button>
              <Button onClick={clearCache} size="sm" variant="outline" className="w-full">
                Clear Cache
              </Button>
              <Button onClick={testElementTranslation} size="sm" variant="outline" className="w-full">
                Test Element
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Manual Translation Test */}
        <Card>
          <CardHeader>
            <CardTitle data-i18n-dynamic="Manual Translation Test">Manual Translation Test</CardTitle>
            <p data-i18n-dynamic="Test direct translation of user input">
              Test direct translation of user input
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="user-input" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-i18n-dynamic="Enter text to translate"
                >
                  Enter text to translate
                </label>
                <input
                  id="user-input"
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Type something to translate..."
                  data-i18n-placeholder="Type something to translate..."
                />
              </div>
              
              <div className="flex space-x-3">
                <Button onClick={handleTranslateInput} disabled={isTranslating}>
                  {isTranslating ? 'Translating...' : 'Translate Text'}
                </Button>
                <Button onClick={() => setUserInput('')} variant="outline">
                  Clear
                </Button>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h4 className="text-sm font-medium mb-2">Translation Result:</h4>
                <div className="text-sm text-gray-600">
                  {userInput ? `Original: "${userInput}"` : 'Enter text above'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Content List */}
        <Card>
          <CardHeader>
            <CardTitle data-i18n-dynamic="Dynamic Content (Auto-Translated)">Dynamic Content (Auto-Translated)</CardTitle>
            <p data-i18n-dynamic="Content below simulates data from your API and gets translated automatically">
              Content below simulates data from your API and gets translated automatically
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
                      <Button variant="ghost" size="sm" data-i18n-dynamic="Edit">Edit</Button>
                      <Button variant="ghost" size="sm" data-i18n-dynamic="Delete">Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-center">
              <Button onClick={handleAddContent} variant="outline">
                <span data-i18n-dynamic="Add Dynamic Content">Add Dynamic Content</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Element for Manual Translation */}
        <Card>
          <CardHeader>
            <CardTitle data-i18n-dynamic="Manual Element Test">Manual Element Test</CardTitle>
            <p data-i18n-dynamic="Test manual translation of specific DOM element">
              Test manual translation of specific DOM element
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                id="test-element"
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                data-i18n-dynamic="This element will be translated manually"
              >
                This element will be translated manually
              </div>
              
              <Button onClick={testElementTranslation} className="w-full">
                <span data-i18n-dynamic="Translate This Element">Translate This Element</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900" data-i18n-dynamic="✅ How It Works">✅ How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-green-800 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2" data-i18n-dynamic="Static Content">Static Content</h4>
                <ul className="space-y-1 text-sm">
                  <li data-i18n-dynamic="• Uses existing i18n JSON files">• Uses existing i18n JSON files</li>
                  <li data-i18n-dynamic="• Call t('key') function">• Call t('key') function</li>
                  <li data-i18n-dynamic="• Immediate translation, no API calls">• Immediate translation, no API calls</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2" data-i18n-dynamic="Dynamic Content">Dynamic Content</h4>
                <ul className="space-y-1 text-sm">
                  <li data-i18n-dynamic="• Add data-i18n-dynamic attributes">• Add data-i18n-dynamic attributes</li>
                  <li data-i18n-dynamic="• Use dt('text') for async translation">• Use dt('text') for async translation</li>
                  <li data-i18n-dynamic="• Automatic API calls via LibreTranslate">• Automatic API calls via LibreTranslate</li>
                  <li data-i18n-dynamic="• Cached for performance">• Cached for performance</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-100 rounded">
              <strong data-i18n-dynamic="To Test:">To Test:</strong>
              <span data-i18n-dynamic=" Change language using the dropdown above and watch all content update automatically. Static content uses i18n, dynamic content uses LibreTranslate.">
                Change language using the dropdown above and watch all content update automatically. Static content uses i18n, dynamic content uses LibreTranslate.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Translation Indicator */}
        {isTranslating && (
          <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span data-i18n-dynamic="Translating content...">Translating content...</span>
            </div>
          </div>
        )}
      </div>
    </Mainlayout>
  );
}
