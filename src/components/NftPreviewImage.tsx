import { Skeleton } from "@/components/ui/skeleton";
import html2canvas from "html2canvas-pro";
import { useEffect, useRef, useState } from "react";
import { useSimpleTheme, type Theme } from "theme-o-rama";
import { ThemeCard } from "./ThemeCard";

interface NftPreviewProps {
  theme: Theme | null;
  className?: string;
  size?: number;
  onReady?: (captureRef: React.RefObject<HTMLDivElement | null>) => void;
}

/**
 * NFT Preview component that renders a theme card for preview/capture purposes.
 * Can be embedded in any page and provides a ref for capturing the preview as an image.
 */
export function NftPreviewImage({
  theme,
  className = "",
  size = 320,
  onReady,
}: NftPreviewProps) {
  const { initializeTheme } = useSimpleTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [initializedTheme, setInitializedTheme] = useState<Theme | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize the theme when it changes to merge inherited properties
  useEffect(() => {
    if (!theme) {
      setInitializedTheme(null);
      return;
    }

    let cancelled = false;
    setIsInitializing(true);

    const initTheme = async () => {
      try {
        const initialized = await initializeTheme(theme);
        if (!cancelled) {
          setInitializedTheme(initialized);
        }
      } catch (error) {
        console.error("Failed to initialize theme for preview:", error);
        if (!cancelled) {
          // Fallback to uninitialized theme if initialization fails
          setInitializedTheme(theme);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    void initTheme();

    return () => {
      cancelled = true;
    };
  }, [theme, initializeTheme]);

  // Notify parent when ready
  useEffect(() => {
    if (!isInitializing && cardRef.current && onReady) {
      onReady(cardRef);
    }
  }, [isInitializing, onReady]);

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {isInitializing ? (
        <div className="flex items-center justify-center h-full w-full">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      ) : (
        <div ref={cardRef} className="w-full h-full">
          <ThemeCard
            key={initializedTheme?.name || theme?.name || "default"}
            theme={initializedTheme || theme}
            isSelected={false}
            onSelect={() => {}}
            className="w-full h-full"
            fullsize={true}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Utility function to capture an NFT preview as an image blob.
 * @param elementRef - Reference to the HTML element containing the preview
 * @param options - Optional capture options (width, height, scale)
 * @returns Promise resolving to a Blob or null if capture fails
 */
export async function captureNftPreview(
  elementRef: React.RefObject<HTMLDivElement | null>,
  options?: {
    width?: number;
    height?: number;
    scale?: number;
  }
): Promise<Blob | null> {
  if (!elementRef.current) {
    return null;
  }

  try {
    const canvas = await html2canvas(elementRef.current, {
      width: options?.width || 320,
      height: options?.height || 320,
      scale: options?.scale || 2, // Higher quality
      useCORS: true,
      backgroundColor: null,
    });

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob: Blob | null) => {
        resolve(blob);
      }, "image/png");
    });
  } catch (error) {
    console.error("Failed to capture NFT preview:", error);
    return null;
  }
}
