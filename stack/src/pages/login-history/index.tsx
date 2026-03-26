"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import Mainlayout from "../../layout/Mainlayout";
import { useAuth } from "../../lib/AuthContext";
import axiosInstance from "../../lib/axiosinstance";
import { Clock, Globe, Monitor, Smartphone, Tablet } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

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
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const fetchLoginHistory = async () => {
      try {
            const res = await axiosInstance.get("/api/login-history");          
            if (res.data.success) {
            setLoginHistory(res.data.data || []);
          }
      } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.message || "Failed to load login history");
      } finally {
        setLoading(false);
      }
    };

    fetchLoginHistory();
  }, [user, router]);

  const getDeviceIcon = (deviceType: string) => {
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
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  };

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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
            Login History
          </h1>
          <p className="text-gray-600 text-sm">
            View all your recent login activity and device information
          </p>
        </div>

        {loginHistory.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No login history found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Logins ({loginHistory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Date & Time
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        IP Address
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Device
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Browser
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Operating System
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((item) => {
                      const { date, time } = formatDateTime(item.loginTime);
                      return (
                        <tr
                          key={item._id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {date}
                                </div>
                                <div className="text-xs text-gray-500">{time}</div>
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
                            <span className="text-sm text-gray-700">{item.os}</span>
                          </td>
                        </tr>
                      );
                    })}
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
