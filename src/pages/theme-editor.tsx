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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, type NextRouter } from "next/router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useSimpleTheme, type Theme } from "theme-o-rama";
import { useAuth } from "../Contexts/AuthContext";
import { ThemeEditorProvider } from "../Contexts/ThemeEditorContext";
import { useThemeOperations } from "../hooks/useThemeOperations";
import { themesApi } from "../lib/data-access";
import type { Database } from "../lib/database.types";
import { loadSettings } from "../lib/settings";

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
  const [savedThemeJson, setSavedThemeJson] = useState<string>("");
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const [settings] = useState(() => loadSettings());

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
      // Disable side-by-side when exiting maximized mode
      setIsSideBySide(false);
    }
  }, [layoutMode]);

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
      setSavedThemeJson(themeJsonString);
      setValidationError(null);
    } catch (error) {
      console.error("Error loading theme:", error);
      toast.error("Failed to load theme");
    } finally {
      setIsLoadingTheme(false);
    }
  }, [themeId, userId]);

  // Parse theme JSON to get the theme object for the context
  // Memoize to ensure it updates reactively when themeJson changes
  const parsedTheme: Theme | null = useMemo(() => {
    try {
      return themeJson ? JSON.parse(themeJson) : null;
    } catch {
      return null;
    }
  }, [themeJson]);

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

    // Update savedThemeJson when theme is updated from database (after save)
    // This ensures isDirty is accurate after saves
    if (theme.theme) {
      let savedJson = "";
      if (typeof theme.theme === "string") {
        try {
          const parsed = JSON.parse(theme.theme);
          savedJson = JSON.stringify(parsed, null, 2);
        } catch {
          savedJson = theme.theme;
        }
      } else {
        savedJson = JSON.stringify(theme.theme, null, 2);
      }
      // Only update if it's different to avoid unnecessary re-renders
      if (savedJson !== savedThemeJson) {
        setSavedThemeJson(savedJson);
      }
    }
  }, [theme, savedThemeJson]);

  const handleToggleSideBySide = () => {
    if (layoutMode !== "maximized") {
      // When not maximized, go into maximized mode and enable side-by-side
      setLayoutMode("maximized");
      setIsSideBySide(true);
    } else {
      // When maximized, just toggle side-by-side
      setIsSideBySide((prev) => !prev);
    }
  };

  const handleToggleMaximize = () => {
    if (layoutMode === "maximized") {
      // Exiting maximized mode, disable side-by-side
      setLayoutMode("normal");
      setIsSideBySide(false);
    } else {
      // Entering maximized mode
      setLayoutMode("maximized");
    }
  };

  const handleSaveTheme = useCallback(async () => {
    // Check the same conditions as the save button
    const isThemeJsonValid = validationError === null;
    const canSave =
      !isSaving &&
      theme &&
      isThemeJsonValid &&
      themeStatus !== "minted" &&
      themeStatus !== "published";
    if (canSave) {
      await saveTheme(themeJson);
      setSavedThemeJson(themeJson);
    }
  }, [isSaving, theme, validationError, themeStatus, themeJson, saveTheme]);

  // Check if JSON is dirty (has unsaved changes)
  const isDirty = useMemo(() => {
    return themeJson !== savedThemeJson;
  }, [themeJson, savedThemeJson]);

  // Intercept navigation attempts using router.beforePopState
  useEffect(() => {
    const handleBeforePopState = ({ url }: { url: string }) => {
      // Don't intercept if navigating to the same page
      if (url === router.asPath) {
        return true;
      }

      // If JSON is invalid, allow navigation without prompt
      if (validationError !== null) {
        return true;
      }

      // If not dirty, allow navigation
      if (!isDirty) {
        return true;
      }

      // If promptToSave is false, auto-save and allow navigation
      if (!settings.promptToSave) {
        const isThemeJsonValid = validationError === null;
        const canSave =
          !isSaving &&
          theme &&
          isThemeJsonValid &&
          themeStatus !== "minted" &&
          themeStatus !== "published";
        if (canSave) {
          saveTheme(themeJson).then(() => {
            setSavedThemeJson(themeJson);
          });
        }
        return true;
      }

      // Otherwise, prevent navigation and show prompt
      setPendingNavigation(url);
      setIsPromptDialogOpen(true);
      return false; // Prevent navigation
    };

    router.beforePopState(handleBeforePopState);

    return () => {
      router.beforePopState(() => true);
    };
  }, [
    router,
    isDirty,
    validationError,
    settings.promptToSave,
    themeJson,
    theme,
    themeStatus,
    isSaving,
    saveTheme,
  ]);

  // Intercept programmatic navigation (router.push) by wrapping router.push
  const originalPushRef = useRef(router.push);
  useEffect(() => {
    originalPushRef.current = router.push;

    router.push = ((
      url: Parameters<NextRouter["push"]>[0],
      as?: Parameters<NextRouter["push"]>[1],
      options?: Parameters<NextRouter["push"]>[2]
    ) => {
      const urlString =
        typeof url === "string"
          ? url
          : (url as { pathname?: string }).pathname || router.asPath;

      // Don't intercept if navigating to the same page
      if (urlString === router.asPath) {
        return originalPushRef.current.call(router, url, as, options);
      }

      // If JSON is invalid, allow navigation without prompt
      if (validationError !== null) {
        return originalPushRef.current.call(router, url, as, options);
      }

      // If not dirty, allow navigation
      if (!isDirty) {
        return originalPushRef.current.call(router, url, as, options);
      }

      // If promptToSave is false, auto-save and allow navigation
      if (!settings.promptToSave) {
        const isThemeJsonValid = validationError === null;
        const canSave =
          !isSaving &&
          theme &&
          isThemeJsonValid &&
          themeStatus !== "minted" &&
          themeStatus !== "published";
        if (canSave) {
          saveTheme(themeJson).then(() => {
            setSavedThemeJson(themeJson);
          });
        }
        return originalPushRef.current.call(router, url, as, options);
      }

      // Otherwise, prevent navigation and show prompt
      setPendingNavigation(urlString);
      setIsPromptDialogOpen(true);
      return Promise.resolve(false);
    }) as typeof router.push;

    return () => {
      router.push = originalPushRef.current;
    };
  }, [
    router,
    isDirty,
    validationError,
    settings.promptToSave,
    themeJson,
    theme,
    themeStatus,
    isSaving,
    saveTheme,
  ]);

  // Handle browser navigation (back/forward/close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If JSON is invalid, allow navigation
      if (validationError !== null) {
        return;
      }

      // If not dirty, allow navigation
      if (!isDirty) {
        return;
      }

      // If promptToSave is false, auto-save
      if (!settings.promptToSave) {
        const isThemeJsonValid = validationError === null;
        const canSave =
          !isSaving &&
          theme &&
          isThemeJsonValid &&
          themeStatus !== "minted" &&
          themeStatus !== "published";
        if (canSave) {
          saveTheme(themeJson).then(() => {
            setSavedThemeJson(themeJson);
          });
        }
        return;
      }

      // Show browser prompt
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    isDirty,
    validationError,
    settings.promptToSave,
    themeJson,
    theme,
    themeStatus,
    isSaving,
    saveTheme,
  ]);

  const handlePromptYes = async () => {
    setIsPromptDialogOpen(false);
    const isThemeJsonValid = validationError === null;
    const canSave =
      !isSaving &&
      theme &&
      isThemeJsonValid &&
      themeStatus !== "minted" &&
      themeStatus !== "published";
    if (canSave) {
      await saveTheme(themeJson);
      setSavedThemeJson(themeJson);
    }
    if (pendingNavigation) {
      // Use original router.push to bypass our wrapper and navigate after saving
      originalPushRef.current.call(router, pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handlePromptNo = () => {
    setIsPromptDialogOpen(false);
    if (pendingNavigation) {
      // Use original router.push to bypass our wrapper and navigate without saving
      originalPushRef.current.call(router, pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handlePromptCancel = () => {
    setIsPromptDialogOpen(false);
    setPendingNavigation(null);
  };

  // Keyboard shortcut: Alt/Command+S to save (for non-Monaco contexts)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Alt+S (Windows/Linux) or Command+S (Mac) is pressed
      if (
        (event.altKey || event.metaKey) &&
        event.key === "s" &&
        !event.shiftKey &&
        !event.ctrlKey
      ) {
        // Don't trigger if user is typing in an input field or textarea
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        // Don't trigger if Monaco Editor has focus (it handles it internally)
        if (target.closest(".monaco-editor")) {
          return;
        }

        event.preventDefault();
        handleSaveTheme();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSaveTheme]);

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

  // Common props for ThemeEditorHeader
  const headerProps = {
    title: theme.display_name,
    layoutMode,
    isSideBySide: isSideBySideLayout,
    isSaving,
    isThemeValid: isThemeJsonValid,
    themeStatus,
    onEdit: () => setIsEditSheetOpen(true),
    onSave: handleSaveTheme,
    onApply: handleApplyTheme,
    onPublish: () => {},
    onDelete: () => setIsDeleteDialogOpen(true),
    onToggleMaximize: handleToggleMaximize,
    onToggleSideBySide: handleToggleSideBySide,
  };

  // Common props for ThemeEditorTabs
  const isReadonly = themeStatus === "minted" || themeStatus === "published";
  const tabsProps = {
    activeTab,
    onTabChange: setActiveTab,
    themeJson,
    onThemeJsonChange: handleThemeJsonChange,
    editorTheme,
    themeId: theme?.id,
    isValid: isThemeJsonValid,
    validationError,
    readonly: isReadonly,
    themeStatus,
    onSave: handleSaveTheme,
    validateTheme,
  };

  const renderEditorTabs = () => {
    return (
      <div
        className="flex-1 flex min-h-0 flex-col overflow-hidden"
        style={{ "--json-editor-height": "100%" } as CSSProperties}
      >
        <ThemeEditorTabs {...tabsProps} />
      </div>
    );
  };

  // Common wrapper for maximized layouts (both side-by-side and editor-only)
  const renderMaximizedWrapper = (children: ReactNode) => {
    return (
      <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-background flex flex-col">
        <Card className="flex-1 flex min-h-0 flex-col rounded-none border-0">
          <ThemeEditorHeader {...headerProps} />
          {children}
        </Card>
      </div>
    );
  };

  const renderLayout = () => {
    // Side-by-side layout (editor + preview)
    if (isSideBySideLayout) {
      return renderMaximizedWrapper(
        <div className="flex-1 flex min-h-0 flex-col gap-6 pb-6 lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="flex h-full w-full min-h-0 flex-col">
            {renderEditorTabs()}
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
      );
    }

    // Maximized layout (fullscreen editor only)
    if (isMaximizedLayout) {
      return renderMaximizedWrapper(renderEditorTabs());
    }

    // Normal layout (container with spacing)
    return (
      <div className="container max-w-6xl mx-auto px-4 flex flex-col h-[calc(100vh-4rem)] pb-6">
        <div className="flex flex-col flex-1 min-h-0 space-y-6">
          <ThemeEditorHeader {...headerProps} />
          {renderEditorTabs()}
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

      {/* Save Prompt Dialog */}
      <AlertDialog
        open={isPromptDialogOpen}
        onOpenChange={setIsPromptDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to save before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel onClick={handlePromptCancel}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handlePromptNo}
              className="sm:order-2"
            >
              No
            </Button>
            <AlertDialogAction onClick={handlePromptYes} className="sm:order-3">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
