import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ClipboardList, User as UserIcon, Wallet } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ProfileAddresses from "../components/profile/ProfileAddresses";
import ProfileDIDs from "../components/profile/ProfileDIDs";
import UserProfile from "../components/UserProfile";
import { useAuth } from "../Contexts/AuthContext";

type ProfileSection = "user" | "dids" | "addresses";

const sections = [
  { id: "user" as ProfileSection, label: "User", icon: UserIcon },
  { id: "dids" as ProfileSection, label: "DIDs", icon: ClipboardList },
  { id: "addresses" as ProfileSection, label: "Addresses", icon: Wallet },
];

export default function Profile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ProfileSection>("user");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "user":
        return <UserProfile />;
      case "dids":
        return <ProfileDIDs />;
      case "addresses":
        return <ProfileAddresses />;
      default:
        return <UserProfile />;
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="md:w-36 flex-shrink-0">
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-left",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Card className="shadow-xl p-6 md:p-10">{renderContent()}</Card>
        </main>
      </div>
    </div>
  );
}
