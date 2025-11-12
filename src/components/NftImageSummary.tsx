import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ImagePreview } from "./ImagePreview";

export interface ImageItem {
  label: string;
  url?: string;
}

interface NftImageSummaryProps {
  images: ImageItem[];
  title?: string;
  emptyMessage?: string;
}

export function NftImageSummary({
  images,
  title = "Theme imagery",
  emptyMessage = "No theme imagery uploaded yet.",
}: NftImageSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
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
                <CardContent className="p-0 relative">
                  {url ? (
                    <ImagePreview
                      imageUrl={url}
                      alt={`${label} preview`}
                      className="cursor-pointer"
                      trigger={
                        <img
                          src={url}
                          alt={`${label} preview`}
                          className="h-32 w-full object-cover"
                        />
                      }
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
          <CardDescription className="text-sm">{emptyMessage}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
