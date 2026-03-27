'use client';

import React, { useState, useEffect } from 'react';
import { useTranslationManager } from '../hooks/useTranslationManager';
import { useDynamicI18n } from '../hooks/useDynamicI18n';
import LanguageSwitcher from './LanguageSwitcher';

/**
 * TranslationExample Component
 * 
 * This component demonstrates the hybrid translation system:
 * 1. Static i18n translations using the 't' function
 * 2. Dynamic translations using the 'dt' function
 * 3. DOM elements with data-i18n attributes
 * 4. Real-time language switching
 */
const TranslationExample: React.FC = () => {
  const { t, dt, locale, isLoading, hasKey } = useTranslationManager();
  const { translateAll, currentLanguage } = useDynamicI18n({ autoScan: true });
  
  // Sample dynamic content that would come from API, database, etc.
  const [dynamicContent, setDynamicContent] = useState({
    welcomeMessage: "Welcome to our platform!",
    featureTitle: "Advanced Features",
    featureDescription: "Experience the power of our cutting-edge technology that adapts to your needs.",
    userGeneratedText: "This is user-generated content that needs translation.",
    apiResponse: "Data loaded successfully from the server."
  });

  // Sample dynamic content that changes
  const [counter, setCounter] = useState(0);
  const [notification, setNotification] = useState("New updates available!");

  // Translate dynamic content when language changes
  useEffect(() => {
    const translateDynamicContent = async () => {
      try {
        const translated = {
          welcomeMessage: await dt(dynamicContent.welcomeMessage),
          featureTitle: await dt(dynamicContent.featureTitle),
          featureDescription: await dt(dynamicContent.featureDescription),
          userGeneratedText: await dt(dynamicContent.userGeneratedText),
          apiResponse: await dt(dynamicContent.apiResponse)
        };
        setDynamicContent(translated);
        setNotification(await dt(notification));
      } catch (error) {
        console.error('Failed to translate dynamic content:', error);
      }
    };

    if (locale !== 'en') {
      translateDynamicContent();
    }
  }, [locale, dt]);

  const handleIncrement = () => {
    setCounter(prev => prev + 1);
  };

  const handleNotificationChange = () => {
    const messages = [
      "New updates available!",
      "Your profile has been updated.",
      "You have a new message.",
      "Download complete!"
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setNotification(randomMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Language Switcher */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('navbar.home')} - Translation Demo
              </h1>
              <p className="text-gray-600 mt-2">
                Current Language: <span className="font-semibold">{locale.toUpperCase()}</span>
                {isLoading && <span className="ml-2 text-blue-600">Translating...</span>}
              </p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Static Translations Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            📚 Static i18n Translations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">Navigation</h3>
              <p className="text-blue-700">Home: {t('sidebar.home')}</p>
              <p className="text-blue-700">Questions: {t('sidebar.questions')}</p>
              <p className="text-blue-700">Tags: {t('sidebar.tags')}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900">Actions</h3>
              <p className="text-green-700">Submit: {t('submit')}</p>
              <p className="text-green-700">Cancel: {t('cancel')}</p>
              <p className="text-green-700">Loading: {t('loading')}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Translations Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            🌐 Dynamic LibreTranslate Translations
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">Welcome Message</h3>
              <p className="text-purple-700">{dynamicContent.welcomeMessage}</p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-medium text-indigo-900 mb-2">Features</h3>
              <h4 className="font-semibold text-indigo-800">{dynamicContent.featureTitle}</h4>
              <p className="text-indigo-700">{dynamicContent.featureDescription}</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">User Content</h3>
              <p className="text-yellow-700">{dynamicContent.userGeneratedText}</p>
            </div>

            <div className="p-4 bg-pink-50 rounded-lg">
              <h3 className="font-medium text-pink-900 mb-2">API Response</h3>
              <p className="text-pink-700">{dynamicContent.apiResponse}</p>
            </div>
          </div>
        </div>

        {/* Interactive Dynamic Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            🔄 Interactive Dynamic Content
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-medium text-orange-900 mb-2">Counter</h3>
              <p className="text-orange-700 mb-3">
                Count: <span className="font-bold">{counter}</span>
              </p>
              <button
                onClick={handleIncrement}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {t('submit')} Increment
              </button>
            </div>

            <div className="p-4 bg-teal-50 rounded-lg">
              <h3 className="font-medium text-teal-900 mb-2">Notifications</h3>
              <p className="text-teal-700 mb-3" data-i18n-dynamic={notification}>
                {notification}
              </p>
              <button
                onClick={handleNotificationChange}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Change Notification
              </button>
            </div>
          </div>
        </div>

        {/* DOM Elements with Translation Attributes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            🏷️ DOM Elements with Translation Attributes
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="font-medium text-gray-700">Static Key:</label>
              <span 
                data-i18n-key="welcome"
                className="px-3 py-1 bg-gray-100 rounded text-gray-800"
              >
                Welcome
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <label className="font-medium text-gray-700">Dynamic Text:</label>
              <span 
                data-i18n-dynamic="This text will be translated dynamically"
                className="px-3 py-1 bg-gray-100 rounded text-gray-800"
              >
                This text will be translated dynamically
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <label className="font-medium text-gray-700">Input Placeholder:</label>
              <input
                type="text"
                data-i18n-placeholder="Enter your search query"
                placeholder="Enter your search query"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="font-medium text-gray-700">Button:</label>
              <button
                data-i18n-dynamic="Click me"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Click me
              </button>
            </div>
          </div>
        </div>

        {/* Translation System Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            ℹ️ Translation System Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">System Status</h3>
              <p className="text-gray-700">Current Locale: {locale}</p>
              <p className="text-gray-700">Is Loading: {isLoading ? 'Yes' : 'No'}</p>
              <p className="text-gray-700">Dynamic Language: {currentLanguage}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Key Check</h3>
              <p className="text-gray-700">
                'welcome' key exists: {hasKey('welcome') ? 'Yes' : 'No'}
              </p>
              <p className="text-gray-700">
                'nonexistent' key exists: {hasKey('nonexistent') ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={translateAll}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🔄 Retranslate All DOM Elements
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">
            📖 How to Use This Translation System
          </h2>
          
          <div className="space-y-3 text-blue-800">
            <div>
              <strong>Static Translations:</strong> Use the `t()` function with keys from your JSON files
            </div>
            <div>
              <strong>Dynamic Translations:</strong> Use the `dt()` function for any text not in i18n files
            </div>
            <div>
              <strong>DOM Attributes:</strong> Add `data-i18n-key`, `data-i18n-dynamic`, or `data-i18n-placeholder` to elements
            </div>
            <div>
              <strong>Language Switching:</strong> Use the LanguageSwitcher component to change languages
            </div>
            <div>
              <strong>Performance:</strong> Translations are cached automatically to avoid redundant API calls
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationExample;
