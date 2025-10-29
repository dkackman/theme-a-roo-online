import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUploadThemeFile } from "@/hooks/useUploadThemeFile";
import { deleteThemeFile, type FileUseType } from "@/lib/theme-files";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Input } from "./ui/input";

interface FileSlotProps {
  title: string;
  description: string;
  fileType: FileUseType;
  fileUrl?: string;
  themeId: string;
  onFileChange?: () => void;
}

function FileSlot({
  title,
  description,
  fileType,
  fileUrl,
  themeId,
  onFileChange,
}: FileSlotProps) {
  const { upload, progress, loading } = useUploadThemeFile();
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      await upload({
        file,
        theme_id: themeId,
        file_use_type: fileType,
      });

      // Refresh file list
      if (onFileChange) {
        onFileChange();
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${title}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteThemeFile(themeId, fileType);
      if (onFileChange) {
        onFileChange();
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {fileUrl ? (
          <div className="space-y-3">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <Image
                src={fileUrl}
                alt={title}
                className="max-w-full max-h-full rounded-lg"
              />
            </div>
            {loading && (
              <div className="text-sm text-muted-foreground text-center">
                Uploading... {progress}%
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFileSelect}
                disabled={loading || isDeleting}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={loading || isDeleting}
                className="flex-1"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-border">
              <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No file uploaded</p>
            </div>
            {loading && (
              <div className="text-sm text-muted-foreground text-center">
                Uploading... {progress}%
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleFileSelect}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload {title}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ThemeFilesManagerProps {
  themeId: string;
}

export function ThemeFilesManager({ themeId }: ThemeFilesManagerProps) {
  // TODO: Fetch actual file URLs from storage
  const [files, _setFiles] = useState<{
    background?: string;
    preview?: string;
    banner?: string;
  }>({});

  const refreshFiles = async () => {
    // TODO: Implement file fetching
    // const filesData = await getThemeFiles(themeId);
    // setFiles(filesData);
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
