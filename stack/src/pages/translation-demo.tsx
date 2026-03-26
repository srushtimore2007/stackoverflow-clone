'use client';

import React, { useState } from 'react';
import Mainlayout from '../layout/Mainlayout';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from '../contexts/TranslationContext';

const TranslationDemo: React.FC = () => {
  const { currentLanguage, isLoading, t } = useTranslation();

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('common.welcome')}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {t('messages.operation_successful')}<br/>
            <span className="text-sm text-gray-500">Supported: English, Hindi, Spanish, Portuguese, Chinese, French</span>
          </p>
          
          {/* Language Switcher */}
          <div className="flex justify-center mb-6">
            <LanguageSwitcher 
              onLanguageChange={(lang) => console.log('Language changed to:', lang)}
            />
          </div>
        </div>

        {/* Current Language Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Current Language</h3>
              <p className="text-blue-700">
                {currentLanguage.toUpperCase()} {isLoading && '(Loading...)'}
              </p>
            </div>
          </div>
        </div>

        {/* Translation Examples */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{t('auth.login_to_account')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="m@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                {t('common.login')}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{t('auth.create_account')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('auth.display_name')}
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder={t('auth.enter_display_name')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="m@example.com"
                />
              </div>
              <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                {t('common.signup')}
              </button>
            </div>
          </div>
        </div>

        {/* Common UI Elements */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('common.navigation')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
              {t('common.home')}
            </button>
            <button className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
              {t('navigation.dashboard')}
            </button>
            <button className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
              {t('navigation.questions')}
            </button>
            <button className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
              {t('navigation.users')}
            </button>
            <button className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
              {t('common.settings')}
            </button>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('questions.ask_question')}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('questions.question_title')}
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder={t('questions.question_title')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('questions.question_body')}
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={4}
                placeholder={t('questions.question_body')}
              />
            </div>
            <div className="flex gap-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                {t('common.submit')}
              </button>
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900">{t('common.success')}</h3>
            <p className="text-green-800">{t('messages.operation_successful')}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900">{t('common.error')}</h3>
            <p className="text-red-800">{t('messages.something_went_wrong')}</p>
          </div>
        </div>
      </div>
    </Mainlayout>
  );
};

export default TranslationDemo;
