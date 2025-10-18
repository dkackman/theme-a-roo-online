import Link from "next/link";
import { useRouter } from "next/router";
import { PropsWithChildren } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";

interface NavLinkProps extends PropsWithChildren {
  url: string | (() => void);
  isCollapsed?: boolean;
  message: React.ReactNode;
  customTooltip?: React.ReactNode;
  ariaCurrent?: "page" | "step" | "location" | "date" | "time" | true | false;
}

export function NavLink({
  url,
  children,
  isCollapsed,
  message,
  customTooltip,
  ariaCurrent,
}: NavLinkProps) {
  const router = useRouter();
  const isActive =
    typeof url === "string" &&
    (router.pathname === url ||
      (url !== "/" && router.pathname.startsWith(url)));

  const baseClassName = `flex items-center gap-3 transition-all ${
    isCollapsed ? "justify-center p-2 rounded-full" : "px-2 rounded-lg py-1.5"
  } text-lg md:text-base`;

  const className = isActive
    ? `${baseClassName} text-primary border-primary`
    : `${baseClassName} text-muted-foreground hover:text-primary`;

  const activeStyle = isActive
    ? { backgroundColor: "var(--nav-active-background)" }
    : {};

  const link =
    typeof url === "string" ? (
      <Link
        href={url}
        className={className}
        style={activeStyle}
        aria-current={isActive ? "page" : ariaCurrent}
        aria-label={isCollapsed ? message?.toString() : undefined}
      >
        {children}
        {!isCollapsed && message}
      </Link>
    ) : (
      <button
        type="button"
        onClick={url}
        className={className}
        style={activeStyle}
        aria-label={isCollapsed ? message?.toString() : undefined}
      >
        {children}
        {!isCollapsed && message}
      </button>
    );

  if (isCollapsed || customTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" role="tooltip" aria-live="polite">
          {customTooltip || message}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
