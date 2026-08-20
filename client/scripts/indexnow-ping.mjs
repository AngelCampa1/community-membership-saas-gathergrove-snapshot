/**
 * IndexNow ping script — notifies Bing and Yandex instantly when content updates.
 *
 * Setup (one-time):
 *   1. Generate a key: node -e "console.log(crypto.randomUUID().replace(/-/g,''))"
 *   2. Set INDEXNOW_KEY in client/.env.local (and Cloudflare env vars for production)
 *   3. Run: node scripts/indexnow-ping.mjs
 *
 * The key file at /public/{key}.txt is auto-created by this script if missing.
 * Run this script as part of your post-deploy CI step.
 *
 * @see https://www.indexnow.org/documentation
 */

import { writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.gathergrove.club'
const KEY = process.env.INDEXNOW_KEY

if (!KEY) {
  console.error(
    'Error: INDEXNOW_KEY environment variable is not set.\n' +
    'Generate a key with: node -e "console.log(crypto.randomUUID().replace(/-/g,\'\'))"'
  )
  process.exit(1)
}

// Ensure the key verification file exists at /public/{key}.txt
const keyFilePath = join(__dirname, '..', 'public', `${KEY}.txt`)
if (!existsSync(keyFilePath)) {
  writeFileSync(keyFilePath, KEY, 'utf8')
  console.log(`Created key file: public/${KEY}.txt`)
}

// URLs to submit — all marketing + pSEO pages
const urls = [
  `${SITE_URL}/`,
  `${SITE_URL}/pricing`,
  `${SITE_URL}/features`,
  `${SITE_URL}/about`,
  `${SITE_URL}/resources`,
  `${SITE_URL}/faq`,
  `${SITE_URL}/contact`,
  `${SITE_URL}/sitemap.xml`,
]

const payload = {
  host: new URL(SITE_URL).hostname,
  key: KEY,
  keyLocation: `${SITE_URL}/${KEY}.txt`,
  urlList: urls,
}

async function ping(endpoint) {
  const res = await fetch(`https://${endpoint}/indexnow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  })
  return { endpoint, status: res.status, ok: res.ok }
}

const endpoints = ['api.indexnow.org', 'www.bing.com']

try {
  const results = await Promise.allSettled(endpoints.map(ping))
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { endpoint, status, ok } = result.value
      console.log(`${ok ? '✓' : '✗'} ${endpoint}: HTTP ${status}`)
    } else {
      console.error(`✗ Failed: ${result.reason}`)
    }
  }
} catch (err) {
  console.error('Ping failed:', err.message)
  process.exit(1)
}
