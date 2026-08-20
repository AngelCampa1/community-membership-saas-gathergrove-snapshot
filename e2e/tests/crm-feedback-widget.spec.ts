/**
 * CRM-FEEDBACK: Ventora CRM feedback widget integration tests.
 *
 * These tests verify that the CRM loader script is injected on authenticated
 * app surfaces when NEXT_PUBLIC_CRM_WIDGET_KEY is set.
 *
 * NOTE: The widget only _functions_ on https://app.gathergrove.club (the CRM
 * enforces an origin allowlist). On localhost:3050 the widget fetch no-ops,
 * we only assert that the loader script tag is present in the DOM with the
 * correct data-product attribute. We do NOT assert ingest HTTP 200.
 *
 * Local env: set NEXT_PUBLIC_CRM_WIDGET_KEY=wk_LOCALTESTPLACEHOLDER00000000000000
 * in client/.env.local before running this spec.
 */

import { test, expect } from "@playwright/test";

test.describe("CRM-FEEDBACK loader script mounts on authenticated surface", () => {
  test("CRM-FEEDBACK-01: script[data-widget=feedback-button] is present after login on /admin/dashboard", async ({
    page,
  }) => {
    // Storage state (admin auth) is injected by the playwright project config.
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // The loader script may inject asynchronously via afterInteractive strategy.
    // Poll the DOM for up to 10 s before failing.
    await expect
      .poll(
        async () => {
          return page.evaluate(() => {
            const els = document.querySelectorAll(
              'script[data-widget="feedback-button"]'
            );
            return els.length > 0;
          });
        },
        { timeout: 10000, message: "CRM loader script not found in DOM" }
      )
      .toBe(true);

    // Verify data-product is a non-empty string (the env key).
    const dataProduct = await page.evaluate(() => {
      const el = document.querySelector<HTMLScriptElement>(
        'script[data-widget="feedback-button"]'
      );
      return el?.dataset.product ?? null;
    });
    expect(dataProduct).toBeTruthy();
    expect(dataProduct).not.toBe("");
  });

  test("CRM-FEEDBACK-02: loader script src points to widgets.ventoralabs.com", async ({
    page,
  }) => {
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("domcontentloaded");

    await expect
      .poll(
        async () => {
          return page.evaluate(() => {
            const el = document.querySelector<HTMLScriptElement>(
              'script[data-widget="feedback-button"]'
            );
            return el?.src ?? null;
          });
        },
        { timeout: 10000 }
      )
      .toMatch(/widgets\.ventoralabs\.com\/w\/v1\.js/);
  });
});
