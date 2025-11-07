import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { applyThemeIsolated, type Theme } from "theme-o-rama";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface ThemePreviewRendererProps {
  theme: Theme | null;
  className?: string;
}

interface ThemePreviewContentProps {
  theme: Theme | null;
}

export function ThemePreviewRenderer({
  theme,
  className,
}: ThemePreviewRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current && theme) {
      applyThemeIsolated(theme, containerRef.current);
    }
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "theme-preview relative h-full overflow-auto rounded-lg border bg-background text-foreground theme-card-isolated",
        className
      )}
    >
      <ThemePreviewContent theme={theme} />
    </div>
  );
}

export function ThemePreviewContent({ theme }: ThemePreviewContentProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          {theme?.displayName ?? "Theme"} Preview
        </h1>
      </div>

      {/* Current Theme Info */}
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Theme Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>Theme information</CardDescription>
          <div className="space-y-2 text-left">
            <p>
              <strong>Name:</strong> {theme?.name || "None"}
            </p>
            <p>
              <strong>Display Name:</strong> {theme?.displayName || "None"}
            </p>
            <p>
              <strong>Inherits:</strong> {theme?.inherits || "N/A"}
            </p>
            <p>
              <strong>Most Like:</strong> {theme?.mostLike || "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Components */}
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Theme Test Components</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Various test components to preview the theme
          </CardDescription>
          {/* Buttons */}
          <div className="space-y-2">
            <h3 className="font-medium">Buttons</h3>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90">
                Primary
              </button>
              <button className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:opacity-90">
                Secondary
              </button>
              <button className="rounded-md bg-destructive px-4 py-2 text-destructive-foreground hover:opacity-90">
                Destructive
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            <h3 className="font-medium">Cards</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                <h4 className="font-semibold">Card 1</h4>
                <p className="text-muted-foreground">
                  This is a card with themed styling.
                </p>
              </div>
              <div className="space-y-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                <h4 className="font-semibold">Card 2</h4>
                <p className="text-muted-foreground">
                  Cards adapt to the current theme.
                </p>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <h3 className="font-medium">Color Palette</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded border bg-background p-3 text-foreground">
                Background
              </div>
              <div className="rounded bg-primary p-3 text-primary-foreground">
                Primary
              </div>
              <div className="rounded bg-secondary p-3 text-secondary-foreground">
                Secondary
              </div>
              <div className="rounded bg-muted p-3 text-muted-foreground">
                Muted
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
