import { shouldRenderVentoraFeedbackWidget } from "../VentoraFeedbackWidget";

describe("shouldRenderVentoraFeedbackWidget", () => {
  it("does not render on marketing pages", () => {
    expect(shouldRenderVentoraFeedbackWidget("/")).toBe(false);
    expect(shouldRenderVentoraFeedbackWidget("/pricing")).toBe(false);
    expect(shouldRenderVentoraFeedbackWidget("/features")).toBe(false);
  });

  it("renders on authenticated app surfaces", () => {
    expect(shouldRenderVentoraFeedbackWidget("/app")).toBe(true);
    expect(shouldRenderVentoraFeedbackWidget("/app/events")).toBe(true);
    expect(shouldRenderVentoraFeedbackWidget("/admin/dashboard")).toBe(true);
    expect(shouldRenderVentoraFeedbackWidget("/dashboard")).toBe(true);
    expect(shouldRenderVentoraFeedbackWidget("/dashboard/members")).toBe(true);
    expect(shouldRenderVentoraFeedbackWidget("/settings/billing")).toBe(true);
  });
});

// CrmFeedbackWidget render tests exercise the env-gated component in a jsdom context.
import React from "react";
import { render } from "@testing-library/react";

// Mock next/navigation to supply a controlled pathname
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock next/script so we can inspect the rendered tag in jsdom
jest.mock("next/script", () => {
  const MockScript = (props: Record<string, string>) => (
    // eslint-disable-next-line @next/next/no-sync-scripts
    <script {...props} />
  );
  MockScript.displayName = "MockScript";
  return MockScript;
});

import { usePathname } from "next/navigation";
import VentoraFeedbackWidget from "../VentoraFeedbackWidget";

const mockUsePathname = usePathname as jest.Mock;

describe("VentoraFeedbackWidget env-gated render", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockUsePathname.mockReturnValue("/app/dashboard");
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("renders nothing when NEXT_PUBLIC_CRM_WIDGET_KEY is not set", () => {
    delete process.env.NEXT_PUBLIC_CRM_WIDGET_KEY;
    const { container } = render(<VentoraFeedbackWidget />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing on a marketing path even when key is set", () => {
    process.env.NEXT_PUBLIC_CRM_WIDGET_KEY = "wk_testkey";
    mockUsePathname.mockReturnValue("/pricing");
    const { container } = render(<VentoraFeedbackWidget />);
    expect(container.firstChild).toBeNull();
  });

  it("renders script with correct src and data-product from env when key is set", () => {
    process.env.NEXT_PUBLIC_CRM_WIDGET_KEY = "wk_testkey";
    const { container } = render(<VentoraFeedbackWidget />);
    const script = container.querySelector("script");
    expect(script).not.toBeNull();
    expect(script?.getAttribute("src")).toBe("https://widgets.ventoralabs.com/w/v1.js");
    expect(script?.getAttribute("data-product")).toBe("wk_testkey");
    expect(script?.getAttribute("data-widget")).toBe("feedback-button");
  });

  it("uses NEXT_PUBLIC_CRM_LOADER_URL override when set", () => {
    process.env.NEXT_PUBLIC_CRM_WIDGET_KEY = "wk_testkey";
    process.env.NEXT_PUBLIC_CRM_LOADER_URL = "https://custom.example.com/w/v1.js";
    const { container } = render(<VentoraFeedbackWidget />);
    const script = container.querySelector("script");
    expect(script?.getAttribute("src")).toBe("https://custom.example.com/w/v1.js");
  });
});
