import { useCallback, useEffect, useState } from "react";
import { Theme, dark, light, useSimpleTheme } from "theme-o-rama";
import { useAuth } from "../Contexts/AuthContext";
import { DbTheme, themesApi } from "../lib/data-access";

export interface UserTheme {
  theme: Theme;
  dbTheme: DbTheme;
}

export function useUserThemes() {
  const { user } = useAuth();
  const { initializeTheme } = useSimpleTheme();
  const [userThemes, setUserThemes] = useState<UserTheme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserThemes = useCallback(async () => {
    if (!user) {
      setUserThemes([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dbThemes = await themesApi.getByUserId(user.id);

      // Convert and initialize themes, keeping them paired with their DbTheme
      const userThemesWithDb = await Promise.all(
        dbThemes.map(async (dbTheme) => {
          try {
            // Convert database theme to Theme-o-rama format
            const themeData =
              dbTheme.theme && typeof dbTheme.theme === "object"
                ? (dbTheme.theme as Record<string, unknown>)
                : {};
            const convertedTheme = {
              name: dbTheme.name,
              displayName: dbTheme.display_name,
              description: dbTheme.notes || `Custom theme by ${user.email}`,
              schemaVersion: 1,
              ...themeData,
            } as Theme;

            // Initialize the theme
            const initializedTheme = await initializeTheme(convertedTheme);

            return {
              theme: initializedTheme,
              dbTheme,
            } as UserTheme;
          } catch (err) {
            console.warn(`Failed to initialize theme ${dbTheme.name}:`, err);
            return null;
          }
        })
      );

      // Filter out any null values from failed initializations
      setUserThemes(
        userThemesWithDb.filter(
          (userTheme): userTheme is UserTheme => userTheme !== null
        )
      );
    } catch (err) {
      console.error("Failed to load user themes:", err);
      setError(err instanceof Error ? err.message : "Failed to load themes");
    } finally {
      setIsLoading(false);
    }
  }, [user, initializeTheme]);

  useEffect(() => {
    loadUserThemes();
  }, [loadUserThemes]);

  return {
    userThemes,
    builtInThemes: [light, dark],
    isLoading,
    error,
    reloadThemes: loadUserThemes,
  };
}
