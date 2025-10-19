"use client";

import { useCallback, useState } from "react";
import { Theme, ThemeProvider } from "theme-o-rama";

// Discover custom themes for this app
// eslint-disable-next-line require-await
async function discoverThemes(): Promise<Theme[]> {
  // Return app-specific themes
  return [] as Theme[];
}

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
  // Read actual theme from localStorage on client
  const [defaultTheme] = useState(() => {
    if (typeof window === "undefined") {
      return initialTheme;
    }
    try {
      return localStorage.getItem("theme") || initialTheme;
    } catch {
      return initialTheme;
    }
  });

  // Handle theme changes - save to localStorage
  const handleThemeChange = useCallback((themeName: string) => {
    try {
      localStorage.setItem("theme", themeName);
    } catch (error) {
      console.warn("Failed to save theme preference:", error);
    }
  }, []);

  return (
    <ThemeProvider
      defaultTheme={defaultTheme}
      onThemeChange={handleThemeChange}
      discoverThemes={discoverThemes}
      imageResolver={resolveThemeImage}
    >
      {children}
    </ThemeProvider>
  );
}
