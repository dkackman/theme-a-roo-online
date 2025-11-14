import { useThemeEditor } from "@/Contexts/ThemeEditorContext";
import {
  getThemeFilePublicUrl,
  getThemeFiles,
  type FileUseType,
} from "@/lib/theme-files";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileSlot } from "./FileSlot";
import { NftPreviewImageDialog } from "./NftPreviewImageDialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface ThemeFilesProps {
  themeId: string;
  readonly?: boolean;
  onPreviewChange?: (previewUrl?: string) => void;
}

export function ThemeFiles({
  themeId,
  readonly = false,
  onPreviewChange,
}: ThemeFilesProps) {
  // Get theme editor context to update backgroundImage
  const { theme, updateTheme } = useThemeEditor();
  const themeRef = useRef(theme);
  const updateThemeRef = useRef(updateTheme);
  const onPreviewChangeRef = useRef(onPreviewChange);
  const [files, setFiles] = useState<{
    publicBackgroundUrl?: string;
    publicPreviewUrl?: string;
    publicBannerUrl?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isNftPreviewDialogOpen, setIsNftPreviewDialogOpen] = useState(false);

  // Track the previous URLs to detect changes
  const previousBackgroundUrlRef = useRef<string | undefined>(undefined);
  const previousPreviewUrlRef = useRef<string | undefined>(undefined);
  const cancelledRef = useRef(false);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    updateThemeRef.current = updateTheme;
  }, [updateTheme]);

  useEffect(() => {
    onPreviewChangeRef.current = onPreviewChange;
  }, [onPreviewChange]);

  const refreshFiles = useCallback(async () => {
    setIsLoading(true);
    cancelledRef.current = false;

    try {
      // Fetch signed URLs for display (thumbnails)
      const filesData = await getThemeFiles(themeId);

      // Check if component was unmounted or themeId changed during fetch
      if (cancelledRef.current) {
        return;
      }

      setFiles({
        ...filesData,
        publicBackgroundUrl: filesData.background,
        publicPreviewUrl: filesData.preview,
        publicBannerUrl: filesData.banner,
      });

      // Only call onPreviewChange if the preview URL actually changed
      if (filesData.preview !== previousPreviewUrlRef.current) {
        onPreviewChangeRef.current?.(filesData.preview);
        previousPreviewUrlRef.current = filesData.preview;
      }

      // Automatically insert/update the public URL in the theme when it changes
      // This handles both uploads (URL changes or is new) and deletes (URL becomes undefined)
      const previousUrl = previousBackgroundUrlRef.current;
      if (filesData.background !== previousUrl) {
        const currentTheme = themeRef.current;
        updateThemeRef.current({
          backgroundImage: filesData.background,
          colors: {
            ...currentTheme?.colors,
            background: "transparent",
          },
        });
        previousBackgroundUrlRef.current = filesData.background;
      }
    } catch (error) {
      if (!cancelledRef.current) {
        console.error("Failed to fetch theme files:", error);
      }
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
      }
    }
  }, [themeId]);

  const refreshFile = useCallback(
    async (type: FileUseType) => {
      cancelledRef.current = false;

      try {
        const url = await getThemeFilePublicUrl(themeId, type);

        // Check if component was unmounted or themeId changed during fetch
        if (cancelledRef.current) {
          return;
        }

        setFiles((prev) => {
          const next = { ...prev };
          switch (type) {
            case "background":
              next.publicBackgroundUrl = url;
              break;
            case "preview":
              next.publicPreviewUrl = url;
              break;
            case "banner":
              next.publicBannerUrl = url;
              break;
          }
          return next;
        });

        if (type === "preview" && url !== previousPreviewUrlRef.current) {
          onPreviewChangeRef.current?.(url);
          previousPreviewUrlRef.current = url;
        }

        if (type === "background") {
          const currentTheme = themeRef.current;
          updateThemeRef.current({
            backgroundImage: url,
            colors: {
              ...currentTheme?.colors,
              background: "transparent",
            },
          });
          previousBackgroundUrlRef.current = url;
        }
      } catch (error) {
        if (!cancelledRef.current) {
          console.error("Failed to refresh file:", error);
        }
      }
    },
    [themeId]
  );

  useEffect(() => {
    if (!themeId) {
      return;
    }
    cancelledRef.current = false;
    void refreshFiles();
    return () => {
      cancelledRef.current = true;
    };
  }, [themeId, refreshFiles]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Theme Files</h2>
        <p className="text-muted-foreground">
          Manage background images and NFT assets for your theme
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FileSlot
          title="Background"
          description="Main theme app background image"
          fileType="background"
          themeId={themeId}
          onFileChange={() => refreshFile("background")}
          onInsertBackground={(url) => {
            const currentTheme = themeRef.current;
            updateThemeRef.current({
              backgroundImage: url,
              colors: {
                ...currentTheme?.colors,
                background: "transparent",
              },
            });
          }}
          publicUrl={files.publicBackgroundUrl}
          isLoading={isLoading}
          readonly={readonly}
        />
        <div className="flex flex-col gap-3">
          <FileSlot
            title="NFT Preview"
            description="Small image for NFT previews. Should be 320x320px."
            fileType="preview"
            publicUrl={files.publicPreviewUrl}
            themeId={themeId}
            onFileChange={() => refreshFile("preview")}
            isLoading={isLoading}
            readonly={readonly}
          />
          <Card>
            <CardContent className="p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNftPreviewDialogOpen(true)}
                disabled={readonly}
                className="w-full"
              >
                Generate Preview
              </Button>
            </CardContent>
          </Card>
        </div>
        <FileSlot
          title="NFT Banner"
          description="Banner image for your collection. Should be 4:1 aspect ratio."
          fileType="banner"
          publicUrl={files.publicBannerUrl}
          themeId={themeId}
          onFileChange={() => refreshFile("banner")}
          isLoading={isLoading}
          readonly={readonly}
        />
      </div>

      <NftPreviewImageDialog
        open={isNftPreviewDialogOpen}
        onOpenChange={setIsNftPreviewDialogOpen}
        themeId={themeId}
        onFileUploaded={refreshFiles}
      />
    </div>
  );
}
