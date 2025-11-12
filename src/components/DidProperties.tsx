import { RefreshCw } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import type { Database } from "../lib/database.types";
import { fetchProfileFromAPI } from "../lib/mintgarden";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Field, FieldContent, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Textarea } from "./ui/textarea";

type Did = Database["public"]["Tables"]["dids"]["Row"];

interface DidPropertiesProps {
  did: Did | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    updates: {
      name: string | null;
      launcher_id: string;
      avatar_uri: string | null;
      notes: string | null;
      network: number;
    }
  ) => Promise<void>;
}

export default function DidProperties({
  did,
  isOpen,
  onClose,
  onSave,
}: DidPropertiesProps) {
  const [editName, setEditName] = useState("");
  const [editLauncherId, setEditLauncherId] = useState("");
  const [editAvatarUri, setEditAvatarUri] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editNetwork, setEditNetwork] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize form when did changes
  useEffect(() => {
    if (did) {
      setEditName(did.name || "");
      setEditLauncherId(did.launcher_id);
      setEditAvatarUri(did.avatar_uri || "");
      setEditNotes(did.notes || "");
      setEditNetwork(did.network);
    } else {
      setEditName("");
      setEditLauncherId("");
      setEditAvatarUri("");
      setEditNotes("");
      setEditNetwork(0);
    }
  }, [did]);

  const handleSave = async () => {
    if (!did) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(did.id, {
        name: editName.trim() || null,
        launcher_id: editLauncherId,
        avatar_uri: editAvatarUri.trim() || null,
        notes: editNotes.trim() || null,
        network: editNetwork,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update DID:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshFromMintGarden = async () => {
    if (!editLauncherId.trim()) {
      return;
    }

    setIsRefreshing(true);
    try {
      const mintGardenProfile = await fetchProfileFromAPI(
        editLauncherId,
        editNetwork === 1
      );

      if (mintGardenProfile?.name) {
        setEditName(mintGardenProfile.name);
      }
      if (mintGardenProfile?.avatar_uri) {
        setEditAvatarUri(mintGardenProfile.avatar_uri);
      }
    } catch (err) {
      console.error("Failed to refresh from MintGarden:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-popover flex flex-col">
        <SheetHeader className="px-6 pt-6 flex-shrink-0">
          <SheetTitle>Edit DID</SheetTitle>
          <SheetDescription>
            Make changes to your DID information here.
          </SheetDescription>
        </SheetHeader>
        {editLauncherId.trim() && (
          <div className="flex justify-end px-6 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshFromMintGarden}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-3 h-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh from MintGarden
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Required Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="launcher_id">Launcher ID</FieldLabel>
                  <FieldContent>
                    <Input
                      id="launcher_id"
                      value={editLauncherId}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setEditLauncherId(e.target.value)
                      }
                      placeholder="Enter launcher ID"
                    />
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="network">Network</FieldLabel>
                  <FieldContent>
                    <Select
                      value={editNetwork.toString()}
                      onValueChange={(value) =>
                        setEditNetwork(parseInt(value, 10))
                      }
                    >
                      <SelectTrigger id="network" className="bg-input">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Mainnet</SelectItem>
                        <SelectItem value="1">Testnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-sm">Optional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setEditName(e.target.value)
                      }
                      placeholder="Enter a name (optional)"
                    />
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="avatar_uri">Avatar URI</FieldLabel>
                  <FieldContent>
                    <Input
                      id="avatar_uri"
                      value={editAvatarUri}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setEditAvatarUri(e.target.value)
                      }
                      placeholder="Enter avatar URI"
                    />
                    {editAvatarUri.trim() && (
                      <div className="mt-3">
                        <img
                          src={editAvatarUri}
                          alt="Avatar preview"
                          className="w-16 h-16 rounded-lg object-cover border border-border"
                          onError={(e) => {
                            // Hide image on error
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="notes">Notes</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="notes"
                      value={editNotes}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setEditNotes(e.target.value)
                      }
                      className="bg-input"
                      placeholder="Add notes (optional)"
                      rows={3}
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
        <SheetFooter className="px-6 pb-6 flex-shrink-0 border-t pt-4">
          <SheetClose asChild>
            <Button variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            onClick={handleSave}
            disabled={isSaving || !editLauncherId.trim()}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
