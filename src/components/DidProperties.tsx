import { RefreshCw } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import type { Database } from "../lib/database.types";
import { fetchProfileFromAPI } from "../lib/mintgarden";
import { Button } from "./ui/button";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
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
      <SheetContent className="w-full sm:max-w-md bg-popover">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Edit DID</SheetTitle>
          <SheetDescription>
            Make changes to your DID information here.
          </SheetDescription>
        </SheetHeader>
        {editLauncherId.trim() && (
          <div className="flex justify-end px-6">
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
        <FieldGroup className="gap-4 px-6 overflow-y-auto">
          <Field>
            <FieldLabel htmlFor="launcher_id">Launcher ID</FieldLabel>
            <Input
              id="launcher_id"
              value={editLauncherId}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEditLauncherId(e.target.value)
              }
              placeholder="Enter launcher ID"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="network">Network</FieldLabel>
            <Select
              value={editNetwork.toString()}
              onValueChange={(value) => setEditNetwork(parseInt(value, 10))}
            >
              <SelectTrigger id="network" className="bg-input">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Mainnet</SelectItem>
                <SelectItem value="1">Testnet</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              value={editName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEditName(e.target.value)
              }
              placeholder="Enter a name (optional)"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="avatar_uri">Avatar URI</FieldLabel>
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
          </Field>

          <Field>
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
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
          </Field>
        </FieldGroup>
        <SheetFooter className="px-6 pb-6">
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
