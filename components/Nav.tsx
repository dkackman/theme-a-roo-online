import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import type { UserRole } from "../lib/types";

const getRoleBadgeClass = (role: UserRole): string => {
  if (role === "admin") {
    return "text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700";
  }
  if (role === "creator") {
    return "text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700";
  }
  return "text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700";
};

export default function Nav() {
  const { user, role, isAdmin, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
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
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                Theme-a-roo
              </span>
            </Link>

            {/* Navigation Links */}
            <Link
              href="/"
              className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/dids"
              className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
            >
              DIDs
            </Link>

            {/* Admin-only link */}
            {isAdmin && (
              <Link
                href="/admin"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                Admin
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                {/* User Menu Button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[150px] truncate">
                    {user.email}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {user.identities?.some((i) => i.provider === "github")
                            ? "GitHub Account"
                            : "Email Account"}
                        </p>
                        {/* Role Badge */}
                        <span className={getRoleBadgeClass(role)}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
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
