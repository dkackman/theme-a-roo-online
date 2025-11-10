import { ThemeEditorActions } from "@/components/ThemeEditorActions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Columns, FileText, Maximize2, Minimize2 } from "lucide-react";

interface ThemeEditorHeaderProps {
  title: string;
  layoutMode: "normal" | "maximized";
  isSideBySide: boolean;
  isSaving: boolean;
  isThemeValid: boolean;
  onEdit: () => void;
  onSave: () => void;
  onApply: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onToggleMaximize: () => void;
  onToggleSideBySide: () => void;
}

export function ThemeEditorHeader({
  title,
  layoutMode,
  isSideBySide,
  isSaving,
  isThemeValid,
  onEdit,
  onSave,
  onApply,
  onPublish,
  onDelete,
  onToggleMaximize,
  onToggleSideBySide,
}: ThemeEditorHeaderProps) {
  const isMaximized = layoutMode === "maximized";
  const headingClassName = cn(
    "flex items-center gap-2 font-bold",
    isMaximized ? "text-xl" : "text-3xl"
  );

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        isMaximized ? "py-3 border-b" : "mb-6"
      )}
    >
      <div className={headingClassName}>
        <FileText className="w-5 h-5" />
        {title}
      </div>
      <div className="flex items-center">
        <ThemeEditorActions
          onEdit={onEdit}
          onSave={onSave}
          onApply={onApply}
          onPublish={onPublish}
          onDelete={onDelete}
          isSaving={isSaving}
          isThemeValid={isThemeValid}
        />
        <Button
          className="ml-2"
          onClick={onToggleSideBySide}
          size="sm"
          variant={isSideBySide ? "secondary" : "ghost"}
          title={
            isSideBySide ? "Exit side-by-side mode" : "Open side-by-side mode"
          }
        >
          <Columns className="w-4 h-4" />
        </Button>
        <Button
          onClick={onToggleMaximize}
          size="sm"
          variant="ghost"
          title={isMaximized ? "Exit maximized mode" : "Maximize editor"}
        >
          {isMaximized ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
