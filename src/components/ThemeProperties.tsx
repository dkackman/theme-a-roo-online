import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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

  const getStatusMessage = () => {
    switch (status) {
      case "draft":
        return "This theme is in draft. It will not be pickable in settings.";
      case "ready":
        return "This theme is ready to be published. You can pick it in settings.";
      case "published":
        return "This theme is published and waiting to be minted. Published themes are read-only. Change the status to Ready if you need to change this theme.";
      case "minted":
        return "This theme has been minted. It is read-only and can no longer be changed.";
      default:
        return "Edit the theme properties.";
    }
  };

  const statusMessage = getStatusMessage();

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
        <SheetHeader className="px-6 pt-6 flex-shrink-0">
          <SheetTitle>Theme Properties</SheetTitle>
          <SheetDescription>{statusMessage}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <FieldContent>
                    <Select
                      value={status}
                      disabled={isMinted}
                      onValueChange={(value) =>
                        onStatusChange(value as ThemeStatus)
                      }
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
                        <SelectItem value="published" disabled>
                          Published
                        </SelectItem>
                        <SelectItem value="minted" disabled>
                          Minted
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Required Information</CardTitle>
              <CardDescription>
                These fields are required to publish your theme.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <FieldContent>
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
                  </FieldContent>
                </Field>

                <Field orientation="vertical">
                  <FieldLabel htmlFor="author">Author</FieldLabel>
                  <FieldContent>
                    <Input
                      id="author"
                      value={authorName}
                      onChange={handleInputChange(onAuthorNameChange)}
                      placeholder="Author name"
                      className="bg-input"
                      readOnly={isMinted}
                      disabled={isMinted}
                    />
                  </FieldContent>
                </Field>

                <Field orientation="vertical">
                  <FieldLabel htmlFor="sponsor">Sponsor</FieldLabel>
                  <FieldContent>
                    <Input
                      id="sponsor"
                      value={sponsor}
                      onChange={handleInputChange(onSponsorChange)}
                      placeholder="Sponsor name"
                      className="bg-input"
                      readOnly={isMinted}
                      disabled={isMinted}
                    />
                  </FieldContent>
                </Field>

                <Field orientation="vertical">
                  <FieldLabel htmlFor="royaltyAddress">
                    Royalty Address
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="royaltyAddress"
                      value={royaltyAddress}
                      onChange={handleInputChange(onRoyaltyAddressChange)}
                      placeholder="Wallet address"
                      className="bg-input"
                      readOnly={isMinted}
                      disabled={isMinted}
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-sm">Optional Information</CardTitle>
              <CardDescription>
                Additional details that can be included with your theme.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="twitter">Twitter</FieldLabel>
                  <FieldContent>
                    <Input
                      id="twitter"
                      value={twitter}
                      onChange={handleInputChange(onTwitterChange)}
                      placeholder="@handle"
                      className="bg-input"
                      readOnly={isMinted}
                      disabled={isMinted}
                    />
                  </FieldContent>
                </Field>

                <Field orientation="vertical">
                  <FieldLabel htmlFor="website">Website</FieldLabel>
                  <FieldContent>
                    <Input
                      id="website"
                      value={website}
                      onChange={handleInputChange(onWebsiteChange)}
                      placeholder="https://example.com"
                      className="bg-input"
                      readOnly={isMinted}
                      disabled={isMinted}
                    />
                  </FieldContent>
                </Field>

                <Field orientation="vertical">
                  <FieldLabel htmlFor="did">DID</FieldLabel>
                  <FieldContent>
                    <Input
                      id="did"
                      value={did}
                      onChange={handleInputChange(onDidChange)}
                      placeholder="Decentralized identifier"
                      className="bg-input"
                      readOnly={isMinted}
                      disabled={isMinted}
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
        <SheetFooter className="px-6 pb-6 flex-shrink-0 border-t pt-4">
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
