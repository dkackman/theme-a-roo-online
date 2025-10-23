import { hasTag } from "@/lib/themes";
import { Loader2, RefreshCw } from "lucide-react";
import { Theme, useTheme } from "theme-o-rama";
import { useUserThemes } from "../hooks/useUserThemes";
import { ThemeCard } from "./ThemeCard";
import { Button } from "./ui/button";

export function ThemeSelector() {
  const { currentTheme, setTheme, availableThemes, isLoading, error } =
    useTheme();
  const {
    userThemes,
    isLoading: isLoadingUserThemes,
    error: userThemesError,
    reloadThemes,
  } = useUserThemes();

  // Handle theme selection and cache the theme definition
  const handleThemeSelect = (themeName: string) => {
    setTheme(themeName);

    // Find the theme object and cache its definition
    const themeObject = [...userThemes, ...availableThemes].find(
      (t) => t.name === themeName
    );
    if (themeObject) {
      try {
        localStorage.setItem(
          "selected-theme-definition",
          JSON.stringify(themeObject)
        );
      } catch (error) {
        console.warn("Failed to cache theme definition:", error);
      }
    }
  };

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
    .filter(
      (theme: Theme) => !hasTag(theme, "hidden") && !hasTag(theme, "custom")
    )
    .sort((a: Theme, b: Theme) => a.displayName.localeCompare(b.displayName));

  // Use user themes from the hook instead of availableThemes
  const customThemes = userThemes.sort((a: Theme, b: Theme) =>
    a.displayName.localeCompare(b.displayName)
  );

  return (
    <div className="space-y-8">
      {/* Custom User Themes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Custom Themes</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={reloadThemes}
            disabled={isLoadingUserThemes}
          >
            {isLoadingUserThemes ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {userThemesError && (
          <div className="text-center p-4 text-destructive mb-4">
            <p>Error loading themes: {userThemesError}</p>
          </div>
        )}

        {isLoadingUserThemes && customThemes.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading your themes...</span>
          </div>
        ) : customThemes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {customThemes.map((theme: Theme) => (
              <ThemeCard
                key={theme.name}
                theme={theme}
                isSelected={currentTheme.name === theme.name}
                onSelect={handleThemeSelect}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            <p>
              No custom themes found. Create your first theme in the theme
              editor!
            </p>
          </div>
        )}
      </div>

      {/* Default Themes */}
      {defaultThemes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Built-in Themes</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {defaultThemes.map((theme: Theme) => (
              <ThemeCard
                key={theme.name}
                theme={theme}
                isSelected={currentTheme.name === theme.name}
                onSelect={handleThemeSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
