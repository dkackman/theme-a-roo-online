import { Check, Palette } from "lucide-react";
import { forwardRef, useEffect, useRef } from "react";
import { applyThemeIsolated, Theme } from "theme-o-rama";

interface ThemeCardProps {
  theme: Theme | null;
  isSelected: boolean;
  onSelect: (theme: Theme) => void;
  className?: string;
  fullsize?: boolean;
}

export const ThemeCard = forwardRef<HTMLDivElement, ThemeCardProps>(
  ({ theme, isSelected, onSelect, className = "", fullsize = false }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (cardRef.current && theme) {
        applyThemeIsolated(theme, cardRef.current);
      }
    }, [theme]);

    useEffect(() => {
      if (previewRef.current && theme && fullsize) {
        applyThemeIsolated(theme, previewRef.current);
      }
    }, [theme, fullsize]);

    // Only apply selection outline as inline style
    const selectionStyle = isSelected
      ? {
          outline: `2px solid ${theme?.colors?.primary || "hsl(220 13% 91%)"}`,
        }
      : {};

    const renderFullsizeContent = () => {
      if (!theme) {
        return null;
      }

      return (
        <div
          ref={(node) => {
            previewRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          className="w-full h-full mx-auto aspect-square border border-border rounded-none shadow-lg theme-card-isolated"
        >
          <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-foreground font-heading">
                {theme.displayName}
              </h3>
              <div className="w-6 h-6 bg-primary rounded-full relative">
                <span
                  className="text-primary-foreground text-xs font-bold absolute inset-0 flex items-center justify-center"
                  style={{
                    lineHeight: "1",
                    transform: "translateY(-1px)",
                  }}
                >
                  {" "}
                </span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 space-y-4">
              {/* Primary Button */}
              <div className="h-12 px-4 bg-primary text-primary-foreground rounded-lg shadow-button relative">
                <span
                  className="font-medium font-body absolute inset-0 flex items-center"
                  style={{
                    lineHeight: "1",
                    transform: "translateY(-1px)",
                  }}
                >
                  {" "}
                </span>
              </div>

              {/* Color Palette */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground font-heading">
                  Color Palette
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="h-8 bg-primary rounded-md relative">
                    <span
                      className="text-primary-foreground text-xs font-bold absolute inset-0 flex items-center justify-center"
                      style={{
                        lineHeight: "1",
                        transform: "translateY(-1px)",
                      }}
                    >
                      {" "}
                    </span>
                  </div>
                  <div className="h-8 bg-secondary rounded-md relative">
                    <span
                      className="text-secondary-foreground text-xs font-bold absolute inset-0 flex items-center justify-center"
                      style={{
                        lineHeight: "1",
                        transform: "translateY(-1px)",
                      }}
                    >
                      {" "}
                    </span>
                  </div>
                  <div className="h-8 bg-accent rounded-md relative">
                    <span
                      className="text-accent-foreground text-xs font-bold absolute inset-0 flex items-center justify-center"
                      style={{
                        lineHeight: "1",
                        transform: "translateY(-1px)",
                      }}
                    >
                      {" "}
                    </span>
                  </div>
                  <div className="h-8 bg-destructive rounded-md relative">
                    <span
                      className="text-destructive-foreground text-xs font-bold absolute inset-0 flex items-center justify-center"
                      style={{
                        lineHeight: "1",
                        transform: "translateY(-1px)",
                      }}
                    >
                      {" "}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Card */}
              <div className="bg-card text-card-foreground border border-border rounded-lg p-3">
                <div className="text-sm font-medium font-heading mb-1"> </div>
                <div className="text-xs text-muted-foreground font-body"></div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    const renderDefaultContent = () => {
      const checkStyles: Record<string, string | undefined> = {};
      if (theme?.colors?.primary) {
        checkStyles.color = theme?.colors.primary;
      } else {
        checkStyles.color = "hsl(220 13% 91%)"; // Default gray
      }

      return (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-foreground font-heading">
              {theme?.displayName || "Get started"}
            </h3>
            <div className="flex items-center gap-2">
              {isSelected && <Check className="h-4 w-4" style={checkStyles} />}
            </div>
          </div>

          {/* Theme preview */}
          <div className="space-y-2">
            <div className="h-8 flex items-center px-2 bg-primary text-primary-foreground rounded-md shadow-button">
              <span className="text-xs font-medium font-body">Aa</span>
            </div>
            <div className="flex gap-1">
              <div className="h-4 w-4 bg-primary rounded-sm" />
              <div className="h-4 w-4 bg-secondary rounded-sm" />
              <div className="h-4 w-4 bg-accent rounded-sm" />
              <div className="h-4 w-4 bg-destructive rounded-sm" />
            </div>
            {theme && (
              <div className="text-xs truncate text-muted-foreground font-body">
                {theme.fonts?.heading?.split(",")[0] || "Default"}
              </div>
            )}
          </div>
        </div>
      );
    };

    if (!theme) {
      return (
        <div
          className={`border-2 border-dashed border-border rounded-lg p-6 text-center ${className}`}
        >
          <Palette className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium text-sm text-foreground mb-2">No Theme</h3>
        </div>
      );
    }

    if (fullsize) {
      if (!theme) {
        return (
          <div className={className}>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center h-full flex items-center justify-center">
              <div>
                <Palette className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium text-sm text-foreground mb-2">
                  No Theme
                </h3>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div ref={ref} className={className}>
          {renderFullsizeContent()}
        </div>
      );
    }

    return (
      <>
        <div
          ref={(node) => {
            cardRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          className={`cursor-pointer transition-all hover:opacity-90 text-card-foreground border border-border rounded-lg shadow-card theme-card-isolated ${
            isSelected ? "ring-2" : "hover:ring-1"
          } ${className}`}
          style={selectionStyle}
          onClick={() => onSelect(theme)}
        >
          {renderDefaultContent()}
        </div>
      </>
    );
  }
);
