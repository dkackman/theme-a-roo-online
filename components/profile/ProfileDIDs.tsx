import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { useAuth } from "../../Contexts/AuthContext";
import type { Database } from "../../lib/database.types";
import { didsApi } from "../../lib/data-access";
import DidList from "../DidList";

type Did = Database["public"]["Tables"]["dids"]["Row"];

export default function ProfileDIDs() {
  const { user } = useAuth();
  const [dids, setDids] = useState<Did[]>([]);
  const [loading, setLoading] = useState(true);
  const [launcherId, setLauncherId] = useState("");

  const fetchDids = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    try {
      const data = await didsApi.getByUserId(user.id);
      setDids(data);
    } catch (error) {
      console.error("Error fetching dids", error);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDids();
    }
  }, [user, fetchDids]);

  const addDid = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!launcherId || !user) {
      return;
    }
    try {
      await didsApi.create({
        launcher_id: launcherId,
        user_id: user.id,
        network: 0,
      });
      toast.success("DID added successfully");
      setLauncherId("");
      fetchDids();
    } catch (error: any) {
      console.error(error);
      // Check for duplicate key error
      if (error.code === "23505") {
        toast.error("Duplicate DID", {
          description: "This launcher ID already exists in your DIDs.",
        });
      } else {
        toast.error("Failed to add DID", {
          description: error.message || "An unexpected error occurred.",
        });
      }
    }
  };

  const deleteDid = async (id: string) => {
    try {
      await didsApi.delete(id);
      toast.success("DID deleted successfully");
      fetchDids();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to delete DID", {
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const updateDid = async (
    id: string,
    updates: {
      name: string | null;
      launcher_id: string;
      notes: string | null;
      network: number;
    }
  ) => {
    try {
      await didsApi.update(id, updates);
      toast.success("DID updated successfully");
      fetchDids();
    } catch (error: any) {
      console.error("Error updating DID:", error);
      // Check for duplicate key error
      if (error.code === "23505") {
        toast.error("Duplicate DID", {
          description: "This launcher ID already exists in your DIDs.",
        });
      } else {
        toast.error("Failed to update DID", {
          description: error.message || "An unexpected error occurred.",
        });
      }
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">DIDs</h2>
        <p className="text-muted-foreground">
          Manage your decentralized identifiers
        </p>
      </div>

      <form onSubmit={addDid} className="flex gap-3">
        <Input
          placeholder="Add a new DID launcher ID..."
          value={launcherId}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setLauncherId(e.target.value)
          }
        />
        <Button type="submit" variant="default">
          Add DID
        </Button>
      </form>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <DidList dids={dids} onDelete={deleteDid} onUpdate={updateDid} />
      )}
    </div>
  );
}
