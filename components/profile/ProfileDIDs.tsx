import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useAuth } from "../../lib/AuthContext";
import type { Database } from "../../lib/database.types";
import { supabase } from "../../lib/supabaseClient";
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
    const { data, error } = await supabase
      .from("dids")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching dids", error);
    } else {
      setDids(data || []);
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
    const newDid = { launcher_id: launcherId, user_id: user.id, network: 0 };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type inference issue with Supabase client
    const { error } = await supabase.from("dids").insert(newDid).select();
    if (error) {
      console.error(error);
    } else {
      setLauncherId("");
      fetchDids();
    }
  };

  const deleteDid = async (id: string) => {
    const { error } = await supabase.from("dids").delete().eq("id", id);
    if (error) {
      console.error(error);
    } else {
      fetchDids();
    }
  };

  const updateDid = async (
    id: string,
    updates: { launcher_id: string; notes: string | null; network: number }
  ) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type inference issue with Supabase client
    const { error } = await supabase.from("dids").update(updates).eq("id", id);

    if (error) {
      console.error("Error updating DID:", error);
      throw error;
    } else {
      fetchDids();
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
