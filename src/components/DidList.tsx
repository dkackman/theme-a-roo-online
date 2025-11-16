import { ClipboardList } from "lucide-react";
import { useState } from "react";
import type { Database } from "../lib/database.types";
import DidCard from "./DidCard";
import DidProperties from "./DidProperties";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";
type Did = Database["public"]["Tables"]["dids"]["Row"];

interface DidListProps {
  dids?: Did[];
  onDelete: (id: string) => void;
  onUpdate?: (
    id: string,
    updates: {
      name: string | null;
      launcher_id: string;
      avatar_uri: string | null;
      notes: string | null;
      network: number;
      is_default: boolean;
    }
  ) => Promise<void>;
}

export default function DidList({
  dids = [],
  onDelete,
  onUpdate,
}: DidListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingDid, setEditingDid] = useState<Did | null>(null);

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
      name: string | null;
      launcher_id: string;
      avatar_uri: string | null;
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

  if (!dids.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardList />
          </EmptyMedia>
          <EmptyTitle>No DIDs yet</EmptyTitle>
          <EmptyDescription>
            Add your first DID to get started!
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      {dids.map((d) => (
        <DidCard
          key={d.id}
          did={d}
          copiedId={copiedId}
          onCopy={copyToClipboard}
          onEdit={setEditingDid}
          onDelete={onDelete}
        />
      ))}

      {/* Edit Sheet */}
      <DidProperties
        did={editingDid}
        isOpen={!!editingDid}
        onClose={() => setEditingDid(null)}
        onSave={handleSave}
      />
    </>
  );
}
