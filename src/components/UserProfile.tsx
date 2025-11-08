import { Edit, Github, Globe, Mail, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Field, FieldGroup, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import { useAuth } from "../Contexts/AuthContext";
import { usersApi } from "../lib/data-access/users";
import type { UserRole } from "../lib/types";

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

export default function UserProfile() {
  const { user, role, loading } = useAuth();
  const [profile, setProfile] = useState<{
    name: string | null;
    twitter: string | null;
    website: string | null;
    sponsor: string | null;
  }>({
    name: null,
    twitter: null,
    website: null,
    sponsor: null,
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    twitter: "",
    website: "",
    sponsor: "",
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        return;
      }

      setIsLoadingProfile(true);
      try {
        const data = await usersApi.getById(user.id);
        setProfile({
          name: data.name,
          twitter: data.twitter,
          website: data.website,
          sponsor: data.sponsor,
        });
        setFormData({
          name: data.name || "",
          twitter: data.twitter || "",
          website: data.website || "",
          sponsor: data.sponsor || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      return;
    }

    setIsSaving(true);
    try {
      await usersApi.update(user.id, {
        name: formData.name || null,
        twitter: formData.twitter || null,
        website: formData.website || null,
        sponsor: formData.sponsor || null,
      });

      // Update local state
      setProfile({
        name: formData.name || null,
        twitter: formData.twitter || null,
        website: formData.website || null,
        sponsor: formData.sponsor || null,
      });

      toast.success("Profile updated successfully!");
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user || isLoadingProfile) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Get display name: name field, GitHub username, or email prefix, or email
  const getDisplayName = () => {
    if (profile.name) {
      return profile.name;
    }
    const githubIdentity = user.identities?.find(
      (i) => i.provider === "github"
    );
    if (githubIdentity?.identity_data?.user_name) {
      return githubIdentity.identity_data.user_name as string;
    }
    return user.email?.split("@")[0] || user.email || "User";
  };

  const displayName = getDisplayName();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">{displayName}</h2>
          <p className="text-muted-foreground">Your account information</p>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Edit className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader className="px-6 pt-6">
              <SheetTitle>Edit Profile</SheetTitle>
              <SheetDescription>
                Update your personal information. Changes will be saved to your
                profile.
              </SheetDescription>
            </SheetHeader>
            <div className="px-6 py-6">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="name">Display Name</FieldLabel>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="twitter">Twitter</FieldLabel>
                  <Input
                    id="twitter"
                    placeholder="twitter.com/username or @username"
                    value={formData.twitter}
                    onChange={(e) =>
                      setFormData({ ...formData, twitter: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="website">Website</FieldLabel>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="sponsor">Sponsor Name</FieldLabel>
                  <Input
                    id="sponsor"
                    placeholder="Your sponsor name"
                    value={formData.sponsor}
                    onChange={(e) =>
                      setFormData({ ...formData, sponsor: e.target.value })
                    }
                  />
                </Field>
              </FieldGroup>
            </div>
            <SheetFooter className="px-6 pb-6">
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
      </div>

      <FieldGroup className="gap-4">
        {/* Display Name */}
        {profile.name && (
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input value={profile.name} readOnly className="bg-muted" />
          </Field>
        )}

        {/* Email */}
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input value={user.email || ""} readOnly className="bg-muted" />
        </Field>

        {/* Twitter */}
        {profile.twitter && (
          <Field>
            <FieldLabel>Twitter</FieldLabel>
            <div className="px-4 py-3 bg-muted rounded-lg border flex items-center gap-2">
              <Twitter className="w-5 h-5" />
              <span>{profile.twitter}</span>
            </div>
          </Field>
        )}

        {/* Website */}
        {profile.website && (
          <Field>
            <FieldLabel>Website</FieldLabel>
            <div className="px-4 py-3 bg-muted rounded-lg border flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {profile.website}
              </a>
            </div>
          </Field>
        )}

        {/* Sponsor */}
        {profile.sponsor && (
          <Field>
            <FieldLabel>Sponsor Name</FieldLabel>
            <Input value={profile.sponsor} readOnly className="bg-muted" />
          </Field>
        )}

        {/* User Role */}
        <Field>
          <FieldLabel>Role</FieldLabel>
          <div className="px-4 py-3 bg-muted rounded-lg border">
            <Badge
              variant={getRoleBadgeVariant(role)}
              className={getRoleBadgeClassName(role)}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          </div>
        </Field>

        {/* Auth Provider(s) */}
        <Field>
          <FieldLabel>Sign-in Methods</FieldLabel>
          <div className="space-y-2">
            {user.identities && user.identities.length > 0 ? (
              user.identities.map((identity) => (
                <div
                  key={identity.id}
                  className="px-4 py-3 bg-muted rounded-lg border"
                >
                  {identity.provider === "github" ? (
                    <div className="flex items-center gap-2">
                      <Github className="w-5 h-5" />
                      <span>GitHub</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {identity.identity_data?.user_name ||
                          identity.identity_data?.email}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      <span>Email / Password</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 bg-muted rounded-lg border">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email / Password
                </div>
              </div>
            )}
          </div>
        </Field>

        {/* Account Created */}
        <Field>
          <FieldLabel>Account Created</FieldLabel>
          <Input
            value={new Date(user.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            readOnly
            className="bg-muted"
          />
        </Field>

        {/* Last Sign In */}
        {user.last_sign_in_at && (
          <Field>
            <FieldLabel>Last Sign In</FieldLabel>
            <Input
              value={new Date(user.last_sign_in_at).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
              readOnly
              className="bg-muted"
            />
          </Field>
        )}
      </FieldGroup>
    </div>
  );
}
