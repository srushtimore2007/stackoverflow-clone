'use client';
import { useTranslationManager } from '../../hooks/useTranslationManager';
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { useAuth } from "../../lib/AuthContext";
import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

export default function SignUpPage() {
  const { t, locale } = useTranslationManager();
  const router = useRouter();

  // ✅ FIXED HERE
  const { signup, loading } = useAuth();

  const [form, setform] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: any) => {
    setform({ ...form, [e.target.id]: e.target.value });
  };

  const handlesubmit = async (e: any) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      toast.error(t('signup.allFieldsRequired'));
      return;
    }

    try {
      // ✅ FIXED HERE
      await signup(form);

      toast.success(t('signup.signupSuccess'));

      router.push("/");
    } catch (error: any) {
      toast.error(error.message || t('signup.signupFailed'));
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
              Stack<span className="font-normal">overflow</span>
            </span>
          </Link>
        </div>

        <form onSubmit={handlesubmit}>
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl lg:text-2xl">
                {t('auth.signup.title')}
              </CardTitle>
              <CardDescription>
                {t('auth.signup.subtitle')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full bg-transparent text-sm"
              >
                Sign up with Google
              </Button>

              <Button
                variant="outline"
                className="w-full bg-transparent text-sm"
              >
                Sign up with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.signup.name')}</Label>
                <Input
                  id="name"
                  placeholder={t('signup.namePlaceholder')}
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.signup.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('signup.emailPlaceholder')}
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.signup.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('signup.passwordPlaceholder')}
                  value={form.password}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-600">
                  {t('signup.passwordMinLength')}
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox id="terms" className="mt-1" />
                <Label htmlFor="terms" className="text-sm">
                  {t('auth.signup.agreeTermsPrivacy')}
                </Label>
              </div>

              <Button type="submit" className="w-full bg-blue-600">
                {loading ? t('signup.signingUp') : t('auth.signup.button')}
              </Button>

              <div className="text-center text-sm">
                {t('auth.signup.haveAccount')}{' '}
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:underline"
                >
                  {t('auth.signup.login')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
