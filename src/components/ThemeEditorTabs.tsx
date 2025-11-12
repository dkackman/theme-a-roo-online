import { BackgroundEditor } from "@/components/BackgroundEditor";
import { JsonEditor } from "@/components/JsonEditor";
import { ThemeFilesManager } from "@/components/ThemeFilesManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Braces,
  CheckCircle2,
  FileText,
  ImageIcon,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "./ui/badge";

interface ThemeEditorTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  themeJson: string;
  onThemeJsonChange: (value: string) => void;
  editorTheme: "vs" | "vs-dark";
  themeId?: string;
  isValid?: boolean;
  validationError?: string | null;
  readonly?: boolean;
  themeStatus?: "draft" | "ready" | "published" | "minted";
  onSave?: () => void;
  onPreviewChange?: (previewUrl?: string) => void;
}

const getStatusMessage = (
  themeStatus?: "draft" | "ready" | "published" | "minted"
) => {
  switch (themeStatus) {
    case "draft":
      return "This theme is in draft. It will not be pickable in settings.";
    case "ready":
      return "This theme is ready to be published. You can pick it in settings.";
    case "published":
      return "This theme is published and waiting to be minted. Published themes are read-only. Change the status to Ready if you need to change this theme.";
    case "minted":
      return "This theme has been minted. It is read-only and can no longer be changed.";
    default:
      return null;
  }
};

export function ThemeEditorTabs({
  activeTab,
  onTabChange,
  themeJson,
  onThemeJsonChange,
  editorTheme,
  themeId,
  isValid: isValidProp,
  validationError,
  readonly = false,
  themeStatus,
  onSave,
  onPreviewChange,
}: ThemeEditorTabsProps) {
  // Determine if theme is valid - isValid prop takes precedence
  const isValid =
    isValidProp !== undefined ? isValidProp : validationError === null;

  // Check if backgroundImage exists and is not a URL
  const backgroundImageWarning = useMemo(() => {
    try {
      const parsedTheme = JSON.parse(themeJson);
      const themeWithBackground = parsedTheme as typeof parsedTheme & {
        backgroundImage?: string;
      };
      if (themeWithBackground.backgroundImage) {
        const bgImage = themeWithBackground.backgroundImage;
        // Check if it's a URL
        const isUrl = (() => {
          try {
            new URL(bgImage);
            return true;
          } catch {
            return /^(https?|data|blob):/i.test(bgImage);
          }
        })();
        if (!isUrl) {
          return "Local background image files are not supported. Please upload the background image file in the theme editor.";
        }
      }
    } catch {
      // If JSON is invalid, we can't check backgroundImage
    }
    return null;
  }, [themeJson]);

  // Determine what to show: isValid takes precedence always
  // If isValid is false -> show error (red)
  // If isValid is true AND (validationError exists OR backgroundImage isn't URL) -> show warning (yellow)
  // Otherwise -> show success (green)
  const showError = isValid === false && validationError;
  const showWarning =
    isValid === true && (validationError || backgroundImageWarning);

  const warningMessage = validationError || backgroundImageWarning;
  const hasValidation = showError || showWarning || isValid === true;

  const readOnlyBadge = useMemo(() => {
    if (themeStatus === "published") {
      return {
        label: "Read-only",
        message:
          "Published themes are awaiting minting and cannot be modified. Change status to Ready to edit.",
      };
    }
    if (themeStatus === "minted") {
      return {
        label: "Read-only",
        message: "Minted themes are immutable and can no longer be changed.",
      };
    }
    return null;
  }, [themeStatus]);

  const validationBadge = useMemo(() => {
    if (!hasValidation) {
      return null;
    }

    if (showError && validationError) {
      return {
        label: "Invalid",
        message: validationError,
        icon: <XCircle className="h-4 w-4" />,
        variant: "destructive" as const,
        className: "",
        ariaLabel: "Theme JSON invalid",
      };
    }

    if (showWarning && warningMessage) {
      return {
        label: "Warning",
        message: warningMessage,
        icon: <TriangleAlert className="h-4 w-4" />,
        variant: "outline" as const,
        className:
          "border-yellow-500/30 bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
        ariaLabel: "Theme JSON warning",
      };
    }

    return {
      label: "Valid",
      message: "Theme JSON is valid",
      icon: <CheckCircle2 className="h-4 w-4" />,
      variant: "outline" as const,
      className:
        "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      ariaLabel: "Theme JSON valid",
    };
  }, [hasValidation, showError, showWarning, validationError, warningMessage]);

  const statusMessage = useMemo(
    () => getStatusMessage(themeStatus),
    [themeStatus]
  );
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex-shrink-0 flex items-center gap-2">
        <TabsList className="justify-start gap-2">
          <TabsTrigger value="json">
            <Braces className="w-4 h-4 mr-2" />
            JSON Editor
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="w-4 h-4 mr-2" />
            Files
          </TabsTrigger>
          <TabsTrigger value="background">
            <ImageIcon className="w-4 h-4 mr-2" />
            Background
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          {themeStatus && statusMessage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Badge
                      variant="outline"
                      className="cursor-pointer border-border bg-background/60 text-xs font-normal capitalize text-muted-foreground hover:text-foreground"
                    >
                      {themeStatus}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{statusMessage}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {readOnlyBadge && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer bg-amber-500/10 text-xs font-normal text-amber-600 dark:text-amber-400"
                    >
                      {readOnlyBadge.label}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{readOnlyBadge.message}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {validationBadge && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span role="status" aria-label={validationBadge.ariaLabel}>
                    <Badge
                      variant={validationBadge.variant}
                      className={`cursor-pointer ${validationBadge.className}`}
                    >
                      {validationBadge.icon}
                      {validationBadge.label}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{validationBadge.message}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <TabsContent
        value="json"
        className="flex flex-1 min-h-0 flex-col overflow-auto border border-border rounded-b-md"
      >
        <JsonEditor
          value={themeJson}
          onChange={onThemeJsonChange}
          theme={editorTheme}
          height={"var(--json-editor-height, 100%)"}
          className="flex-1 min-h-0"
          readonly={readonly}
          onSave={onSave}
        />
      </TabsContent>
      <TabsContent
        value="files"
        className="flex flex-1 min-h-0 flex-col overflow-auto border border-border rounded-b-md p-6"
      >
        {themeId ? (
          <ThemeFilesManager
            themeId={themeId}
            readonly={readonly}
            onPreviewChange={onPreviewChange}
          />
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            Theme ID not available
          </div>
        )}
      </TabsContent>
      <TabsContent
        value="background"
        className="flex flex-1 min-h-0 flex-col overflow-auto border border-border rounded-b-md p-6"
      >
        <BackgroundEditor readonly={readonly} />
      </TabsContent>
    </Tabs>
  );
}
