import { BackgroundEditor } from "@/components/BackgroundEditor";
import { JsonEditor } from "@/components/JsonEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            <TabsTrigger value="json">JSON Editor</TabsTrigger>
            <TabsTrigger value="background">Background</TabsTrigger>
          </TabsList>
        </div>
      )}
      {!isMaximized && (
        <TabsList>
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="background">Background</TabsTrigger>
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
