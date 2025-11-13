import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase-client";
import type { UserRole } from "../lib/types";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setUser(session?.user ?? null);
        // Extract role from JWT app_metadata
        const userRole =
          (session?.user?.app_metadata?.role as UserRole) ?? "user";
        setRole(userRole);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Update role from JWT
      const userRole =
        (session?.user?.app_metadata?.role as UserRole) ?? "user";
      setRole(userRole);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Only run once on mount

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const value: AuthContextType = {
    user,
    role,
    loading,
    isAdmin: role === "admin",
    isCreator: role === "creator",
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
