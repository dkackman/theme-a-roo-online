import { type ChangeEvent, useEffect, useState } from "react";
import type { Database } from "../lib/database.types";
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

type Address = Database["public"]["Tables"]["addresses"]["Row"];

interface AddressPropertiesProps {
  address: Address | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    updates: {
      address: string;
      name: string | null;
      notes: string | null;
      network: number;
    }
  ) => Promise<void>;
}

export default function AddressProperties({
  address,
  isOpen,
  onClose,
  onSave,
}: AddressPropertiesProps) {
  const [editAddress, setEditAddress] = useState("");
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editNetwork, setEditNetwork] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when address changes
  useEffect(() => {
    if (address) {
      setEditAddress(address.address);
      setEditName(address.name || "");
      setEditNotes(address.notes || "");
      setEditNetwork(address.network);
    } else {
      setEditAddress("");
      setEditName("");
      setEditNotes("");
      setEditNetwork(0);
    }
  }, [address]);

  const handleSave = async () => {
    if (!address) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(address.id, {
        address: editAddress,
        name: editName.trim() || null,
        notes: editNotes.trim() || null,
        network: editNetwork,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update address:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-popover">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Edit Address</SheetTitle>
          <SheetDescription>
            Make changes to your address information here.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                value={editName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditName(e.target.value)
                }
                placeholder="Enter name"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input
                id="address"
                value={editAddress}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditAddress(e.target.value)
                }
                placeholder="Enter address"
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
        </div>
        <SheetFooter className="px-6 pb-6">
          <SheetClose asChild>
            <Button variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            onClick={handleSave}
            disabled={isSaving || !editAddress.trim()}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
