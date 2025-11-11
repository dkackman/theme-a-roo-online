import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-button hover:bg-primary/90 btn-variant-default",
        destructive:
          "bg-destructive text-destructive-foreground shadow-button hover:bg-destructive/90 btn-variant-destructive",
        outline:
          "outline-btn border border-input text-foreground shadow-button hover:bg-accent hover:text-accent-foreground btn-variant-outline",
        secondary:
          "bg-secondary text-secondary-foreground shadow-button hover:bg-secondary/80 btn-variant-secondary",
        ghost:
          "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground btn-variant-ghost",
        link: "text-primary underline-offset-4 hover:underline btn-variant-link",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      disabled,
      "aria-label": ariaLabel,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // Get current theme styles from body data attribute
    const themeStyle =
      typeof document !== "undefined"
        ? document.documentElement.getAttribute("data-theme-style") || ""
        : "";

    const getLoadingAriaLabel = () => {
      if (ariaLabel) {
        return `${ariaLabel} - ${loadingText || "Loading..."}`;
      }
      return loadingText || "Loading...";
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        data-theme-style={themeStyle}
        ref={ref}
        disabled={loading || disabled}
        aria-label={loading ? getLoadingAriaLabel() : ariaLabel}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {loading && loadingText ? loadingText : children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
