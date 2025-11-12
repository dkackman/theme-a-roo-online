import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface NftSummaryProps {
  description: string;
  authorName: string;
  sponsor: string;
  twitter?: string;
  website?: string;
  did?: string;
  royaltyAddress?: string;
}

export function NftSummary({
  description,
  authorName,
  sponsor,
  twitter,
  website,
  did,
  royaltyAddress,
}: NftSummaryProps) {
  const requiredDetails = [
    {
      label: "Description",
      value: description,
      required: true,
      shouldWrap: true,
    },
    { label: "Author", value: authorName, required: true, shouldWrap: false },
    { label: "Sponsor", value: sponsor, required: true, shouldWrap: false },
    {
      label: "Royalty Address",
      value: royaltyAddress,
      required: true,
      shouldWrap: false,
    },
  ];

  const optionalDetails = [
    { label: "Twitter", value: twitter, shouldWrap: false },
    { label: "Website", value: website, shouldWrap: false },
    { label: "DID", value: did, shouldWrap: false },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Required details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {requiredDetails.map(({ label, value, shouldWrap }) => (
              <Field key={label} orientation="vertical">
                <FieldLabel className="text-xs uppercase tracking-wide">
                  {label}
                </FieldLabel>
                <FieldContent>
                  <FieldDescription
                    className={cn(
                      "text-sm font-normal",
                      shouldWrap
                        ? "break-words whitespace-pre-wrap"
                        : "truncate"
                    )}
                  >
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
              {optionalDetails.map(({ label, value, shouldWrap }) => (
                <Field key={label} orientation="vertical">
                  <FieldLabel className="text-xs uppercase tracking-wide">
                    {label}
                  </FieldLabel>
                  <FieldContent className="min-w-0">
                    <FieldDescription
                      className={cn(
                        "text-sm font-normal",
                        shouldWrap
                          ? "break-words whitespace-pre-wrap"
                          : "truncate"
                      )}
                    >
                      {value?.trim() ? value : "Not provided"}
                    </FieldDescription>
                  </FieldContent>
                </Field>
              ))}
            </FieldGroup>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
