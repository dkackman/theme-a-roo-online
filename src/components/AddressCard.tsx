import { Copy, Pencil, Star, Wallet } from "lucide-react";
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

type Address = Database["public"]["Tables"]["addresses"]["Row"];

interface AddressCardProps {
  address: Address;
  name: string | null;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onEdit: (address: Address) => void;
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

export default function AddressCard({
  address,
  name,
  copiedId,
  onCopy,
  onEdit,
  onDelete,
}: AddressCardProps) {
  return (
    <Card
      className={`border rounded-lg hover:bg-accent/50 transition-colors ${
        address.is_default ? "border-primary/50 bg-primary/5" : ""
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-4 h-4 flex-shrink-0" />
          <span className="truncate flex-1">{name || address.address}</span>
          {address.is_default && (
            <Badge variant="default" className="flex-shrink-0">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Default
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {/* Address */}
          <Field orientation="vertical">
            <FieldLabel>Address</FieldLabel>
            <FieldContent>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono truncate flex-1 bg-muted px-2 py-1 rounded">
                  {address.address}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(address.address, address.id)}
                  className="flex-shrink-0"
                  aria-label="Copy address"
                >
                  <Copy className="w-4 h-4" />
                  {copiedId === address.id && (
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
              <div className="flex items-center gap-2">
                <Badge variant={getNetworkBadgeVariant(address.network)}>
                  {getNetworkLabel(address.network)}
                </Badge>
              </div>
            </FieldContent>
          </Field>

          {/* Notes */}
          {address.notes && (
            <Field orientation="vertical">
              <FieldLabel>Notes</FieldLabel>
              <FieldContent>
                <FieldDescription className="text-sm font-normal">
                  {address.notes}
                </FieldDescription>
              </FieldContent>
            </Field>
          )}
        </FieldGroup>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
          <Button onClick={() => onEdit(address)} variant="outline" size="sm">
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <DeleteButton
            title="Delete address?"
            description={`This will permanently delete ${
              name ? `"${name}"` : "this address"
            }. This action cannot be undone.`}
            onConfirm={() => onDelete(address.id)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
