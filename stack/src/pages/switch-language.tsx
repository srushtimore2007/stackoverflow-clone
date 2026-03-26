
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/language-context';

export default function HomePage() {
  const { t } = useTranslation('common');
  const { locale } = useLanguage();

  // Mock user data - replace with actual user data from your auth system
  const userData = {
    email: 'user@example.com',
    mobile: '+1234567890',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('welcome')}
            </h1>
            <LanguageSwitcher userData={userData} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Current Language: {locale.toUpperCase()}
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                Translation Examples:
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• {t('welcome')}</li>
                <li>• {t('logout')}</li>
                <li>• {t('submit')}</li>
                <li>• {t('cancel')}</li>
                <li>• {t('loading')}</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-700 mb-2">
                Language Switching:
              </h3>
              <p className="text-gray-600">
                To change language, click the language switcher above.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-500">
                <li>• French requires Email OTP verification</li>
                <li>• All other languages require Mobile OTP verification</li>
                <li>• OTP is valid for 5 minutes</li>
                <li>• Maximum 3 verification attempts</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-700 mb-2">
                Features Implemented:
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ 6 Language Support (EN, HI, ES, PT, ZH, FR)</li>
                <li>✓ Persistent Language Selection (Cookies)</li>
                <li>✓ Conditional OTP Authentication</li>
                <li>✓ Email OTP for French</li>
                <li>✓ Mobile OTP for Other Languages</li>
                <li>✓ Secure OTP Generation & Verification</li>
                <li>✓ Translation System with useTranslation Hook</li>
                <li>✓ Responsive UI with Loading States</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}