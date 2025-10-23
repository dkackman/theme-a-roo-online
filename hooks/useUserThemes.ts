import { useCallback, useEffect, useState } from "react";
import { Theme } from "theme-o-rama";
import { useAuth } from "../Contexts/AuthContext";
import { themesApi } from "../lib/data-access";

export function useUserThemes() {
    const { user } = useAuth();
    const [userThemes, setUserThemes] = useState<Theme[]>([]);
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
            const themes = await themesApi.getByUserId(user.id);

            // Convert database themes to Theme-o-rama format
            const convertedThemes = themes
                .filter((theme) => !theme.is_draft) // Only non-draft themes
                .map((theme) => {
                    const themeData =
                        theme.theme && typeof theme.theme === "object"
                            ? (theme.theme as any)
                            : {};
                    return {
                        name: theme.name,
                        displayName: theme.display_name,
                        description: theme.notes || `Custom theme by ${user.email}`,
                        tags: ["custom", "user-created"],
                        schemaVersion: "1.0.0",
                        ...themeData,
                    } as Theme;
                });

            setUserThemes(convertedThemes);
        } catch (err) {
            console.error("Failed to load user themes:", err);
            setError(err instanceof Error ? err.message : "Failed to load themes");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Load themes when component mounts
    useEffect(() => {
        loadUserThemes();
    }, [loadUserThemes]);

    return {
        userThemes,
        isLoading,
        error,
        reloadThemes: loadUserThemes,
    };
}
