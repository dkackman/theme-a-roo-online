import { ThemeEditorActions } from "@/components/ThemeEditorActions";
import { ThemeEditorTabs } from "@/components/ThemeEditorTabs";
import { ThemePreview } from "@/components/ThemePreview";
import { ThemeProperties } from "@/components/ThemeProperties";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Maximize2, Minimize2 } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSimpleTheme, type Theme } from "theme-o-rama";
import { useAuth } from "../Contexts/AuthContext";
import { ThemeEditorProvider } from "../Contexts/ThemeEditorContext";
import { useThemeOperations } from "../hooks/useThemeOperations";
import { themesApi } from "../lib/data-access";
import type { Database } from "../lib/database.types";

type DbTheme = Database["public"]["Tables"]["themes"]["Row"];

export default function ThemeEditor() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [theme, setTheme] = useState<DbTheme | null>(null);
  const [themeJson, setThemeJson] = useState("");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [themeStatus, setThemeStatus] = useState<DbTheme["status"]>("draft");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editorTheme, setEditorTheme] = useState<"vs" | "vs-dark">("vs");
  const [isMaximized, setIsMaximized] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme-editor-maximized");
      return saved === "true";
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState("json");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Theme operations hook
  const {
    saveTheme,
    saveProperties,
    deleteTheme,
    validateTheme,
    isSaving,
    isSavingNotes,
    isDeleting,
  } = useThemeOperations({
    theme,
    user,
    onThemeUpdate: setTheme,
  });

  // Simple theme hook for applying themes
  const { setTheme: setCurrentTheme, initializeTheme } = useSimpleTheme();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Save maximized state to localStorage
  useEffect(() => {
    localStorage.setItem("theme-editor-maximized", String(isMaximized));
  }, [isMaximized]);

  useEffect(() => {
    // Set editor theme based on html element's color-scheme style property
    const updateEditorTheme = () => {
      if (typeof document === "undefined") {
        setEditorTheme("vs");
        return;
      }

      const colorScheme = document.documentElement.style.colorScheme;
      setEditorTheme(colorScheme === "dark" ? "vs-dark" : "vs");
    };

    updateEditorTheme();

    const observer = new MutationObserver(updateEditorTheme);
    if (typeof document !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }

    return () => observer.disconnect();
  }, []);

  const loadTheme = useCallback(async () => {
    if (!user || !id || typeof id !== "string") {
      return;
    }

    setIsLoadingTheme(true);
    try {
      const data = await themesApi.getById(id, user.id);
      setTheme(data);
      let themeJsonString = "";
      if (typeof data.theme === "string") {
        try {
          const parsed = JSON.parse(data.theme);
          themeJsonString = JSON.stringify(parsed, null, 2);
        } catch {
          themeJsonString = data.theme;
        }
      } else {
        themeJsonString = JSON.stringify(data.theme, null, 2);
      }
      setThemeJson(themeJsonString);
      setNotes(data.notes || "");
      setThemeStatus(data.status);

      setValidationError(null);
    } catch (error) {
      console.error("Error loading theme:", error);
      toast.error("Failed to load theme");
    } finally {
      setIsLoadingTheme(false);
    }
  }, [id, user]);

  // Parse theme JSON to get the theme object for the context
  const parsedTheme: Theme | null = (() => {
    try {
      return themeJson ? JSON.parse(themeJson) : null;
    } catch {
      return null;
    }
  })();

  const handleThemeChange = (newTheme: Theme) => {
    const jsonString = JSON.stringify(newTheme, null, 2);
    setThemeJson(jsonString);
  };

  const handleThemeJsonChange = useCallback((json: string) => {
    setThemeJson(json);
  }, []);

  useEffect(() => {
    if (id && user) {
      void loadTheme();
    }
  }, [id, loadTheme, user]);

  useEffect(() => {
    if (theme) {
      setThemeStatus(theme.status);
    }
  }, [theme]);

  const handleSaveTheme = () => saveTheme(themeJson);

  const handleSaveProperties = async () => {
    const success = await saveProperties(notes, themeStatus);
    if (success) {
      setIsEditSheetOpen(false);
    }
  };

  const handleDeleteTheme = async () => {
    await deleteTheme();
    setIsDeleteDialogOpen(false);
  };

  const handleApplyTheme = async () => {
    try {
      // Validate the theme first
      const validationError = validateTheme(themeJson);
      if (validationError) {
        toast.error(`Cannot apply theme: ${validationError}`);
        return;
      }

      // Parse the theme JSON
      const themeToApply = JSON.parse(themeJson) as Theme;

      // Initialize the theme (this processes images, colors, etc.)
      const initializedTheme = await initializeTheme(themeToApply);

      // Set it as the current theme
      setCurrentTheme(initializedTheme);

      toast.success("Theme applied successfully!");
    } catch (error) {
      console.error("Error applying theme:", error);
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON format. Please check your syntax.");
      } else if (error instanceof Error) {
        toast.error(`Failed to apply theme: ${error.message}`);
      } else {
        toast.error("Failed to apply theme");
      }
    }
  };

  if (loading || !user || isLoadingTheme) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Theme not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isThemeJsonValid = validationError === null;

  return (
    <ThemeEditorProvider
      theme={parsedTheme}
      themeJson={themeJson}
      onThemeChange={handleThemeChange}
      onThemeJsonChange={handleThemeJsonChange}
    >
      {isMaximized ? (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-background flex flex-col">
          <Card className="flex-1 flex flex-col rounded-none border-0">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-3 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {theme.display_name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <ThemeEditorActions
                  onEdit={() => setIsEditSheetOpen(true)}
                  onSave={handleSaveTheme}
                  onApply={handleApplyTheme}
                  onPublish={() => {}}
                  onDelete={() => setIsDeleteDialogOpen(true)}
                  isSaving={isSaving}
                  isThemeValid={isThemeJsonValid}
                />
                <Button onClick={() => setIsMaximized(false)} size="sm">
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <div className="flex-1 flex flex-col overflow-hidden">
              <ThemeEditorTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                themeJson={themeJson}
                onThemeJsonChange={handleThemeJsonChange}
                editorTheme={editorTheme}
                isMaximized={true}
                themeId={theme?.id}
                validationError={validationError}
              />
            </div>
          </Card>
        </div>
      ) : (
        <div className="container max-w-6xl mx-auto px-4">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-4">{theme.display_name}</h1>
            </div>
            <div className="flex items-center justify-between">
              <ThemeEditorActions
                onEdit={() => setIsEditSheetOpen(true)}
                onSave={handleSaveTheme}
                onApply={handleApplyTheme}
                onPublish={() => {}}
                onDelete={() => setIsDeleteDialogOpen(true)}
                isSaving={isSaving}
                isThemeValid={isThemeJsonValid}
              />
              <Button
                onClick={() => setIsMaximized(true)}
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>

            <ThemeEditorTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              themeJson={themeJson}
              onThemeJsonChange={handleThemeJsonChange}
              editorTheme={editorTheme}
              isMaximized={false}
              themeId={theme?.id}
              validationError={validationError}
            />
          </div>
        </div>
      )}

      <ThemePreview
        themeJson={themeJson}
        validateTheme={validateTheme}
        onValidationChange={setValidationError}
      />
      <ThemeProperties
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        status={themeStatus}
        onStatusChange={setThemeStatus}
        notes={notes}
        onNotesChange={setNotes}
        onSave={handleSaveProperties}
        isSaving={isSavingNotes}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Theme?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{theme.display_name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTheme}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ThemeEditorProvider>
  );
}
