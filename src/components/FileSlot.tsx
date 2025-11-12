import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUploadThemeFile } from "@/hooks/useUploadThemeFile";
import { deleteThemeFile, type FileUseType } from "@/lib/theme-files";
import { Copy, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePreview } from "./ImagePreview";
import { Dropzone } from "./ui/shadcn-io/dropzone";

interface FileSlotProps {
  title: string;
  description: string;
  fileType: FileUseType;
  publicUrl?: string;
  themeId: string;
  onFileChange?: () => void | Promise<void>;
  onInsertBackground?: (url: string | undefined) => void;
  isLoading?: boolean;
  readonly?: boolean;
}

export function FileSlot({
  title,
  description,
  fileType,
  publicUrl,
  themeId,
  onFileChange,
  onInsertBackground,
  isLoading = false,
  readonly = false,
}: FileSlotProps) {
  const { upload, progress, loading } = useUploadThemeFile();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) {
      return;
    }

    try {
      await upload({
        file,
        theme_id: themeId,
        file_use_type: fileType,
      });

      // Refresh files to get the new public URL
      // The parent component (ThemeFilesManager) will handle inserting the public URL
      if (onFileChange) {
        await onFileChange();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteThemeFile(themeId, fileType);

      // For background files, clear the background image from theme when deleted
      if (fileType === "background" && onInsertBackground) {
        onInsertBackground(undefined);
      }

      if (onFileChange) {
        await onFileChange();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = async () => {
    const urlToCopy = publicUrl;
    if (!urlToCopy) {
      toast.error("No URL available to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(urlToCopy);
      toast.success("URL copied to clipboard");
    } catch (error) {
      console.error("Failed to copy URL:", error);
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-9 w-full" />
          </div>
        )}
        {!isLoading && publicUrl && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <Dropzone
              accept={{ "image/*": [] }}
              maxFiles={1}
              disabled={loading || isDeleting || readonly}
              onDrop={(acceptedFiles) => {
                void handleDrop(acceptedFiles);
              }}
              onError={(error) => toast.error(error.message)}
              className="p-0 border-2 border-dashed border-border rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <div
                className="aspect-video w-full overflow-hidden rounded-lg"
                title={"Click to replace"}
              >
                <Image
                  src={publicUrl}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain"
                  quality={50}
                  placeholder="empty"
                />
              </div>
            </Dropzone>
            {loading && (
              <div className="flex items-center justify-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Uploading... {progress}%</span>
              </div>
            )}
            <div className="flex gap-2">
              {publicUrl && (
                <ImagePreview
                  imageUrl={publicUrl}
                  alt={title}
                  disabled={loading || isDeleting || !publicUrl}
                  trigger={
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={loading || isDeleting || !publicUrl}
                      className="flex-1"
                    >
                      Preview
                    </Button>
                  }
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={loading || isDeleting || !publicUrl}
                title="Copy public URL to clipboard"
              >
                <Copy className="w-4 h-4" />
              </Button>

              <DeleteButton
                title={`Delete ${title}?`}
                description="This action cannot be undone. This will permanently remove the file from storage."
                onConfirm={confirmDelete}
                disabled={loading || isDeleting || !publicUrl || readonly}
              />
            </div>
          </div>
        )}
        {!isLoading && !publicUrl && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <Dropzone
              accept={{ "image/*": [] }}
              maxFiles={1}
              disabled={loading || isDeleting || readonly}
              onDrop={(acceptedFiles) => {
                void handleDrop(acceptedFiles);
              }}
              onError={(error) => toast.error(error.message)}
              className="p-0 border-2 border-dashed border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="aspect-video w-full flex flex-col items-center justify-center gap-2">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  Drag and drop or click
                  <br />
                  to upload {title.toLowerCase()}
                </p>
              </div>
            </Dropzone>
            {loading && (
              <div className="flex items-center justify-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Uploading... {progress}%</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
