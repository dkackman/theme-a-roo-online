import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  CheckCircle,
  Eye,
  Rocket,
  Save,
  Settings2,
  Trash2,
  Wand2,
} from "lucide-react";

interface ThemeEditorActionsProps {
  onEdit: () => void;
  onValidate: () => void;
  onSave: () => void;
  onPreview: () => void;
  onApply: () => void;
  onPublish: () => void;
  onDelete: () => void;
  isSaving: boolean;
  className?: string;
}

export function ThemeEditorActions({
  onEdit,
  onValidate,
  onSave,
  onPreview,
  onApply,
  onPublish,
  onDelete,
  isSaving,
  className = "",
}: ThemeEditorActionsProps) {
  return (
    <ButtonGroup className={className}>
      <Button onClick={onValidate} variant="outline" size="sm">
        <CheckCircle className="w-4 h-4 mr-2" />
        Validate
      </Button>
      <Button onClick={onSave} disabled={isSaving} variant="outline" size="sm">
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? "Saving..." : "Save"}
      </Button>
      <Button onClick={onPreview} variant="outline" size="sm">
        <Eye className="w-4 h-4 mr-2" />
        Preview
      </Button>
      <Button onClick={onApply} variant="outline" size="sm">
        <Wand2 className="w-4 h-4 mr-2" />
        Apply
      </Button>
      <Button onClick={onPublish} variant="outline" size="sm">
        <Rocket className="w-4 h-4 mr-2" />
        Publish
      </Button>
      <Button onClick={onEdit} variant="outline" size="sm">
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
