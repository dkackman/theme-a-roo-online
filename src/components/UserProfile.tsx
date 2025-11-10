import { Github, Globe, Mail, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { useAuth } from "../Contexts/AuthContext";
import { usersApi } from "../lib/data-access/users";
import type { UserRole } from "../lib/types";
import UserProfileProperties from "./UserProfileProperties";

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

  const handleSave = async (updates: {
    name: string | null;
    twitter: string | null;
    website: string | null;
    sponsor: string | null;
  }) => {
    if (!user) {
      return;
    }

    try {
      await usersApi.update(user.id, updates);

      // Update local state
      setProfile(updates);

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      throw error; // Re-throw so ProfileProperties can handle it
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
        <UserProfileProperties
          profile={profile}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          onSave={handleSave}
        />
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
