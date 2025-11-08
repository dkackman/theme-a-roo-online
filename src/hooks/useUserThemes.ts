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
            // Handle JSONB column which can be null, string (if unparsed), or object
            let themeData: Record<string, unknown> = {};

            if (dbTheme.theme !== null && dbTheme.theme !== undefined) {
              // If it's a string, try to parse it
              if (typeof dbTheme.theme === "string") {
                try {
                  themeData = JSON.parse(dbTheme.theme) as Record<
                    string,
                    unknown
                  >;
                } catch (parseError) {
                  console.warn(
                    `Failed to parse theme JSON for ${dbTheme.name}:`,
                    parseError
                  );
                }
              }
              // If it's already an object (and not null or array), use it directly
              else if (
                typeof dbTheme.theme === "object" &&
                dbTheme.theme !== null &&
                !Array.isArray(dbTheme.theme)
              ) {
                themeData = dbTheme.theme as Record<string, unknown>;
              }
            }

            console.warn("Theme data for", dbTheme.name, ":", themeData);
            const convertedTheme = {
              name: dbTheme.name,
              displayName: dbTheme.display_name,
              description:
                dbTheme.description ||
                `Custom theme by ${user.user_metadata.name}`,
              schemaVersion: 1,
              ...themeData,
            } as Theme;

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
    loadUserThemes,
  };
}
