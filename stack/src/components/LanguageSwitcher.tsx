'use client';

import React, { useState } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import LanguageVerificationModal from './LanguageVerificationModal';

interface LanguageSwitcherProps {
  className?: string;
  onLanguageChange?: (languageCode: string) => void;
  userEmail?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '', 
  onLanguageChange,
  userEmail
}) => {
  const { 
    currentLanguage, 
    supportedLanguages, 
    setLanguage, 
    isLoading
  } = useTranslation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string>('');

  // Language OTP requirements
  const languageRequirements: Record<string, { required: boolean; type: 'email' | 'phone' | null }> = {
    en: { required: false, type: null },
    fr: { required: true, type: 'email' },
    hi: { required: true, type: 'phone' },
    es: { required: true, type: 'phone' },
    pt: { required: true, type: 'phone' },
    zh: { required: true, type: 'phone' }
  };

  const handleLanguageSelect = (languageCode: string) => {
    const requirements = languageRequirements[languageCode];
    
    if (requirements.required) {
      // Show verification modal
      setPendingLanguage(languageCode);
      setShowVerificationModal(true);
      setIsDropdownOpen(false);
    } else {
      // Switch immediately (English)
      setLanguage(languageCode);
      onLanguageChange?.(languageCode);
      setIsDropdownOpen(false);
    }
  };

  const handleVerificationSuccess = () => {
    // Switch to pending language after successful verification
    setLanguage(pendingLanguage);
    onLanguageChange?.(pendingLanguage);
    setPendingLanguage('');
    setShowVerificationModal(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Language Selector Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isLoading}
        className="
          flex items-center gap-2 px-4 py-2 
          bg-white border border-gray-300 
          rounded-lg shadow-sm 
          hover:bg-gray-50 
          focus:outline-none focus:ring-2 focus:ring-blue-500 
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        "
      >
        <svg 
          className="w-5 h-5 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
          />
        </svg>
        
        <span className="font-medium text-gray-700">
          {supportedLanguages[currentLanguage as keyof typeof supportedLanguages]?.name || 'English'}
        </span>
        
        <span className="text-sm text-gray-500">
          ({currentLanguage.toUpperCase()})
        </span>
        
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
        
        {isLoading && (
          <div className="ml-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="
          absolute top-full left-0 mt-2 w-56 
          bg-white border border-gray-200 
          rounded-lg shadow-lg 
          z-50 max-h-80 overflow-y-auto
        ">
          <div className="py-1">
            {Object.entries(supportedLanguages).map(([code, language]) => (
              <button
                key={code}
                onClick={() => handleLanguageSelect(code)}
                className={`
                  w-full px-4 py-2 text-left 
                  hover:bg-blue-50 hover:text-blue-600 
                  focus:bg-blue-50 focus:text-blue-600 
                  focus:outline-none 
                  transition-colors duration-150
                  ${currentLanguage === code 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-700'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{language.name}</span>
                  <span className="text-sm text-gray-500">
                    {code.toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Verification Modal */}
      <LanguageVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        targetLanguage={pendingLanguage}
        onVerified={handleVerificationSuccess}
        userEmail={userEmail}
      />

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSwitcher;
