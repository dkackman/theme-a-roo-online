import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Theme } from "theme-o-rama";
import { themesApi } from "../lib/data-access";
import type { Database } from "../lib/database.types";
import { uploadJsonMetadata } from "../lib/ipfs";
import { generateNftMetadata } from "../lib/nft-metadata";

type DbTheme = Database["public"]["Tables"]["themes"]["Row"];

interface NftMetadataStepProps {
  theme: Theme;
  dbTheme: DbTheme;
  themeId: string;
  ipfsUrls: {
    background?: string;
    preview?: string;
    banner?: string;
  };
  previousStep?: "preview" | "upload-images" | "metadata" | "review" | null;
  onMetadataUploaded?: (ipfsUrl: string) => void;
  onCanProceedChange?: (canProceed: boolean) => void;
}

export function NftMetadataStep({
  theme,
  dbTheme,
  themeId,
  ipfsUrls,
  previousStep,
  onMetadataUploaded,
  onCanProceedChange,
}: NftMetadataStepProps) {
  const [metadataIpfsUrl, setMetadataIpfsUrl] = useState<string | null>(null);
  const [isUploadingMetadata, setIsUploadingMetadata] = useState(false);

  // Load collectionId from database if it exists, otherwise generate a new one
  // This ensures consistency across re-uploads and component remounts
  // Use useState with lazy initializer to generate only once, then update via effect if dbTheme changes
  const [collectionId, setCollectionId] = useState<string>(() => {
    return dbTheme.collection_id || crypto.randomUUID();
  });

  // Update collectionId if dbTheme.collection_id becomes available (e.g., after first upload)
  useEffect(() => {
    if (dbTheme.collection_id && dbTheme.collection_id !== collectionId) {
      setCollectionId(dbTheme.collection_id);
    }
  }, [dbTheme.collection_id, collectionId]);

  // Load existing metadata IPFS URL from dbTheme
  // If coming from upload-images step, require re-upload (clear existing)
  // If coming from review step, keep existing metadata
  useEffect(() => {
    if (previousStep === "upload-images") {
      // Coming from upload step - images may have changed, require new metadata upload
      setMetadataIpfsUrl(null);
    } else if (dbTheme.nft_metadata_url) {
      // Coming from other steps (or initial load) - use existing metadata if available
      setMetadataIpfsUrl(dbTheme.nft_metadata_url);
    }
  }, [dbTheme.nft_metadata_url, previousStep]);

  const canProceed = !!metadataIpfsUrl;

  // Notify parent when canProceed changes
  useEffect(() => {
    onCanProceedChange?.(canProceed);
  }, [canProceed, onCanProceedChange]);

  const handleUploadMetadata = async () => {
    if (!theme || !dbTheme || isUploadingMetadata) {
      return;
    }

    // Get Pinata configuration from storage
    const apiKey = sessionStorage.getItem("pinata-jwt") || "";
    const gatewayUrl = localStorage.getItem("pinata-gateway") || "";
    const groupName = localStorage.getItem("pinata-group-name") || "";

    if (!apiKey || !gatewayUrl || !groupName) {
      toast.error(
        "Please configure Pinata settings in the Upload Images step first"
      );
      return;
    }

    setIsUploadingMetadata(true);

    try {
      // Convert IPFS URLs to UploadedFile format
      const uploadedFiles = [
        ipfsUrls.background && {
          url: ipfsUrls.background,
          fileUseType: "background" as const,
        },
        ipfsUrls.preview && {
          url: ipfsUrls.preview,
          fileUseType: "preview" as const,
        },
        ipfsUrls.banner && {
          url: ipfsUrls.banner,
          fileUseType: "banner" as const,
        },
      ].filter(Boolean) as Array<{
        url: string;
        fileUseType: "background" | "preview" | "banner";
      }>;

      // Generate metadata
      const metadataJson = generateNftMetadata(
        theme,
        collectionId,
        dbTheme.description || "",
        dbTheme.author_name || "",
        dbTheme.twitter || "",
        dbTheme.sponsor || "",
        dbTheme.website || "",
        dbTheme.did || "",
        uploadedFiles
      );

      // Upload to IPFS
      const basename = dbTheme.display_name.toLowerCase();
      const ipfsUrl = await uploadJsonMetadata(
        apiKey,
        gatewayUrl,
        groupName,
        basename,
        metadataJson
      );

      // Save to database (including collectionId to ensure consistency)
      await themesApi.update(themeId, {
        nft_metadata_url: ipfsUrl,
        collection_id: collectionId,
      });

      setMetadataIpfsUrl(ipfsUrl);
      onMetadataUploaded?.(ipfsUrl);

      toast.success("Metadata uploaded to IPFS successfully!");
    } catch (error) {
      console.error("Error uploading metadata:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to upload metadata: ${errorMessage}`);
    } finally {
      setIsUploadingMetadata(false);
    }
  };
  // Convert IPFS URLs to UploadedFile format for metadata generation
  const uploadedFiles = [
    ipfsUrls.background && {
      url: ipfsUrls.background,
      fileUseType: "background" as const,
    },
    ipfsUrls.preview && {
      url: ipfsUrls.preview,
      fileUseType: "preview" as const,
    },
    ipfsUrls.banner && {
      url: ipfsUrls.banner,
      fileUseType: "banner" as const,
    },
  ].filter(Boolean) as Array<{
    url: string;
    fileUseType: "background" | "preview" | "banner";
  }>;

  const metadataJson = generateNftMetadata(
    theme,
    collectionId,
    dbTheme.description || "",
    dbTheme.author_name || "",
    dbTheme.twitter || "",
    dbTheme.sponsor || "",
    dbTheme.website || "",
    dbTheme.did || "",
    uploadedFiles
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Configure Metadata</h2>
        <p className="text-muted-foreground mb-4">
          Review and upload the NFT metadata to IPFS.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Generated Metadata JSON
              </label>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs max-h-96">
                {metadataJson}
              </pre>
            </div>
            {metadataIpfsUrl && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Metadata IPFS URL:
                </p>
                <a
                  href={metadataIpfsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {metadataIpfsUrl}
                </a>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleUploadMetadata}
                disabled={isUploadingMetadata}
              >
                {isUploadingMetadata && (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                )}
                {!isUploadingMetadata && metadataIpfsUrl && "Re-upload to IPFS"}
                {!isUploadingMetadata && !metadataIpfsUrl && "Upload to IPFS"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {!canProceed && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Please upload the metadata to IPFS before proceeding to the next
              step.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
