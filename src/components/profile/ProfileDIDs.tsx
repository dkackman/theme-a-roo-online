/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { useAuth } from "../../Contexts/AuthContext";
import { didsApi } from "../../lib/data-access";
import type { Database } from "../../lib/database.types";
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
      avatar_uri: string | null;
      notes: string | null;
      network: number;
      is_default: boolean;
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add New DID</CardTitle>
          <CardDescription>
            Enter a launcher ID to add a decentralized identifier to your
            profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addDid}>
            <FieldGroup>
              <Field orientation="vertical">
                <FieldLabel htmlFor="launcherId">Launcher ID</FieldLabel>
                <FieldContent>
                  <div className="flex gap-3">
                    <Input
                      id="launcherId"
                      placeholder="Add a new DID launcher ID..."
                      value={launcherId}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setLauncherId(e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button type="submit" variant="default">
                      Add DID
                    </Button>
                  </div>
                </FieldContent>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : (
        <DidList dids={dids} onDelete={deleteDid} onUpdate={updateDid} />
      )}
    </div>
  );
}
