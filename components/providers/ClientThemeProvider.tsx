"use client";

import { useCallback, useEffect, useState } from "react";
import { Theme, ThemeProvider } from "theme-o-rama";
import { useAuth } from "../../Contexts/AuthContext";

// Image resolver for theme background images
// eslint-disable-next-line require-await
async function resolveThemeImage(
  themeName: string,
  imagePath: string
): Promise<string> {
  // Images are in /public/themes/{imagePath}
  // Next.js serves public files from root
  return `/themes/${themeName}/${imagePath}`;
}

interface ClientThemeProviderProps {
  children: React.ReactNode;
  initialTheme: string;
}

export function ClientThemeProvider({
  children,
  initialTheme,
}: ClientThemeProviderProps) {
  const { user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(initialTheme);
  const [isLoadingUserTheme, setIsLoadingUserTheme] = useState(false);

  // Return cached theme definition if available
  const discoverUserThemes = useCallback(async (): Promise<Theme[]> => {
    if (typeof window === "undefined") return [];

    try {
      const cachedTheme = localStorage.getItem("selected-theme-definition");
      if (cachedTheme) {
        return [JSON.parse(cachedTheme)];
      }
    } catch (error) {
      console.warn("Failed to load cached theme definition:", error);
    }

    return [];
  }, []);

  // Read theme from localStorage on client, with user theme priority
  const [defaultTheme] = useState(() => {
    if (typeof window === "undefined") {
      return initialTheme;
    }
    try {
      // Check for user-specific theme first
      const userTheme = localStorage.getItem("user-theme");
      if (userTheme) {
        return userTheme;
      }
      // Fallback to general theme preference
      return localStorage.getItem("theme") || initialTheme;
    } catch {
      return initialTheme;
    }
  });

  // Load user's active theme from cache only
  useEffect(() => {
    if (!user) return;

    try {
      const cachedUserTheme = localStorage.getItem("user-theme");
      if (cachedUserTheme) {
        setCurrentTheme(cachedUserTheme);
      }
    } catch (error) {
      console.warn("Failed to load cached user theme:", error);
    }
  }, [user]);

  // Handle theme changes - save to localStorage and update cache
  const handleThemeChange = useCallback(
    (themeName: string) => {
      try {
        // Save to localStorage
        localStorage.setItem("theme", themeName);

        // If user is logged in, also save as user preference
        if (user) {
          localStorage.setItem("user-theme", themeName);
        }

        setCurrentTheme(themeName);
      } catch (error) {
        console.warn("Failed to save theme preference:", error);
      }
    },
    [user]
  );

  return (
    <ThemeProvider
      defaultTheme={currentTheme}
      onThemeChange={handleThemeChange}
      discoverThemes={discoverUserThemes}
      imageResolver={resolveThemeImage}
    >
      {children}
    </ThemeProvider>
  );
}
