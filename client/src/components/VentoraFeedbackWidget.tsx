"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const DEFAULT_CRM_LOADER_URL = "https://widgets.ventoralabs.com/w/v1.js";

export function shouldRenderVentoraFeedbackWidget(pathname?: string | null) {
  const path = pathname ?? "";
  return path === "/app" || path.startsWith("/app/") || path.startsWith("/admin") || path.startsWith("/dashboard") || path.startsWith("/settings");
}

export default function VentoraFeedbackWidget() {
  const pathname = usePathname();
  const key = process.env.NEXT_PUBLIC_CRM_WIDGET_KEY;
  const url = process.env.NEXT_PUBLIC_CRM_LOADER_URL || DEFAULT_CRM_LOADER_URL;

  if (!key || !shouldRenderVentoraFeedbackWidget(pathname)) {
    return null;
  }

  return (
    <Script
      src={url}
      data-product={key}
      data-widget="feedback-button"
      strategy="afterInteractive"
    />
  );
}
