import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { hslToRgb, rgbToHsl } from "@/lib/color";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RgbColorPicker } from "react-colorful";
import { useThemeEditor } from "../Contexts/ThemeEditorContext";

interface ThemeColorPickerProps {
  className?: string;
  readonly?: boolean;
}

export function ThemeColorPicker({ className = "", readonly = false }: ThemeColorPickerProps) {
  const { theme, updateTheme } = useThemeEditor();

  const hasBackgroundImage = Boolean(theme?.backgroundImage);

  const getColorFromTheme = useCallback((): {
    r: number;
    g: number;
    b: number;
  } => {
    if (theme?.colors?.themeColor) {
      const rgb = hslToRgb(theme.colors.themeColor);
      if (rgb) {
        return rgb;
      }
    }
    return theme?.mostLike === "dark"
      ? { r: 0, g: 0, b: 0 }
      : { r: 255, g: 255, b: 255 };
  }, [theme]);

  const [color, setColor] = useState(getColorFromTheme());

  // Compute whether background should be checked based on current theme
  const shouldApplyToBackground = useMemo(() => {
    return theme?.colors?.background === "var(--theme-color)";
  }, [theme?.colors?.background]);

  const [applyToBackground, setApplyToBackground] = useState(
    shouldApplyToBackground
  );

  // Update color and applyToBackground when theme changes
  useEffect(() => {
    setColor(getColorFromTheme());
    setApplyToBackground(shouldApplyToBackground);
  }, [theme, getColorFromTheme, shouldApplyToBackground]);

  const handleColorChange = (newColor: { r: number; g: number; b: number }) => {
    if (hasBackgroundImage || readonly) {
      return;
    }
    setColor(newColor);
    // Convert RGB to HSL using the color helper
    const hsl = rgbToHsl(newColor);
    const hslColor = `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`;

    if (theme) {
      updateTheme({
        colors: {
          ...theme.colors,
          themeColor: hslColor,
        },
      });
    }
  };

  const handleApplyToBackgroundChange = (checked: boolean) => {
    if (hasBackgroundImage || readonly) {
      return;
    }
    setApplyToBackground(checked);
    if (checked && theme) {
      updateTheme({
        colors: {
          ...theme.colors,
          background: "var(--theme-color)",
        },
      });
    } else if (theme) {
      updateTheme({
        colors: {
          ...theme.colors,
          background: undefined,
        },
      });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-center">
        <div
          className={`relative ${hasBackgroundImage || readonly ? "pointer-events-none opacity-50" : ""}`}
        >
          <RgbColorPicker
            color={color}
            onChange={handleColorChange}
            style={{ width: "200px", height: "200px" }}
          />
          {(hasBackgroundImage || readonly) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded bg-background/80 px-2 py-1 text-xs text-muted-foreground shadow-sm">
                {hasBackgroundImage
                  ? "Disabled while background image is set"
                  : "Read-only mode"}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center space-x-2">
        <Checkbox
          id="apply-to-background"
          checked={applyToBackground}
          onCheckedChange={handleApplyToBackgroundChange}
          disabled={hasBackgroundImage || readonly}
        />
        <Label htmlFor="apply-to-background" className="text-sm cursor-pointer">
          Apply to background color
        </Label>
      </div>
      <div className="text-center">
        <div
          className="w-16 h-16 mx-auto rounded-lg border-2 border-border shadow-sm"
          style={{
            backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b})`,
          }}
        />
        <div className="mt-2 space-y-1">
          <p className="text-sm text-muted-foreground">
            RGBA({color.r}, {color.g}, {color.b})
          </p>
          <p className="text-sm text-muted-foreground">
            {(() => {
              const hsl = rgbToHsl(color);
              return `HSL(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
