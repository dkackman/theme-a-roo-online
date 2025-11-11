import { Copy, Pencil, Wallet } from "lucide-react";
import type { Database } from "../lib/database.types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DeleteButton } from "./ui/delete-button";

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
    <Card className="border rounded-lg hover:bg-accent/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 truncate">
          <Wallet className="w-4 h-4" />
          <span className="truncate">{name || address.address}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Address */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Address
            </label>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono truncate block bg-muted px-2 py-1 rounded">
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
          </div>
        </div>

        {/* Network */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Network
          </label>
          <Badge variant={getNetworkBadgeVariant(address.network)}>
            {getNetworkLabel(address.network)}
          </Badge>
        </div>

        {/* Notes */}
        {address.notes && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Notes
            </label>
            <p className="text-sm">{address.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
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
