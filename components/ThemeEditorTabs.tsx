import { BackdropFilters } from "@/components/BackdropFilters";
import { BackgroundEditor } from "@/components/BackgroundEditor";
import { JsonEditor } from "@/components/JsonEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Braces, FileText, ImageIcon } from "lucide-react";

interface ThemeEditorTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  themeJson: string;
  onThemeJsonChange: (value: string) => void;
  editorTheme: "vs" | "vs-dark";
  isMaximized?: boolean;
}

export function ThemeEditorTabs({
  activeTab,
  onTabChange,
  themeJson,
  onThemeJsonChange,
  editorTheme,
  isMaximized = false,
}: ThemeEditorTabsProps) {
  const jsonTabContentClass = isMaximized
    ? "flex-1 p-0 overflow-hidden border border-border rounded-b-md"
    : "space-y-4 border border-border rounded-b-md";

  const backgroundTabContentClass = isMaximized
    ? "flex-1 p-6 border border-border rounded-b-md"
    : "p-6 border border-border rounded-b-md";

  const editorHeight = isMaximized ? "100%" : "calc(100vh - 300px)";
  const backgroundHeight = isMaximized ? "h-full" : "h-64";

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className={isMaximized ? "flex-1 flex flex-col" : "w-full"}
    >
      {isMaximized && (
        <div className="px-6 py-3 border-b">
          <TabsList>
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
      )}
      {!isMaximized && (
        <TabsList>
          <TabsTrigger value="json">
            <Braces className="w-4 h-4 mr-2" />
            JSON
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
      )}
      <TabsContent
        value="json"
        className={jsonTabContentClass}
        style={
          isMaximized ? { display: "flex", flexDirection: "column" } : undefined
        }
      >
        <JsonEditor
          value={themeJson}
          onChange={onThemeJsonChange}
          theme={editorTheme}
          height={editorHeight}
        />
      </TabsContent>
      <TabsContent
        value="files"
        className={backgroundTabContentClass}
        style={
          isMaximized ? { display: "flex", flexDirection: "column" } : undefined
        }
      >
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Backdrop Filters</h3>
            <BackdropFilters />
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="background"
        className={backgroundTabContentClass}
        style={
          isMaximized ? { display: "flex", flexDirection: "column" } : undefined
        }
      >
        <BackgroundEditor className={backgroundHeight} />
      </TabsContent>
    </Tabs>
  );
}
