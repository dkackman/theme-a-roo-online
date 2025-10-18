import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.push("/auth");
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Home - Theme-a-roo Online</title>
        <meta
          name="description"
          content="Theme-a-roo Online - Manage your DIDs and themes"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="bg-white rounded-2xl shadow-xl p-10">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">
          Welcome to Theme-a-roo Online
        </h1>
        <div className="flex gap-4">
          <Link
            href="/dids"
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to DIDs
          </Link>
          <Link
            href="/profile"
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </>
  );
}
