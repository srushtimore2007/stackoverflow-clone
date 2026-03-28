// src/lib/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface AuthContextType {
  user: any | null;
  loading: boolean;
  rewards: { points: number; badges: string[] } | null;
  refreshRewards: () => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  login: (data: {
    email: string;
    password: string;
  }) => Promise<{ requiresOTP: boolean; message: string }>;
  verifyLoginOTP: (data: { email: string; otp: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  rewards: null,
  refreshRewards: async () => {},
  signup: async () => {},
  login: async () => ({ requiresOTP: false, message: "" }),
  verifyLoginOTP: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState<{ points: number; badges: string[] } | null>(
    null
  );

const API = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}`
  : "http://localhost:5000";

  const refreshRewards = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      setRewards(null);
      return;
    }

    try {
      const res = await fetch(`${API}/api/points/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        setRewards(null);
        return;
      }
      const json = await res.json();
      const data = json?.data;
      if (data && typeof data.points === "number") {
        setRewards({ points: data.points, badges: data.badges || [] });
      } else {
        setRewards(null);
      }
    } catch (e) {
      console.error("[refreshRewards]", e);
      setRewards(null);
    }
  };

  // 🔁 Load user on refresh
 useEffect(() => {
  if (typeof window !== "undefined") {
    try {
      const storedUser = localStorage.getItem("user");

      console.log("Stored user:", storedUser); // debug

      if (
        storedUser &&
        storedUser !== "undefined" &&
        storedUser !== "null"
      ) {
        setUser(JSON.parse(storedUser));
      } else {
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.error("Error parsing user:", error);
      localStorage.removeItem("user");
    }
  }
}, []);

  // Refresh rewards when user changes (login/logout)
  useEffect(() => {
    if (user) refreshRewards();
    else setRewards(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // 📝 SIGNUP
  const signup = async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Signup failed");
      }

      const result = await res.json();
      const userData = result.data || result.user;

      setUser(userData);

      // ✅ SAVE USER
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData));
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
      }
      await refreshRewards();
    } finally {
      setLoading(false);
    }
  };

  // 🔐 LOGIN
  const login = async (data: {
    email: string;
    password: string;
  }): Promise<{ requiresOTP: boolean; message: string }> => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        // Preserve the error message for conditional access rules
        const errorMessage = error.message || "Login failed";
        throw new Error(errorMessage);
      }

      const result = await res.json();
      
      // Handle OTP requirement
      if (result.requiresOTP) {
        return {
          requiresOTP: true,
          message: result.message || "OTP required for login"
        };
      }

      // Direct login success
      const userData = result.data || result.user;
      setUser(userData);

      // ✅ SAVE USER
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData));
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
      }
      await refreshRewards();

      return {
        requiresOTP: false,
        message: result.message || "Login successful"
      };
    } catch (error) {
      // Re-throw error to be handled by the calling component
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔄 VERIFY LOGIN OTP
  const verifyLoginOTP = async (data: { email: string; otp: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-login-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "OTP verification failed");
      }

      const result = await res.json();
      const userData = result.data || result.user;

      setUser(userData);

      // ✅ SAVE USER
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData));
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
      }
      await refreshRewards();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, rewards, refreshRewards, signup, login, verifyLoginOTP, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

