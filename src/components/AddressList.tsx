import { Wallet } from "lucide-react";
import { useState } from "react";
import type { Database } from "../lib/database.types";
import AddressCard from "./AddressCard";
import AddressProperties from "./AddressProperties";
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
      name: string | null;
      notes: string | null;
      network: number;
    }
  ) => Promise<void>;
}

export default function AddressList({
  addresses = [],
  onDelete,
  onUpdate,
}: AddressListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = () => {
    if (!deletingAddress) {
      return;
    }
    onDelete(deletingAddress.id);
    setDeletingAddress(null);
  };

  const handleSave = async (
    id: string,
    updates: {
      address: string;
      name: string | null;
      notes: string | null;
      network: number;
    }
  ) => {
    if (!onUpdate) {
      return;
    }
    await onUpdate(id, updates);
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
      {addresses.map((a) => (
        <AddressCard
          key={a.id}
          address={a}
          name={a.name}
          copiedId={copiedId}
          onCopy={copyToClipboard}
          onEdit={setEditingAddress}
          onDelete={setDeletingAddress}
        />
      ))}

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
      <AddressProperties
        address={editingAddress}
        isOpen={!!editingAddress}
        onClose={() => setEditingAddress(null)}
        onSave={handleSave}
      />
    </>
  );
}
