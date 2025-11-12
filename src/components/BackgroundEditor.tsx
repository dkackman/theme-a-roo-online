import { BackdropFilters } from "./BackdropFilters";
import { ThemeColorPicker } from "./ThemeColorPicker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { FieldGroup, FieldLabel } from "./ui/field";

interface BackgroundEditorProps {
  className?: string;
  readonly?: boolean;
}

export function BackgroundEditor({
  className = "",
  readonly = false,
}: BackgroundEditorProps) {
  return (
    <Card className={`${className} w-full`}>
      <CardHeader>
        <CardTitle>Background</CardTitle>
        <CardDescription>
          Configure background effects and theme colors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-8">
          <div className="space-y-4">
            <FieldLabel className="text-sm font-semibold">
              Backdrop Filters
            </FieldLabel>
            <BackdropFilters readonly={readonly} />
          </div>
          <div className="space-y-4">
            <FieldLabel className="text-sm font-semibold">
              Theme Color
            </FieldLabel>
            <ThemeColorPicker readonly={readonly} />
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
