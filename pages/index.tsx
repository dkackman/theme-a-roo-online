import { Card } from "@/components/ui/card";
import { Palette } from "lucide-react";
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
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Card className="rounded-2xl shadow-xl p-10">
        <h1 className="text-4xl font-bold mb-6">
          Welcome to Theme-a-roo Online
        </h1>
        <div className="text-center py-12">
          <Palette className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your Themes</h2>
          <p className="text-muted-foreground">Your themes will appear here</p>
        </div>
      </Card>
    </div>
  );
}
