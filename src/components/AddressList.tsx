import { Wallet } from "lucide-react";
import { useState } from "react";
import type { Database } from "../lib/database.types";
import AddressCard from "./AddressCard";
import AddressProperties from "./AddressProperties";
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

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
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
          onDelete={onDelete}
        />
      ))}

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
