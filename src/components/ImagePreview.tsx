import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  imageUrl: string;
  alt: string;
  trigger?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ImagePreview({
  imageUrl,
  alt,
  trigger,
  className,
  disabled = false,
}: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultTrigger = (
    <Button variant="secondary" size="sm">
      Preview
    </Button>
  );

  const handleClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // If trigger is provided, wrap it; otherwise use default button
  const triggerElement = trigger ? (
    <div
      onClick={handleClick}
      className={cn(disabled && "pointer-events-none opacity-50", className)}
    >
      {trigger}
    </div>
  ) : (
    <div onClick={handleClick} className={className}>
      {defaultTrigger}
    </div>
  );

  return (
    <>
      {triggerElement}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="!max-w-none !md:max-w-none w-[90vw] max-w-[95vw] h-[90vh] max-h-[95vh] p-0 bg-black/90">
          <div className="relative h-full w-full">
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

