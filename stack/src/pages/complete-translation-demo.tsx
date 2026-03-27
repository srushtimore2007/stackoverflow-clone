// pages/complete-translation-demo.tsx
// Complete demonstration of the dynamic translation system

import React, { useState, useEffect } from 'react';
import Mainlayout from '../layout/Mainlayout';
import { DynamicTranslationDemo } from '../components/DynamicTranslationDemo';
import { useTranslationManager } from '../hooks/useTranslationManager';
import { useAutoTranslator } from '../utils/autoTranslator';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

/**
 * Complete Translation Demo
 * 
 * This page demonstrates:
 * 1. Static i18n translations (existing JSON files)
 * 2. Dynamic LibreTranslate translations for missing content
 * 3. Automatic DOM updates when language switches
 * 4. Manual and automatic translation modes
 * 5. Real-world usage patterns
 */
export default function CompleteTranslationDemo() {
  const { 
    t,                    // Static translation
    dt,                   // Dynamic translation (async)
    dtSync,               // Dynamic translation (sync, cached)
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

  // Initialize auto-translator for automatic DOM scanning
  const { translateAll, retranslate } = useAutoTranslator({
    selector: '[data-translate], [data-translate-key], [data-placeholder]',
    autoUpdate: true
  });

  // Sample data that would come from API
  const [apiData, setApiData] = useState([
    {
      id: 1,
      title: "Understanding React State Management",
      description: "Learn how to effectively manage state in React applications using useState, useReducer, and Context API.",
      author: "Sarah Chen",
      category: "React",
      likes: 42,
      comments: 8
    },
    {
      id: 2,
      title: "TypeScript Best Practices",
      description: "Discover the best practices for writing type-safe TypeScript code in large applications.",
      author: "Michael Rodriguez",
      category: "TypeScript",
      likes: 38,
      comments: 12
    }
  ]);

  const [translatedApiData, setTranslatedApiData] = useState(apiData);
  const [isTranslating, setIsTranslating] = useState(false);

  // Dynamic form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General'
  });

  // Translate API data when language changes
  useEffect(() => {
    const translateApiData = async () => {
      setIsTranslating(true);
      
      try {
        const translated = await Promise.all(
          apiData.map(async (item) => {
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

        setTranslatedApiData(translated);
      } catch (error) {
        console.error('Failed to translate API data:', error);
        setTranslatedApiData(apiData);
      } finally {
        setIsTranslating(false);
      }
    };

    translateApiData();
  }, [apiData, locale, dt]);

  // Handle form submission with dynamic content
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Translate form data before submitting
      const translatedTitle = await dt(formData.title);
      const translatedDescription = await dt(formData.description);
      
      const newItem = {
        id: Date.now(),
        title: translatedTitle,
        description: translatedDescription,
        category: formData.category,
        author: "Current User",
        likes: 0,
        comments: 0
      };

      setApiData(prev => [...prev, newItem]);
      setFormData({ title: '', description: '', category: 'General' });
      
      alert('Content added and translated!');
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  // Test manual DOM updates
  const testManualUpdate = async () => {
    const elements = document.querySelectorAll('.manual-update-test');
    const texts = ['Hello World', 'Dynamic Content', 'Auto Translation'];
    
    for (let i = 0; i < elements.length && i < texts.length; i++) {
      const element = elements[i] as HTMLElement;
      const translated = await dt(texts[i]);
      updateElementText(element, translated);
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 
            className="text-4xl font-bold text-gray-900"
            data-translate="Complete Translation System Demo"
          >
            Complete Translation System Demo
          </h1>
          <p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            data-translate="This demonstrates how static i18n and dynamic LibreTranslate work together to provide comprehensive multilingual support."
          >
            This demonstrates how static i18n and dynamic LibreTranslate work together to provide comprehensive multilingual support.
          </p>
        </div>

        {/* Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Current Language</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{locale.toUpperCase()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm">Translation: {isLoading ? 'Loading' : 'Ready'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isTranslating ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm">Content: {isTranslating ? 'Translating' : 'Ready'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Static i18n</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="font-medium">Welcome:</span> {t('welcome')}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Ask Question:</span> {t('home.askQuestion')}
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
                Scan & Translate
              </Button>
              <Button onClick={retranslate} size="sm" variant="outline" className="w-full">
                Retranslate All
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Form with Dynamic Translation */}
        <Card>
          <CardHeader>
            <CardTitle data-translate="Add Dynamic Content">Add Dynamic Content</CardTitle>
            <p data-translate="This form demonstrates how user input can be translated before submission">
              This form demonstrates how user input can be translated before submission
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="title" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-translate="Title"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter title..."
                  data-placeholder="Enter title..."
                  required
                />
              </div>

              <div>
                <label 
                  htmlFor="description" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-translate="Description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description..."
                  data-placeholder="Enter description..."
                  required
                />
              </div>

              <div>
                <label 
                  htmlFor="category" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-translate="Category"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="General" data-translate="General">General</option>
                  <option value="Tutorial" data-translate="Tutorial">Tutorial</option>
                  <option value="Advanced" data-translate="Advanced">Advanced</option>
                </select>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                data-translate="Add Content"
              >
                Add Content
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* API Data with Dynamic Translation */}
        <Card>
          <CardHeader>
            <CardTitle data-translate="API Content (Auto-Translated)">API Content (Auto-Translated)</CardTitle>
            <p data-translate="This content simulates data from your backend API that gets translated automatically">
              This content simulates data from your backend API that gets translated automatically
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {translatedApiData.map((item) => (
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
                      <span>{item.likes} likes</span>
                      <span>•</span>
                      <span>{item.comments} comments</span>
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

        {/* Manual DOM Update Test */}
        <Card>
          <CardHeader>
            <CardTitle data-translate="Manual DOM Update Test">Manual DOM Update Test</CardTitle>
            <p data-translate="Test manual DOM manipulation with translation">
              Test manual DOM manipulation with translation
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded text-center manual-update-test">
                  <div className="text-lg font-medium">Hello World</div>
                </div>
                <div className="p-4 bg-gray-50 rounded text-center manual-update-test">
                  <div className="text-lg font-medium">Dynamic Content</div>
                </div>
                <div className="p-4 bg-gray-50 rounded text-center manual-update-test">
                  <div className="text-lg font-medium">Auto Translation</div>
                </div>
              </div>
              
              <Button onClick={testManualUpdate} className="w-full">
                <span data-translate="Translate These Elements">Translate These Elements</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Translation Instructions */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900" data-translate="How to Use This System">How to Use This System</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2" data-translate="For Static Content">For Static Content</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Use existing i18n JSON files</li>
                  <li>• Call <code className="bg-blue-100 px-1 rounded">t('key')</code> function</li>
                  <li>• Content is translated immediately</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2" data-translate="For Dynamic Content">For Dynamic Content</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Use <code className="bg-blue-100 px-1 rounded">dt('text')</code> for async translation</li>
                  <li>• Add <code className="bg-blue-100 px-1 rounded">data-translate</code> attributes to elements</li>
                  <li>• Content is translated via LibreTranslate API</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-100 rounded">
              <strong data-translate="To Test:">To Test:</strong>
              <span data-translate=" Change language using the dropdown above and watch all content update automatically.">
                Change language using the dropdown above and watch all content update automatically.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Full Demo Component */}
        <div className="mt-8">
          <DynamicTranslationDemo />
        </div>

        {/* Loading Indicator */}
        {(isLoading || isTranslating) && (
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
