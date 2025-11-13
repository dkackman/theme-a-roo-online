import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
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
import { useAuth } from "@/Contexts/AuthContext";
import { addressesApi } from "@/lib/data-access/addresses";
import { didsApi } from "@/lib/data-access/dids";
import type { Database } from "@/lib/database.types";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
  onSave: () => void | Promise<void>;
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
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<ComboboxOption[]>([]);
  const [dids, setDids] = useState<ComboboxOption[]>([]);
  const [newAddressesToSave, setNewAddressesToSave] = useState<Set<string>>(
    new Set()
  );
  const [newDidsToSave, setNewDidsToSave] = useState<Set<string>>(new Set());
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const isMinted = status === "minted";

  const formatTruncatedValue = useCallback(
    (value: string, startLength: number, endLength: number): string => {
      if (value.length <= startLength + endLength) {
        return value;
      }
      return `${value.slice(0, startLength)}...${value.slice(-endLength)}`;
    },
    []
  );

  const fetchOptions = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoadingOptions(true);
    try {
      const [addressesData, didsData] = await Promise.all([
        addressesApi.getByUserId(user.id),
        didsApi.getByUserId(user.id),
      ]);

      setAddresses(
        addressesData.map((addr) => ({
          value: addr.address,
          label: addr.name
            ? `${addr.name} (${formatTruncatedValue(addr.address, 8, 5)})`
            : addr.address,
        }))
      );

      setDids(
        didsData.map((didItem) => ({
          value: didItem.launcher_id,
          label: didItem.name
            ? `${didItem.name} (${formatTruncatedValue(didItem.launcher_id, 14, 5)})`
            : didItem.launcher_id,
        }))
      );
    } catch (error) {
      console.error("Error fetching addresses/DIDs:", error);
      toast.error("Failed to load addresses and DIDs");
    } finally {
      setIsLoadingOptions(false);
    }
  }, [user, formatTruncatedValue]);

  // Fetch addresses and DIDs when sheet opens
  useEffect(() => {
    if (open && user) {
      fetchOptions();
    }
  }, [open, user, fetchOptions]);

  const handleCreateNewAddress = useCallback((value: string) => {
    setNewAddressesToSave((prev) => new Set(prev).add(value));
    // Add to local options immediately for display
    setAddresses((prev) => [...prev, { value, label: value }]);
  }, []);

  const handleCreateNewDid = useCallback((value: string) => {
    setNewDidsToSave((prev) => new Set(prev).add(value));
    // Add to local options immediately for display
    setDids((prev) => [...prev, { value, label: value }]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      // Save new addresses
      const addressPromises = Array.from(newAddressesToSave).map(
        async (address) => {
          try {
            await addressesApi.create({
              address,
              user_id: user.id,
              network: 0,
            });
          } catch (error: unknown) {
            // Ignore duplicate errors
            const err = error as { code?: string };
            if (err.code !== "23505") {
              console.error("Error saving address:", error);
              toast.error(`Failed to save address: ${address}`);
            }
          }
        }
      );

      // Save new DIDs
      const didPromises = Array.from(newDidsToSave).map(async (launcherId) => {
        try {
          await didsApi.create({
            launcher_id: launcherId,
            user_id: user.id,
            network: 0,
          });
        } catch (error: unknown) {
          // Ignore duplicate errors
          const err = error as { code?: string };
          if (err.code !== "23505") {
            console.error("Error saving DID:", error);
            toast.error(`Failed to save DID: ${launcherId}`);
          }
        }
      });

      // Wait for all saves to complete
      await Promise.all([...addressPromises, ...didPromises]);

      // Clear the sets after saving
      setNewAddressesToSave(new Set());
      setNewDidsToSave(new Set());

      // Call the original onSave
      await onSave();
    } catch (error) {
      console.error("Error in handleSave:", error);
      // Still call onSave even if saving addresses/DIDs failed
      await onSave();
    }
  }, [user, newAddressesToSave, newDidsToSave, onSave]);

  const getStatusMessage = () => {
    switch (status) {
      case "draft":
        return "This theme is in draft. It will not be selectable in settings.";
      case "ready":
        return "This theme is ready to be published. You can select as the theme-a-roo theme in settings.";
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
                    <Combobox
                      options={addresses}
                      value={royaltyAddress}
                      onValueChange={onRoyaltyAddressChange}
                      placeholder="Select or enter wallet address"
                      searchPlaceholder="Search addresses..."
                      emptyMessage="No address found."
                      className="w-full bg-input"
                      disabled={isMinted || isLoadingOptions}
                      onCreateNew={handleCreateNewAddress}
                      createNewLabel={(value) => `Add "${value}"`}
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
                    <Combobox
                      options={dids}
                      value={did}
                      onValueChange={onDidChange}
                      placeholder="Select or enter DID"
                      searchPlaceholder="Search DIDs..."
                      emptyMessage="No DID found."
                      className="w-full bg-input"
                      disabled={isMinted || isLoadingOptions}
                      onCreateNew={handleCreateNewDid}
                      createNewLabel={(value) => `Add "${value}"`}
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
            onClick={handleSave}
            disabled={isSaving || isMinted}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
