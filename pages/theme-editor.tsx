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
import { parseColor, rgbaToHex } from "@/lib/color";
import Editor from "@monaco-editor/react";
import { FileText, Save, StickyNote, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "../Contexts/AuthContext";
import type { Database } from "../lib/database.types";
import { supabase } from "../lib/supabaseClient";
import jsonSchema from "../public/schema.json";

type Theme = Database["public"]["Tables"]["themes"]["Row"];

export default function ThemeEditor() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [theme, setTheme] = useState<Theme | null>(null);
  const [themeJson, setThemeJson] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [isNotesSheetOpen, setIsNotesSheetOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const monacoInitializedRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const loadTheme = async () => {
    if (!id || typeof id !== "string") {
      return;
    }

    setIsLoadingTheme(true);
    try {
      const { data, error } = await supabase
        .from("themes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      setTheme(data);
      setThemeJson(JSON.stringify(data.theme, null, 2));
      setNotes(data.notes || "");
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

  const handleSaveTheme = async () => {
    if (!theme || !user) {
      return;
    }

    setIsSaving(true);
    try {
      // Parse and validate JSON
      const parsedJson = JSON.parse(themeJson);

      // Validate required fields
      if (
        !parsedJson.name ||
        typeof parsedJson.name !== "string" ||
        parsedJson.name.trim() === ""
      ) {
        toast.error("Theme JSON must contain a non-empty 'name' field");
        return;
      }

      if (
        !parsedJson.displayName ||
        typeof parsedJson.displayName !== "string" ||
        parsedJson.displayName.trim() === ""
      ) {
        toast.error("Theme JSON must contain a non-empty 'displayName' field");
        return;
      }

      // Update the theme in the database
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { error } = await supabase
        .from("themes")
        .update({
          name: parsedJson.name.trim(),
          display_name: parsedJson.displayName.trim(),
          theme: parsedJson,
          updated_at: new Date().toISOString(),
        })
        .eq("id", theme.id);

      if (error) {
        throw error;
      }

      toast.success("Theme saved successfully!");
      setTheme({
        ...theme,
        name: parsedJson.name.trim(),
        display_name: parsedJson.displayName.trim(),
        theme: parsedJson,
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON format. Please check your syntax.");
      } else {
        console.error("Error saving theme:", error);
        toast.error("Failed to save theme");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!theme || !user) {
      return;
    }

    setIsSavingNotes(true);
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { error } = await supabase
        .from("themes")
        .update({
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", theme.id);

      if (error) {
        throw error;
      }

      toast.success("Notes saved successfully!");
      setTheme({ ...theme, notes: notes.trim() || null });
      setIsNotesSheetOpen(false);
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteTheme = async () => {
    if (!theme || !user) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("themes")
        .delete()
        .eq("id", theme.id);

      if (error) {
        throw error;
      }

      toast.success("Theme deleted successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error deleting theme:", error);
      toast.error("Failed to delete theme");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
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

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{theme.display_name}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsNotesSheetOpen(true)}
              variant="outline"
              size="sm"
            >
              <StickyNote className="w-4 h-4 mr-2" />
              Notes
            </Button>
            <Button
              onClick={() => setIsDeleteDialogOpen(true)}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Theme JSON
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Editor
              beforeMount={(monaco) => {
                // Only initialize Monaco once to prevent duplicate color providers
                if (monacoInitializedRef.current) {
                  return;
                }
                monacoInitializedRef.current = true;

                monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                  validate: true,
                  schemas: [
                    {
                      uri: "http://myserver/my-schema.json",
                      fileMatch: ["*"],
                      schema: jsonSchema,
                    },
                  ],
                });
                monaco.languages.json.jsonDefaults.setModeConfiguration({
                  documentFormattingEdits: true,
                  documentRangeFormattingEdits: true,
                  completionItems: true,
                  hovers: true,
                  documentSymbols: true,
                  tokens: true,
                  colors: true, // Enable color picker
                  foldingRanges: true,
                  diagnostics: true,
                  selectionRanges: true,
                });
                // Only register color provider once to prevent duplicates on navigation
                if (
                  !(
                    window as unknown as {
                      __jsonColorProviderRegistered?: boolean;
                    }
                  ).__jsonColorProviderRegistered
                ) {
                  monaco.languages.registerColorProvider("json", {
                    provideDocumentColors(model) {
                      const colors: {
                        color: {
                          red: number;
                          green: number;
                          blue: number;
                          alpha: number;
                        };
                        range: {
                          startLineNumber: number;
                          startColumn: number;
                          endLineNumber: number;
                          endColumn: number;
                        };
                      }[] = [];
                      const text = model.getValue();

                      // Match quoted strings that could be colors (hex, rgb, rgba, hsl, hsla, or named colors)
                      // This regex matches any quoted string, then we'll validate with parseColor
                      const colorRegex = /"([^"]+)"/g;
                      let match;

                      while ((match = colorRegex.exec(text)) !== null) {
                        const colorString = match[1];

                        // Skip obviously non-color strings to improve performance
                        // Only check strings that could plausibly be colors
                        if (
                          colorString.length > 50 ||
                          (colorString.includes(" ") &&
                            !colorString.match(/^(rgb|hsl)/i)) ||
                          colorString.includes("/") ||
                          colorString.includes("\\")
                        ) {
                          continue;
                        }

                        const startPos = model.getPositionAt(match.index + 1); // +1 to skip opening quote
                        const endPos = model.getPositionAt(
                          match.index + match[1].length + 1
                        );

                        // Use our robust parseColor function to validate and parse
                        const color = parseColor(colorString);
                        if (color) {
                          colors.push({
                            color: color,
                            range: {
                              startLineNumber: startPos.lineNumber,
                              startColumn: startPos.column,
                              endLineNumber: endPos.lineNumber,
                              endColumn: endPos.column,
                            },
                          });
                        }
                      }

                      return colors;
                    },
                    provideColorPresentations(_, colorInfo) {
                      const color = colorInfo.color;
                      const hex = rgbaToHex(color);
                      const rgb = `rgba(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)}, ${color.alpha})`;

                      return [
                        {
                          label: hex,
                          textEdit: {
                            range: colorInfo.range,
                            text: hex,
                          },
                        },
                        {
                          label: rgb,
                          textEdit: {
                            range: colorInfo.range,
                            text: rgb,
                          },
                        },
                      ];
                    },
                  });
                  (
                    window as unknown as {
                      __jsonColorProviderRegistered?: boolean;
                    }
                  ).__jsonColorProviderRegistered = true;
                }
              }}
              height="calc(100vh - 300px)"
              defaultLanguage="json"
              value={themeJson}
              onChange={(value) => setThemeJson(value || "")}
              options={{
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontSize: 12,
                fontFamily:
                  "Monaco, Menlo, Ubuntu Mono, Consolas, source-code-pro, monospace",
                tabSize: 2,
                insertSpaces: true,
                wordWrap: "on",
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                bracketPairColorization: { enabled: true },
                folding: true,
                lineNumbers: "on",
                renderWhitespace: "selection",
                selectOnLineNumbers: true,
                roundedSelection: true,
                cursorStyle: "line",
                contextmenu: true,
                mouseWheelZoom: true,
                smoothScrolling: true,
              }}
              loading={
                <div className="flex items-center justify-center h-32">
                  Loading editor...
                </div>
              }
            />
            <div className="flex justify-end">
              <Button onClick={handleSaveTheme} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Theme"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Side Sheet */}
      <Sheet open={isNotesSheetOpen} onOpenChange={setIsNotesSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Theme Notes</SheetTitle>
            <SheetDescription>
              Add notes or comments about this theme.
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 py-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setNotes(e.target.value)
                  }
                  placeholder="Add your notes here..."
                  rows={15}
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
            <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
              {isSavingNotes ? "Saving..." : "Save Notes"}
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
    </div>
  );
}
