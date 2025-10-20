import { Copy, Pencil, Trash2, Wallet } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import type { Database } from "../lib/database.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

interface AddressListProps {
  addresses?: Address[];
  onDelete: (id: string) => void;
  onUpdate?: (
    id: string,
    updates: {
      address: string;
      notes: string | null;
      network: number;
    }
  ) => Promise<void>;
}

const getNetworkLabel = (network: number): string => {
  return network === 0 ? "Mainnet" : "Testnet";
};

const getNetworkBadgeClass = (network: number): string => {
  return network === 0
    ? "text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700"
    : "text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700";
};

export default function AddressList({
  addresses = [],
  onDelete,
  onUpdate,
}: AddressListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editNetwork, setEditNetwork] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const openEditSheet = (address: Address) => {
    setEditingAddress(address);
    setEditAddress(address.address);
    setEditNotes(address.notes || "");
    setEditNetwork(address.network);
  };

  const closeEditSheet = () => {
    setEditingAddress(null);
    setEditAddress("");
    setEditNotes("");
    setEditNetwork(0);
  };

  const handleSave = async () => {
    if (!editingAddress || !onUpdate) {
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(editingAddress.id, {
        address: editAddress,
        notes: editNotes.trim() || null,
        network: editNetwork,
      });
      closeEditSheet();
    } catch (err) {
      console.error("Failed to update address:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAddress) {
      return;
    }
    await onDelete(deletingAddress.id);
    setDeletingAddress(null);
  };

  if (!addresses.length) {
    return (
      <div className="text-center py-12">
        <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">No addresses yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first address to get started!
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-4">
        {addresses.map((a) => (
          <li
            key={a.id}
            className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="space-y-3">
              {/* Address */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Address
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono truncate block bg-muted px-2 py-1 rounded">
                      {a.address}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(a.address, a.id)}
                      className="flex-shrink-0"
                      aria-label="Copy address"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedId === a.id && (
                        <span className="ml-1 text-xs">Copied!</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Network */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Network
                </label>
                <span className={getNetworkBadgeClass(a.network)}>
                  {getNetworkLabel(a.network)}
                </span>
              </div>

              {/* Notes */}
              {a.notes && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Notes
                  </label>
                  <p className="text-sm">{a.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => openEditSheet(a)}
                  variant="outline"
                  size="sm"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => setDeletingAddress(a)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Delete Confirmation Dialog */}
      <TooltipProvider>
        <AlertDialog
          open={!!deletingAddress}
          onOpenChange={(open) => !open && setDeletingAddress(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete:{" "}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <code className="text-xs cursor-help inline-block max-w-[400px] truncate align-bottom">
                      {deletingAddress?.address}
                    </code>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md break-all">
                    {deletingAddress?.address}
                  </TooltipContent>
                </Tooltip>
                <div className="mt-4"> This action cannot be undone. </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>

      {/* Edit Sheet */}
      <Sheet
        open={!!editingAddress}
        onOpenChange={(open) => !open && closeEditSheet()}
      >
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Edit Address</SheetTitle>
            <SheetDescription>
              Make changes to your address information here.
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 py-6">
            <FieldGroup className="gap-4">
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
                  <SelectTrigger id="network">
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
                  placeholder="Add notes (optional)"
                  rows={5}
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
    </>
  );
}
