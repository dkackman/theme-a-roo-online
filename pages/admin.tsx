import Head from "next/head";
import { useEffect, useState } from "react";
import { AdminOnly } from "../components/RoleProtected";
import { useAuth } from "../lib/AuthContext";
import type { Database } from "../lib/database.types";
import { supabase } from "../lib/supabaseClient";

type Did = Database["public"]["Tables"]["dids"]["Row"];
type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

const getRoleBadgeClass = (role: string | null): string => {
  if (role === "admin") {
    return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-700";
  }
  if (role === "creator") {
    return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-700";
  }
  return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700";
};

export default function Admin() {
  const { user } = useAuth();
  const [allDids, setAllDids] = useState<Did[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDids: 0,
    completedDids: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    setLoading(true);

    // Fetch all DIDs (admin can see all)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type inference issue with Supabase client
    const { data: dids, error: didsError } = await supabase
      .from("dids")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch all users (admin can see all)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type inference issue with Supabase client
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!didsError && dids) {
      const typedDids = dids as Did[];
      setAllDids(typedDids);
      setStats({
        totalDids: typedDids.length,
        completedDids: typedDids.filter((d) => d.is_complete ?? false).length,
        totalUsers: users?.length || 0,
      });
    }

    if (!usersError && users) {
      const typedUsers = users as UserProfile[];
      setAllUsers(typedUsers);
    }

    setLoading(false);
  };

  const deleteAnyDid = async (id: string) => {
    const { error } = await supabase.from("dids").delete().eq("id", id);
    if (error) {
      console.error(error);
    } else {
      fetchAdminData();
    }
  };

  return (
    <AdminOnly>
      <Head>
        <title>Admin Dashboard - Theme-a-roo Online</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage users and content across the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase">
              Total DIDs
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalDids}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase">
              Completed DIDs
            </h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.completedDids}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase">
              Active Users
            </h3>
            <p className="text-3xl font-bold text-indigo-600 mt-2">
              {stats.totalUsers}
            </p>
          </div>
        </div>

        {/* All Users Table */}
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Users</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Sign In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((userProfile) => (
                    <tr key={userProfile.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userProfile.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getRoleBadgeClass(userProfile.role)}>
                          {(userProfile.role || "user")
                            .charAt(0)
                            .toUpperCase() +
                            (userProfile.role || "user").slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userProfile.created_at
                          ? new Date(
                              userProfile.created_at
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userProfile.last_sign_in_at
                          ? new Date(
                              userProfile.last_sign_in_at
                            ).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            userProfile.email_confirmed_at
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {userProfile.email_confirmed_at
                            ? "Confirmed"
                            : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {allUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>No users in the system yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* All DIDs Table */}
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All DIDs</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allDids.map((did) => (
                    <tr key={did.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {did.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            did.is_complete
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {did.is_complete ? "Complete" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                        {did.user_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {did.created_at
                          ? new Date(did.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => deleteAnyDid(did.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {allDids.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>No DIDs in the system yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
