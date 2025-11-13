import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSimpleTheme, type Theme } from "theme-o-rama";
import IpfsImageUpload from "../components/IpfsImageUpload";
import { NftMetadataStep } from "../components/NftMetadataStep";
import { NftSummary } from "../components/NftSummary";
import { ReviewStep } from "../components/ReviewStep";
import { AdminOnly } from "../components/RoleProtected";
import { useAuth } from "../Contexts/AuthContext";
import { ThemeEditorProvider } from "../Contexts/ThemeEditorContext";
import { themesApi } from "../lib/data-access";
import type { Database } from "../lib/database.types";
import { getThemeFiles } from "../lib/theme-files";

type Step = "preview" | "upload-images" | "metadata" | "review";

const steps: { id: Step; label: string; description: string }[] = [
  {
    id: "preview",
    label: "NFT Summary",
    description: "Review theme details and imagery",
  },
  {
    id: "upload-images",
    label: "Upload Images",
    description: "Upload theme images",
  },
  {
    id: "metadata",
    label: "Metadata",
    description: "Configure NFT metadata",
  },
  {
    id: "review",
    label: "Review and Complete",
    description: "Review and mint the theme",
  },
];

type DbTheme = Database["public"]["Tables"]["themes"]["Row"];

export default function PrepareNft() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const themeId = typeof id === "string" ? id : null;
  const { initializeTheme } = useSimpleTheme();
  const [currentStep, setCurrentStep] = useState<Step>("preview");
  const [completedSteps] = useState<Set<Step>>(new Set());
  const [dbTheme, setDbTheme] = useState<DbTheme | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [themeJson, setThemeJson] = useState("");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [themeFiles, setThemeFiles] = useState<{
    background?: string;
    preview?: string;
    banner?: string;
  }>({});
  const [ipfsUrls, setIpfsUrls] = useState<{
    background?: string;
    preview?: string;
    banner?: string;
  }>({});
  const [metadataIpfsUrl, setMetadataIpfsUrl] = useState<string | null>(null);
  const [canProceedFromUpload, setCanProceedFromUpload] = useState(false);
  const [canProceedFromMetadata, setCanProceedFromMetadata] = useState(false);
  const [previousStep, setPreviousStep] = useState<Step | null>(null);

  // Track the last loaded themeId/user to prevent unnecessary reloads
  const lastLoadedRef = useRef<{ themeId: string; userId: string } | null>(
    null
  );
  const initializeThemeRef = useRef(initializeTheme);

  // Keep initializeTheme ref up to date
  useEffect(() => {
    initializeThemeRef.current = initializeTheme;
  }, [initializeTheme]);

  const loadTheme = useCallback(async () => {
    if (!themeId || !user) {
      return;
    }

    // Skip if we've already loaded this exact themeId/user combination
    if (
      lastLoadedRef.current?.themeId === themeId &&
      lastLoadedRef.current?.userId === user.id
    ) {
      return;
    }

    setIsLoadingTheme(true);
    try {
      const data = await themesApi.getById(themeId, user.id);
      setDbTheme(data);

      // Convert database theme to Theme-o-rama format
      let themeData: Record<string, unknown> = {};
      if (data.theme !== null && data.theme !== undefined) {
        if (typeof data.theme === "string") {
          try {
            themeData = JSON.parse(data.theme) as Record<string, unknown>;
          } catch {
            themeData = {};
          }
        } else if (
          typeof data.theme === "object" &&
          data.theme !== null &&
          !Array.isArray(data.theme)
        ) {
          themeData = data.theme as Record<string, unknown>;
        }
      }

      const convertedTheme = {
        name: data.name,
        displayName: data.display_name,
        description: data.description || "",
        schemaVersion: 1,
        ...themeData,
      } as Theme;

      const initializedTheme = await initializeThemeRef.current(convertedTheme);
      setTheme(initializedTheme);
      setThemeJson(JSON.stringify(initializedTheme, null, 2));

      // Load theme files
      try {
        const files = await getThemeFiles(themeId);
        setThemeFiles(files);
      } catch (error) {
        console.error("Failed to load theme files:", error);
      }

      // Load metadata IPFS URL if it exists (for ReviewStep)
      if (data.nft_metadata_url) {
        setMetadataIpfsUrl(data.nft_metadata_url);
      }

      // Mark this themeId/user as loaded
      lastLoadedRef.current = { themeId, userId: user.id };
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setIsLoadingTheme(false);
    }
  }, [themeId, user]);

  useEffect(() => {
    if (user && themeId) {
      loadTheme();
    } else {
      // Reset tracking when user or themeId becomes unavailable
      lastLoadedRef.current = null;
    }
  }, [user, themeId, loadTheme]);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    setThemeJson(JSON.stringify(newTheme, null, 2));
  }, []);

  const handleThemeJsonChange = useCallback((json: string) => {
    setThemeJson(json);
    try {
      const parsed = JSON.parse(json) as Theme;
      setTheme(parsed);
    } catch {
      // Invalid JSON, keep current theme
    }
  }, []);

  if (authLoading || !user || isLoadingTheme) {
    return (
      <AdminOnly>
        <div className="flex justify-center items-center py-12">
          <Loader2
            className="h-8 w-8 animate-spin text-primary"
            aria-hidden="true"
          />
        </div>
      </AdminOnly>
    );
  }

  if (!themeId) {
    return (
      <AdminOnly>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">No theme ID provided</p>
            </CardContent>
          </Card>
        </div>
      </AdminOnly>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    if (currentStep === "upload-images" && !canProceedFromUpload) {
      return;
    }
    if (currentStep === "metadata" && !canProceedFromMetadata) {
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setPreviousStep(currentStep);
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleMetadataUploaded = (ipfsUrl: string) => {
    setMetadataIpfsUrl(ipfsUrl);
    // Reload theme to get updated data
    loadTheme();
  };

  const handleStatusUpdated = async () => {
    // Reload theme to get updated status
    await loadTheme();
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setPreviousStep(currentStep);
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "preview":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">NFT Summary</h2>
              <p className="text-muted-foreground mb-4">
                Review the theme details and imagery that will be used for the
                NFT.
              </p>
            </div>
            {dbTheme && (
              <NftSummary
                name={dbTheme.display_name}
                description={dbTheme.description || ""}
                authorName={dbTheme.author_name || ""}
                sponsor={dbTheme.sponsor || ""}
                twitter={dbTheme.twitter || undefined}
                website={dbTheme.website || undefined}
                did={dbTheme.did || undefined}
                royaltyAddress={dbTheme.royalty_address || undefined}
              />
            )}
          </div>
        );
      case "upload-images":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Upload Images</h2>
              <p className="text-muted-foreground mb-4">
                Upload theme images for this NFT.
              </p>
            </div>
            {dbTheme && (
              <IpfsImageUpload
                themeFiles={themeFiles}
                themeId={themeId!}
                themeName={dbTheme.display_name}
                onIpfsUrlsChange={setIpfsUrls}
                onCanProceedChange={setCanProceedFromUpload}
              />
            )}
            {!canProceedFromUpload && (
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="pt-6">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Please upload all theme images to IPFS before proceeding to
                    the next step.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case "metadata": {
        if (!theme || !dbTheme) {
          return (
            <div className="space-y-4">
              <p className="text-muted-foreground">Loading theme data...</p>
            </div>
          );
        }

        return (
          <NftMetadataStep
            theme={theme}
            dbTheme={dbTheme}
            themeId={themeId!}
            ipfsUrls={ipfsUrls}
            previousStep={previousStep}
            onMetadataUploaded={handleMetadataUploaded}
            onCanProceedChange={setCanProceedFromMetadata}
          />
        );
      }
      case "review": {
        if (!dbTheme) {
          return (
            <div className="space-y-4">
              <p className="text-muted-foreground">Loading theme data...</p>
            </div>
          );
        }

        return (
          <ReviewStep
            themeId={themeId!}
            metadataIpfsUrl={metadataIpfsUrl}
            previewIpfsUrl={ipfsUrls.preview}
            royaltyAddress={dbTheme.royalty_address}
            isMinted={dbTheme.status === "minted"}
            onStatusUpdated={handleStatusUpdated}
          />
        );
      }
      default:
        return null;
    }
  };

  if (!dbTheme || !theme) {
    return (
      <AdminOnly>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Theme not found</p>
            </CardContent>
          </Card>
        </div>
      </AdminOnly>
    );
  }

  return (
    <AdminOnly>
      <ThemeEditorProvider
        theme={theme}
        themeJson={themeJson}
        onThemeChange={handleThemeChange}
        onThemeJsonChange={handleThemeJsonChange}
      >
        <div className="flex h-screen overflow-hidden">
          {/* Step Indicator Sidebar */}
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            title="Prepare NFT"
            description="Walk through the steps to prepare this theme for NFT minting"
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Step Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="container max-w-4xl mx-auto px-4 py-8 min-h-full flex flex-col">
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardContent className="pt-6 flex-1 overflow-y-auto min-h-0">
                    {renderStepContent()}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Navigation - Fixed at bottom */}
            <div className="border-t bg-background shrink-0">
              <div className="container max-w-4xl mx-auto px-4 py-4">
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                  >
                    Previous
                  </Button>
                  {currentStep !== "review" && (
                    <Button
                      onClick={handleNext}
                      disabled={
                        (currentStep === "upload-images" &&
                          !canProceedFromUpload) ||
                        (currentStep === "metadata" && !canProceedFromMetadata)
                      }
                    >
                      Next
                    </Button>
                  )}
                  {currentStep === "review" && (
                    <Button onClick={() => router.push("/mint-queue")}>
                      Back to Mint Queue
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ThemeEditorProvider>
    </AdminOnly>
  );
}
