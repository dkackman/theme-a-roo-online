import { createContext, ReactNode, useContext } from "react";
import type { Theme } from "theme-o-rama";

interface ThemeEditorContextType {
  theme: Theme | null;
  themeJson: string;
  setTheme: (theme: Theme) => void;
  setThemeJson: (json: string) => void;
  updateTheme: (updates: Partial<Theme>) => void;
}

const ThemeEditorContext = createContext<ThemeEditorContextType | undefined>(
  undefined
);

export function useThemeEditor() {
  const context = useContext(ThemeEditorContext);
  if (context === undefined) {
    throw new Error("useThemeEditor must be used within a ThemeEditorProvider");
  }
  return context;
}

interface ThemeEditorProviderProps {
  children: ReactNode;
  theme: Theme | null;
  themeJson: string;
  onThemeChange: (theme: Theme) => void;
  onThemeJsonChange: (json: string) => void;
}

export function ThemeEditorProvider({
  children,
  theme,
  themeJson,
  onThemeChange,
  onThemeJsonChange,
}: ThemeEditorProviderProps) {
  const updateTheme = (updates: Partial<Theme>) => {
    if (theme) {
      const updatedTheme = { ...theme, ...updates };
      onThemeChange(updatedTheme);
    }
  };

  const setTheme = (newTheme: Theme) => {
    onThemeChange(newTheme);
  };

  const setThemeJson = (json: string) => {
    onThemeJsonChange(json);
  };

  const value = {
    theme,
    themeJson,
    setTheme,
    setThemeJson,
    updateTheme,
  };

  return (
    <ThemeEditorContext.Provider value={value}>
      {children}
    </ThemeEditorContext.Provider>
  );
}
