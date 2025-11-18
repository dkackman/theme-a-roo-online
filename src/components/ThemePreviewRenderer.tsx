import { removeAlphaChannel } from "@/lib/color";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { applyTheme, type Theme } from "theme-o-rama";
import { ThemePreviewContent } from "./ThemePreviewContent";

const THEME_PREVIEW_IFRAME_TEMPLATE_URL = new URL(
  "./ThemePreviewRendererTemplate.html",
  import.meta.url
).toString();

const THEME_PREVIEW_IFRAME_ROOT_ID = "theme-preview-root";

interface ThemePreviewRendererProps {
  theme: Theme | null;
  className?: string;
}

export function ThemePreviewRenderer({
  theme,
  className,
}: ThemePreviewRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeDocument, setIframeDocument] = useState<Document | null>(null);
  const [mountNode, setMountNode] = useState<HTMLDivElement | null>(null);

  const handleLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) {
      setIframeDocument(null);
      return;
    }

    // Locate the root container defined in the static template
    let mount = doc.getElementById(
      THEME_PREVIEW_IFRAME_ROOT_ID
    ) as HTMLDivElement | null;

    if (!mount) {
      // Fallback for unexpected template changes: create the container dynamically
      mount = doc.createElement("div");
      mount.id = THEME_PREVIEW_IFRAME_ROOT_ID;
      mount.className = "theme-preview-iframe-root";
      mount.style.height = "100%";
      mount.style.width = "100%";
      doc.body.appendChild(mount);
    } else {
      // Ensure the container is empty before mounting React content
      mount.innerHTML = "";
    }

    if (!mount) {
      setMountNode(null);
      setIframeDocument(doc);
      return;
    }

    setMountNode(mount);
    setIframeDocument(doc);
  }, []);

  useEffect(() => {
    if (!iframeDocument || !document) {
      return;
    }

    const head = iframeDocument.head;
    //head.innerHTML = "";

    const parentStyles = Array.from(
      document.head.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
        "link[rel='stylesheet'], style"
      )
    );

    parentStyles.forEach((node) => {
      const cloned = node.cloneNode(true) as HTMLElement;
      head.appendChild(cloned);
    });
  }, [iframeDocument]);

  const content = useMemo(() => {
    if (!mountNode) {
      return null;
    }

    return createPortal(
      <IsolatedThemePreview
        theme={theme}
        iframeDocument={iframeDocument}
        className={className}
      />,
      mountNode
    );
  }, [className, iframeDocument, mountNode, theme]);

  // set the iframe background color so that it is opaque no matter what the theme is
  // this prevents the iframe from ever blending with the parent page
  const backgroundColor = useMemo(() => {
    const themeBackground = theme?.colors?.background;

    if (themeBackground && !themeBackground.startsWith("var")) {
      const opaqueBackground = removeAlphaChannel(themeBackground);
      if (opaqueBackground) {
        return opaqueBackground;
      }
    }

    if (theme?.mostLike === "dark") {
      return "#000000";
    }

    return "#FFFFFF";
  }, [theme]);

  return (
    <div
      className="theme-preview-iframe-wrapper relative h-full w-full"
      style={{
        isolation: "isolate",
        mixBlendMode: "normal",
        opacity: 1,
        filter: "none",
        backdropFilter: "none",
        backgroundColor: backgroundColor,
        all: "initial",
      }}
    >
      <iframe
        ref={iframeRef}
        className="h-full w-full border-0"
        sandbox="allow-same-origin"
        src={THEME_PREVIEW_IFRAME_TEMPLATE_URL}
        onLoad={handleLoad}
        aria-label="Theme preview"
      />
      {content}
    </div>
  );
}

interface IsolatedThemePreviewProps {
  theme: Theme | null;
  className?: string;
  iframeDocument: Document | null;
}

function IsolatedThemePreview({
  theme,
  iframeDocument,
  className,
}: IsolatedThemePreviewProps) {
  const root = iframeDocument?.documentElement;

  useEffect(() => {
    if (!root) {
      return;
    }

    if (theme) {
      applyTheme(theme, root);
    } else {
      root.removeAttribute("style");
      const themeClasses = Array.from(root.classList).filter((cls) =>
        cls.startsWith("theme-")
      );
      if (themeClasses.length > 0) {
        root.classList.remove(...themeClasses);
      }
      root.removeAttribute("data-theme-style");
    }
  }, [root, theme]);

  return (
    <div
      className={cn(
        "theme-preview relative flex h-full min-h-full min-h-screen w-full flex-1 flex-col overflow-auto theme-card-isolated",
        className
      )}
    >
      <ThemePreviewContent theme={theme} />
    </div>
  );
}
