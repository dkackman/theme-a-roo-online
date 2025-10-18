import { useEffect } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  // Keep server session in sync if you use SSR session endpoints later
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Optionally sync with server via /api/session for SSR
        fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: _event, session }),
        });
      }
    );
    return () => listener?.subscription?.unsubscribe();
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
