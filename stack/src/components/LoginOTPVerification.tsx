"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import { useTranslationManager } from "../hooks/useTranslationManager";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import Link from "next/link";
import { toast } from "react-toastify";

const LoginOTPVerification = () => {
  const router = useRouter();
  const { verifyLoginOTP, loading } = useAuth();
  const { t, locale } = useTranslationManager();
  
  // Get email from URL query or localStorage
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Try to get email from URL query first
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromQuery = urlParams.get("email");
    
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    } else {
      // Fallback to localStorage
      const storedEmail = localStorage.getItem("pendingLoginEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, []);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError(t("otp.invalid"));
      return;
    }

    if (!email) {
      setError(t("otp.emailRequired"));
      return;
    }

    try {
      await verifyLoginOTP({ email, otp });
      
      setSuccess(t("otp.success"));
      toast.success(t("otp.loginSuccess"));
      
      // Clear stored email
      localStorage.removeItem("pendingLoginEmail");
      
      // Redirect to dashboard after successful verification
      setTimeout(() => {
        router.push("/");
      }, 1500);
      
    } catch (error: any) {
      const errorMessage = error.message || t("otp.verificationFailed");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleResendOTP = async () => {
    // This would require a new endpoint for resending OTP
    // For now, we'll just show a message
    toast.info(t("otp.resendMessage"));
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
              stack<span className="font-normal">overflow</span>
            </span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl lg:text-2xl">
              {t("otp.verifyTitle")}
            </CardTitle>
            <CardDescription>
              {t("otp.subtitle")}
              {email && (
                <div className="text-sm text-gray-600 mt-2">
                  {email}
                </div>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleVerifyOTP}>
              <div className="space-y-2">
                <Label htmlFor="otp">{t("otp.otpLabel")}</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder={t("otp.placeholder")}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-xl tracking-widest font-mono"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || otp.length !== 6}
              >
                {loading ? t("otp.verifying") : t("otp.verify")}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <button
                onClick={handleResendOTP}
                className="text-sm text-blue-600 hover:underline"
                disabled={loading}
              >
                {t("otp.resend")}
              </button>
              
              <div className="text-sm text-gray-600">
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:underline"
                >
                  {t("otp.backToLogin")}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginOTPVerification;
