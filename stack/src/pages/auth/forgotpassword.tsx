// // pages/auth/forgotpassword.tsx
// 'use client';

// import { useState, FormEvent } from 'react';
// import type { ForgotPasswordResponse } from '../../../../server/types/auth.types';
// import { useTranslation } from '../../hooks/useTranslation';
// import { useRouter } from 'next/router';
// import axiosInstance from '../../lib/axiosinstance';

// export default function ForgotPasswordPage() {
//   // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   // State Management
//   // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
//   const { t } = useTranslation('common');
//   const { t: tError } = useTranslation('errors');
//   const router = useRouter();
  
//   const [identifier, setIdentifier] = useState('');
//   const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
//   const [loading, setLoading] = useState(false);
//   const [response, setResponse] = useState<ForgotPasswordResponse | null>(null);

//   // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   // Form Submission Handler
//   // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//   e.preventDefault();

//   setResponse(null);
//   setLoading(true);

//   try {
//     const res = await axiosInstance.post("/api/auth/forgot-password", {
//       identifier: identifier.trim(), // must be non-empty
//       identifierType,                // "email" or "phone" from state
//     });

//     setResponse(res.data);

//     if (res.data.success) {
//       setIdentifier(""); // clear form on success
//     }
//   } catch (error: any) {
//     console.error("Request failed:", error);
//     setResponse({
//       success: false,
//       message: "Network error",
//       error: "NETWORK_ERROR",
//     });
//   } finally {
//     setLoading(false);
//   }
// };


//   // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   // Render
//   // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
        
//         {/* Header */}
//         <div>
//           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
//             {t('forgotPassword.title')}
//           </h2>
//           <p className="mt-2 text-center text-sm text-gray-600">
//             {t('forgotPassword.subtitle')}
//           </p>
//         </div>

//         {/* Form */}
//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//           <div className="rounded-md shadow-sm space-y-4">
            
//             {/* Identifier Type Selector */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 {t('forgotPassword.resetMethod')}
//               </label>
//               <div className="flex gap-4">
//                 <button
//                   type="button"
//                   onClick={() => setIdentifierType('email')}
//                   className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
//                     identifierType === 'email'
//                       ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
//                       : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
//                   }`}
//                 >
//                   📧 {t('forgotPassword.email')}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setIdentifierType('phone')}
//                   className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
//                     identifierType === 'phone'
//                       ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
//                       : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
//                   }`}
//                 >
//                   📱 {t('forgotPassword.phone')}
//                 </button>
//               </div>
//             </div>

//             {/* Input Field */}
//             <div>
//               <label htmlFor="identifier" className="sr-only">
//                 {identifierType === 'email' ? t('forgotPassword.emailLabel') : t('forgotPassword.phoneLabel')}
//               </label>
//               <input
//                 id="identifier"
//                 name="identifier"
//                 type={identifierType === 'email' ? 'email' : 'tel'}
//                 autoComplete={identifierType === 'email' ? 'email' : 'tel'}
//                 required
//                 value={identifier}
//                 onChange={(e) => setIdentifier(e.target.value)}
//                 className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
//                 placeholder={
//                   identifierType === 'email'
//                     ? t('forgotPassword.emailPlaceholder')
//                     : t('forgotPassword.phonePlaceholder')
//                 }
//                 disabled={loading}
//               />
//             </div>
//           </div>

//           {/* Alert Messages */}
//           {response && (
//             <div
//               className={`rounded-lg p-4 ${
//                 response.success
//                   ? 'bg-green-50 border border-green-200'
//                   : 'bg-red-50 border border-red-200'
//               }`}
//             >
//               <div className="flex">
//                 <div className="flex-shrink-0">
//                   {response.success ? (
//                     <svg
//                       className="h-5 w-5 text-green-400"
//                       xmlns="http://www.w3.org/2000/svg"
//                       viewBox="0 0 20 20"
//                       fill="currentColor"
//                     >
//                       <path
//                         fillRule="evenodd"
//                         d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                         clipRule="evenodd"
//                       />
//                     </svg>
//                   ) : (
//                     <svg
//                       className="h-5 w-5 text-red-400"
//                       xmlns="http://www.w3.org/2000/svg"
//                       viewBox="0 0 20 20"
//                       fill="currentColor"
//                     >
//                       <path
//                         fillRule="evenodd"
//                         d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                         clipRule="evenodd"
//                       />
//                     </svg>
//                   )}
//                 </div>
//                 <div className="ml-3">
//                   <p
//                     className={`text-sm font-medium ${
//                       response.success ? 'text-green-800' : 'text-red-800'
//                     }`}
//                   >
//                     {response.message}
//                   </p>
//                   {response.success && response.data && (
//                     <p className="mt-1 text-xs text-green-700">
//                       {t('forgotPassword.successMessage', { maskedIdentifier: response.data.sentTo })}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Submit Button */}
//           <div>
//             <button
//               type="submit"
//               disabled={loading || !identifier.trim()}
//               className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-colors ${
//                 loading || !identifier.trim()
//                   ? 'bg-indigo-400 cursor-not-allowed'
//                   : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
//               }`}
//             >
//               {loading ? (
//                 <>
//                   <svg
//                     className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                   {t('forgotPassword.processing')}
//                 </>
//               ) : (
//                 t('forgotPassword.resetButton')
//               )}
//             </button>
//           </div>

//           {/* Back to Login Link */}
//           <div className="text-center">
//             <button
//               type="button"
//               onClick={() => router.push('/auth/login')}
//               className="font-medium text-indigo-600 hover:text-indigo-500 text-sm"
//             >
//               {t('forgotPassword.backToLogin')}
//             </button>
//           </div>
//         </form>

//         {/* Security Notice */}
//         <div className="mt-6 text-center">
//           <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-4">
//             <p className="font-semibold mb-1">🔒 {t('forgotPassword.securityNotice')}</p>
//             <p>
//               {t('forgotPassword.securityNoticeText')}
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// pages/auth/forgotpassword.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import axiosInstance from '../../lib/axiosinstance';
import { useTranslation } from 'react-i18next';
import type { ForgotPasswordResponse } from '../../types/auth.types';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ForgotPasswordResponse | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!identifier.trim()) {
      setResponse({
        success: false,
        message: t('forgotPassword.emptyIdentifier'),
        error: 'EMPTY_IDENTIFIER',
      });
      return;
    }

    setResponse(null);
    setLoading(true);

    try {
      const res = await axiosInstance.post<ForgotPasswordResponse>(
        '/api/auth/forgot-password',
        {
          identifier: identifier.trim(),
          identifierType,
        }
      );

      setResponse(res.data);

      if (res.data.success) {
        setIdentifier('');
      }
    } catch (error: any) {
      // Extract message from API response if available
      let message = t('forgotPassword.networkError');
      
      if (error.response?.data?.message) {
        // Use the exact message from backend API response
        message = error.response.data.message;
      } else if (error.response?.status === 404) {
        message = t('forgotPassword.userNotFound');
      } else if (error.response?.status === 429) {
        message = t('forgotPassword.rateLimitExceeded');
      }

      // Minimal logging for debugging
      console.error('Forgot password request failed:', error.response?.status, message);

      setResponse({
        success: false,
        message,
        error: 'REQUEST_FAILED',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('forgotPassword.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('forgotPassword.subtitle')}
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">

            {/* Identifier Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forgotPassword.resetMethod')}
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIdentifierType('email')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    identifierType === 'email'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  📧 {t('forgotPassword.email')}
                </button>
                <button
                  type="button"
                  onClick={() => setIdentifierType('phone')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    identifierType === 'phone'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  📱 {t('forgotPassword.phone')}
                </button>
              </div>
            </div>

            {/* Input Field */}
            <div>
              <input
                id="identifier"
                name="identifier"
                type={identifierType === 'email' ? 'email' : 'tel'}
                autoComplete={identifierType === 'email' ? 'email' : 'tel'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={
                  identifierType === 'email'
                    ? t('forgotPassword.emailPlaceholder')
                    : t('forgotPassword.phonePlaceholder')
                }
                disabled={loading}
              />
            </div>
          </div>

          {/* Alert Messages */}
          {response && (
            <div className={`rounded-lg p-4 ${response.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {response.success ? (
                    <span className="text-green-400">✔</span>
                  ) : (
                    <span className="text-red-400">✖</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${response.success ? 'text-green-800' : 'text-red-800'}`}>
                    {response.message}
                  </p>
                  {response.success && response.data && (
                    <p className="mt-1 text-xs text-green-700">
                      {t('forgotPassword.successMessage', { maskedIdentifier: response.data.sentTo })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-colors ${
                loading || !identifier.trim()
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-2 mr-2 h-5 w-5 text-white inline"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('forgotPassword.processing')}
                </>
              ) : (
                t('forgotPassword.resetButton')
              )}
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="font-medium text-indigo-600 hover:text-indigo-500 text-sm"
            >
              ← {t('forgotPassword.backToLogin')}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-4">
            <p className="font-semibold mb-1">🔒 {t('forgotPassword.securityNotice')}</p>
            <p>
              {t('forgotPassword.securityNoticeText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
