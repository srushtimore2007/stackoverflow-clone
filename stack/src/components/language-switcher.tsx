'use client';

import React, { useState } from 'react';
import { useLanguage } from '../contexts/language-context';
import { LanguageOTPModal } from './LanguageOTPModal';
import { useTranslation } from '../hooks/useTranslation';
import { Locale } from '../shared/types/i18n';
import { localeConfigs } from '../shared/lib/i18n';
import { useLanguageOTP } from '../hooks/useLanguageOTP';
import axiosInstance from '../lib/axiosinstance';
import { LanguageOtpDialog } from './verification/LanguageOtpDialog';
import { SimulatedMobileOTPModal } from './verification/SimulatedMobileOTPModal';

interface UserData {
  email?: string;
  mobile?: string;
  id?: string;
}

interface LanguageSwitcherProps {
  userData: UserData;
}

export function LanguageSwitcher({ userData }: LanguageSwitcherProps) {
  const { locale, setLocale, isChangingLanguage } = useLanguage();
  const { t } = useTranslation('common');
  const { sendOTP, loading: sendOtpLoading } = useLanguageOTP();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const [sendOtpError, setSendOtpError] = useState<string | null>(null);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneDialogLocale, setPhoneDialogLocale] = useState<Locale | null>(null);

  const [simulatedOtpOpen, setSimulatedOtpOpen] = useState(false);
  const [simulatedOtpLocale, setSimulatedOtpLocale] = useState<Locale | null>(null);

  const isPending = !!pendingLocale || sendOtpLoading;

  const handleLanguageSelect = async (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsDropdownOpen(false);
      return;
    }

    if (!userData?.id) {
      alert(t('messages.verificationRequired') + ' Please log in to change language.');
      setIsDropdownOpen(false);
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingLanguage', newLocale);
    }

    setSendOtpError(null);
    setIsDropdownOpen(false);

    // Email OTP flow (French example)
    if (newLocale === 'fr') {
      const email = userData.email;

      if (!email) {
        alert(`${t('messages.verificationRequired')} Email required in your profile.`);
        return;
      }

      const result = await sendOTP(newLocale, undefined, email);

      if (result.success) {
        setPendingLocale(newLocale);
        setIsOTPModalOpen(true);
      } else {
        setSendOtpError(result.message || 'Failed to send OTP');
        alert(result.message || 'Failed to send OTP');
      }

      return;
    }

    // Phone OTP flow (Simulated)
    setSimulatedOtpLocale(newLocale);
    setSimulatedOtpOpen(true);
  };

  const handleOTPVerified = async (verifiedLocale: Locale) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingLanguage');
      }

      await axiosInstance.patch('/api/auth/language', { language: verifiedLocale });

      await setLocale(verifiedLocale);

      setPendingLocale(null);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleOTPModalClose = () => {
    setIsOTPModalOpen(false);
    setPendingLocale(null);
    setSendOtpError(null);
  };

  const handlePhoneDialogVerified = async (phoneNumber: string) => {
    if (!phoneDialogLocale) return;

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('userPhone', phoneNumber);
      }

      await axiosInstance.patch('/api/auth/language', { language: phoneDialogLocale });

      await setLocale(phoneDialogLocale);
    } catch (error) {
      console.error('Failed to change language after phone verification:', error);
    } finally {
      setPhoneDialogOpen(false);
      setPhoneDialogLocale(null);
    }
  };

  const handleSimulatedOtpVerified = async (phoneNumber: string) => {
    if (!simulatedOtpLocale) return;

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('userPhone', phoneNumber);
      }

      await axiosInstance.patch('/api/auth/language', { language: simulatedOtpLocale });

      await setLocale(simulatedOtpLocale);
    } catch (error) {
      console.error('Failed to change language after simulated phone verification:', error);
    } finally {
      setSimulatedOtpOpen(false);
      setSimulatedOtpLocale(null);
    }
  };

  const currentLocaleConfig = localeConfigs[locale];

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isChangingLanguage || isPending}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <span className="font-medium">{currentLocaleConfig.nativeName}</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                {t('languageSwitcher.title')}
              </div>

              {Object.values(localeConfigs).map((config) => (
                <button
                  key={config.code}
                  onClick={() => handleLanguageSelect(config.code)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between ${
                    locale === config.code ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <span className="font-medium">{config.nativeName}</span>

                  <span className="text-xs text-gray-500">
                    {config.otpMethod === 'email' ? '📧' : '📱'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <LanguageOTPModal
        isOpen={isOTPModalOpen}
        onClose={handleOTPModalClose}
        onVerified={handleOTPVerified}
        pendingLanguage={pendingLocale}
        userPhone={userData?.mobile ?? null}
        userEmail={userData?.email ?? null}
      />

      <LanguageOtpDialog
        open={phoneDialogOpen}
        onOpenChange={setPhoneDialogOpen}
        onVerified={handlePhoneDialogVerified}
        initialPhone={userData?.mobile ?? undefined}
      />

      <SimulatedMobileOTPModal
        open={simulatedOtpOpen}
        onOpenChange={setSimulatedOtpOpen}
        onVerified={handleSimulatedOtpVerified}
        initialPhone={userData?.mobile ?? undefined}
      />

      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </>
  );
}