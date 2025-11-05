import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUploadThemeFile } from "@/hooks/useUploadThemeFile";
import { deleteThemeFile, type FileUseType } from "@/lib/theme-files";
import { Copy, ImageIcon, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input";

interface FileSlotProps {
  title: string;
  description: string;
  fileType: FileUseType;
  fileUrl?: string;
  publicUrl?: string;
  themeId: string;
  onFileChange?: () => void | Promise<void>;
  onInsertBackground?: (url: string | undefined) => void;
  isLoading?: boolean;
}

export function FileSlot({
  title,
  description,
  fileType,
  fileUrl,
  publicUrl,
  themeId,
  onFileChange,
  onInsertBackground,
  isLoading = false,
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

      // Refresh files to get the new public URL
      // The parent component (ThemeFilesManager) will handle inserting the public URL
      if (onFileChange) {
        await onFileChange();
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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
    const urlToCopy = publicUrl || fileUrl;
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
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-9 w-full" />
          </div>
        )}
        {!isLoading && fileUrl && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  <Image
                    src={fileUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain rounded-lg"
                    quality={50}
                    placeholder="empty"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="!max-w-none !md:max-w-none w-auto h-auto max-w-[95vw] max-h-[95vh] p-0 bg-black/90">
                <div className="relative flex items-center justify-center p-4">
                  {}
                  <Image
                    src={fileUrl}
                    alt={title}
                    className="max-w-[93vw] max-h-[93vh] w-auto h-auto object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
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
                onClick={handleCopy}
                disabled={loading || isDeleting || !fileUrl}
                className="p-1.5"
                title="Copy public URL to clipboard"
              >
                <Copy className="w-4 h-4" />
              </Button>

              <DeleteButton
                title={`Delete ${title}?`}
                description="This action cannot be undone. This will permanently remove the file from storage."
                onConfirm={confirmDelete}
                disabled={loading || isDeleting}
              />
            </div>
          </div>
        )}
        {!isLoading && !fileUrl && (
          <div className="space-y-3 animate-in fade-in duration-300">
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
