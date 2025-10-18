import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { AuthProvider } from "../lib/AuthContext";
import "../styles/globals.css";

// Map routes to page titles
const pageTitles: Record<string, string> = {
  "/": "Home",
  "/auth": "Sign In",
  "/dids": "DIDs",
  "/profile": "Profile",
  "/settings": "Settings",
  "/admin": "Admin Dashboard",
};

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const pageTitle = pageTitles[router.pathname] || "Page";
  const fullTitle = `${pageTitle} - Theme-a-roo Online`;

  return (
    <AuthProvider>
      <Head>
        <title>{fullTitle}</title>
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <Analytics />
      <SpeedInsights />
    </AuthProvider>
  );
}
