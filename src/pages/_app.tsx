import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { Toaster } from "sonner";
import "theme-o-rama/themes.css";
import Layout from "../components/Layout";
import { ClientThemeProvider } from "../components/providers/ClientThemeProvider";
import { AuthProvider } from "../Contexts/AuthContext";

// Map routes to page titles
const pageTitles: Record<string, string> = {
  "/auth": "Sign In",
  "/theme-editor": "Theme Editor",
  "/profile": "Profile",
  "/settings": "Settings",
  "/admin": "Admin Dashboard",
};

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const pageTitle = pageTitles[router.pathname];
  const fullTitle = `${pageTitle ? `${pageTitle} - ` : ""}Theme-a-roo Online`;
  const [defaultTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    try {
      return localStorage.getItem("theme") || "light";
    } catch {
      return "light";
    }
  });

  return (
    <AuthProvider>
      <ClientThemeProvider initialTheme={defaultTheme}>
        <Head>
          <title>{fullTitle}</title>
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Toaster position="top-right" richColors />
        <Analytics />
        <SpeedInsights />
      </ClientThemeProvider>
    </AuthProvider>
  );
}
