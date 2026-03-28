import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const publicRoutes = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/send-email-otp",
  "/api/auth/verify-email-otp",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

// ✅ REQUEST INTERCEPTOR (Axios v1 safe)
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

      const isPublicRoute = publicRoutes.some((route) =>
        config.url?.includes(route)
      );

      if (token && !isPublicRoute) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ✅ RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (typeof window !== "undefined") {
      if (error.response?.status === 401) {
        const isAuthRoute = publicRoutes.some((route) =>
          error.config?.url?.includes(route)
        );

        if (!isAuthRoute) {
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          window.location.href = "/auth/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;