import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
} from "@/components/ui/item";
import type { Database } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Info, Rocket, XCircle } from "lucide-react";
import { useMemo } from "react";

type ThemeStatus = Database["public"]["Enums"]["theme_status"];

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeName: string;
  themeStatus: ThemeStatus;
  validationError: string | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  hasPreviewImage: boolean;
  hasDescription: boolean;
  hasAuthor: boolean;
  hasSponsor: boolean;
  hasRoyaltyAddress: boolean;
  description: string;
  authorName: string;
  sponsor: string;
  twitter?: string;
  website?: string;
  did?: string;
  royaltyAddress?: string;
  themeFiles: {
    background?: string;
    preview?: string;
    banner?: string;
  };
  onConfirm: () => Promise<void> | void;
}

export function PublishDialog({
  open,
  onOpenChange,
  themeName,
  themeStatus,
  validationError,
  hasUnsavedChanges,
  isSaving,
  isPublishing,
  hasPreviewImage,
  hasDescription,
  hasAuthor,
  hasSponsor,
  hasRoyaltyAddress,
  description,
  authorName,
  sponsor,
  twitter,
  website,
  did,
  royaltyAddress,
  themeFiles,
  onConfirm,
}: PublishDialogProps) {
  const checklistItems = useMemo(
    () => [
      {
        id: "status",
        label: "Theme status is set to Ready",
        passed: themeStatus === "ready",
      },
      {
        id: "saved",
        label: "All changes are saved",
        passed: !hasUnsavedChanges && !isSaving,
      },
      {
        id: "valid",
        label: "Theme JSON is valid",
        passed: validationError === null,
      },
      {
        id: "preview",
        label: "NFT preview image uploaded",
        passed: hasPreviewImage,
      },
      {
        id: "description",
        label: "Description provided",
        passed: hasDescription,
      },
      {
        id: "author",
        label: "Author provided",
        passed: hasAuthor,
      },
      {
        id: "sponsor",
        label: "Sponsor provided",
        passed: hasSponsor,
      },
      {
        id: "royaltyAddress",
        label: "Royalty address provided",
        passed: hasRoyaltyAddress,
      },
    ],
    [
      themeStatus,
      hasUnsavedChanges,
      isSaving,
      validationError,
      hasPreviewImage,
      hasDescription,
      hasAuthor,
      hasSponsor,
      hasRoyaltyAddress,
    ]
  );

  const canPublish = checklistItems.every((item) => item.passed);

  const requiredDetails = useMemo(
    () => [
      { label: "Description", value: description, required: true },
      { label: "Author", value: authorName, required: true },
      { label: "Sponsor", value: sponsor, required: true },
      { label: "Royalty Address", value: royaltyAddress, required: true },
    ],
    [description, authorName, sponsor, royaltyAddress]
  );

  const optionalDetails = useMemo(
    () => [
      { label: "Twitter", value: twitter },
      { label: "Website", value: website },
      { label: "DID", value: did },
    ],
    [twitter, website, did]
  );

  const images = useMemo(
    () => [
      { label: "Background", url: themeFiles.background },
      { label: "NFT Preview", url: themeFiles.preview },
      { label: "NFT Banner", url: themeFiles.banner },
    ],
    [themeFiles.background, themeFiles.preview, themeFiles.banner]
  );

  const handleConfirm = () => {
    if (!canPublish || isPublishing) {
      return;
    }
    void onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Publish "{themeName}"</DialogTitle>
          <DialogDescription>
            Publishing will mark this theme as read-only while it awaits
            minting. Double-check everything before continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2 pl-4">
          <Card className="bg-muted/30 border-border/60">
            <CardContent className="flex items-start gap-3 p-4">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <CardDescription className="text-sm">
                After publishing, this theme can no longer be edited until it is
                returned to the Ready state. Double-check the information below
                before continuing.
              </CardDescription>
            </CardContent>
          </Card>

          {canPublish ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Required details</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    {requiredDetails.map(({ label, value }) => (
                      <Field key={label} orientation="vertical">
                        <FieldLabel className="text-xs uppercase tracking-wide">
                          {label}
                        </FieldLabel>
                        <FieldContent>
                          <FieldDescription className="text-sm font-normal">
                            {value?.trim() ? value : "Not provided"}
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    ))}
                  </FieldGroup>
                </CardContent>
              </Card>

              {optionalDetails.some((d) => d.value?.trim()) && (
                <Card className="bg-muted/20 border-border/60">
                  <CardHeader>
                    <CardTitle className="text-sm">Optional details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      {optionalDetails.map(({ label, value }) => (
                        <Field key={label} orientation="vertical">
                          <FieldLabel className="text-xs uppercase tracking-wide">
                            {label}
                          </FieldLabel>
                          <FieldContent>
                            <FieldDescription className="text-sm font-normal">
                              {value?.trim() ? value : "Not provided"}
                            </FieldDescription>
                          </FieldContent>
                        </Field>
                      ))}
                    </FieldGroup>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Theme imagery</CardTitle>
                </CardHeader>
                <CardContent>
                  {images.some((image) => image.url) ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {images.map(({ label, url }) => (
                        <Card
                          key={label}
                          className={cn(
                            "overflow-hidden bg-muted/20 border-border/60 flex flex-col",
                            !url && "items-center justify-center"
                          )}
                        >
                          <CardHeader className="px-3 py-2 pb-2">
                            <CardTitle className="text-xs font-medium uppercase tracking-wide">
                              {label}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            {url ? (
                              <img
                                src={url}
                                alt={`${label} preview`}
                                className="h-32 w-full object-cover"
                              />
                            ) : (
                              <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs px-3 py-6">
                                Not provided
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <CardDescription className="text-sm">
                      No theme imagery uploaded yet.
                    </CardDescription>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pre-publish checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ItemGroup>
                  {checklistItems.map((item) => (
                    <Item key={item.id} variant="default" size="sm">
                      <ItemMedia variant="default">
                        {item.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </ItemMedia>
                      <ItemContent>
                        <ItemDescription
                          className={cn(
                            item.passed
                              ? "text-muted-foreground"
                              : "text-foreground"
                          )}
                        >
                          {item.label}
                        </ItemDescription>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2 flex-shrink-0 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={!canPublish}
            loading={isPublishing}
            loadingText="Publishing..."
          >
            <Rocket className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
