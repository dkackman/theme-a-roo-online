import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";
import type { UserRole } from "../lib/types";
import { NavLink } from "./NavLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const getRoleBadgeClass = (role: UserRole): string => {
  if (role === "admin") {
    return "text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700";
  }
  if (role === "creator") {
    return "text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700";
  }
  return "text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100";
};

export default function Nav() {
  const { user, role, isAdmin, signOut } = useAuth();

  return (
    <nav className="border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/kangaroo.png"
                alt="Theme-a-roo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-bold hidden sm:block">
                Theme-a-roo
              </span>
            </Link>

            {/* Navigation Links */}
            <NavLink url="/" message="Home" />
            <NavLink url="/dids" message="DIDs" />

            {/* Admin-only link */}
            {isAdmin && <NavLink url="/admin" message="Admin" />}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors outline-none">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[150px] truncate">
                    {user.email}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {user.identities?.some((i) => i.provider === "github")
                            ? "GitHub Account"
                            : "Email Account"}
                        </p>
                        <span className={getRoleBadgeClass(role)}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-3">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-3">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <NavLink url="/auth" message="Sign in" />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
