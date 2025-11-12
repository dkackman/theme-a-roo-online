import { Github, Globe, Mail, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../components/ui/field";
import { Input } from "../components/ui/input";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
} from "../components/ui/item";
import { Skeleton } from "../components/ui/skeleton";
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
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

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Profile Information</CardTitle>
            <CardDescription>
              Your personal details and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {/* Display Name */}
              {profile.name && (
                <Field orientation="vertical">
                  <FieldLabel>Name</FieldLabel>
                  <FieldContent>
                    <Input value={profile.name} readOnly className="bg-muted" />
                  </FieldContent>
                </Field>
              )}

              {/* Email */}
              <Field orientation="vertical">
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <Input
                    value={user.email || ""}
                    readOnly
                    className="bg-muted"
                  />
                </FieldContent>
              </Field>

              {/* Twitter */}
              {profile.twitter && (
                <Field orientation="vertical">
                  <FieldLabel>Twitter</FieldLabel>
                  <FieldContent>
                    <div className="px-4 py-3 bg-muted rounded-lg border flex items-center gap-2">
                      <Twitter className="w-5 h-5 shrink-0" />
                      <span className="truncate">{profile.twitter}</span>
                    </div>
                  </FieldContent>
                </Field>
              )}

              {/* Website */}
              {profile.website && (
                <Field orientation="vertical">
                  <FieldLabel>Website</FieldLabel>
                  <FieldContent>
                    <div className="px-4 py-3 bg-muted rounded-lg border flex items-center gap-2">
                      <Globe className="w-5 h-5 shrink-0" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {profile.website}
                      </a>
                    </div>
                  </FieldContent>
                </Field>
              )}

              {/* Sponsor */}
              {profile.sponsor && (
                <Field orientation="vertical">
                  <FieldLabel>Sponsor Name</FieldLabel>
                  <FieldContent>
                    <Input
                      value={profile.sponsor}
                      readOnly
                      className="bg-muted"
                    />
                  </FieldContent>
                </Field>
              )}
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Account Details</CardTitle>
            <CardDescription>
              Your account role, authentication methods, and activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {/* User Role */}
              <Field orientation="vertical">
                <FieldLabel>Role</FieldLabel>
                <FieldContent>
                  <Badge
                    variant={getRoleBadgeVariant(role)}
                    className={getRoleBadgeClassName(role)}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                </FieldContent>
              </Field>

              {/* Auth Provider(s) */}
              <Field orientation="vertical">
                <FieldLabel>Sign-in Methods</FieldLabel>
                <FieldContent>
                  <ItemGroup>
                    {user.identities && user.identities.length > 0 ? (
                      user.identities.map((identity) => (
                        <Item key={identity.id} variant="outline" size="sm">
                          <ItemMedia variant="icon">
                            {identity.provider === "github" ? (
                              <Github />
                            ) : (
                              <Mail />
                            )}
                          </ItemMedia>
                          <ItemContent>
                            <ItemDescription>
                              {identity.provider === "github"
                                ? "GitHub"
                                : "Email / Password"}
                            </ItemDescription>
                            {identity.provider === "github" &&
                              (identity.identity_data?.user_name ||
                                identity.identity_data?.email) && (
                                <FieldDescription className="text-xs mt-1">
                                  {identity.identity_data?.user_name ||
                                    identity.identity_data?.email}
                                </FieldDescription>
                              )}
                          </ItemContent>
                        </Item>
                      ))
                    ) : (
                      <Item variant="outline" size="sm">
                        <ItemMedia variant="icon">
                          <Mail />
                        </ItemMedia>
                        <ItemContent>
                          <ItemDescription>Email / Password</ItemDescription>
                        </ItemContent>
                      </Item>
                    )}
                  </ItemGroup>
                </FieldContent>
              </Field>

              {/* Account Created */}
              <Field orientation="vertical">
                <FieldLabel>Account Created</FieldLabel>
                <FieldContent>
                  <Input
                    value={new Date(user.created_at).toLocaleDateString(
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
                </FieldContent>
              </Field>

              {/* Last Sign In */}
              {user.last_sign_in_at && (
                <Field orientation="vertical">
                  <FieldLabel>Last Sign In</FieldLabel>
                  <FieldContent>
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
                  </FieldContent>
                </Field>
              )}
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
