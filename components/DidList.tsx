import { ClipboardList, Copy, Pencil, Trash2 } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import type { Database } from "../lib/database.types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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

interface DidListProps {
  dids?: Did[];
  onDelete: (id: string) => void;
  onUpdate?: (
    id: string,
    updates: { launcher_id: string; notes: string | null }
  ) => Promise<void>;
}

export default function DidList({
  dids = [],
  onDelete,
  onUpdate,
}: DidListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingDid, setEditingDid] = useState<Did | null>(null);
  const [editLauncherId, setEditLauncherId] = useState("");
  const [editNotes, setEditNotes] = useState("");
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

  const openEditSheet = (did: Did) => {
    setEditingDid(did);
    setEditLauncherId(did.launcher_id);
    setEditNotes(did.notes || "");
  };

  const closeEditSheet = () => {
    setEditingDid(null);
    setEditLauncherId("");
    setEditNotes("");
  };

  const handleSave = async () => {
    if (!editingDid || !onUpdate) {
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(editingDid.id, {
        launcher_id: editLauncherId,
        notes: editNotes.trim() || null,
      });
      closeEditSheet();
    } catch (err) {
      console.error("Failed to update DID:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!dids.length) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">No DIDs yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first DID to get started!
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-4">
        {dids.map((d) => (
          <li
            key={d.id}
            className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="space-y-3">
              {/* Launcher ID */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Launcher ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono truncate block bg-muted px-2 py-1 rounded">
                      {d.launcher_id}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(d.launcher_id, d.id)}
                      className="flex-shrink-0"
                      aria-label="Copy launcher ID"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedId === d.id && (
                        <span className="ml-1 text-xs">Copied!</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {d.notes && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Notes
                  </label>
                  <p className="text-sm">{d.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => openEditSheet(d)}
                  variant="outline"
                  size="sm"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => onDelete(d.id)}
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

      {/* Edit Sheet */}
      <Sheet
        open={!!editingDid}
        onOpenChange={(open) => !open && closeEditSheet()}
      >
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Edit DID</SheetTitle>
            <SheetDescription>
              Make changes to your DID information here.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="launcher_id">Launcher ID</Label>
              <Input
                id="launcher_id"
                value={editLauncherId}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditLauncherId(e.target.value)
                }
                placeholder="Enter launcher ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editNotes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setEditNotes(e.target.value)
                }
                placeholder="Add notes (optional)"
                rows={5}
              />
            </div>
          </div>
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
    </>
  );
}
