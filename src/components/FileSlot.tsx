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
import { useUploadThemeFile } from "@/hooks/useUploadThemeFile";
import { deleteThemeFile, type FileUseType } from "@/lib/theme-files";
import { ImageIcon, Loader2, Upload } from "lucide-react";
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

export function FileSlot({
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

      if (onFileChange) {
        onFileChange();
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const confirmDelete = async () => {
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
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  <Image
                    src={fileUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain rounded-lg"
                    priority={false}
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="!max-w-none !md:max-w-none w-auto h-auto max-w-[95vw] max-h-[95vh] p-0 bg-black/90">
                <div className="relative flex items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
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

              <DeleteButton
                title={`Delete ${title}?`}
                description="This action cannot be undone. This will permanently remove the file from storage."
                onConfirm={confirmDelete}
                disabled={loading || isDeleting}
              />
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
