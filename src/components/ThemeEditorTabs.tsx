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
import { Braces, FileText, ImageIcon, Info } from "lucide-react";

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
}

export function ThemeEditorTabs({
  activeTab,
  onTabChange,
  themeJson,
  onThemeJsonChange,
  editorTheme,
  themeId,
  isValid,
  validationError,
  readonly = false,
  themeStatus,
  onSave,
}: ThemeEditorTabsProps) {
  const getStatusMessage = () => {
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

  const statusMessage = getStatusMessage();
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
        {statusMessage && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background text-muted-foreground hover:text-foreground"
                >
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{statusMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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
          isValid={isValid}
          validationError={validationError}
          readonly={readonly}
          onSave={onSave}
        />
      </TabsContent>
      <TabsContent
        value="files"
        className="flex flex-1 min-h-0 flex-col overflow-auto border border-border rounded-b-md p-6"
      >
        {themeId ? (
          <ThemeFilesManager themeId={themeId} readonly={readonly} />
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
