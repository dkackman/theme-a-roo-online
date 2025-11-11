import { Button } from "@/components/ui/button";
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
import html2canvas from "html2canvas-pro";
import { Download, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ThemeCard } from "./ThemeCard";

interface NftPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeId: string;
  onFileUploaded?: () => void;
}

export function NftPreviewDialog({
  open,
  onOpenChange,
  themeId,
  onFileUploaded,
}: NftPreviewDialogProps) {
  const { theme } = useThemeEditor();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const captureImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) {
      return null;
    }

    try {
      const canvas = await html2canvas(cardRef.current, {
        width: 320,
        height: 320,
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: null,
      });

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob: Blob | null) => {
          resolve(blob);
        }, "image/png");
      });
    } catch (error) {
      console.error("Failed to capture image:", error);
      toast.error("Failed to generate image");
      return null;
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await captureImage();
      if (!blob) {
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
  };

  const handleUseImage = async () => {
    setIsUploading(true);
    try {
      const blob = await captureImage();
      if (!blob) {
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
        <div className="py-4">
          <div className="w-[320px] h-[320px] mx-auto flex items-center justify-center">
            <div ref={cardRef} className="w-full h-full">
              <ThemeCard
                theme={theme}
                isSelected={false}
                onSelect={() => {}}
                className="w-full h-full"
                fullsize={true}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
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
            disabled={isGenerating || isUploading || !theme}
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Download"}
          </Button>
          <Button
            variant="default"
            onClick={handleUseImage}
            disabled={isGenerating || isUploading || !theme}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading..." : "Use this image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
