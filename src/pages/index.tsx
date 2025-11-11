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
import { Download, Palette, Plus } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../Contexts/AuthContext";
import { useUserThemes } from "../hooks/useUserThemes";
import { themesApi } from "../lib/data-access";
import { validateThemeJson } from "../lib/themes";

export default function Home() {
  const { user, loading } = useAuth();
  const {
    userThemes,
    isLoading: isLoadingUserThemes,
    loadUserThemes,
  } = useUserThemes();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await loadUserThemes();
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
      await loadUserThemes();
    } catch (error) {
      console.error("Error deleting theme:", error);
      toast.error("Failed to delete theme. Please try again.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const isUrl = (str: string): boolean => {
    try {
      // Check if it's a valid URL (http://, https://, data:, blob:, etc.)
      const _url = new URL(str);
      return true;
    } catch {
      // If it's not a valid URL, check if it starts with common URL protocols
      return /^(https?|data|blob):/i.test(str);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user) {
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Reset the input so the same file can be selected again
    event.target.value = "";

    setIsImporting(true);
    try {
      // Read file content
      const fileContent = await file.text();

      // Validate the theme using validateTheme from theme-o-rama
      const validatedTheme = validateThemeJson(fileContent);

      // Check if backgroundImage exists and is not a URL (i.e., it's a local file path)
      const themeWithBackground = validatedTheme as typeof validatedTheme & {
        backgroundImage?: string;
      };
      if (
        themeWithBackground.backgroundImage &&
        !isUrl(themeWithBackground.backgroundImage)
      ) {
        toast.warning(
          "Local background image files are not supported. Please upload the background image file in the theme editor after importing."
        );
      }

      // Set the name property to a new UUID v4
      const themeToImport = {
        ...validatedTheme,
        name: crypto.randomUUID(),
      };

      // Save the imported theme
      const theme = await themesApi.create({
        name: themeToImport.name,
        display_name: themeToImport.displayName,
        theme: themeToImport,
        user_id: user.id,
      });

      await loadUserThemes();
      router.push(`/theme-editor?id=${theme.id}`);
    } catch (error) {
      console.error("Error importing theme:", error);
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON format. Please check your file.");
      } else if (error instanceof Error) {
        toast.error(`Failed to import theme: ${error.message}`);
      } else {
        toast.error("Failed to import theme. Please try again.");
      }
    } finally {
      setIsImporting(false);
    }
  };

  if (loading || !user || isLoadingUserThemes) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
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
            <Button
              onClick={handleImportClick}
              variant="outline"
              disabled={isImporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>

        {userThemes.length === 0 ? (
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
                  <Button
                    onClick={handleImportClick}
                    variant="outline"
                    disabled={isImporting}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isImporting ? "Importing..." : "Import Theme"}
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userThemes.map((userTheme) => {
              const { theme, dbTheme } = userTheme;

              return (
                <Card
                  key={dbTheme.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/theme-editor?id=${dbTheme.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      {dbTheme.display_name}
                    </CardTitle>
                    <CardDescription>
                      {dbTheme.description
                        ? dbTheme.description.substring(0, 60) +
                          (dbTheme.description.length > 60 ? "..." : "")
                        : "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ThemeCard
                      key={dbTheme.id}
                      theme={theme}
                      isSelected={false}
                      onSelect={() => {}}
                    />
                  </CardContent>
                  <CardFooter>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium text-muted-foreground capitalize">
                        {dbTheme.status}
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DeleteButton
                          title="Delete Theme"
                          description={`Are you sure you want to delete "${dbTheme.display_name}"? This action cannot be undone.`}
                          onConfirm={() => handleDeleteTheme(dbTheme.id)}
                        />
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
