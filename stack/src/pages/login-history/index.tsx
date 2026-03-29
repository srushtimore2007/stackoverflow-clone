"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import Mainlayout from "../../layout/Mainlayout";
import { useAuth } from "../../lib/AuthContext";
import axiosInstance from "../../lib/axiosinstance";
import { Clock, Globe, Monitor, Smartphone, Tablet } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslationManager } from "../../hooks/useTranslationManager";
import { ApiResponse } from "../../types/api.types";

interface LoginHistoryItem {
  _id: string;
  userId: string;
  ip: string;
  browser: string;
  os: string;
  deviceType: string;
  loginTime: string;
}

const LoginHistoryPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { t, locale } = useTranslationManager();
  
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoize device icon function to prevent re-creation
  const getDeviceIcon = useCallback((deviceType: string) => {
    switch (deviceType) {
      case "Mobile":
        return <Smartphone className="w-5 h-5" />;
      case "Tablet":
        return <Tablet className="w-5 h-5" />;
      case "Desktop":
      case "Laptop":
        return <Monitor className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  }, []);

  // Memoize date formatting function to prevent re-creation
  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  }, [locale]);

  // Fetch login history only once when user is available
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    let isMounted = true; // Prevent state updates on unmounted component

    const fetchLoginHistory = async () => {
      try {
        const res = await axiosInstance.get<ApiResponse<LoginHistoryItem[]>>("/api/login-history");
        if (res.data.success && isMounted) {
          setLoginHistory(res.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch login history:", error);
        if (isMounted) {
          toast.error("Failed to load login history");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLoginHistory();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [user]); // ✅ Only depend on user, not router

  // Memoize formatted history data to prevent unnecessary re-renders
  const formattedHistory = useMemo(() => {
    return loginHistory.map((item) => ({
      ...item,
      formatted: formatDateTime(item.loginTime),
    }));
  }, [loginHistory, formatDateTime]);

  if (loading) {
    return (
      <Mainlayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2" data-i18n-key="loginHistory.title">
            {t('loginHistory.title')}
          </h1>
          <p className="text-gray-600 text-sm" data-i18n-key="loginHistory.subtitle">
            {t('loginHistory.subtitle')}
          </p>
        </div>

        {formattedHistory.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600" data-i18n-key="loginHistory.noHistory">
                {t('loginHistory.noHistory')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle data-i18n-key="loginHistory.recentLogins">
                {t('loginHistory.recentLogins', { count: formattedHistory.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" data-i18n-key="loginHistory.loginTime">
                        {t('loginHistory.loginTime')}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" data-i18n-key="loginHistory.ipAddress">
                        {t('loginHistory.ipAddress')}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" data-i18n-key="loginHistory.device">
                        {t('loginHistory.device')}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" data-i18n-key="loginHistory.browser">
                        {t('loginHistory.browser')}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" data-i18n-key="loginHistory.operatingSystem">
                        {t('loginHistory.operatingSystem')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formattedHistory.map((item) => (
                      <tr
                        key={item._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.formatted.date}
                              </div>
                              <div className="text-xs text-gray-500">{item.formatted.time}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 font-mono">
                              {item.ip}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="text-gray-600">
                              {getDeviceIcon(item.deviceType)}
                            </div>
                            <span className="text-sm text-gray-700">
                              {item.deviceType}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700">
                            {item.browser}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700">
                            {item.os}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Mainlayout>
  );
};

export default LoginHistoryPage;
