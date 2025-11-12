import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useThemeEditor } from "@/Contexts/ThemeEditorContext";
import { uploadThemeFile } from "@/lib/theme-files";
import { AlertTriangle, Download, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { NftPreviewImage, captureNftPreview } from "./NftPreviewImage";

interface NftPreviewImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeId: string;
  onFileUploaded?: () => void;
}

export function NftPreviewImageDialog({
  open,
  onOpenChange,
  themeId,
  onFileUploaded,
}: NftPreviewImageDialogProps) {
  const { theme } = useThemeEditor();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handlePreviewReady = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      cardRef.current = ref.current;
      setIsReady(true);
    }
  };

  const captureImage = async (): Promise<Blob | null> => {
    const blob = await captureNftPreview(cardRef, {
      width: 320,
      height: 320,
      scale: 2,
    });
    if (!blob) {
      toast.error("Failed to generate image");
    }
    return blob;
  };

  const handleDownload = () => {
    setIsGenerating(true);
    // Defer async work to next tick to ensure loading state renders immediately
    setTimeout(() => {
      (async () => {
        try {
          const blob = await captureImage();
          if (!blob) {
            setIsGenerating(false);
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `theme-preview-${themeId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success("Image downloaded successfully");
        } catch (error) {
          console.error("Failed to download image:", error);
          toast.error("Failed to download image");
        } finally {
          setIsGenerating(false);
        }
      })();
    }, 0);
  };

  const handleUseImage = () => {
    setIsUploading(true);
    // Defer async work to next tick to ensure loading state renders immediately
    setTimeout(() => {
      (async () => {
        try {
          const blob = await captureImage();
          if (!blob) {
            setIsUploading(false);
            return;
          }

          const file = new File([blob], `theme-preview-${themeId}.png`, {
            type: "image/png",
          });

          await uploadThemeFile({
            file,
            theme_id: themeId,
            file_use_type: "preview",
          });

          toast.success("Preview image uploaded successfully");
          onFileUploaded?.();
          onOpenChange(false);
        } catch (error) {
          console.error("Failed to upload image:", error);
          toast.error("Failed to upload image");
        } finally {
          setIsUploading(false);
        }
      })();
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate NFT Preview</DialogTitle>
          <DialogDescription>
            Generate a preview image for your NFT theme.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <CardContent className="flex gap-2 p-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <CardDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Not all theme properties may render
                faithfully in the generated image. Please double-check the
                resulting image before using it.
              </CardDescription>
            </CardContent>
          </Card>
          <div className="mx-auto">
            <NftPreviewImage
              theme={theme}
              size={320}
              onReady={handlePreviewReady}
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2 flex-shrink-0 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating || isUploading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownload}
            loading={isGenerating}
            loadingText="Generating..."
            disabled={isUploading || !isReady || !theme}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="default"
            onClick={handleUseImage}
            loading={isUploading}
            loadingText="Uploading..."
            disabled={isGenerating || !isReady || !theme}
          >
            <Upload className="w-4 h-4 mr-2" />
            Use this image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
