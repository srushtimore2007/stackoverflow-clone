'use client';

import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const TestTranslation: React.FC = () => {
  const { currentLanguage, isLoading, t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Translation System Test</h1>
        
        {/* Language Switcher */}
        <div className="mb-8">
          <LanguageSwitcher />
        </div>

        {/* Current Status */}
        <div className="bg-blue-100 p-4 rounded-lg mb-6">
          <p><strong>Current Language:</strong> {currentLanguage}</p>
          <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        </div>

        {/* Test Translations */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Common Elements</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-blue-500 text-white px-4 py-2 rounded">
                {t('common.login')}
              </button>
              <button className="bg-green-500 text-white px-4 py-2 rounded">
                {t('common.signup')}
              </button>
              <button className="bg-gray-500 text-white px-4 py-2 rounded">
                {t('common.cancel')}
              </button>
              <button className="bg-purple-500 text-white px-4 py-2 rounded">
                {t('common.submit')}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth Labels</h2>
            <div className="space-y-2">
              <p><strong>Email:</strong> {t('auth.email')}</p>
              <p><strong>Password:</strong> {t('auth.password')}</p>
              <p><strong>Login Success:</strong> {t('auth.login_success')}</p>
              <p><strong>Forgot Password:</strong> {t('auth.forgot_password')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Navigation</h2>
            <div className="space-y-2">
              <p><strong>Home:</strong> {t('common.home')}</p>
              <p><strong>Dashboard:</strong> {t('navigation.dashboard')}</p>
              <p><strong>Questions:</strong> {t('navigation.questions')}</p>
              <p><strong>Users:</strong> {t('navigation.users')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Messages</h2>
            <div className="space-y-2">
              <p><strong>Success:</strong> {t('messages.operation_successful')}</p>
              <p><strong>Error:</strong> {t('messages.something_went_wrong')}</p>
              <p><strong>Network Error:</strong> {t('messages.network_error')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTranslation;
