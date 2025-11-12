import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Field, FieldContent, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

interface UserProfileData {
  name: string | null;
  twitter: string | null;
  website: string | null;
  sponsor: string | null;
}

interface UserProfilePropertiesProps {
  profile: UserProfileData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: UserProfileData) => Promise<void>;
}

export default function UserProfileProperties({
  profile,
  isOpen,
  onOpenChange,
  onSave,
}: UserProfilePropertiesProps) {
  const [formData, setFormData] = useState({
    name: "",
    twitter: "",
    website: "",
    sponsor: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when profile changes
  useEffect(() => {
    setFormData({
      name: profile.name || "",
      twitter: profile.twitter || "",
      website: profile.website || "",
      sponsor: profile.sponsor || "",
    });
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        name: formData.name || null,
        twitter: formData.twitter || null,
        website: formData.website || null,
        sponsor: formData.sponsor || null,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
      throw err; // Re-throw so parent can handle error display
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-popover flex flex-col">
        <SheetHeader className="px-6 pt-6 flex-shrink-0">
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Update your personal information. Changes will be saved to your
            profile.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Profile Information</CardTitle>
              <CardDescription>
                All fields are optional. Update as needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="name">Display Name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="twitter">Twitter</FieldLabel>
                  <FieldContent>
                    <Input
                      id="twitter"
                      placeholder="twitter.com/username or @username"
                      value={formData.twitter}
                      onChange={(e) =>
                        setFormData({ ...formData, twitter: e.target.value })
                      }
                    />
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="website">Website</FieldLabel>
                  <FieldContent>
                    <Input
                      id="website"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                    />
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="sponsor">Sponsor Name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="sponsor"
                      placeholder="Your sponsor name"
                      value={formData.sponsor}
                      onChange={(e) =>
                        setFormData({ ...formData, sponsor: e.target.value })
                      }
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
        <SheetFooter className="px-6 pb-6 flex-shrink-0 border-t pt-4">
          <SheetClose asChild>
            <Button variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </SheetClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
