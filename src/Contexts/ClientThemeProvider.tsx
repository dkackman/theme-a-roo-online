"use client";

import { useCallback, useEffect, useState } from "react";
import {
  light,
  SimpleThemeProvider,
  Theme,
  useSimpleTheme,
} from "theme-o-rama";

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
}

function ThemeInitializer() {
  const { setTheme, initializeTheme } = useSimpleTheme();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) {
      return;
    }

    const initializeThemeAsync = async () => {
      try {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme) {
          const parsedTheme = JSON.parse(storedTheme) as Theme;
          const initializedTheme = await initializeTheme(parsedTheme);
          setTheme(initializedTheme);
        } else {
          setTheme(light);
        }
      } catch (error) {
        console.warn("Failed to initialize theme:", error);
        try {
          setTheme(light);
        } catch (fallbackError) {
          console.error("Failed to set light theme:", fallbackError);
        }
      } finally {
        setInitialized(true);
      }
    };

    void initializeThemeAsync();
  }, [setTheme, initializeTheme, initialized]);

  return null;
}

export function ClientThemeProvider({ children }: ClientThemeProviderProps) {
  const handleThemeChange = useCallback((theme: Theme) => {
    try {
      localStorage.setItem("theme", JSON.stringify(theme));
    } catch (error) {
      console.warn("Failed to save theme preference:", error);
    }
  }, []);

  return (
    <SimpleThemeProvider
      onThemeChange={handleThemeChange}
      imageResolver={resolveThemeImage}
    >
      <ThemeInitializer />
      {children}
    </SimpleThemeProvider>
  );
}
