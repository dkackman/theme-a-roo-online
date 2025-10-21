import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminOnly } from "../components/RoleProtected";
import { useAuth } from "../Contexts/AuthContext";
import type { Database } from "../lib/database.types";
import { supabase } from "../lib/supabaseClient";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

const getRoleBadgeVariant = (
  role: string | null
): "default" | "secondary" | "outline" => {
  if (role === "admin") {
    return "default";
  }
  if (role === "creator") {
    return "secondary";
  }
  return "outline";
};

const getRoleBadgeClassName = (role: string | null): string => {
  if (role === "admin") {
    return "bg-purple-100 text-purple-700 border-transparent";
  }
  if (role === "creator") {
    return "bg-blue-100 text-blue-700 border-transparent";
  }
  return "";
};

export default function Admin() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalThemes: 0,
  });

  const fetchAdminData = useCallback(async () => {
    setLoading(true);

    // Fetch all users (admin can see all)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type inference issue with Supabase client
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    const { count: themeCount } = await supabase
      .from('themes')
      .select('*', { count: 'exact', head: true });
    
    if (!usersError && users) {
      const typedUsers = users as UserProfile[];
      setAllUsers(typedUsers);
      setStats({
        totalUsers: users?.length || 0,
        totalThemes: themeCount || 0,
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user, fetchAdminData]);

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
          <Badge
            variant={getRoleBadgeVariant(row.original.role)}
            className={getRoleBadgeClassName(row.original.role)}
          >
            {(row.original.role || "user").charAt(0).toUpperCase() +
              (row.original.role || "user").slice(1)}
          </Badge>
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
          <Badge
            variant={row.original.email_confirmed_at ? "default" : "secondary"}
            className={
              row.original.email_confirmed_at
                ? "bg-green-100 text-green-800 border-transparent"
                : ""
            }
          >
            {row.original.email_confirmed_at ? "Confirmed" : "Pending"}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <AdminOnly>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>
              Manage users and content across the platform
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <Card className="rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle>Total # of Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-green-600">
                  {stats.totalThemes}
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
      </div>
    </AdminOnly>
  );
}
