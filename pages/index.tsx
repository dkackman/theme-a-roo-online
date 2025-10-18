import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <Card className="rounded-2xl shadow-xl p-10">
      <h1 className="text-4xl font-bold mb-6 ">
        Welcome to Theme-a-roo Online
      </h1>
      <div className="flex gap-4">
        <Button variant="default" asChild>
          <Link href="/dids">Go to DIDs</Link>
        </Button>

        <Button variant="secondary" asChild>
          <Link href="/profile">View Profile</Link>
        </Button>
      </div>
    </Card>
  );
}
