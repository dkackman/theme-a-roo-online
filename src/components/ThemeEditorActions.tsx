import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Rocket, Save, Settings2, Trash2, Wand2 } from "lucide-react";

interface ThemeEditorActionsProps {
  onEdit: () => void;
  onSave: () => void;
  onApply: () => void;
  onPublish: () => void;
  onDelete: () => void;
  isSaving: boolean;
  className?: string;
}

export function ThemeEditorActions({
  onEdit,
  onSave,
  onApply,
  onPublish,
  onDelete,
  isSaving,
  className = "",
}: ThemeEditorActionsProps) {
  return (
    <ButtonGroup className={className}>
      <Button onClick={onSave} disabled={isSaving} variant="default" size="sm">
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? "Saving..." : "Save"}
      </Button>
      <Button onClick={onApply} variant="secondary" size="sm">
        <Wand2 className="w-4 h-4 mr-2" />
        Apply
      </Button>
      <Button onClick={onPublish} variant="secondary" size="sm">
        <Rocket className="w-4 h-4 mr-2" />
        Publish
      </Button>
      <Button onClick={onEdit} variant="secondary" size="sm">
        <Settings2 className="w-4 h-4 mr-2" />
        Properties
      </Button>
      <Button onClick={onDelete} variant="destructive" size="sm">
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
    </ButtonGroup>
  );
}
