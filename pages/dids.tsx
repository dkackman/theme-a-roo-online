import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/router";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import DidList from "../components/DidList";
import { useAuth } from "../lib/AuthContext";
import type { Database } from "../lib/database.types";
import { supabase } from "../lib/supabaseClient";

type Did = Database["public"]["Tables"]["dids"]["Row"];

export default function Dids() {
  const { user, loading: authLoading } = useAuth();
  const [dids, setDids] = useState<Did[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const router = useRouter();

  const fetchDids = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dids")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching dids", error);
    } else {
      setDids(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }

    if (user) {
      fetchDids();
    }
  }, [user, authLoading, router, fetchDids]);

  const addDid = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !user) {
      return;
    }
    const newDid = { title, user_id: user.id };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type inference issue with Supabase client
    const { error } = await supabase.from("dids").insert(newDid).select();
    if (error) {
      console.error(error);
    } else {
      setTitle("");
      fetchDids();
    }
  };

  const toggleComplete = async (did: Did) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type inference issue with Supabase client
    const { error } = await supabase
      .from("dids")
      .update({ is_complete: !did.is_complete })
      .eq("id", did.id);
    if (error) {
      console.error(error);
    } else {
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

  return (
    <div>
      <div className="rounded-2xl shadow-xl p-10">
        <h2 className="text-3xl font-bold mb-6">DIDs</h2>

        <form onSubmit={addDid} className="mb-8">
          <div className="flex gap-3">
            <Input
              placeholder="Add a new DID..."
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
            />
            <Button type="submit" variant="default">
              Add DID
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <DidList dids={dids} onToggle={toggleComplete} onDelete={deleteDid} />
        )}
      </div>
    </div>
  );
}
