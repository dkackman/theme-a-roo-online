import { type ChangeEvent, useEffect, useState } from "react";
import type { Database } from "../lib/database.types";
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
import { Switch } from "./ui/switch";
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
      is_default: boolean;
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
  const [editIsDefault, setEditIsDefault] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when address changes
  useEffect(() => {
    if (address) {
      setEditAddress(address.address);
      setEditName(address.name || "");
      setEditNotes(address.notes || "");
      setEditNetwork(address.network);
      setEditIsDefault(address.is_default);
    } else {
      setEditAddress("");
      setEditName("");
      setEditNotes("");
      setEditNetwork(0);
      setEditIsDefault(false);
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
        is_default: editIsDefault,
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
      <SheetContent className="w-full sm:max-w-md bg-popover flex flex-col">
        <SheetHeader className="px-6 pt-6 flex-shrink-0">
          <SheetTitle>Edit Address</SheetTitle>
          <SheetDescription>
            Make changes to your address information here.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Required Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <FieldContent>
                    <Input
                      id="address"
                      value={editAddress}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setEditAddress(e.target.value)
                      }
                      placeholder="Enter address"
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
                      placeholder="Enter name"
                    />
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
                <Field orientation="vertical">
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="is-default">Set as Default</FieldLabel>
                    <FieldContent>
                      <Switch
                        id="is-default"
                        checked={editIsDefault}
                        onCheckedChange={setEditIsDefault}
                        className="ml-2"
                      />
                    </FieldContent>
                  </div>
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
            disabled={isSaving || !editAddress.trim()}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
