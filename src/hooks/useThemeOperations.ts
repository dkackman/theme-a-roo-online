import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { themesApi } from "../lib/data-access";
import type { Database, Json } from "../lib/database.types";
import { validateThemeJson } from "../lib/themes";

type Theme = Database["public"]["Tables"]["themes"]["Row"];
type ThemeStatus = Theme["status"];

interface UseThemeOperationsProps {
  theme: Theme | null;
  user: User | null;
  onThemeUpdate: (theme: Theme) => void;
}

interface SavePropertiesPayload {
  description: string;
  status?: ThemeStatus;
  authorName: string;
  sponsor: string;
  twitter: string;
  website: string;
  did: string;
  royaltyAddress: string;
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
  const [isPublishing, setIsPublishing] = useState(false);

  const saveTheme = useCallback(
    async (themeJson: string) => {
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
    },
    [theme, user, onThemeUpdate]
  );

  const saveProperties = useCallback(
    async ({
      description,
      status,
      authorName,
      sponsor,
      twitter,
      website,
      did,
      royaltyAddress,
    }: SavePropertiesPayload) => {
      if (!theme || !user) {
        return;
      }

      setIsSavingNotes(true);
      try {
        const toNullable = (value: string) => {
          const trimmed = value.trim();
          return trimmed.length > 0 ? trimmed : null;
        };

        const updatedTheme = await themesApi.update(theme.id, {
          description: description.trim() || null,
          status,
          author_name: toNullable(authorName),
          sponsor: toNullable(sponsor),
          twitter: toNullable(twitter),
          website: toNullable(website),
          did: toNullable(did),
          royalty_address: toNullable(royaltyAddress),
        });

        toast.success("Theme properties saved successfully!");
        onThemeUpdate(updatedTheme);
        return true; // Success indicator
      } catch (error) {
        console.error("Error saving theme properties:", error);
        toast.error("Failed to save theme properties");
        return false; // Failure indicator
      } finally {
        setIsSavingNotes(false);
      }
    },
    [theme, user, onThemeUpdate]
  );

  const deleteTheme = useCallback(async () => {
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
  }, [theme, user, router]);

  const publishTheme = useCallback(async () => {
    if (!theme || !user) {
      return false;
    }

    if (theme.status !== "ready") {
      toast.error("Theme must be in the Ready state before publishing.");
      return false;
    }

    setIsPublishing(true);
    try {
      const updatedTheme = await themesApi.update(theme.id, {
        status: "published",
      });
      toast.success("Theme published successfully!");
      onThemeUpdate(updatedTheme);
      return true;
    } catch (error) {
      console.error("Error publishing theme:", error);
      toast.error("Failed to publish theme");
      return false;
    } finally {
      setIsPublishing(false);
    }
  }, [theme, user, onThemeUpdate]);

  const validateTheme = useCallback((themeJson: string): string | null => {
    try {
      validateThemeJson(themeJson);
      return null; // No errors
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }
    }

    return "Validation failed";
  }, []);

  return {
    saveTheme,
    saveProperties: saveProperties,
    deleteTheme,
    validateTheme,
    publishTheme,
    isSaving,
    isSavingNotes,
    isDeleting,
    isPublishing,
  };
}
