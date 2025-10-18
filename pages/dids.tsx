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
      <div className="bg-white rounded-2xl shadow-xl p-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">DIDs</h2>

        <form onSubmit={addDid} className="mb-8">
          <div className="flex gap-3">
            <input
              placeholder="Add a new DID..."
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-all whitespace-nowrap"
            >
              Add DID
            </button>
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
