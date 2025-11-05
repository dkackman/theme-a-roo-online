import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { Toaster } from "sonner";
import "theme-o-rama/themes.css";
import Layout from "../components/Layout";
import { AuthProvider } from "../Contexts/AuthContext";
import { ClientThemeProvider } from "../Contexts/ClientThemeProvider";

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

  return (
    <AuthProvider>
      <ClientThemeProvider>
        <Head>
          <title>{fullTitle}</title>
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Toaster position="bottom-right" richColors />
        <Analytics debug={false} />
        <SpeedInsights debug={false} />
      </ClientThemeProvider>
    </AuthProvider>
  );
}
