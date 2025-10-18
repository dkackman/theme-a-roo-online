import { ClipboardList } from "lucide-react";
import type { Database } from "../lib/database.types";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

type Did = Database["public"]["Tables"]["dids"]["Row"];

interface DidListProps {
  dids?: Did[];
  onToggle: (did: Did) => void;
  onDelete: (id: string) => void;
}

export default function DidList({
  dids = [],
  onToggle,
  onDelete,
}: DidListProps) {
  if (!dids.length) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-lg font-medium">No DIDs yet</p>
        <p className="mt-1 text-sm">Add your first DID to get started!</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {dids.map((d) => (
        <li
          key={d.id}
          className="py-4 flex items- center gap-4 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors"
        >
          <Checkbox
            checked={d.is_complete ?? false}
            onCheckedChange={() => onToggle(d)}
            onChange={() => onToggle(d)}
          />
          <span
            className={`flex-1 ${
              d.is_complete ? "line-through text-gray-400" : ""
            }`}
          >
            {d.title}
          </span>
          <Button onClick={() => onDelete(d.id)} variant="destructive">
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
