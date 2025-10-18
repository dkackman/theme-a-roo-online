import { Settings as SettingsIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuth } from "../lib/AuthContext";

export default function Settings() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="h-8 w-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <p className="text-gray-600">Settings will be available here soon.</p>
        </div>
      </div>
    </div>
  );
}
