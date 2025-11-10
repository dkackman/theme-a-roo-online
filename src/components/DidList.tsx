import { ClipboardList } from "lucide-react";
import { useState } from "react";
import type { Database } from "../lib/database.types";
import DidCard from "./DidCard";
import DidProperties from "./DidProperties";
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

type Did = Database["public"]["Tables"]["dids"]["Row"];

interface DidListProps {
  dids?: Did[];
  onDelete: (id: string) => void;
  onUpdate?: (
    id: string,
    updates: {
      name: string | null;
      launcher_id: string;
      notes: string | null;
      network: number;
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
  const [deletingDid, setDeletingDid] = useState<Did | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = async () => {
    if (!deletingDid) {
      return;
    }
    await onDelete(deletingDid.id);
    setDeletingDid(null);
  };

  const handleSave = async (
    id: string,
    updates: {
      name: string | null;
      launcher_id: string;
      notes: string | null;
      network: number;
    }
  ) => {
    if (!onUpdate) {
      return;
    }
    await onUpdate(id, updates);
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
      {dids.map((d) => (
        <DidCard
          key={d.id}
          did={d}
          copiedId={copiedId}
          onCopy={copyToClipboard}
          onEdit={setEditingDid}
          onDelete={setDeletingDid}
        />
      ))}

      {/* Delete Confirmation Dialog */}
      <TooltipProvider>
        <AlertDialog
          open={!!deletingDid}
          onOpenChange={(open) => !open && setDeletingDid(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete:{" "}
                {deletingDid?.name ? (
                  <>
                    <span className="font-semibold">{deletingDid.name}</span>
                    <br />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <code className="text-xs cursor-help inline-block max-w-[400px] truncate align-bottom">
                          {deletingDid.launcher_id}
                        </code>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md break-all">
                        {deletingDid.launcher_id}
                      </TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <code className="text-xs cursor-help inline-block max-w-[400px] truncate align-bottom">
                        {deletingDid?.launcher_id}
                      </code>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md break-all">
                      {deletingDid?.launcher_id}
                    </TooltipContent>
                  </Tooltip>
                )}{" "}
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
      <DidProperties
        did={editingDid}
        isOpen={!!editingDid}
        onClose={() => setEditingDid(null)}
        onSave={handleSave}
      />
    </>
  );
}
