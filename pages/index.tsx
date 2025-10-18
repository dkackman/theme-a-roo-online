import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuth } from "../lib/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
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
  );
}
