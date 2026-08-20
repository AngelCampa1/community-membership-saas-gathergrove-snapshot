#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

const ignoredDirectories = new Set([
  '.git',
  '.next',
  '.playwright-mcp',
  '.worktrees',
  'bin',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'obj',
  'out',
]);

const ignoredExtensions = new Set([
  '.avif',
  '.bmp',
  '.dll',
  '.eot',
  '.exe',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.lcov',
  '.mov',
  '.mp4',
  '.pdf',
  '.png',
  '.pdb',
  '.sqlite',
  '.sqlite3',
  '.ttf',
  '.webp',
  '.woff',
  '.woff2',
  '.zip',
]);

const findings = [];

const patterns = [
  {
    name: 'Google service account private key',
    regex: /"type"\s*:\s*"service_account"[\s\S]{0,2000}"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----/,
  },
  {
    name: 'PEM private key',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/,
  },
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(repoRoot, fullPath).replaceAll(path.sep, '/');

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await walk(fullPath);
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (relativePath === 'scripts/security/scan-secrets.mjs') {
      continue;
    }

    if (ignoredExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    const fileStat = await stat(fullPath);
    if (fileStat.size > 2 * 1024 * 1024) {
      continue;
    }

    const content = await readFile(fullPath, 'utf8').catch(() => null);
    if (content === null) {
      continue;
    }

    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        findings.push(`${relativePath}: ${pattern.name}`);
      }
    }
  }
}

await walk(repoRoot);

if (findings.length > 0) {
  console.error('Secret scan failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log('Secret scan passed: no private key material detected.');
