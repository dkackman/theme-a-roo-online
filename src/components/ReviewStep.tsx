import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyBox } from "@/components/ui/copy-box";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { themesApi } from "../lib/data-access";

interface ReviewStepProps {
  themeId: string;
  metadataIpfsUrl: string | null;
  previewIpfsUrl?: string;
  royaltyAddress?: string | null;
  isMinted: boolean;
  onStatusUpdated?: () => void;
}

export function ReviewStep({
  themeId,
  metadataIpfsUrl,
  previewIpfsUrl,
  royaltyAddress,
  isMinted: initialIsMinted,
  onStatusUpdated,
}: ReviewStepProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isMinted, setIsMinted] = useState(initialIsMinted);

  // Update local state when prop changes
  useEffect(() => {
    setIsMinted(initialIsMinted);
  }, [initialIsMinted]);

  const handleSetStatusToMinted = async () => {
    if (!themeId || isPublishing || isMinted) {
      return;
    }

    setIsPublishing(true);

    try {
      await themesApi.update(themeId, {
        status: "minted",
      });

      setIsMinted(true);
      onStatusUpdated?.();
      toast.success("Theme status set to minted successfully!");
    } catch (error) {
      console.error("Error setting theme status:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to set theme status: ${errorMessage}`);
    } finally {
      setIsPublishing(false);
    }
  };
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Review</h2>
        <p className="text-muted-foreground mb-4">
          These values will be needed for the minting process.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-6">
          {previewIpfsUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Data URL</label>
              <CopyBox
                title="Preview Image IPFS URL"
                value={previewIpfsUrl}
                truncateMiddle={true}
              />
            </div>
          )}
          {metadataIpfsUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Metadata URL</label>
              <CopyBox
                title="Metadata IPFS URL"
                value={metadataIpfsUrl}
                truncateMiddle={true}
              />
            </div>
          )}

          {royaltyAddress && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Royalty Address</label>
              <CopyBox
                title="Royalty Address"
                value={royaltyAddress}
                truncateMiddle={true}
              />
            </div>
          )}
          {(!metadataIpfsUrl || !previewIpfsUrl || !royaltyAddress) && (
            <p className="text-sm text-muted-foreground">
              Some required information is missing. Please complete all previous
              steps.
            </p>
          )}
          {metadataIpfsUrl && previewIpfsUrl && royaltyAddress && (
            <div className="pt-4 border-t">
              <div className="flex justify-end">
                <Button
                  onClick={handleSetStatusToMinted}
                  disabled={isPublishing || isMinted}
                >
                  {isPublishing && (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting status...
                    </>
                  )}
                  {!isPublishing && isMinted && "Status: Minted"}
                  {!isPublishing && !isMinted && "Set Theme to Minted"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
