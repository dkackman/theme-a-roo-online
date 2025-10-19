import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminOnly } from "../components/RoleProtected";
import { Button } from "../components/ui/button";
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
  return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100";
};

export default function Admin() {
  const { user } = useAuth();
  const [allDids, setAllDids] = useState<Did[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDids: 0,
    totalUsers: 0,
  });

  const fetchAdminData = useCallback(async () => {
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
        totalUsers: users?.length || 0,
      });
    }

    if (!usersError && users) {
      const typedUsers = users as UserProfile[];
      setAllUsers(typedUsers);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user, fetchAdminData]);

  const deleteAnyDid = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("dids").delete().eq("id", id);
      if (error) {
        console.error(error);
      } else {
        fetchAdminData();
      }
    },
    [fetchAdminData]
  );

  const usersColumns = useMemo<ColumnDef<UserProfile>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        size: 120,
        cell: ({ row }) => (
          <span className={getRoleBadgeClass(row.original.role)}>
            {(row.original.role || "user").charAt(0).toUpperCase() +
              (row.original.role || "user").slice(1)}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Joined",
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleDateString()
              : "N/A"}
          </span>
        ),
      },
      {
        accessorKey: "last_sign_in_at",
        header: "Last Sign In",
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.last_sign_in_at
              ? new Date(row.original.last_sign_in_at).toLocaleDateString()
              : "Never"}
          </span>
        ),
      },
      {
        accessorKey: "email_confirmed_at",
        header: "Status",
        size: 120,
        cell: ({ row }) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              row.original.email_confirmed_at
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {row.original.email_confirmed_at ? "Confirmed" : "Pending"}
          </span>
        ),
      },
    ],
    []
  );

  const didsColumns = useMemo<ColumnDef<Did>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.launcher_id}</span>
        ),
      },
      {
        accessorKey: "user_id",
        header: "User ID",
        size: 150,
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.user_id.substring(0, 8)}...
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleDateString()
              : "N/A"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 100,
        cell: ({ row }) => (
          <Button
            onClick={() => deleteAnyDid(row.original.id)}
            variant="destructive"
            size="sm"
            aria-label={`Delete "${row.original.launcher_id}"`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        ),
        meta: {
          cellClassName: "text-right px-4",
        },
      },
    ],
    [deleteAnyDid]
  );

  return (
    <AdminOnly>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin Dashboard</CardTitle>
          </CardHeader>
          <CardDescription className="space-y-4 ml-8 pb-8">
            Manage users and content across the platform
          </CardDescription>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle>Total DIDs</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{stats.totalDids}</span>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-indigo-600">
                {stats.totalUsers}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* All Users Table */}
        <Card className="rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            )}
            {!loading && allUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No users in the system yet
                </p>
              </div>
            )}
            {!loading && allUsers.length > 0 && (
              <DataTable
                columns={usersColumns}
                data={allUsers}
                showTotalRows={true}
                rowLabel="user"
                rowLabelPlural="users"
              />
            )}
          </CardContent>
        </Card>

        {/* All DIDs Table */}
        <Card className="rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle>All DIDs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            )}
            {!loading && allDids.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No DIDs in the system yet
                </p>
              </div>
            )}
            {!loading && allDids.length > 0 && (
              <DataTable
                columns={didsColumns}
                data={allDids}
                showTotalRows={true}
                rowLabel="DID"
                rowLabelPlural="DIDs"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  );
}
