import { hasTag } from "@/lib/themes";
import { Loader2 } from "lucide-react";
import { Theme, useTheme } from "theme-o-rama";
import { ThemeCard } from "./ThemeCard";

export function ThemeSelector() {
  const { currentTheme, setTheme, availableThemes, isLoading, error } =
    useTheme();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        <span className="ml-2">Loading themes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-destructive">
        <p>Error loading themes: {error}</p>
      </div>
    );
  }

  if (!currentTheme) {
    return <div className="text-center p-8">No theme available</div>;
  }

  const defaultThemes = availableThemes
    .filter((theme: Theme) => !hasTag(theme, "hidden"))
    .sort((a: Theme, b: Theme) => a.displayName.localeCompare(b.displayName));

  return (
    <div className="space-y-8">
      {/* Default Themes */}
      {defaultThemes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-8">
          {defaultThemes.map((theme: Theme) => (
            <ThemeCard
              key={theme.name}
              theme={theme}
              isSelected={currentTheme.name === theme.name}
              onSelect={setTheme}
            />
          ))}
        </div>
      )}
    </div>
  );
}
