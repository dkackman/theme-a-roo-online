import { Wallet } from "lucide-react";
import { useState } from "react";
import type { Database } from "../lib/database.types";
import AddressCard from "./AddressCard";
import AddressProperties from "./AddressProperties";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";
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
      is_default: boolean;
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
      is_default: boolean;
    }
  ) => {
    if (!onUpdate) {
      return;
    }
    await onUpdate(id, updates);
  };

  if (!addresses.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Wallet />
          </EmptyMedia>
          <EmptyTitle>No addresses yet</EmptyTitle>
          <EmptyDescription>
            Add your first address to get started!
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
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
