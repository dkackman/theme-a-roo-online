import type { AppProps } from "next/app";
import Layout from "../components/Layout";
import { AuthProvider } from "../lib/AuthContext";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
