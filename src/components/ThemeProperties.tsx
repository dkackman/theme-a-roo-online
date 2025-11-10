import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
  authorName: string;
  onAuthorNameChange: (value: string) => void;
  sponsor: string;
  onSponsorChange: (value: string) => void;
  twitter: string;
  onTwitterChange: (value: string) => void;
  website: string;
  onWebsiteChange: (value: string) => void;
  did: string;
  onDidChange: (value: string) => void;
  royaltyAddress: string;
  onRoyaltyAddressChange: (value: string) => void;
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
  authorName,
  onAuthorNameChange,
  sponsor,
  onSponsorChange,
  twitter,
  onTwitterChange,
  website,
  onWebsiteChange,
  did,
  onDidChange,
  royaltyAddress,
  onRoyaltyAddressChange,
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

  const handleInputChange =
    (callback: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      if (isMinted) {
        return;
      }
      callback(event.target.value);
    };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-popover flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Theme Properties</SheetTitle>
          <SheetDescription>Edit the theme properties.</SheetDescription>
        </SheetHeader>
        <div className="px-6 flex-1 overflow-y-auto">
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
                  className="w-full bg-input"
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
          <div className="mt-6 space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="author">Author</FieldLabel>
                <Input
                  id="author"
                  value={authorName}
                  onChange={handleInputChange(onAuthorNameChange)}
                  placeholder="Author name"
                  className="bg-input"
                  readOnly={isMinted}
                  disabled={isMinted}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sponsor">Sponsor</FieldLabel>
                <Input
                  id="sponsor"
                  value={sponsor}
                  onChange={handleInputChange(onSponsorChange)}
                  placeholder="Sponsor name"
                  className="bg-input"
                  readOnly={isMinted}
                  disabled={isMinted}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="twitter">Twitter</FieldLabel>
                <Input
                  id="twitter"
                  value={twitter}
                  onChange={handleInputChange(onTwitterChange)}
                  placeholder="@handle"
                  className="bg-input"
                  readOnly={isMinted}
                  disabled={isMinted}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="website">Website</FieldLabel>
                <Input
                  id="website"
                  value={website}
                  onChange={handleInputChange(onWebsiteChange)}
                  placeholder="https://example.com"
                  className="bg-input"
                  readOnly={isMinted}
                  disabled={isMinted}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="did">DID</FieldLabel>
                <Input
                  id="did"
                  value={did}
                  onChange={handleInputChange(onDidChange)}
                  placeholder="Decentralized identifier"
                  className="bg-input"
                  readOnly={isMinted}
                  disabled={isMinted}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="royaltyAddress">
                  Royalty Address
                </FieldLabel>
                <Input
                  id="royaltyAddress"
                  value={royaltyAddress}
                  onChange={handleInputChange(onRoyaltyAddressChange)}
                  placeholder="Wallet address"
                  className="bg-input"
                  readOnly={isMinted}
                  disabled={isMinted}
                />
              </Field>
            </FieldGroup>
          </div>
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
