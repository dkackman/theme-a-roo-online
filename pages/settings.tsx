import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { ThemeSelector } from "../components/ThemeSelector";
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
      <div className="rounded-lg shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="h-8 w-8" />
          <h1 className="text-3xl font-bold ">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <ThemeSelector />
        </Card>
      </div>
    </div>
  );
}
