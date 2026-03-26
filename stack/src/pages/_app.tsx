import '../styles/globals.css'
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "../lib/AuthContext";
import { LanguageProvider } from "../contexts/language-context";
import { TranslationProvider } from "../contexts/TranslationContext";
import { I18nextProvider } from "react-i18next";
import i18n from "../lib/i18n";
import '../lib/i18n';
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Moved Head settings to include additional meta tags for better SEO and responsiveness */}
      <Head>
        <title>Code-Quest</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Code-Quest: Master coding with real challenges, instant feedback, and a supportive community. Level up your learning adventure." />
        <meta charSet="utf-8" />
      </Head>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <LanguageProvider>
            <TranslationProvider>
              {/* Invisible reCAPTCHA container for Firebase phone OTP */}
              <div id="recaptcha-container" aria-hidden="true" style={{ display: 'none' }} />
              <ToastContainer />
              <Component {...pageProps} />
            </TranslationProvider>
          </LanguageProvider>
        </AuthProvider>
      </I18nextProvider>
    </>
  );
}
