import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Download, Palette, Plus } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../Contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const handleCreateTheme = async () => {
    if (!user) {
      return;
    }

    setIsCreating(true);
    try {
      // Generate a UUID for the theme name
      const themeId = crypto.randomUUID();
      const displayName = "My New Theme";

      // Create the theme JSON
      const themeJson = {
        name: themeId,
        display_name: displayName,
        schema_version: 1,
        most_like: "light",
      };

      // Insert the new theme into the database
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { data, error } = await supabase
        .from("themes")
        .insert({
          name: themeId,
          display_name: displayName,
          theme: themeJson,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success("Theme created successfully!");

      // Navigate to the theme editor with the theme ID
      router.push(`/theme-editor?id=${data.id}`);
    } catch (error) {
      console.error("Error creating theme:", error);
      toast.error("Failed to create theme. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

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
        <h1 className="text-4xl font-bold">Welcome to Theme-a-roo Online</h1>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Palette />
            </EmptyMedia>
            <EmptyTitle>No Themes Yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any themes yet. Get started by creating
              your first theme.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-3">
              <Button
                onClick={handleCreateTheme}
                variant="default"
                disabled={isCreating}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreating ? "Creating..." : "Create Theme"}
              </Button>
              <Button onClick={() => {}} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Import Theme
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </Card>
    </div>
  );
}
