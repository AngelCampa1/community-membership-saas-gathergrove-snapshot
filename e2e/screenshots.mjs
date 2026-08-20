/**
 * Capture product screenshots for documentation.
 *
 * Prerequisites (see README "Running locally"):
 *   1. docker compose up -d postgres
 *   2. dotnet ef database update
 *   3. pwsh scripts/seed-database.ps1
 *   4. backend running on :8050, client dev server on :3050
 *
 * Usage:
 *   cd e2e && npm run screenshots
 *   SHOT_FILTER=dashboard npm run screenshots   # capture a subset
 *
 * Output: docs/images/
 */

import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'docs', 'images');

// Lives in e2e/ rather than scripts/ because that is where @playwright/test is
// a real dependency - ESM resolves from the script's own directory, not cwd.

const BASE_URL = process.env.SHOT_BASE_URL ?? 'http://localhost:3050';
const FILTER = process.env.SHOT_FILTER ?? '';

// Seeded by scripts/seed-database.ps1 - the Unlimited-tier club has the most data.
const ADMIN_EMAIL = process.env.SHOT_ADMIN_EMAIL ?? 'admin-metro-fitness@test.local';
const ADMIN_PASSWORD = process.env.SHOT_ADMIN_PASSWORD ?? 'TestPassword123!';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** @type {{name:string,path:string,auth:boolean,viewport?:object,fullPage?:boolean,waitFor?:string}[]} */
const SHOTS = [
  // Public marketing
  { name: 'public-homepage', path: '/', auth: false, fullPage: false },
  { name: 'public-pricing', path: '/pricing', auth: false, fullPage: false },
  { name: 'public-homepage-mobile', path: '/', auth: false, viewport: MOBILE, fullPage: false },

  // Admin product surface
  { name: 'admin-dashboard', path: '/admin/dashboard', auth: true },
  { name: 'admin-members', path: '/admin/members', auth: true },
  { name: 'admin-member-segments', path: '/admin/members/segments', auth: true },
  { name: 'admin-events', path: '/admin/events', auth: true },
  { name: 'admin-analytics', path: '/admin/analytics', auth: true },
  { name: 'admin-engagement', path: '/admin/engagement', auth: true },
  { name: 'admin-communications', path: '/admin/communications', auth: true },
  { name: 'admin-email-designer', path: '/admin/communications/email-templates/designer', auth: true },
  { name: 'admin-billing', path: '/admin/billing', auth: true },
  { name: 'admin-branding', path: '/admin/settings/branding', auth: true },
  { name: 'admin-dashboard-mobile', path: '/admin/dashboard', auth: true, viewport: MOBILE },
];

// Text that shows up in a rendered error panel or empty/failure state. A page
// that reaches one of these is not a valid screenshot, even though navigation
// itself succeeded (see the ok:true bug this replaces - screenshots.mjs used
// to report success whenever goto() didn't throw, so an error panel got saved
// and reported as ok).
const ERROR_TEXT_PATTERNS = [
  /failed to load/i,
  /couldn'?t load/i,
  /could not load/i,
  /error loading/i,
  /unable to load/i,
  /something went wrong/i,
  /an unexpected error occurred/i,
];

// A lingering spinner/skeleton is just as invalid a capture as a rendered
// error panel - it means the data fetch never settled in time for the shot.
const LOADING_TEXT_PATTERNS = [/^loading/i, /loading\.\.\.$/i, /loading [a-z]+\.\.\./i];

async function login(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  // The Next.js dev server compiles routes on first request, which can exceed
  // the default 30s locator timeout on a cold start.
  await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 120_000 });
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL(/\/admin\//, { timeout: 30_000 });
    console.log('  authenticated as', ADMIN_EMAIL);
  } catch {
    console.warn('  WARNING: login did not redirect to /admin - authed shots may be blank');
  }
  await page.close();
}

/**
 * Inspect the live page (not the screenshot) for signs the capture is not
 * usable: a rendered error panel, or - for an authenticated shot - having
 * bounced back to /login. Returns a reason string, or null if the page looks
 * fine.
 *
 * The /login bounce is a known false-positive: the app has a client-side bug
 * where an unrelated 401 (from a background request) fires a global
 * "session expired" handler and hard-redirects to /login even though the
 * jwt cookie is still valid. The caller retries in that case since the
 * underlying session is fine; it just needs a second attempt.
 */
async function detectErrorState(page, shot) {
  const currentUrl = page.url();
  if (shot.auth && /\/login(?:$|[/?])/.test(new URL(currentUrl).pathname)) {
    return { reason: `bounced to ${currentUrl} (session-expired false positive)`, retryable: true };
  }

  const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '');
  for (const pattern of ERROR_TEXT_PATTERNS) {
    if (pattern.test(bodyText)) {
      return { reason: `rendered error state matching ${pattern}`, retryable: false };
    }
  }
  for (const pattern of LOADING_TEXT_PATTERNS) {
    if (pattern.test(bodyText.trim())) {
      return { reason: `still showing a loading state ("${bodyText.trim().slice(0, 60)}")`, retryable: true };
    }
  }

  return null;
}

async function capture(context, shot) {
  const url = `${BASE_URL}${shot.path}`;
  const MAX_ATTEMPTS = shot.auth ? 3 : 1;

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const page = await context.newPage();
    if (shot.viewport) await page.setViewportSize(shot.viewport);

    try {
      // Generous timeout: the dev server compiles each route on first request.
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
      // Let client-side data fetches settle; networkidle is unreliable with polling/SignalR.
      await page.waitForTimeout(5000);
      await page.evaluate(() => window.scrollTo(0, 0));

      const errorState = await detectErrorState(page, shot);
      const file = path.join(OUT_DIR, `${shot.name}.png`);
      await page.screenshot({ path: file, fullPage: shot.fullPage ?? false });

      if (!errorState) {
        console.log(`  ok  ${shot.name.padEnd(28)} ${shot.path}`);
        return { ...shot, ok: true };
      }

      lastError = errorState.reason;
      if (errorState.retryable && attempt < MAX_ATTEMPTS) {
        console.warn(`  retry ${shot.name.padEnd(26)} attempt ${attempt}: ${errorState.reason}`);
        continue;
      }

      console.error(`  FAIL ${shot.name.padEnd(28)} ${errorState.reason}`);
      return { ...shot, ok: false, error: errorState.reason };
    } catch (err) {
      lastError = err.message;
      console.error(`  FAIL ${shot.name.padEnd(28)} ${err.message.split('\n')[0]}`);
      return { ...shot, ok: false, error: err.message };
    } finally {
      await page.close();
    }
  }

  return { ...shot, ok: false, error: lastError };
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  const shots = FILTER ? SHOTS.filter((s) => s.name.includes(FILTER)) : SHOTS;
  console.log(`Capturing ${shots.length} screenshots from ${BASE_URL}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2, // retina-quality output for docs
  });

  if (shots.some((s) => s.auth)) await login(context);

  const results = [];
  for (const shot of shots) results.push(await capture(context, shot));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  await writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(
      { capturedAt: new Date().toISOString(), baseUrl: BASE_URL, results },
      null,
      2
    )
  );

  console.log(`\n${results.length - failed.length}/${results.length} captured -> docs/images/`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
