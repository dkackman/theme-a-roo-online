import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { uploadFile, type UploadedFile } from "../lib/ipfs";
import {
  getThemeFileIpfsUrls,
  updateThemeFileIpfsUrl,
} from "../lib/theme-files";
import { NftImageSummary } from "./NftImageSummary";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const STORAGE_KEYS = {
  PINATA_GATEWAY: "pinata-gateway",
  PINATA_GROUP_NAME: "pinata-group-name",
  PINATA_JWT: "pinata-jwt",
};

interface IpfsImageUploadProps {
  themeFiles: {
    background?: string;
    preview?: string;
    banner?: string;
  };
  themeId: string;
  themeName: string;
  onIpfsUrlsChange?: (urls: {
    background?: string;
    preview?: string;
    banner?: string;
  }) => void;
  onCanProceedChange?: (canProceed: boolean) => void;
}

export default function IpfsImageUpload({
  themeFiles,
  themeId,
  themeName,
  onIpfsUrlsChange,
  onCanProceedChange,
}: IpfsImageUploadProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [gatewayUrl, setGatewayUrl] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<{
    background?: string;
    preview?: string;
    banner?: string;
  }>({});

  // Load saved configuration from localStorage and sessionStorage
  useEffect(() => {
    const savedGateway = localStorage.getItem(STORAGE_KEYS.PINATA_GATEWAY);
    const savedGroupName = localStorage.getItem(STORAGE_KEYS.PINATA_GROUP_NAME);
    const savedJwt = sessionStorage.getItem("pinata-jwt");

    if (savedGateway) {
      setGatewayUrl(savedGateway);
    }
    if (savedGroupName) {
      setGroupName(savedGroupName);
    }
    if (savedJwt) {
      setApiKey(savedJwt);
    }
  }, []);

  // Save gateway URL to localStorage whenever it changes
  useEffect(() => {
    if (gatewayUrl) {
      localStorage.setItem(STORAGE_KEYS.PINATA_GATEWAY, gatewayUrl);
    }
  }, [gatewayUrl]);

  // Save group name to localStorage whenever it changes
  useEffect(() => {
    if (groupName) {
      localStorage.setItem(STORAGE_KEYS.PINATA_GROUP_NAME, groupName);
    }
  }, [groupName]);

  // Save JWT token to sessionStorage whenever it changes
  useEffect(() => {
    if (apiKey) {
      sessionStorage.setItem("pinata-jwt", apiKey);
    } else {
      sessionStorage.removeItem("pinata-jwt");
    }
  }, [apiKey]);

  // Load IPFS URLs from database on mount
  useEffect(() => {
    const loadIpfsUrls = async () => {
      try {
        const urls = await getThemeFileIpfsUrls(themeId);
        if (Object.keys(urls).length > 0) {
          setUploadedUrls(urls);
          onIpfsUrlsChange?.(urls);
        }
      } catch (error) {
        console.error("Failed to load IPFS URLs:", error);
      }
    };

    loadIpfsUrls();
  }, [themeId, onIpfsUrlsChange]);

  // Check if all present theme images have IPFS links
  const canProceed = (() => {
    const imagesToCheck = [
      { type: "background" as const, hasImage: !!themeFiles.background },
      { type: "preview" as const, hasImage: !!themeFiles.preview },
      { type: "banner" as const, hasImage: !!themeFiles.banner },
    ];

    for (const { type, hasImage } of imagesToCheck) {
      if (hasImage && !uploadedUrls[type]) {
        return false;
      }
    }

    return true;
  })();

  // Notify parent when canProceed changes
  useEffect(() => {
    onCanProceedChange?.(canProceed);
  }, [canProceed, onCanProceedChange]);

  // Save uploaded URLs to localStorage for next step
  useEffect(() => {
    if (Object.keys(uploadedUrls).length > 0) {
      localStorage.setItem(
        `ipfs-uploaded-urls-${themeId}`,
        JSON.stringify(uploadedUrls)
      );
    }
  }, [uploadedUrls, themeId]);

  const isUploadEnabled =
    apiKey.trim().length > 0 &&
    gatewayUrl.trim().length > 0 &&
    groupName.trim().length > 0;

  const handleUpload = async () => {
    if (!isUploadEnabled || isUploading) {
      return;
    }

    setIsUploading(true);
    const results: UploadedFile[] = [];
    const errors: string[] = [];

    try {
      // Create a basename from theme name (sanitize for filename)
      const basename = themeName.toLowerCase();
      // .replace(/[^a-z0-9]+/g, "-")
      // .replace(/^-+|-+$/g, "");

      // Upload each image if present
      const uploads = [
        {
          url: themeFiles.background,
          fileUseType: "background" as const,
        },
        {
          url: themeFiles.preview,
          fileUseType: "preview" as const,
        },
        {
          url: themeFiles.banner,
          fileUseType: "banner" as const,
        },
      ].filter((item) => item.url);

      const uploadPromises = uploads.map(async ({ url, fileUseType }) => {
        if (!url) {
          return null;
        }

        try {
          const result = await uploadFile(
            apiKey,
            gatewayUrl,
            groupName,
            basename,
            fileUseType,
            url
          );
          return { success: true, result } as const;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return {
            success: false,
            error: `${fileUseType}: ${errorMessage}`,
          } as const;
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      for (const result of uploadResults) {
        if (result === null) {
          continue;
        }
        if (result.success) {
          results.push(result.result);
        } else {
          errors.push(result.error);
        }
      }

      if (errors.length > 0) {
        toast.error(`Some uploads failed: ${errors.join(", ")}`, {
          duration: 5000,
        });
      }

      if (results.length > 0) {
        // Store uploaded URLs by fileUseType, merging with existing URLs
        const newUploadedUrls: typeof uploadedUrls = { ...uploadedUrls };
        for (const result of results) {
          newUploadedUrls[result.fileUseType] = result.url;
        }
        setUploadedUrls(newUploadedUrls);
        onIpfsUrlsChange?.(newUploadedUrls);

        // Save IPFS URLs to database
        const dbUpdatePromises = results.map(async (result) => {
          try {
            await updateThemeFileIpfsUrl(
              themeId,
              result.fileUseType,
              result.url
            );
          } catch (error) {
            console.error(
              `Failed to save IPFS URL for ${result.fileUseType}:`,
              error
            );
            // Don't throw - we still want to show success for the upload
          }
        });

        await Promise.all(dbUpdatePromises);

        toast.success(
          `Successfully uploaded ${results.length} image(s) to IPFS`,
          { duration: 3000 }
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Upload failed: ${errorMessage}`, { duration: 5000 });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pinata Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">JWT Token</Label>
            <Textarea
              id="api-key"
              placeholder="Enter your Pinata JWT token"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gateway-url">Gateway URL</Label>
              <Input
                id="gateway-url"
                placeholder="some-random-words-887.mypinata.cloud"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Enter an optional group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <NftImageSummary
          images={[
            {
              label: "Background",
              url: themeFiles.background,
              ipfsUrl: uploadedUrls.background,
            },
            {
              label: "NFT Preview",
              url: themeFiles.preview,
              ipfsUrl: uploadedUrls.preview,
            },
            {
              label: "NFT Banner",
              url: themeFiles.banner,
              ipfsUrl: uploadedUrls.banner,
            },
          ]}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!isUploadEnabled || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload to IPFS"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
