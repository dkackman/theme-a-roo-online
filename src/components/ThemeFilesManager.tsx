import { useThemeEditor } from "@/Contexts/ThemeEditorContext";
import {
  getThemeFilePublicUrl,
  getThemeFiles,
  type FileUseType,
} from "@/lib/theme-files";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileSlot } from "./FileSlot";
import { NftPreviewDialog } from "./NftPreviewDialog";
import { Button } from "./ui/button";

interface ThemeFilesManagerProps {
  themeId: string;
  readonly?: boolean;
}

export function ThemeFilesManager({
  themeId,
  readonly = false,
}: ThemeFilesManagerProps) {
  // Get theme editor context to update backgroundImage
  const themeEditor = useThemeEditor();
  const [files, setFiles] = useState<{
    publicBackgroundUrl?: string;
    publicPreviewUrl?: string;
    publicBannerUrl?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isNftPreviewDialogOpen, setIsNftPreviewDialogOpen] = useState(false);

  // Track the previous publicBackgroundUrl to detect changes
  const previousPublicUrlRef = useRef<string | undefined>(undefined);

  const refreshFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch signed URLs for display (thumbnails)
      const filesData = await getThemeFiles(themeId);

      setFiles({
        ...filesData,
        publicBackgroundUrl: filesData.background,
        publicPreviewUrl: filesData.preview,
        publicBannerUrl: filesData.banner,
      });

      // Automatically insert/update the public URL in the theme when it changes
      // This handles both uploads (URL changes or is new) and deletes (URL becomes undefined)
      const previousUrl = previousPublicUrlRef.current;
      if (filesData.background !== previousUrl) {
        themeEditor.updateTheme({ backgroundImage: filesData.background });
        previousPublicUrlRef.current = filesData.background;
      }
    } catch (error) {
      console.error("Failed to fetch theme files:", error);
    } finally {
      setIsLoading(false);
    }
  }, [themeId, themeEditor]);

  const refreshFile = useCallback(
    async (type: FileUseType) => {
      const url = await getThemeFilePublicUrl(themeId, type);

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

      if (type === "background") {
        themeEditor.updateTheme({ backgroundImage: url });
        previousPublicUrlRef.current = url;
      }
    },
    [themeEditor, themeId]
  );

  useEffect(() => {
    if (!themeId) {
      return;
    }
    void refreshFiles();
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
            themeEditor.updateTheme({ backgroundImage: url });
          }}
          publicUrl={files.publicBackgroundUrl}
          isLoading={isLoading}
          readonly={readonly}
        />
        <div className="space-y-3">
          <FileSlot
            title="NFT Preview"
            description="Small image for NFT previews"
            fileType="preview"
            publicUrl={files.publicPreviewUrl}
            themeId={themeId}
            onFileChange={() => refreshFile("preview")}
            isLoading={isLoading}
            readonly={readonly}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNftPreviewDialogOpen(true)}
            disabled={readonly}
            className="w-full"
          >
            Generate
          </Button>
        </div>
        <FileSlot
          title="NFT Banner"
          description="Large image for NFT showcases"
          fileType="banner"
          publicUrl={files.publicBannerUrl}
          themeId={themeId}
          onFileChange={() => refreshFile("banner")}
          isLoading={isLoading}
          readonly={readonly}
        />
      </div>

      <NftPreviewDialog
        open={isNftPreviewDialogOpen}
        onOpenChange={setIsNftPreviewDialogOpen}
        themeId={themeId}
        onFileUploaded={refreshFiles}
      />
    </div>
  );
}
