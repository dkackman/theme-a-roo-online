import { Wallet } from "lucide-react";

export default function ProfileAddresses() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Addresses</h2>
        <p className="text-muted-foreground">
          Manage your blockchain addresses
        </p>
      </div>

      <div className="text-center py-12">
        <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">No addresses yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This feature is coming soon!
        </p>
      </div>
    </div>
  );
}
