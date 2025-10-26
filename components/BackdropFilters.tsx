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
    const loadData = async () => {
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

        // Get background image from theme (check various possible locations)
        const backgroundImageResult =
          (theme as any)?.background?.imageUrl ||
          (theme as any)?.backgroundImage ||
          null;

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

    if (!theme) return;

    // Update theme with backdrop filter settings
    if (checked) {
      updateTheme({
        colors: {
          ...theme.colors,
          cardBackdropFilter: checked
            ? "blur(16px) saturate(180%) brightness(1.1)"
            : null,
          popoverBackdropFilter: checked
            ? "blur(20px) saturate(180%) brightness(1.1)"
            : null,
          inputBackdropFilter: checked
            ? "blur(8px) saturate(150%) brightness(1.05)"
            : null,
        },
        sidebar: {
          ...theme.sidebar,
          backdropFilter: checked
            ? "blur(20px) saturate(180%) brightness(1.1)"
            : null,
        },
        tables: {
          ...theme.tables,
          header: {
            ...theme.tables?.header,
            backdropFilter: checked
              ? "blur(8px) saturate(150%) brightness(1.05)"
              : null,
          },
          row: {
            ...theme.tables?.row,
            backdropFilter: checked
              ? "blur(4px) saturate(120%) brightness(1.02)"
              : null,
          },
          footer: {
            ...theme.tables?.footer,
            backdropFilter: checked
              ? "blur(8px) saturate(150%) brightness(1.05)"
              : null,
          },
        },
      });
    }
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
        {isLoading
          ? "Loading..."
          : !backgroundImage
            ? "Requires a background image to enable backdrop filters"
            : "Adds blur effect to cards, popups, and other UI elements"}
      </p>
    </div>
  );
}
