

// src/app/auth/page.tsx

"use client";

import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useTranslationManager } from "../../hooks/useTranslationManager";

const LoginPage = () => {
  const router = useRouter();
  const { t, locale } = useTranslationManager();

  // ✅ FIXED HERE
  const { login, loading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error(t('login.allFieldsRequired'));
      return;
    }

    try {
      // ✅ FIXED HERE - login now returns OTP requirement info
      const result = await login(form);

      if (result.requiresOTP) {
        // Store email for OTP verification
        localStorage.setItem("pendingLoginEmail", form.email);
        
        // Redirect to OTP verification page
        router.push(`/auth/otp?email=${encodeURIComponent(form.email)}`);
        
        toast.info(result.message || t('login.loginFailed'));
      } else {
        // Direct login success
        toast.success(result.message || t('login.loginSuccessful'));
        router.push("/");
      }
    } catch (error: any) {
      console.error(error);
      // Handle conditional access errors (e.g., mobile time restriction)
      const errorMessage = error.message || t('login.loginFailed');
      toast.error(errorMessage);
      
      // If it's a conditional access error (403), show it clearly
      if (errorMessage.includes("Mobile login allowed only")) {
        toast.error(errorMessage, { autoClose: 5000 });
      }
    }
  };

  return (
    <div key={locale} className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 lg:mb-8">
          <Link href="/" className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded mr-2 flex items-center justify-center">
              <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-orange-500 rounded-sm"></div>
              </div>
            </div>
            <span className="text-lg lg:text-xl font-bold text-gray-800">
              {t('StackOverflow')}
            </span>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl lg:text-2xl">
                {t('auth.login.title')}
              </CardTitle>
              <CardDescription>
                {t('auth.login.subtitle')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('login.passwordPlaceholder')}
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? t('login.loggingIn') : t('auth.login.button')}
              </Button>

              <div className="text-center text-sm mt-2">
                <Link
                  href="/auth/forgotpassword"
                  className="text-blue-600 hover:underline"
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>

              <div className="text-center text-sm mt-2">
                {t('auth.login.noAccount')}{' '}
                <Link
                  href="/signup/signup"
                  className="text-blue-600 hover:underline"
                >
                  {t('auth.login.signup')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
