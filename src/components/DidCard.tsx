import { Copy, Pencil, User } from "lucide-react";
import type { Database } from "../lib/database.types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DeleteButton } from "./ui/delete-button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "./ui/field";

type Did = Database["public"]["Tables"]["dids"]["Row"];

interface DidCardProps {
  did: Did;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onEdit: (did: Did) => void;
  onDelete: (id: string) => void | Promise<void>;
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
      <CardContent>
        <FieldGroup>
          {/* Launcher ID */}
          <Field orientation="vertical">
            <FieldLabel>Launcher ID</FieldLabel>
            <FieldContent>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono truncate flex-1 bg-muted px-2 py-1 rounded">
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
            </FieldContent>
          </Field>

          {/* Network */}
          <Field orientation="vertical">
            <FieldLabel>Network</FieldLabel>
            <FieldContent>
              <Badge variant={getNetworkBadgeVariant(did.network)}>
                {getNetworkLabel(did.network)}
              </Badge>
            </FieldContent>
          </Field>

          {/* Notes */}
          {did.notes && (
            <Field orientation="vertical">
              <FieldLabel>Notes</FieldLabel>
              <FieldContent>
                <FieldDescription className="text-sm font-normal">
                  {did.notes}
                </FieldDescription>
              </FieldContent>
            </Field>
          )}
        </FieldGroup>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
          <Button onClick={() => onEdit(did)} variant="outline" size="sm">
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <DeleteButton
            title="Delete DID?"
            description={`This will permanently delete ${
              did.name ? `"${did.name}"` : "this DID"
            }. This action cannot be undone.`}
            onConfirm={() => onDelete(did.id)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
