import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "hi", "es", "pt", "zh", "fr"],
  },
  // optional: if using next-i18next, point it to your shared folder
  // localePath is used only by next-i18next; Next.js uses i18n.locales by default
};

export default nextConfig;
