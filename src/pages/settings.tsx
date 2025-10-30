import { ClipboardList, Palette } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ThemeSelector } from "../components/ThemeSelector";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuth } from "../Contexts/AuthContext";
import { cn } from "../lib/utils";

type SettingsSection = "theme" | "editor";

const sections = [
  { id: "theme" as SettingsSection, label: "Theme", icon: Palette },
  { id: "editor" as SettingsSection, label: "Editor", icon: ClipboardList },
];

export default function Settings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>("theme");

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
      case "theme":
        return <ThemeSelector />;
      case "editor":
        return <div>Editor settings</div>;
      default:
        return <ThemeSelector />;
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="md:w-36 flex-shrink-0">
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <Button
                    variant={isActive ? "default" : "link"}
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center justify-start gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-left",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{section.label}</span>
                  </Button>
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
    </>
  );
}
