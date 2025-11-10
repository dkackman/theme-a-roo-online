import { ThemeEditorHeader } from "@/components/ThemeEditorHeader";
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
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { useSimpleTheme, type Theme } from "theme-o-rama";
import { useAuth } from "../Contexts/AuthContext";
import { ThemeEditorProvider } from "../Contexts/ThemeEditorContext";
import { useThemeOperations } from "../hooks/useThemeOperations";
import { themesApi } from "../lib/data-access";
import type { Database } from "../lib/database.types";

type DbTheme = Database["public"]["Tables"]["themes"]["Row"];

type EditorLayoutMode = "normal" | "maximized";

const LAYOUT_STORAGE_KEY = "theme-editor-layout";
const SIDE_BY_SIDE_STORAGE_KEY = "theme-editor-side-by-side";

export default function ThemeEditor() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const themeId = typeof id === "string" ? id : null;
  const userId = user?.id ?? null;

  const [theme, setTheme] = useState<DbTheme | null>(null);
  const [themeJson, setThemeJson] = useState("");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [themeStatus, setThemeStatus] = useState<DbTheme["status"]>("draft");
  const [authorName, setAuthorName] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [did, setDid] = useState("");
  const [royaltyAddress, setRoyaltyAddress] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editorTheme, setEditorTheme] = useState<"vs" | "vs-dark">("vs");
  const [layoutMode, setLayoutMode] = useState<EditorLayoutMode>(() => {
    if (typeof window === "undefined") {
      return "normal";
    }
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (stored === "normal" || stored === "maximized") {
      return stored;
    }
    const legacyMaximized = window.localStorage.getItem(
      "theme-editor-maximized"
    );
    if (legacyMaximized === "true") {
      return "maximized";
    }
    return "normal";
  });
  const [isSideBySide, setIsSideBySide] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const stored = window.localStorage.getItem(SIDE_BY_SIDE_STORAGE_KEY);
    return stored === "true";
  });
  const isSideBySideLayout = layoutMode === "maximized" && isSideBySide;
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, layoutMode);
    if (layoutMode === "maximized") {
      window.localStorage.setItem("theme-editor-maximized", "true");
    } else {
      window.localStorage.removeItem("theme-editor-maximized");
      if (isSideBySide) {
        setIsSideBySide(false);
      }
    }
  }, [layoutMode, isSideBySide]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      SIDE_BY_SIDE_STORAGE_KEY,
      isSideBySide ? "true" : "false"
    );
  }, [isSideBySide]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const mainElement = document.querySelector("main");
    if (!mainElement) {
      return;
    }

    if (isSideBySideLayout) {
      mainElement.classList.add("max-w-full", "px-0");
    } else {
      mainElement.classList.remove("max-w-full", "px-0");
    }

    return () => {
      mainElement.classList.remove("max-w-full", "px-0");
    };
  }, [layoutMode, isSideBySideLayout]);

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
    if (!userId || !themeId) {
      return;
    }

    setIsLoadingTheme(true);
    try {
      const data = await themesApi.getById(themeId, userId);
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
      setValidationError(null);
    } catch (error) {
      console.error("Error loading theme:", error);
      toast.error("Failed to load theme");
    } finally {
      setIsLoadingTheme(false);
    }
  }, [themeId, userId]);

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
    if (themeId && userId) {
      void loadTheme();
    }
  }, [loadTheme, themeId, userId]);

  useEffect(() => {
    if (!theme) {
      return;
    }
    setThemeStatus(theme.status);
    setDescription(theme.description ?? "");
    setAuthorName(theme.author_name ?? "");
    setSponsor(theme.sponsor ?? "");
    setTwitter(theme.twitter ?? "");
    setWebsite(theme.website ?? "");
    setDid(theme.did ?? "");
    setRoyaltyAddress(theme.royalty_address ?? "");
  }, [theme]);

  const handleToggleSideBySide = () => {
    setLayoutMode((current) => {
      if (current !== "maximized") {
        setIsSideBySide(true);
        return "maximized";
      }
      setIsSideBySide((prev) => !prev);
      return current;
    });
  };

  const handleToggleMaximize = () => {
    setLayoutMode((current) => {
      if (current === "maximized") {
        setIsSideBySide(false);
        return "normal";
      }
      return "maximized";
    });
  };

  const handleSaveTheme = () => saveTheme(themeJson);

  const handleSaveProperties = async () => {
    const success = await saveProperties({
      description,
      status: themeStatus,
      authorName,
      sponsor,
      twitter,
      website,
      did,
      royaltyAddress,
    });
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
  const isMaximizedLayout = layoutMode === "maximized";
  const fullHeightEditorStyle = {
    "--json-editor-height": "100%",
  } as CSSProperties;
  const defaultEditorStyle = {
    "--json-editor-height": "min(70vh, 560px)",
  } as CSSProperties;

  const renderLayout = () => {
    if (isMaximizedLayout && !isSideBySideLayout) {
      return (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-background flex flex-col">
          <Card className="flex-1 flex min-h-0 flex-col rounded-none border-0">
            <ThemeEditorHeader
              title={theme.display_name}
              mode="maximized"
              isSaving={isSaving}
              isThemeValid={isThemeJsonValid}
              onEdit={() => setIsEditSheetOpen(true)}
              onSave={handleSaveTheme}
              onApply={handleApplyTheme}
              onPublish={() => {}}
              onDelete={() => setIsDeleteDialogOpen(true)}
              onToggleMaximize={handleToggleMaximize}
              onToggleSideBySide={handleToggleSideBySide}
            />
            <div
              className="flex-1 flex min-h-0 flex-col overflow-hidden"
              style={fullHeightEditorStyle}
            >
              <ThemeEditorTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                themeJson={themeJson}
                onThemeJsonChange={handleThemeJsonChange}
                editorTheme={editorTheme}
                themeId={theme?.id}
                validationError={validationError}
              />
            </div>
          </Card>
        </div>
      );
    }

    if (isSideBySideLayout) {
      return (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-background flex flex-col">
          <Card className="flex-1 flex min-h-0 flex-col rounded-none border-0">
            <ThemeEditorHeader
              title={theme.display_name}
              mode="side-by-side"
              isSaving={isSaving}
              isThemeValid={isThemeJsonValid}
              onEdit={() => setIsEditSheetOpen(true)}
              onSave={handleSaveTheme}
              onApply={handleApplyTheme}
              onPublish={() => {}}
              onDelete={() => setIsDeleteDialogOpen(true)}
              onToggleMaximize={handleToggleMaximize}
              onToggleSideBySide={handleToggleSideBySide}
            />
            <div className="flex min-h-0 flex-col gap-6 lg:grid lg:min-h-[calc(100vh-200px)] lg:grid-cols-2 lg:gap-8">
              <div
                className="flex h-full w-full min-h-0 flex-col"
                style={fullHeightEditorStyle}
              >
                <ThemeEditorTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  themeJson={themeJson}
                  onThemeJsonChange={handleThemeJsonChange}
                  editorTheme={editorTheme}
                  themeId={theme?.id}
                  validationError={validationError}
                />
              </div>
              <div className="flex h-full w-full min-h-0 flex-col">
                <ThemePreview
                  themeJson={themeJson}
                  validateTheme={validateTheme}
                  onValidationChange={setValidationError}
                  variant="inline"
                />
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="container max-w-6xl mx-auto px-4">
        <div className="space-y-6">
          <ThemeEditorHeader
            title={theme.display_name}
            mode="normal"
            isSaving={isSaving}
            isThemeValid={isThemeJsonValid}
            onEdit={() => setIsEditSheetOpen(true)}
            onSave={handleSaveTheme}
            onApply={handleApplyTheme}
            onPublish={() => {}}
            onDelete={() => setIsDeleteDialogOpen(true)}
            onToggleMaximize={handleToggleMaximize}
            onToggleSideBySide={handleToggleSideBySide}
          />
          <div style={defaultEditorStyle}>
            <ThemeEditorTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              themeJson={themeJson}
              onThemeJsonChange={handleThemeJsonChange}
              editorTheme={editorTheme}
              themeId={theme?.id}
              validationError={validationError}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderOverlayPreview = () => {
    if (isSideBySideLayout) {
      return null;
    }
    return (
      <ThemePreview
        themeJson={themeJson}
        validateTheme={validateTheme}
        onValidationChange={setValidationError}
      />
    );
  };

  return (
    <ThemeEditorProvider
      theme={parsedTheme}
      themeJson={themeJson}
      onThemeChange={handleThemeChange}
      onThemeJsonChange={handleThemeJsonChange}
    >
      {renderLayout()}

      {renderOverlayPreview()}
      <ThemeProperties
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        status={themeStatus}
        onStatusChange={setThemeStatus}
        description={description}
        onDescriptionChange={setDescription}
        authorName={authorName}
        onAuthorNameChange={setAuthorName}
        sponsor={sponsor}
        onSponsorChange={setSponsor}
        twitter={twitter}
        onTwitterChange={setTwitter}
        website={website}
        onWebsiteChange={setWebsite}
        did={did}
        onDidChange={setDid}
        royaltyAddress={royaltyAddress}
        onRoyaltyAddressChange={setRoyaltyAddress}
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
