import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import { themesApi } from "../lib/data-access";
import type { Database, Json } from "../lib/database.types";
import { validateThemeJson } from "../lib/themes";

type Theme = Database["public"]["Tables"]["themes"]["Row"];

interface UseThemeOperationsProps {
  theme: Theme | null;
  user: User | null;
  onThemeUpdate: (theme: Theme) => void;
}

export function useThemeOperations({
  theme,
  user,
  onThemeUpdate,
}: UseThemeOperationsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const saveTheme = async (themeJson: string) => {
    if (!theme || !user) {
      return;
    }

    setIsSaving(true);
    try {
      const validatedTheme = validateThemeJson(themeJson);
      const updatedTheme = await themesApi.update(theme.id, {
        name: validatedTheme.name.trim(),
        display_name: validatedTheme.displayName.trim(),
        theme: JSON.stringify(validatedTheme) as Json, // Store as object, not stringified
      });

      toast.success("Theme saved successfully!");
      onThemeUpdate(updatedTheme);
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

  const saveProperties = async (notes: string, isDraft?: boolean) => {
    if (!theme || !user) {
      return;
    }

    setIsSavingNotes(true);
    try {
      const updatedTheme = await themesApi.update(theme.id, {
        notes: notes.trim() || null,
        is_draft: isDraft,
      });

      toast.success("Notes saved successfully!");
      onThemeUpdate(updatedTheme);
      return true; // Success indicator
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
      return false; // Failure indicator
    } finally {
      setIsSavingNotes(false);
    }
  };

  const deleteTheme = async () => {
    if (!theme || !user) {
      return;
    }

    setIsDeleting(true);
    try {
      await themesApi.delete(theme.id);
      toast.success("Theme deleted successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error deleting theme:", error);
      toast.error("Failed to delete theme");
    } finally {
      setIsDeleting(false);
    }
  };

  const validateTheme = (themeJson: string) => {
    try {
      validateThemeJson(themeJson);
      toast.success("Theme JSON is valid!");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Validation failed");
      }
      return false;
    }
  };

  return {
    saveTheme,
    saveProperties: saveProperties,
    deleteTheme,
    validateTheme,
    isSaving,
    isSavingNotes,
    isDeleting,
  };
}
