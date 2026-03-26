'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const TestForgotPassword: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Forgot Password Translation Test</h1>
        
        {/* Language Switcher */}
        <div className="mb-8">
          <LanguageSwitcher />
        </div>

        {/* Test all forgotPassword translations */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Forgot Password Translations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Title:</strong> {t('forgotPassword.title')}
              </div>
              <div>
                <strong>Subtitle:</strong> {t('forgotPassword.subtitle')}
              </div>
              <div>
                <strong>Reset Method:</strong> {t('forgotPassword.resetMethod')}
              </div>
              <div>
                <strong>Email:</strong> {t('forgotPassword.email')}
              </div>
              <div>
                <strong>Phone:</strong> {t('forgotPassword.phone')}
              </div>
              <div>
                <strong>Email Label:</strong> {t('forgotPassword.emailLabel')}
              </div>
              <div>
                <strong>Phone Label:</strong> {t('forgotPassword.phoneLabel')}
              </div>
              <div>
                <strong>Email Placeholder:</strong> {t('forgotPassword.emailPlaceholder')}
              </div>
              <div>
                <strong>Phone Placeholder:</strong> {t('forgotPassword.phonePlaceholder')}
              </div>
              <div>
                <strong>Reset Button:</strong> {t('forgotPassword.resetButton')}
              </div>
              <div>
                <strong>Processing:</strong> {t('forgotPassword.processing')}
              </div>
              <div>
                <strong>Back to Login:</strong> {t('forgotPassword.backToLogin')}
              </div>
              <div>
                <strong>Empty Identifier:</strong> {t('forgotPassword.emptyIdentifier')}
              </div>
              <div>
                <strong>Network Error:</strong> {t('forgotPassword.networkError')}
              </div>
              <div>
                <strong>User Not Found:</strong> {t('forgotPassword.userNotFound')}
              </div>
              <div>
                <strong>Rate Limit Exceeded:</strong> {t('forgotPassword.rateLimitExceeded')}
              </div>
              <div>
                <strong>Success Message:</strong> {t('forgotPassword.successMessage')}
              </div>
              <div>
                <strong>Security Notice:</strong> {t('forgotPassword.securityNotice')}
              </div>
              <div>
                <strong>Security Notice Text:</strong> {t('forgotPassword.securityNoticeText')}
              </div>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Interactive Demo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('forgotPassword.resetMethod')}
                </label>
                <div className="flex gap-4">
                  <button className="flex-1 py-2 px-4 rounded-lg border-2 border-indigo-600 bg-indigo-50 text-indigo-700 font-medium">
                    📧 {t('forgotPassword.email')}
                  </button>
                  <button className="flex-1 py-2 px-4 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-gray-400">
                    📱 {t('forgotPassword.phone')}
                  </button>
                </div>
              </div>
              
              <div>
                <input
                  type="email"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder={t('forgotPassword.emailPlaceholder')}
                />
              </div>
              
              <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">
                {t('forgotPassword.resetButton')}
              </button>
              
              <div className="text-center">
                <button className="text-indigo-600 hover:text-indigo-500 text-sm">
                  {t('forgotPassword.backToLogin')}
                </button>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="font-semibold mb-1">🔒 {t('forgotPassword.securityNotice')}</p>
            <p className="text-xs text-gray-600">
              {t('forgotPassword.securityNoticeText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestForgotPassword;
