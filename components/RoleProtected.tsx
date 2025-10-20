import { useRouter } from "next/router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../Contexts/AuthContext";
import type { UserRole } from "../lib/types";

interface RoleProtectedProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

export default function RoleProtected({
  children,
  allowedRoles,
  fallbackPath = "/",
}: RoleProtectedProps) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !allowedRoles.includes(role)) {
      router.push(fallbackPath);
    }
  }, [role, loading, allowedRoles, fallbackPath, router]);

  if (loading || !allowedRoles.includes(role)) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience component for admin-only pages
export function AdminOnly({ children }: { children: ReactNode }) {
  return <RoleProtected allowedRoles={["admin"]}>{children}</RoleProtected>;
}

// Convenience component for creator and admin pages
export function CreatorOrAdmin({ children }: { children: ReactNode }) {
  return (
    <RoleProtected allowedRoles={["admin", "creator"]}>
      {children}
    </RoleProtected>
  );
}
