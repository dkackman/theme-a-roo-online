import { useThemeEditor } from "@/Contexts/ThemeEditorContext";
import { getThemeFiles } from "@/lib/theme-files";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileSlot } from "./FileSlot";

interface ThemeFilesManagerProps {
  themeId: string;
}

export function ThemeFilesManager({ themeId }: ThemeFilesManagerProps) {
  // Get theme editor context to update backgroundImage
  const themeEditor = useThemeEditor();
  const [files, setFiles] = useState<{
    background?: string;
    preview?: string;
    banner?: string;
    publicBackgroundUrl?: string;
    publicPreviewUrl?: string;
    publicBannerUrl?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Track the previous publicBackgroundUrl to detect changes
  const previousPublicUrlRef = useRef<string | undefined>(undefined);

  const refreshFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch signed URLs for display (thumbnails)
      const filesData = await getThemeFiles(themeId);

      // Fetch public URLs for all files (if bucket is public)
      let publicBackgroundUrl: string | undefined;
      let publicPreviewUrl: string | undefined;
      let publicBannerUrl: string | undefined;

      // Fetch public URLs if we have any files
      if (filesData.background || filesData.preview || filesData.banner) {
        try {
          const publicFilesData = await getThemeFiles(themeId, true);

          // Helper function to validate and set public URL
          const validatePublicUrl = (
            url: string | undefined,
            fallback: string | undefined
          ) => {
            if (!url) {
              return undefined;
            }
            if (url.includes("token=") || !url.includes("/object/public/")) {
              // If URL has token or wrong format, bucket is likely private
              return fallback;
            }
            return url;
          };

          publicBackgroundUrl = validatePublicUrl(
            publicFilesData.background,
            filesData.background
          );
          publicPreviewUrl = validatePublicUrl(
            publicFilesData.preview,
            filesData.preview
          );
          publicBannerUrl = validatePublicUrl(
            publicFilesData.banner,
            filesData.banner
          );
        } catch (error) {
          // If public URLs fail (bucket is private), fall back to signed URLs
          console.warn("Failed to fetch public URLs:", error);
          publicBackgroundUrl = filesData.background;
          publicPreviewUrl = filesData.preview;
          publicBannerUrl = filesData.banner;
        }
      }

      setFiles({
        ...filesData,
        publicBackgroundUrl,
        publicPreviewUrl,
        publicBannerUrl,
      });

      // Automatically insert/update the public URL in the theme when it changes
      // This handles both uploads (URL changes or is new) and deletes (URL becomes undefined)
      const previousUrl = previousPublicUrlRef.current;
      if (publicBackgroundUrl !== previousUrl) {
        themeEditor.updateTheme({ backgroundImage: publicBackgroundUrl });
        previousPublicUrlRef.current = publicBackgroundUrl;
      }
    } catch (error) {
      console.error("Failed to fetch theme files:", error);
    } finally {
      setIsLoading(false);
    }
  }, [themeId, themeEditor]);

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
          title="Background Image"
          description="Main theme background displayed throughout the app"
          fileType="background"
          fileUrl={files.background}
          themeId={themeId}
          onFileChange={refreshFiles}
          onInsertBackground={(url) => {
            themeEditor.updateTheme({ backgroundImage: url });
          }}
          publicUrl={files.publicBackgroundUrl}
          isLoading={isLoading}
        />
        <FileSlot
          title="NFT Preview"
          description="Small preview image for theme previews"
          fileType="preview"
          fileUrl={files.preview}
          publicUrl={files.publicPreviewUrl}
          themeId={themeId}
          onFileChange={refreshFiles}
          isLoading={isLoading}
        />
        <FileSlot
          title="NFT Banner"
          description="Large banner image for theme showcases"
          fileType="banner"
          fileUrl={files.banner}
          publicUrl={files.publicBannerUrl}
          themeId={themeId}
          onFileChange={refreshFiles}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
