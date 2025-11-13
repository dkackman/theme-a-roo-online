import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ImagePreview } from "./ImagePreview";

export interface ImageItem {
  label: string;
  url?: string;
  ipfsUrl?: string;
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
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {images.some((image) => image.url) ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {images.map(({ label, url, ipfsUrl }) => (
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
                  <CardContent className="p-0 relative flex flex-col">
                    {url ? (
                      <>
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
                        {ipfsUrl && (
                          <div className="px-3 py-2 border-t">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={ipfsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  IPFS link
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-all">{ipfsUrl}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </>
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
              {emptyMessage}
            </CardDescription>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
