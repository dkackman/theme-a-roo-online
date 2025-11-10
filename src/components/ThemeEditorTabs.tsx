import { BackgroundEditor } from "@/components/BackgroundEditor";
import { JsonEditor } from "@/components/JsonEditor";
import { ThemeFilesManager } from "@/components/ThemeFilesManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Braces, FileText, ImageIcon } from "lucide-react";

interface ThemeEditorTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  themeJson: string;
  onThemeJsonChange: (value: string) => void;
  editorTheme: "vs" | "vs-dark";
  themeId?: string;
  validationError?: string | null;
}

export function ThemeEditorTabs({
  activeTab,
  onTabChange,
  themeJson,
  onThemeJsonChange,
  editorTheme,
  themeId,
  validationError,
}: ThemeEditorTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex-shrink-0">
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
          validationError={validationError}
        />
      </TabsContent>
      <TabsContent
        value="files"
        className="flex flex-1 min-h-0 flex-col overflow-auto border border-border rounded-b-md p-6"
      >
        {themeId ? (
          <ThemeFilesManager themeId={themeId} />
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
        <BackgroundEditor />
      </TabsContent>
    </Tabs>
  );
}
