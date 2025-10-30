import { ThemeCard } from "@/components/ThemeCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Check, Download, Palette, PencilOff, Plus } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Theme, useTheme } from "theme-o-rama";
import { useAuth } from "../Contexts/AuthContext";
import { DbTheme, themesApi } from "../lib/data-access";

export default function Home() {
  const { user, loading } = useAuth();
  const { initializeTheme } = useTheme();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [themes, setThemes] = useState<DbTheme[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);
  const [initializedThemes, setInitializedThemes] = useState<(Theme | null)[]>(
    []
  );

  // Pre-initialize themes for performance
  useEffect(() => {
    const initializeAllThemes = async () => {
      const initialized = await Promise.all(
        themes.map(async (theme) => {
          if (!theme.theme) {
            return null;
          }

          try {
            const themeData =
              typeof theme.theme === "string"
                ? (JSON.parse(theme.theme) as Theme)
                : (theme.theme as unknown as Theme);

            return await initializeTheme(themeData);
          } catch {
            return null;
          }
        })
      );
      setInitializedThemes(initialized);
    };

    if (themes.length > 0) {
      initializeAllThemes();
    } else {
      setInitializedThemes([]);
    }
  }, [themes, initializeTheme]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchThemes = async () => {
      if (!user) {
        return;
      }

      setIsLoadingThemes(true);
      try {
        const userThemes = await themesApi.getByUserId(user.id);
        setThemes(userThemes);
      } catch (error) {
        console.error("Error fetching themes:", error);
        toast.error("Failed to load themes");
      } finally {
        setIsLoadingThemes(false);
      }
    };

    if (user) {
      fetchThemes();
    }
  }, [user]);

  const handleCreateTheme = async () => {
    if (!user) {
      return;
    }

    setIsCreating(true);
    try {
      // Create the theme JSON
      // the name and display name are both in the themeJson object
      // and the database record (for easy retreival)
      const themeJson = {
        name: crypto.randomUUID(),
        displayName: "My New Theme",
        schemaVersion: 1,
        mostLike: "light",
        inherits: "light",
      };

      const theme = await themesApi.create({
        name: themeJson.name,
        display_name: themeJson.displayName,
        theme: themeJson,
        user_id: user.id,
      });

      toast.success("Theme created successfully!");

      // Add to local state
      setThemes([...themes, theme]);

      // Navigate to the theme editor with the theme ID
      router.push(`/theme-editor?id=${theme.id}`);
    } catch (error) {
      console.error("Error creating theme:", error);
      toast.error("Failed to create theme. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!user) {
      return;
    }

    try {
      await themesApi.delete(themeId);
      toast.success("Theme deleted successfully!");

      // Remove from local state
      setThemes(themes.filter((theme) => theme.id !== themeId));
    } catch (error) {
      console.error("Error deleting theme:", error);
      toast.error("Failed to delete theme. Please try again.");
    }
  };

  if (loading || !user || isLoadingThemes) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Themes</h1>
            <p className="text-muted-foreground">
              Create and manage your custom themes
            </p>
          </div>
          <div className="flex gap-2">
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
              Import
            </Button>
          </div>
        </div>

        {themes.length === 0 ? (
          <Card className="rounded-2xl shadow-xl p-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Palette />
                </EmptyMedia>
                <EmptyTitle>No Themes Yet</EmptyTitle>
                <EmptyDescription>
                  You haven&apos;t created any themes yet. Get started by
                  creating your first theme.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-3 justify-center">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((theme, index) => (
              <Card
                key={theme.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/theme-editor?id=${theme.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    {theme.display_name}
                  </CardTitle>
                  <CardDescription>
                    {theme.notes
                      ? theme.notes.substring(0, 60) +
                        (theme.notes.length > 60 ? "..." : "")
                      : "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemeCard
                    key={theme.id}
                    theme={initializedThemes[index] || null}
                    isSelected={false}
                    onSelect={() => {}}
                  />
                </CardContent>
                <CardFooter>
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-muted-foreground">
                      {theme.is_draft ? (
                        <div title="Draft" className="flex items-center gap-2">
                          <PencilOff className="w-4 h-4 mr-2 text-muted-foreground" />
                        </div>
                      ) : (
                        <div title="Active" className="flex items-center gap-2">
                          <Check className="w-4 h-4 mr-2 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DeleteButton
                        title="Delete Theme"
                        description={`Are you sure you want to delete "${theme.display_name}"? This action cannot be undone.`}
                        onConfirm={() => handleDeleteTheme(theme.id)}
                      />
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
