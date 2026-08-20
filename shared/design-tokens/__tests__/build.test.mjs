/**
 * Design Token Build Pipeline Tests
 *
 * TDD: These tests define the expected behavior of:
 *  1. Transform functions (css-hsl, rn-shadow, csharp)
 *  2. Generated output files (existence + content)
 *  3. Cross-platform consistency
 *
 * Run: node --test shared/design-tokens/__tests__/build.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const TOKENS_DIR = path.resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// Transform unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe('css-hsl transform', async () => {
  const { hexToHsl, hslTriplet } = await import('../transforms/css-hsl.mjs');

  test('converts primary-500 hex to HSL triplet', () => {
    // #4a9a72 → hsl(150, 35%, 45%)
    const result = hexToHsl('#4a9a72');
    assert.equal(result, '150 35% 45%');
  });

  test('converts white to HSL triplet', () => {
    assert.equal(hexToHsl('#ffffff'), '0 0% 100%');
  });

  test('converts black to HSL triplet', () => {
    assert.equal(hexToHsl('#000000'), '0 0% 0%');
  });

  test('converts pure red to HSL triplet', () => {
    assert.equal(hexToHsl('#ff0000'), '0 100% 50%');
  });

  test('converts pure green to HSL triplet', () => {
    assert.equal(hexToHsl('#00ff00'), '120 100% 50%');
  });

  test('converts pure blue to HSL triplet', () => {
    assert.equal(hexToHsl('#0000ff'), '240 100% 50%');
  });

  test('converts neutral-500 hex', () => {
    // #6b7d75 → approximately hsl(150-155, ~8%, ~45%)  — green-tinted neutral
    const result = hexToHsl('#6b7d75');
    const [h, s, l] = result.split(' ');
    assert.ok(parseInt(h) >= 140 && parseInt(h) <= 160, `Expected H in green range, got ${h}`);
    assert.ok(parseInt(l) >= 43 && parseInt(l) <= 48, `Expected L≈46%, got ${l}`);
  });

  test('converts semantic error hex', () => {
    // #ef4444 → hsl(0, 84%, 60%)
    const result = hexToHsl('#ef4444');
    const [h] = result.split(' ');
    assert.equal(parseInt(h), 0);
  });

  test('hslTriplet formats H S% L% correctly', () => {
    assert.equal(hslTriplet(150, 35, 45), '150 35% 45%');
    assert.equal(hslTriplet(0, 0, 100), '0 0% 100%');
  });
});

describe('rn-shadow transform', async () => {
  const { abstractShadowToRN } = await import('../transforms/rn-shadow.mjs');

  test('converts xs shadow to React Native format', () => {
    const input = {
      offsetX: 0, offsetY: 1, blur: 2, spread: 0,
      color: '#19241e', opacity: 0.05, elevation: 1,
    };
    const result = abstractShadowToRN(input);
    assert.deepEqual(result, {
      shadowColor: '#19241e',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    });
  });

  test('converts md shadow to React Native format', () => {
    const input = {
      offsetX: 0, offsetY: 4, blur: 6, spread: 0,
      color: '#19241e', opacity: 0.15, elevation: 4,
    };
    const result = abstractShadowToRN(input);
    assert.equal(result.shadowRadius, 6);
    assert.equal(result.elevation, 4);
    assert.deepEqual(result.shadowOffset, { width: 0, height: 4 });
  });

  test('handles zero / none shadow', () => {
    const input = {
      offsetX: 0, offsetY: 0, blur: 0, spread: 0,
      color: 'transparent', opacity: 0, elevation: 0,
    };
    const result = abstractShadowToRN(input);
    assert.equal(result.shadowOpacity, 0);
    assert.equal(result.elevation, 0);
    assert.equal(result.shadowColor, 'transparent');
  });
});

describe('csharp transform', async () => {
  const { toCSharpIdentifier } = await import('../transforms/csharp.mjs');

  test('converts brand primary path to PascalCase identifier', () => {
    assert.equal(
      toCSharpIdentifier(['brand', 'primary', '500']),
      'BrandPrimary500',
    );
  });

  test('converts semantic success path', () => {
    assert.equal(
      toCSharpIdentifier(['semantic', 'success', 'light']),
      'SemanticSuccessLight',
    );
  });

  test('capitalizes each segment', () => {
    assert.equal(
      toCSharpIdentifier(['neutral', '50']),
      'Neutral50',
    );
  });

  test('handles single segment', () => {
    assert.equal(toCSharpIdentifier(['star']), 'Star');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Generated file existence tests
// ─────────────────────────────────────────────────────────────────────────────

describe('generated files exist after build', () => {
  const cssFile = path.join(ROOT, 'client/src/generated/tokens.css');
  const tsWebFile = path.join(ROOT, 'client/src/generated/tokens.ts');
  const tsMobileFile = path.join(ROOT, 'mobile/src/generated/tokens.ts');
  const csharpFile = path.join(ROOT, 'backend/src/GatherGrove.Application/Generated/DesignTokens.cs');

  test('CSS file exists', () => {
    assert.ok(existsSync(cssFile), `Expected ${cssFile} to exist. Run: npm run tokens:build`);
  });

  test('TypeScript web file exists', () => {
    assert.ok(existsSync(tsWebFile), `Expected ${tsWebFile} to exist. Run: npm run tokens:build`);
  });

  test('TypeScript mobile file exists', () => {
    assert.ok(existsSync(tsMobileFile), `Expected ${tsMobileFile} to exist. Run: npm run tokens:build`);
  });

  test('C# file exists', () => {
    assert.ok(existsSync(csharpFile), `Expected ${csharpFile} to exist. Run: npm run tokens:build`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Generated CSS content tests
// ─────────────────────────────────────────────────────────────────────────────

describe('generated CSS content', async () => {
  const cssFile = path.join(ROOT, 'client/src/generated/tokens.css');

  let content = '';
  try {
    content = await readFile(cssFile, 'utf-8');
  } catch {
    // File doesn't exist yet — tests will fail below with helpful message
  }

  test('contains :root block', () => {
    assert.ok(content.length > 0, 'CSS file is empty or missing — run npm run tokens:build');
    assert.match(content, /:root\s*\{/);
  });

  test('does not emit a separate light class block', () => {
    assert.doesNotMatch(content, /\.light\s*\{/);
  });

  test('contains auto-generated header comment', () => {
    assert.match(content, /auto-generated/i);
  });

  test('primary CSS var uses HSL triplet format (no hsl() wrapper)', () => {
    // Must be: --primary: 150 35% 45%;
    // Must NOT be: --primary: hsl(150, 35%, 45%);
    assert.match(content, /--primary:\s*\d+\s+\d+%\s+\d+%/);
    assert.doesNotMatch(content, /--primary:\s*hsl\(/);
  });

  test('contains border radius vars', () => {
    assert.match(content, /--radius:/);
    assert.match(content, /--radius-sm:/);
    assert.match(content, /--radius-lg:/);
  });

  test('contains shadow vars', () => {
    assert.match(content, /--shadow-xs:/);
    assert.match(content, /--shadow-md:/);
  });

  test('contains typography vars', () => {
    assert.match(content, /--text-sm:/);
    assert.match(content, /--text-base:/);
  });

  test('contains accessibility vars', () => {
    assert.match(content, /--focus-ring-width:/);
    assert.match(content, /--min-touch-target:/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Generated TypeScript web content tests
// ─────────────────────────────────────────────────────────────────────────────

describe('generated TypeScript web content', async () => {
  const tsFile = path.join(ROOT, 'client/src/generated/tokens.ts');

  let content = '';
  try {
    content = await readFile(tsFile, 'utf-8');
  } catch { /* missing */ }

  test('exports tokens object', () => {
    assert.match(content, /export const tokens/);
  });

  test('has TypeScript as const assertion', () => {
    assert.match(content, /as const/);
  });

  test('exports Tokens type', () => {
    assert.match(content, /export type Tokens/);
  });

  test('contains color tokens with HSL triplets', () => {
    // JSON.stringify uses double quotes; accept either style
    assert.match(content, /["']\d+ \d+% \d+%["']/);
  });

  test('contains radius tokens', () => {
    assert.match(content, /radius/);
  });

  test('contains spacing tokens', () => {
    assert.match(content, /spacing/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Generated TypeScript mobile content tests
// ─────────────────────────────────────────────────────────────────────────────

describe('generated TypeScript mobile content', async () => {
  const tsFile = path.join(ROOT, 'mobile/src/generated/tokens.ts');

  let content = '';
  try {
    content = await readFile(tsFile, 'utf-8');
  } catch { /* missing */ }

  test('exports tokens object', () => {
    assert.match(content, /export const tokens/);
  });

  test('contains hex color values', () => {
    // JSON.stringify uses double quotes; accept either style
    assert.match(content, /["']#[0-9a-fA-F]{6}["']/);
  });

  test('contains numeric spacing values (not rem)', () => {
    // Mobile spacing should be numeric px, not rem strings
    assert.match(content, /spacing.*:\s*\d+/s);
  });

  test('contains shadow objects', () => {
    assert.match(content, /shadowColor/);
    assert.match(content, /shadowRadius/);
    assert.match(content, /elevation/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Generated C# content tests
// ─────────────────────────────────────────────────────────────────────────────

describe('generated C# content', async () => {
  const csFile = path.join(ROOT, 'backend/src/GatherGrove.Application/Generated/DesignTokens.cs');

  let content = '';
  try {
    content = await readFile(csFile, 'utf-8');
  } catch { /* missing */ }

  test('contains correct namespace', () => {
    assert.match(content, /namespace GatherGrove\.Application\.Generated/);
  });

  test('contains static DesignTokens class', () => {
    assert.match(content, /public static class DesignTokens/);
  });

  test('contains Colors inner class', () => {
    assert.match(content, /public static class Colors/);
  });

  test('contains auto-generated comment', () => {
    assert.match(content, /<auto-generated>/);
  });

  test('primary color is hex format', () => {
    assert.match(content, /Primary500\s*=\s*"#[0-9a-fA-F]{6}"/);
  });

  test('neutral color constant exists', () => {
    assert.match(content, /Neutral500/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-platform consistency
// ─────────────────────────────────────────────────────────────────────────────

describe('cross-platform consistency', async () => {
  test('primary-500 hex is the same in colors.json and mobile tokens', async () => {
    const colorsPath = path.join(TOKENS_DIR, 'colors.json');
    const mobilePath = path.join(ROOT, 'mobile/src/generated/tokens.ts');

    if (!existsSync(mobilePath)) return;

    const colors = JSON.parse(await readFile(colorsPath, 'utf-8'));
    const primary500 = colors.brand.primary['500'].value;

    const mobileContent = await readFile(mobilePath, 'utf-8');
    assert.ok(
      mobileContent.includes(primary500),
      `Mobile tokens must include primary-500 hex ${primary500}`,
    );
  });

  test('primary-500 hex matches between C# and colors.json', async () => {
    const colorsPath = path.join(TOKENS_DIR, 'colors.json');
    const csPath = path.join(ROOT, 'backend/src/GatherGrove.Application/Generated/DesignTokens.cs');

    if (!existsSync(csPath)) return;

    const colors = JSON.parse(await readFile(colorsPath, 'utf-8'));
    const primary500 = colors.brand.primary['500'].value;

    const csContent = await readFile(csPath, 'utf-8');
    assert.ok(
      csContent.includes(primary500),
      `C# DesignTokens must include primary-500 hex ${primary500}`,
    );
  });
});
