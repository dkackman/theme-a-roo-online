import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Nav() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data?.session?.user ?? null);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/dids"
              className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
            >
              DIDs
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-600 text-sm">Hi, {user.email}</span>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
