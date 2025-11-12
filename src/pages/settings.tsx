import { ClipboardList, Loader2, Palette } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ThemeSelector } from "../components/ThemeSelector";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { useAuth } from "../Contexts/AuthContext";
import {
  defaultSettings,
  loadSettings,
  saveSettings,
  type Settings as AppSettings,
} from "../lib/settings";
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
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
  }, []);

  const handlePromptToSaveChange = (checked: boolean) => {
    const nextSettings: AppSettings = {
      ...settings,
      promptToSave: checked,
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden="true"
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "theme":
        return <ThemeSelector />;
      case "editor":
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Editor Settings</h2>
              <p className="text-sm text-muted-foreground">
                Configure how the theme editor behaves.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-4">
              <div className="pr-4">
                <p className="font-medium leading-none">Prompt to save</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask before leaving the editor when there are unsaved changes.
                  Will always save if not set.
                </p>
              </div>
              <Switch
                checked={settings.promptToSave}
                onCheckedChange={handlePromptToSaveChange}
                aria-label="Prompt to save themes"
              />
            </div>
          </div>
        );
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
