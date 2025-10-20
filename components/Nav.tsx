import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../Contexts/AuthContext";
import type { UserRole } from "../lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";

const getRoleBadgeVariant = (
  role: UserRole
): "default" | "secondary" | "outline" => {
  if (role === "admin") {
    return "default";
  }
  if (role === "creator") {
    return "secondary";
  }
  return "outline";
};

const getRoleBadgeClassName = (role: UserRole): string => {
  if (role === "admin") {
    return "bg-purple-100 text-purple-700 border-transparent";
  }
  if (role === "creator") {
    return "bg-blue-100 text-blue-700 border-transparent";
  }
  return "";
};

export default function Nav() {
  const { user, role, isAdmin, signOut } = useAuth();
  const router = useRouter();

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
                style={{ filter: "var(--logo-invert)" }}
              />
              <span className="text-xl font-bold hidden sm:block">
                Theme-a-roo
              </span>
            </Link>

            {/* Navigation Menu */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                    active={router.pathname === "/"}
                  >
                    <Link href="/">Home</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                {isAdmin && (
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                      active={router.pathname === "/admin"}
                    >
                      <Link href="/admin">Admin</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors outline-none">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={user.email || "User avatar"}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
                        <Badge
                          variant={getRoleBadgeVariant(role)}
                          className={getRoleBadgeClassName(role)}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Badge>
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
              <Link
                href="/auth"
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
