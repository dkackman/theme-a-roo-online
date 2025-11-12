import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useSimpleTheme, type Theme } from "theme-o-rama";
import IpfsImageUpload from "../components/IpfsImageUpload";
import { NftSummary } from "../components/NftSummary";
import { AdminOnly } from "../components/RoleProtected";
import { useAuth } from "../Contexts/AuthContext";
import { ThemeEditorProvider } from "../Contexts/ThemeEditorContext";
import { themesApi } from "../lib/data-access";
import type { Database } from "../lib/database.types";
import { getThemeFiles } from "../lib/theme-files";

type Step = "preview" | "upload-images" | "metadata" | "review" | "complete";

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
    label: "Review",
    description: "Review and confirm",
  },
  {
    id: "complete",
    label: "Complete",
    description: "NFT prepared successfully",
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

  const loadTheme = useCallback(async () => {
    if (!themeId || !user) {
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

      const initializedTheme = await initializeTheme(convertedTheme);
      setTheme(initializedTheme);
      setThemeJson(JSON.stringify(initializedTheme, null, 2));

      // Load theme files
      try {
        const files = await getThemeFiles(themeId);
        setThemeFiles(files);
      } catch (error) {
        console.error("Failed to load theme files:", error);
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setIsLoadingTheme(false);
    }
  }, [themeId, user, initializeTheme]);

  useEffect(() => {
    if (user && themeId) {
      loadTheme();
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
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
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
                themeName={dbTheme.display_name || dbTheme.name}
              />
            )}
          </div>
        );
      case "metadata":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Configure Metadata</h2>
              <p className="text-muted-foreground mb-4">
                Set up the metadata for this NFT.
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Metadata configuration coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "review":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Review</h2>
              <p className="text-muted-foreground mb-4">
                Review all information before completing the NFT preparation.
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Review content coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "complete":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Complete</h2>
              <p className="text-muted-foreground mb-4">
                NFT preparation completed successfully!
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
                  <p className="font-medium text-lg">
                    NFT Prepared Successfully
                  </p>
                  <p className="text-muted-foreground">
                    This NFT is now ready for minting.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
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
          <div className="flex-1 overflow-y-auto">
            <div className="container max-w-4xl mx-auto px-4 pb-8 space-y-8">
              {/* Step Content */}
              <Card>
                <CardContent className="pt-6">
                  {renderStepContent()}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                >
                  Previous
                </Button>
                {currentStep !== "complete" && (
                  <Button onClick={handleNext}>Next</Button>
                )}
                {currentStep === "complete" && (
                  <Button onClick={() => router.push("/mint-queue")}>
                    Back to Mint Queue
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </ThemeEditorProvider>
    </AdminOnly>
  );
}
