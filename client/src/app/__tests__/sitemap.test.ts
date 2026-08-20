import { GET } from '../sitemap.xml/route'
import { generateSitemapEntries } from '../sitemap.xml/sitemap-data'
import fs from 'fs'
import path from 'path'
import { GLOSSARY_LAST_UPDATED, HOW_TO_START_LAST_UPDATED } from '@/lib/site-config'
import {
  RETAINED_CLUB_TYPE_SLUGS,
  RETAINED_GLOSSARY_SLUGS,
  RETAINED_HOW_TO_START_SLUGS,
  RETAINED_ALTERNATIVE_SLUGS,
} from '@/lib/seo-content-config'

describe('sitemap route handler', () => {
  function discoverStaticMarketingRoutes(): string[] {
    const appDir = path.join(process.cwd(), 'src', 'app')
    const routes: string[] = []
    const excludedTopLevelSegments = new Set([
      'activate-account',
      'admin',
      'api',
      'app',
      'events',
      'forgot-password',
      'login',
      'payment',
    ])

    function walk(dir: string, segments: string[]): void {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('_') || entry.name === '__tests__') continue

        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name.startsWith('(') || entry.name.includes('[') || entry.name.includes('.')) continue
          if (segments.length === 0 && excludedTopLevelSegments.has(entry.name)) continue
          walk(fullPath, [...segments, entry.name])
          continue
        }

        if (entry.name !== 'page.tsx') continue
        const route = segments.length === 0 ? '' : `/${segments.join('/')}`
        routes.push(route)
      }
    }

    walk(appDir, [])
    return routes.sort()
  }

  describe('HTTP response', () => {
    it('returns 200 OK', () => {
      const response = GET()
      expect(response.status).toBe(200)
    })

    it('sets Content-Type to application/xml', () => {
      const response = GET()
      expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8')
    })

    it('sets Cache-Control with CDN caching', () => {
      const response = GET()
      const cc = response.headers.get('Cache-Control')
      expect(cc).toContain('public')
      expect(cc).toContain('s-maxage=86400')
    })

    it('does not set X-Robots-Tag (would suppress sitemap processing)', () => {
      const response = GET()
      expect(response.headers.get('X-Robots-Tag')).toBeNull()
    })

    it('does not set RSC Vary headers', () => {
      const response = GET()
      const vary = response.headers.get('Vary')
      expect(vary ?? '').not.toContain('rsc')
      expect(vary ?? '').not.toContain('next-router')
    })

    it('returns valid XML with urlset root element', async () => {
      const response = GET()
      const text = await response.text()
      expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
      expect(text).toContain('</urlset>')
    })
  })

  describe('sitemap entries', () => {
    let entries: ReturnType<typeof generateSitemapEntries>

    beforeAll(() => {
      entries = generateSitemapEntries()
    })

    it('returns an array of URL entries', () => {
      expect(Array.isArray(entries)).toBe(true)
      expect(entries.length).toBeGreaterThanOrEqual(20)
    })

    it('every entry has url, lastModified, changeFrequency, and priority', () => {
      for (const entry of entries) {
        expect(entry.url).toBeDefined()
        expect(entry.lastModified).toBeDefined()
        expect(entry.changeFrequency).toBeDefined()
        expect(entry.priority).toBeDefined()
      }
    })

    describe('static pages', () => {
      it('includes homepage with highest priority', () => {
        const homepage = entries.find((e) => e.url === 'https://www.gathergrove.club')
        expect(homepage).toBeDefined()
        expect(homepage!.priority).toBe(1.0)
      })

      it('includes pricing page with high priority', () => {
        const pricing = entries.find((e) => e.url.endsWith('/pricing'))
        expect(pricing).toBeDefined()
        expect(pricing!.priority).toBe(0.9)
      })

      it('includes about page', () => {
        expect(entries.some((e) => e.url.endsWith('/about'))).toBe(true)
      })

      it('includes FAQ page', () => {
        expect(entries.some((e) => e.url.endsWith('/faq'))).toBe(true)
      })

      it('includes support page', () => {
        expect(entries.some((e) => e.url.endsWith('/support'))).toBe(true)
      })

      it('includes legal pages', () => {
        expect(entries.some((e) => e.url.endsWith('/privacy-policy'))).toBe(true)
        expect(entries.some((e) => e.url.endsWith('/terms-of-service'))).toBe(true)
      })

      it('excludes auth pages except register (indexed for discoverability)', () => {
        expect(entries.some((e) => e.url.endsWith('/login'))).toBe(false)
        expect(entries.some((e) => e.url.endsWith('/register'))).toBe(true)
        expect(entries.some((e) => e.url.endsWith('/forgot-password'))).toBe(false)
      })
    })

    describe('resource pages', () => {
      it('includes resources hub', () => {
        expect(entries.some((e) => e.url === 'https://www.gathergrove.club/resources')).toBe(true)
      })

      it('includes individual resource pages', () => {
        expect(entries.some((e) => e.url.includes('/resources/complete-guide-club-management'))).toBe(true)
        expect(entries.some((e) => e.url.includes('/resources/member-retention-strategies'))).toBe(true)
        expect(entries.some((e) => e.url.includes('/resources/event-planning-mastery'))).toBe(true)
      })

      it('includes more than 5 resource pages', () => {
        const resourcePages = entries.filter((e) => /\/resources\/[a-z-]+$/.test(e.url))
        expect(resourcePages.length).toBeGreaterThan(5)
      })
    })

    describe('hub pages', () => {
      it('includes /for hub page', () => {
        expect(entries.some((e) => e.url === 'https://www.gathergrove.club/for')).toBe(true)
      })

      it('includes /features hub page', () => {
        expect(entries.some((e) => e.url === 'https://www.gathergrove.club/features')).toBe(true)
      })

      it('includes only retained club type pages', () => {
        const forPages = entries.filter((e) => /\/for\/[a-z-]+$/.test(e.url))
        expect(forPages).toHaveLength(RETAINED_CLUB_TYPE_SLUGS.length)
        expect(entries.some((e) => e.url.endsWith('/for/book-clubs'))).toBe(true)
        expect(entries.some((e) => e.url.endsWith('/for/kiwanis-clubs'))).toBe(false)
      })

      it('includes feature pages', () => {
        const featurePages = entries.filter((e) => /\/features\/[a-z-]+$/.test(e.url))
        expect(featurePages.length).toBeGreaterThanOrEqual(8)
      })
    })

    describe('glossary pages', () => {
      it('includes glossary hub', () => {
        expect(entries.some((e) => e.url === 'https://www.gathergrove.club/glossary')).toBe(true)
      })

      it('includes only retained glossary pages', () => {
        const glossaryPages = entries.filter((e) => /\/glossary\/[a-z-]+$/.test(e.url))
        expect(glossaryPages).toHaveLength(RETAINED_GLOSSARY_SLUGS.length)
        expect(entries.some((e) => e.url.endsWith('/glossary/event-registration'))).toBe(true)
        expect(entries.some((e) => e.url.endsWith('/glossary/501c3'))).toBe(false)
      })
    })

    describe('how-to-start pages', () => {
      it('includes how-to-start hub', () => {
        expect(entries.some((e) => e.url === 'https://www.gathergrove.club/how-to-start')).toBe(true)
      })

      it('includes only retained how-to-start pages', () => {
        const howToPages = entries.filter((e) => /\/how-to-start\/[a-z-]+$/.test(e.url))
        expect(howToPages).toHaveLength(RETAINED_HOW_TO_START_SLUGS.length)
        expect(entries.some((e) => e.url.endsWith('/how-to-start/running-club'))).toBe(true)
        expect(entries.some((e) => e.url.endsWith('/how-to-start/nonprofit-organization'))).toBe(false)
      })
    })

    describe('comparison pages', () => {
      it('includes compare hub', () => {
        expect(entries.some((e) => e.url === 'https://www.gathergrove.club/compare')).toBe(true)
      })

      it('includes individual comparison pages', () => {
        const comparePages = entries.filter((e) => /\/compare\/[a-z-]+$/.test(e.url))
        expect(comparePages.length).toBeGreaterThanOrEqual(4)
      })

      it('excludes retired alternatives from the sitemap', () => {
        const alternativesPages = entries.filter((e) => /\/alternatives\/[a-z-]+$/.test(e.url))
        expect(alternativesPages).toHaveLength(RETAINED_ALTERNATIVE_SLUGS.length)
        expect(entries.some((e) => e.url.endsWith('/alternatives/signupgenius'))).toBe(false)
      })
    })

    describe('template pages', () => {
      it('includes templates hub with priority 0.75', () => {
        const hub = entries.find((e) => e.url === 'https://www.gathergrove.club/templates')
        expect(hub).toBeDefined()
        expect(hub!.priority).toBe(0.75)
      })

      it('includes individual template pages', () => {
        const templatePages = entries.filter((e) => /\/templates\/[a-z-]+$/.test(e.url))
        expect(templatePages.length).toBeGreaterThanOrEqual(6)
      })

      it('includes meeting-minutes-template page', () => {
        expect(entries.some((e) => e.url.includes('/templates/meeting-minutes-template'))).toBe(true)
      })
    })

    describe('volunteer management pages', () => {
      it('includes /volunteer-management with priority 0.8', () => {
        const vm = entries.find((e) => e.url === 'https://www.gathergrove.club/volunteer-management')
        expect(vm).toBeDefined()
        expect(vm!.priority).toBe(0.8)
      })

      it('includes all volunteer management cluster pages with priority 0.75', () => {
        const clusterSlugs = [
          'for-nonprofits',
          'free',
          'scheduling',
          'best-software',
          'hour-tracking',
          'for-schools',
          'for-churches',
          'app',
        ]
        for (const slug of clusterSlugs) {
          const entry = entries.find((e) => e.url === `https://www.gathergrove.club/volunteer-management/${slug}`)
          expect(entry).toBeDefined()
          expect(entry!.priority).toBe(0.75)
        }
      })
    })

    describe('best-X comparison pages', () => {
      it('includes best-membership-management-software with priority 0.75', () => {
        const entry = entries.find((e) => e.url.includes('best-membership-management-software'))
        expect(entry).toBeDefined()
        expect(entry!.priority).toBe(0.75)
      })

      it('includes best-club-management-software with priority 0.75', () => {
        const entry = entries.find((e) => e.url.includes('best-club-management-software'))
        expect(entry).toBeDefined()
        expect(entry!.priority).toBe(0.75)
      })

      it('includes best-event-registration-software with priority 0.75', () => {
        const entry = entries.find((e) => e.url.includes('best-event-registration-software'))
        expect(entry).toBeDefined()
        expect(entry!.priority).toBe(0.75)
      })
    })

    describe('distinct lastModified dates', () => {
      it('glossary pages use GLOSSARY_LAST_UPDATED date', () => {
        const glossaryPage = entries.find((e) => /\/glossary\/[a-z-]+$/.test(e.url))
        expect(glossaryPage).toBeDefined()
        expect(glossaryPage!.lastModified).toBe(GLOSSARY_LAST_UPDATED)
      })

      it('how-to-start pages use HOW_TO_START_LAST_UPDATED date', () => {
        const howToPage = entries.find((e) => /\/how-to-start\/[a-z-]+$/.test(e.url))
        expect(howToPage).toBeDefined()
        expect(howToPage!.lastModified).toBe(HOW_TO_START_LAST_UPDATED)
      })
    })

    describe('all URLs use correct domain', () => {
      it('all entries use www.gathergrove.club', () => {
        for (const entry of entries) {
          expect(entry.url).toContain('https://www.gathergrove.club')
        }
      })
    })

    describe('static marketing route coverage', () => {
      it('includes every static crawlable marketing page in the sitemap', () => {
        const sitemapPaths = new Set(entries.map((entry) => new URL(entry.url).pathname === '/' ? '' : new URL(entry.url).pathname))

        for (const route of discoverStaticMarketingRoutes()) {
          expect(sitemapPaths).toContain(route)
        }
      })
    })

    describe('XML output', () => {
      it('XML contains all entry URLs', async () => {
        const response = GET()
        const xml = await response.text()
        const firstEntry = entries[0]
        expect(xml).toContain(`<loc>${firstEntry.url}</loc>`)
      })

      it('XML contains correct number of url elements', async () => {
        const response = GET()
        const xml = await response.text()
        const urlCount = (xml.match(/<url>/g) || []).length
        expect(urlCount).toBe(entries.length)
      })
    })
  })
})
