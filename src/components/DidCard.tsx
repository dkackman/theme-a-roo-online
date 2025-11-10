import { Copy, Pencil, Trash2, User } from "lucide-react";
import type { Database } from "../lib/database.types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type Did = Database["public"]["Tables"]["dids"]["Row"];

interface DidCardProps {
  did: Did;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onEdit: (did: Did) => void;
  onDelete: (did: Did) => void;
}

const getNetworkLabel = (network: number): string => {
  return network === 0 ? "Mainnet" : "Testnet";
};

const getNetworkBadgeVariant = (
  network: number
): "default" | "secondary" | "outline" => {
  return network === 0 ? "default" : "secondary";
};

export default function DidCard({
  did,
  copiedId,
  onCopy,
  onEdit,
  onDelete,
}: DidCardProps) {
  return (
    <Card className="border rounded-lg hover:bg-accent/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {did.avatar_uri?.trim() ? (
            <img
              src={did.avatar_uri}
              alt="Avatar preview"
              className="w-8 h-8 rounded-lg object-cover border border-border"
              onError={(e) => {
                // Hide image on error
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <User className="w-4 h-4" />
          )}
          <span className="truncate">{did.name || did.launcher_id}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Launcher ID */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Launcher ID
            </label>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono truncate block bg-muted px-2 py-1 rounded">
                {did.launcher_id}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(did.launcher_id, did.id)}
                className="flex-shrink-0"
                aria-label="Copy launcher ID"
              >
                <Copy className="w-4 h-4" />
                {copiedId === did.id && (
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
          <Badge variant={getNetworkBadgeVariant(did.network)}>
            {getNetworkLabel(did.network)}
          </Badge>
        </div>

        {/* Notes */}
        {did.notes && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Notes
            </label>
            <p className="text-sm">{did.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={() => onEdit(did)} variant="outline" size="sm">
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button onClick={() => onDelete(did)} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
