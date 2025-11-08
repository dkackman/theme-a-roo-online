import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/database.types";
import { type ChangeEvent } from "react";

type ThemeStatus = Database["public"]["Enums"]["theme_status"];

type ThemePropertiesProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ThemeStatus;
  onStatusChange: (status: ThemeStatus) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  onSave: () => void;
  isSaving?: boolean;
};

export function ThemeProperties({
  open,
  onOpenChange,
  status,
  onStatusChange,
  description,
  onDescriptionChange,
  onSave,
  isSaving = false,
}: ThemePropertiesProps) {
  const isMinted = status === "minted";

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (isMinted) {
      return;
    }
    onDescriptionChange(event.target.value);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-popover">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Theme Properties</SheetTitle>
          <SheetDescription>Edit the theme properties.</SheetDescription>
        </SheetHeader>
        <div className="px-6 py-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <Select
                value={status}
                disabled={isMinted}
                onValueChange={(value) => onStatusChange(value as ThemeStatus)}
              >
                <SelectTrigger
                  id="status"
                  className="w-full"
                  disabled={isMinted}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="z-[90]">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="minted" disabled>
                    Minted
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Add your description here..."
                className="bg-input"
                rows={5}
                readOnly={isMinted}
                disabled={isMinted}
              />
            </Field>
          </FieldGroup>
        </div>
        <SheetFooter className="px-6 pb-6">
          <SheetClose asChild>
            <Button variant="secondary" disabled={isSaving}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            variant="default"
            onClick={onSave}
            disabled={isSaving || isMinted}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
