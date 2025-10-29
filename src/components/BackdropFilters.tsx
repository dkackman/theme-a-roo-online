import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useThemeEditor } from "../Contexts/ThemeEditorContext";

export function BackdropFilters() {
  const { theme, updateTheme } = useThemeEditor();
  const [backdropFilters, setBackdropFilters] = useState<boolean>(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = () => {
      try {
        setIsLoading(true);

        // Check backdrop filters synchronously from theme
        const hasBackdropFilters = Boolean(
          theme?.colors?.cardBackdropFilter ||
            theme?.colors?.popoverBackdropFilter ||
            theme?.colors?.inputBackdropFilter ||
            theme?.sidebar?.backdropFilter ||
            theme?.tables?.header?.backdropFilter ||
            theme?.tables?.row?.backdropFilter ||
            theme?.tables?.footer?.backdropFilter
        );

        // Get background image from theme
        // The Theme type from theme-o-rama may not have this property in its type definition
        // but it exists at runtime, so we need to access it dynamically
        const themeWithBackground = theme as typeof theme & {
          backgroundImage?: string;
        };
        const backgroundImageResult =
          themeWithBackground?.backgroundImage || null;

        setBackdropFilters(hasBackdropFilters);
        setBackgroundImage(backgroundImageResult);
      } catch (error) {
        console.error("Failed to load backdrop filters data:", error);
        // Set default values on error
        setBackdropFilters(false);
        setBackgroundImage(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (theme) {
      loadData();
    }
  }, [theme]);

  const handleToggle = (checked: boolean) => {
    setBackdropFilters(checked);

    if (!theme) {
      return;
    }

    // Update theme with backdrop filter settings
    if (!checked) {
      return;
    }

    updateTheme({
      colors: {
        ...theme.colors,
        cardBackdropFilter: "blur(16px) saturate(180%) brightness(1.1)",
        popoverBackdropFilter: "blur(20px) saturate(180%) brightness(1.1)",
        inputBackdropFilter: "blur(8px) saturate(150%) brightness(1.05)",
      },
      sidebar: {
        ...theme.sidebar,
        backdropFilter: "blur(20px) saturate(180%) brightness(1.1)",
      },
      tables: {
        ...theme.tables,
        header: {
          ...theme.tables?.header,
          backdropFilter: "blur(8px) saturate(150%) brightness(1.05)",
        },
        row: {
          ...theme.tables?.row,
          backdropFilter: "blur(4px) saturate(120%) brightness(1.02)",
        },
        footer: {
          ...theme.tables?.footer,
          backdropFilter: "blur(8px) saturate(150%) brightness(1.05)",
        },
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="backdropFilters"
          checked={backdropFilters}
          onCheckedChange={(checked) => handleToggle(checked === true)}
          disabled={isLoading || !backgroundImage}
        />
        <Label
          htmlFor="backdropFilters"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Enable backdrop filters
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        {(() => {
          if (isLoading) {
            return "Loading...";
          }
          if (!backgroundImage) {
            return "Requires a background image to enable backdrop filters";
          }
          return "Adds blur effect to cards, popups, and other UI elements";
        })()}
      </p>
    </div>
  );
}
