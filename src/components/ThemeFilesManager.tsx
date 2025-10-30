import { getThemeFiles } from "@/lib/theme-files";
import { useEffect, useState } from "react";
import { FileSlot } from "./FileSlot";

interface ThemeFilesManagerProps {
  themeId: string;
}

export function ThemeFilesManager({ themeId }: ThemeFilesManagerProps) {
  // TODO: Fetch actual file URLs from storage
  const [files, setFiles] = useState<{
    background?: string;
    preview?: string;
    banner?: string;
  }>({});
  useEffect(() => {
    if (!themeId) return;
    void refreshFiles();
  }, [themeId]);
  const refreshFiles = async () => {
    try {
      const filesData = await getThemeFiles(themeId);
      setFiles(filesData);
    } catch (error) {
      console.error("Failed to fetch theme files:", error);
    }
  };

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
        />
        <FileSlot
          title="NFT Preview"
          description="Small preview image for theme previews"
          fileType="preview"
          fileUrl={files.preview}
          themeId={themeId}
          onFileChange={refreshFiles}
        />
        <FileSlot
          title="NFT Banner"
          description="Large banner image for theme showcases"
          fileType="banner"
          fileUrl={files.banner}
          themeId={themeId}
          onFileChange={refreshFiles}
        />
      </div>
    </div>
  );
}
