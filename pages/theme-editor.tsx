import { ThemeEditorActions } from "@/components/ThemeEditorActions";
import { ThemeEditorTabs } from "@/components/ThemeEditorTabs";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Maximize2, Minimize2 } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "../Contexts/AuthContext";
import { useThemeOperations } from "../hooks/useThemeOperations";
import { themesApi } from "../lib/data-access";
import type { Database } from "../lib/database.types";

type Theme = Database["public"]["Tables"]["themes"]["Row"];

export default function ThemeEditor() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [theme, setTheme] = useState<Theme | null>(null);
  const [themeJson, setThemeJson] = useState("");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isDraft, setIsDraft] = useState(false);
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

    // Initial set
    updateEditorTheme();

    // Watch for changes to the color-scheme on html element
    const observer = new MutationObserver(updateEditorTheme);
    if (typeof document !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }

    return () => observer.disconnect();
  }, []);

  const loadTheme = async () => {
    if (!user || !id || typeof id !== "string") {
      return;
    }

    setIsLoadingTheme(true);
    try {
      const data = await themesApi.getById(id, user.id);
      setTheme(data);
      // Handle both object and string formats from database
      if (typeof data.theme === "string") {
        // If it's already a string, parse it first to remove escaped characters
        try {
          const parsed = JSON.parse(data.theme);
          setThemeJson(JSON.stringify(parsed, null, 2));
        } catch {
          // If parsing fails, use the string as-is
          setThemeJson(data.theme);
        }
      } else {
        // If it's an object, stringify it with formatting
        setThemeJson(JSON.stringify(data.theme, null, 2));
      }
      setNotes(data.notes || "");
      setIsDraft(data.is_draft || false);
    } catch (error) {
      console.error("Error loading theme:", error);
      toast.error("Failed to load theme");
    } finally {
      setIsLoadingTheme(false);
    }
  };

  useEffect(() => {
    if (id && user) {
      loadTheme();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleSaveTheme = () => saveTheme(themeJson);

  const handleSaveProperties = async () => {
    const success = await saveProperties(notes, isDraft);
    if (success) {
      setIsEditSheetOpen(false);
    }
  };

  const handleDeleteTheme = async () => {
    await deleteTheme();
    setIsDeleteDialogOpen(false);
  };

  const handleValidateTheme = () => validateTheme(themeJson);

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

  return (
    <>
      {isMaximized && (
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
                  onValidate={handleValidateTheme}
                  onSave={handleSaveTheme}
                  onPreview={() => {}}
                  onApply={() => {}}
                  onPublish={() => {}}
                  onDelete={() => setIsDeleteDialogOpen(true)}
                  isSaving={isSaving}
                />
                <Button
                  onClick={() => setIsMaximized(false)}
                  variant="ghost"
                  size="sm"
                >
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Minimize
                </Button>
              </div>
            </CardHeader>
            <div className="flex-1 flex flex-col overflow-hidden">
              <ThemeEditorTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                themeJson={themeJson}
                onThemeJsonChange={setThemeJson}
                editorTheme={editorTheme}
                isMaximized={true}
              />
            </div>
          </Card>
        </div>
      )}
      {!isMaximized && (
        <div className="container max-w-6xl mx-auto px-4">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-4">{theme.display_name}</h1>
            </div>
            <div className="flex items-center justify-between">
              <ThemeEditorActions
                onEdit={() => setIsEditSheetOpen(true)}
                onValidate={handleValidateTheme}
                onSave={handleSaveTheme}
                onPreview={() => {}}
                onApply={() => {}}
                onPublish={() => {}}
                onDelete={() => setIsDeleteDialogOpen(true)}
                isSaving={isSaving}
              />
              <Button
                onClick={() => setIsMaximized(true)}
                variant="ghost"
                size="sm"
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Maximize
              </Button>
            </div>

            <ThemeEditorTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              themeJson={themeJson}
              onThemeJsonChange={setThemeJson}
              editorTheme={editorTheme}
              isMaximized={false}
            />
          </div>
        </div>
      )}

      {/* Notes Side Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Theme Properties</SheetTitle>
            <SheetDescription>Edit the theme properties.</SheetDescription>
          </SheetHeader>
          <div className="px-6 py-6">
            <FieldGroup>
              <Field>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-draft"
                    checked={isDraft}
                    onCheckedChange={(checked) =>
                      setIsDraft(checked as boolean)
                    }
                  />
                  <FieldLabel htmlFor="is-draft">Draft</FieldLabel>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Mark this theme as a draft. Draft themes are not published.
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setNotes(e.target.value)
                  }
                  placeholder="Add your notes here..."
                  rows={5}
                />
              </Field>
            </FieldGroup>
          </div>
          <SheetFooter className="px-6 pb-6">
            <SheetClose asChild>
              <Button variant="outline" disabled={isSavingNotes}>
                Cancel
              </Button>
            </SheetClose>
            <Button onClick={handleSaveProperties} disabled={isSavingNotes}>
              {isSavingNotes ? "Saving..." : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
    </>
  );
}
