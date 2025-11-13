import { ThemeCard } from "@/components/ThemeCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Palette } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSimpleTheme, type Theme } from "theme-o-rama";
import { AdminOnly } from "../components/RoleProtected";
import { useAuth } from "../Contexts/AuthContext";
import { themesApi } from "../lib/data-access";
import type { Database } from "../lib/database.types";

type DbTheme = Database["public"]["Tables"]["themes"]["Row"];

type PublishedThemeWithUser = DbTheme & {
  user_profiles: {
    id: string;
    email: string;
    name: string | null;
  } | null;
};

type ThemeWithUser = {
  theme: Theme;
  dbTheme: DbTheme;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
};

export default function MintQueue() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { initializeTheme } = useSimpleTheme();
  const [themes, setThemes] = useState<ThemeWithUser[]>([]);
  const [mintedThemes, setMintedThemes] = useState<ThemeWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMinted, setIsLoadingMinted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mintingThemeId, setMintingThemeId] = useState<string | null>(null);
  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [themeToMint, setThemeToMint] = useState<ThemeWithUser | null>(null);

  // Helper function to convert database themes to ThemeWithUser format
  const convertThemes = useCallback(
    async (dbThemes: PublishedThemeWithUser[]): Promise<ThemeWithUser[]> => {
      const themesWithUsers = await Promise.all(
        dbThemes.map(async (dbTheme: PublishedThemeWithUser) => {
          try {
            // Convert database theme to Theme-o-rama format
            let themeData: Record<string, unknown> = {};

            if (dbTheme.theme !== null && dbTheme.theme !== undefined) {
              // If it's a string, try to parse it
              if (typeof dbTheme.theme === "string") {
                try {
                  themeData = JSON.parse(dbTheme.theme) as Record<
                    string,
                    unknown
                  >;
                } catch (parseError) {
                  console.warn(
                    `Failed to parse theme JSON for ${dbTheme.name}:`,
                    parseError
                  );
                }
              }
              // If it's already an object (and not null or array), use it directly
              else if (
                typeof dbTheme.theme === "object" &&
                dbTheme.theme !== null &&
                !Array.isArray(dbTheme.theme)
              ) {
                themeData = dbTheme.theme as Record<string, unknown>;
              }
            }

            const convertedTheme = {
              name: dbTheme.name,
              displayName: dbTheme.display_name,
              description: dbTheme.description || "",
              schemaVersion: 1,
              ...themeData,
            };

            const initializedTheme = await initializeTheme(
              convertedTheme as Theme
            );

            return {
              theme: initializedTheme,
              dbTheme,
              user: dbTheme.user_profiles,
            } as ThemeWithUser;
          } catch (err) {
            console.warn(`Failed to initialize theme ${dbTheme.name}:`, err);
            return null;
          }
        })
      );

      // Filter out any null values from failed initializations
      return themesWithUsers.filter(
        (themeWithUser): themeWithUser is ThemeWithUser =>
          themeWithUser !== null
      );
    },
    [initializeTheme]
  );

  const loadPublishedThemes = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const publishedThemes = await themesApi.getPublishedWithUsers();
      const themesWithUsers = await convertThemes(publishedThemes);
      setThemes(themesWithUsers);
    } catch (err) {
      console.error("Failed to load published themes:", err);
      setError(err instanceof Error ? err.message : "Failed to load themes");
    } finally {
      setIsLoading(false);
    }
  }, [user, convertThemes]);

  const loadMintedThemes = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoadingMinted(true);

    try {
      const mintedThemesData = await themesApi.getMintedWithUsers();
      const themesWithUsers = await convertThemes(mintedThemesData);
      setMintedThemes(themesWithUsers);
    } catch (err) {
      console.error("Failed to load minted themes:", err);
      // Don't set error state for minted themes, just log it
    } finally {
      setIsLoadingMinted(false);
    }
  }, [user, convertThemes]);

  useEffect(() => {
    if (user && !authLoading) {
      loadPublishedThemes();
      loadMintedThemes();
    }
  }, [user, authLoading, loadPublishedThemes, loadMintedThemes]);

  const handlePrepareNFT = (themeId: string) => {
    router.push(`/prepare-nft?id=${themeId}`);
  };

  const handleSetToMinted = async () => {
    if (!themeToMint) {
      return;
    }

    setMintingThemeId(themeToMint.dbTheme.id);
    try {
      await themesApi.update(themeToMint.dbTheme.id, { status: "minted" });
      toast.success("Theme status set to minted");
      setMintDialogOpen(false);
      setThemeToMint(null);
      await Promise.all([loadPublishedThemes(), loadMintedThemes()]);
    } catch (error) {
      console.error("Error setting theme to minted:", error);
      toast.error("Failed to update theme status. Please try again.");
    } finally {
      setMintingThemeId(null);
    }
  };

  const openMintDialog = (theme: ThemeWithUser) => {
    setThemeToMint(theme);
    setMintDialogOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <AdminOnly>
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Mint Queue</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminOnly>
    );
  }

  return (
    <AdminOnly>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mint Queue</h1>
        <p className="text-muted-foreground mb-6">
          Review and mint published themes.
        </p>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && themes.length === 0 && (
          <Card>
            <CardContent className="p-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Palette />
                  </EmptyMedia>
                  <EmptyTitle>No Published Themes</EmptyTitle>
                  <EmptyDescription>
                    There are no published themes ready for minting.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        )}

        {!isLoading && themes.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4">Published Themes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {themes.map(({ theme, dbTheme, user: author }) => (
                <Card
                  key={dbTheme.id}
                  className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/theme-editor?id=${dbTheme.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      {dbTheme.display_name}
                    </CardTitle>
                    {dbTheme.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {dbTheme.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ThemeCard
                      theme={theme}
                      isSelected={false}
                      onSelect={() => {}}
                    />
                  </CardContent>
                  <CardContent className="pt-2 border-t">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={undefined}
                            alt={author?.email || "Unknown user"}
                          />
                          <AvatarFallback className="text-xs">
                            {author?.email?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {author?.name || author?.email || "Unknown User"}
                          </p>
                          {author?.name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {author.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrepareNFT(dbTheme.id)}
                      disabled={dbTheme.status === "minted"}
                      className="flex-1"
                    >
                      Prepare NFT
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        openMintDialog({ theme, dbTheme, user: author })
                      }
                      disabled={
                        mintingThemeId === dbTheme.id ||
                        dbTheme.status === "minted"
                      }
                      className="flex-1"
                    >
                      {mintingThemeId === dbTheme.id
                        ? "Setting..."
                        : "Set to Minted"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Minted Themes Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Minted Themes
          </h2>
          {isLoadingMinted && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-48 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!isLoadingMinted && mintedThemes.length === 0 && (
            <Card>
              <CardContent className="p-10">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CheckCircle2 className="text-muted-foreground" />
                    </EmptyMedia>
                    <EmptyTitle>No Minted Themes</EmptyTitle>
                    <EmptyDescription>
                      Themes that have been marked as minted will appear here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          )}
          {!isLoadingMinted && mintedThemes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mintedThemes.map(({ theme, dbTheme, user: author }) => (
                <Card
                  key={dbTheme.id}
                  className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow border-green-200 dark:border-green-800"
                  onClick={() => router.push(`/theme-editor?id=${dbTheme.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      {dbTheme.display_name}
                    </CardTitle>
                    {dbTheme.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {dbTheme.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ThemeCard
                      theme={theme}
                      isSelected={false}
                      onSelect={() => {}}
                    />
                  </CardContent>
                  <CardContent className="pt-2 border-t">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={undefined}
                            alt={author?.email || "Unknown user"}
                          />
                          <AvatarFallback className="text-xs">
                            {author?.email?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {author?.name || author?.email || "Unknown User"}
                          </p>
                          {author?.name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {author.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrepareNFT(dbTheme.id)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Set to Minted Confirmation Dialog */}
        <AlertDialog open={mintDialogOpen} onOpenChange={setMintDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Set Theme to Minted?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark &quot;
                {themeToMint?.dbTheme.display_name}&quot; as minted? This action
                will change the theme status to &quot;minted&quot; and it cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={mintingThemeId !== null}
                onClick={() => {
                  setMintDialogOpen(false);
                  setThemeToMint(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSetToMinted}
                disabled={mintingThemeId !== null}
              >
                {mintingThemeId ? "Setting..." : "Set to Minted"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminOnly>
  );
}
