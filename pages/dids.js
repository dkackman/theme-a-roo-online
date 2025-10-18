import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DidList from "../components/DidList";
import { supabase } from "../lib/supabaseClient";

export default function Dids() {
  const [dids, setDids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        router.push("/auth");
        return;
      }
      await fetchDids();
      // Optional: realtime subscription for todos table broadcasts (requires DB trigger or broadcast usage)
      // const channel = supabase.channel('public:todos').on('broadcast', { event: 'INSERT' }, payload => {
      //   fetchTodos()
      // }).subscribe()
      // cleanup would unsubscribe
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchDids = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dids")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching dids", error);
    } else {
      setDids(data);
    }
    setLoading(false);
  };

  const addDid = async (e) => {
    e.preventDefault();
    if (!title) {
      return;
    }
    const { data, error } = await supabase
      .from("dids")
      .insert([{ title }])
      .select();
    if (error) {
      console.error(error);
    } else {
      setTitle("");
      fetchDids();
    }
  };

  const toggleComplete = async (did) => {
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

  const deleteDid = async (id) => {
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
              onChange={(e) => setTitle(e.target.value)}
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
