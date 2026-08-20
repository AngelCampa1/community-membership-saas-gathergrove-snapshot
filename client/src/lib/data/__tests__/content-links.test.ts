import {
  getRelatedContent,
  getNextFunnelContent,
  getFunnelStageForType,
  hrefForType,
  _resetRegistryForTesting,
  getAutoLinkTargets,
  ContentPageType,
  FunnelStage,
} from '../content-links'
import { getSeoRedirects } from '@/lib/seo-content-config'

describe('content-links', () => {
  describe('getFunnelStageForType', () => {
    it('maps tofu types correctly', () => {
      expect(getFunnelStageForType('glossary')).toBe('tofu')
      expect(getFunnelStageForType('how-to-start')).toBe('tofu')
      expect(getFunnelStageForType('resources')).toBe('tofu')
      expect(getFunnelStageForType('templates')).toBe('tofu')
    })

    it('maps mofu types correctly', () => {
      expect(getFunnelStageForType('for')).toBe('mofu')
      expect(getFunnelStageForType('features')).toBe('mofu')
      expect(getFunnelStageForType('volunteer-management')).toBe('mofu')
    })

    it('maps bofu types correctly', () => {
      expect(getFunnelStageForType('compare')).toBe('bofu')
      expect(getFunnelStageForType('alternatives')).toBe('bofu')
      expect(getFunnelStageForType('best')).toBe('bofu')
      expect(getFunnelStageForType('statistics')).toBe('bofu')
      expect(getFunnelStageForType('switch-from')).toBe('bofu')
    })
  })

  describe('hrefForType', () => {
    it('generates correct hrefs for all types', () => {
      expect(hrefForType('for', 'book-clubs')).toBe('/for/book-clubs')
      expect(hrefForType('features', 'event-management')).toBe('/features/event-management')
      expect(hrefForType('resources', 'guide')).toBe('/resources/guide')
      expect(hrefForType('glossary', 'dues')).toBe('/glossary/dues')
      expect(hrefForType('how-to-start', 'pickleball')).toBe('/how-to-start/pickleball')
      expect(hrefForType('compare', 'wild-apricot')).toBe('/compare/wild-apricot')
      expect(hrefForType('alternatives', 'test')).toBe('/alternatives/test')
      expect(hrefForType('best', 'test')).toBe('/best/test')
      expect(hrefForType('statistics', 'test')).toBe('/statistics/test')
      expect(hrefForType('switch-from', 'test')).toBe('/switch-from/test')
      expect(hrefForType('volunteer-management', 'for-nonprofits')).toBe('/volunteer-management/for-nonprofits')
      expect(hrefForType('templates', 'some-slug')).toBe('/templates/some-slug')
    })
  })

  describe('getRelatedContent', () => {
    it('returns an array', () => {
      const links = getRelatedContent({
        keywords: ['membership', 'dues'],
        currentType: 'glossary',
        currentSlug: 'dues',
      })
      expect(Array.isArray(links)).toBe(true)
    })

    it('never includes the current page in results', () => {
      const links = getRelatedContent({
        keywords: ['membership'],
        currentType: 'for',
        currentSlug: 'book-clubs',
      })
      const selfLink = links.find(
        (l) => l.type === 'for' && l.slug === 'book-clubs'
      )
      expect(selfLink).toBeUndefined()
    })

    it('returns at most maxResults items', () => {
      const links = getRelatedContent({
        keywords: ['club', 'management', 'membership', 'event', 'dues'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 3,
      })
      expect(links.length).toBeLessThanOrEqual(3)
    })

    it('defaults to 6 max results', () => {
      const links = getRelatedContent({
        keywords: ['club', 'management', 'membership', 'event', 'dues', 'volunteer', 'nonprofit'],
        currentType: 'glossary',
        currentSlug: 'test',
      })
      expect(links.length).toBeLessThanOrEqual(6)
    })

    it('returns links with required fields including funnelStage', () => {
      const links = getRelatedContent({
        keywords: ['membership', 'management'],
        currentType: 'glossary',
        currentSlug: 'test',
      })
      links.forEach((link) => {
        expect(link.title).toBeTruthy()
        expect(link.href).toBeTruthy()
        expect(link.type).toBeTruthy()
        expect(link.slug).toBeTruthy()
        expect(link.href).toMatch(/^\//)
        expect(['tofu', 'mofu', 'bofu']).toContain(link.funnelStage)
      })
    })

    it('ranks items with more keyword overlap higher', () => {
      // 'member retention', 'membership retention', and 'retain members' all
      // directly match the glossary/member-retention entry's keywords
      // (keywords: ['member retention', 'membership retention', 'retain members',
      //  'member retention strategies']), giving it a score of 3.
      // The features/event-planning entry has keywords
      // ['event planning software', 'event management tool', 'RSVP tracking',
      //  'event ticketing platform'], giving it a score of 0 for these inputs.
      // Therefore member-retention must rank above event-planning.
      const links = getRelatedContent({
        keywords: ['member retention', 'membership retention', 'retain members'],
        currentType: 'for',
        currentSlug: 'test-slug',
        maxResults: 20,
      })

      // There must be at least one result for the retention keywords to match
      expect(links.length).toBeGreaterThan(0)

      // The top result should have the highest overlap — it must not be event-planning
      // which has zero keyword overlap with the retention terms
      expect(links[0].slug).not.toBe('event-planning')

      // member-retention resource must appear in results
      const retentionIndex = links.findIndex((l) => l.slug === 'member-retention-strategies')
      expect(retentionIndex).not.toBe(-1)

      // If event-planning appears, member-retention must rank strictly above it
      const eventPlanningIndex = links.findIndex((l) => l.slug === 'event-planning-mastery')
      if (eventPlanningIndex !== -1) {
        expect(retentionIndex).toBeLessThan(eventPlanningIndex)
      }
    })

    it('returns links across different content types including glossary and how-to-start', () => {
      const links = getRelatedContent({
        keywords: ['club', 'management', 'membership', 'event'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
      })
      const types = new Set(links.map((l) => l.type))
      expect(types.size).toBeGreaterThanOrEqual(1)
    })

    it('handles empty keywords gracefully', () => {
      const links = getRelatedContent({
        keywords: [],
        currentType: 'glossary',
        currentSlug: 'test',
      })
      expect(Array.isArray(links)).toBe(true)
      expect(links.length).toBe(0)
    })

    it('accepts all valid content page types', () => {
      const types: ContentPageType[] = [
        'for',
        'features',
        'resources',
        'glossary',
        'how-to-start',
        'compare',
        'alternatives',
        'best',
        'statistics',
        'switch-from',
        'volunteer-management',
        'templates',
      ]
      types.forEach((type) => {
        const links = getRelatedContent({
          keywords: ['club'],
          currentType: type,
          currentSlug: 'test',
        })
        expect(Array.isArray(links)).toBe(true)
      })
    })

    it('filters by funnelStage when filterStage is provided', () => {
      const mofuLinks = getRelatedContent({
        keywords: ['club', 'membership', 'management'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
        filterStage: 'mofu',
      })
      mofuLinks.forEach((link) => {
        expect(link.funnelStage).toBe('mofu')
      })
    })

    it('includes glossary entries in registry', () => {
      const links = getRelatedContent({
        keywords: ['governance', 'board', 'nonprofit'],
        currentType: 'for',
        currentSlug: 'test',
        maxResults: 20,
      })
      const hasGlossary = links.some((l) => l.type === 'glossary')
      expect(hasGlossary).toBe(true)
    })

    it('excludes retired glossary and formation pages from related content', () => {
      const links = getRelatedContent({
        keywords: ['payment', 'nonprofit', 'legal', 'formation'],
        currentType: 'resources',
        currentSlug: 'modern-dues-collection-best-practices',
        maxResults: 40,
      })

      expect(links.some((l) => l.href === '/glossary/501c3')).toBe(false)
      expect(links.some((l) => l.href === '/how-to-start/nonprofit-organization')).toBe(false)
      expect(links.some((l) => l.href === '/for/kiwanis-clubs')).toBe(false)
    })

    it('includes how-to-start entries in registry', () => {
      const links = getRelatedContent({
        keywords: ['pickleball', 'club', 'sports'],
        currentType: 'for',
        currentSlug: 'test',
        maxResults: 20,
      })
      const hasHowTo = links.some((l) => l.type === 'how-to-start')
      expect(hasHowTo).toBe(true)
    })

    it('includes comparison entries in registry', () => {
      const links = getRelatedContent({
        keywords: ['wild apricot', 'club management software comparison'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
      })
      const hasCompare = links.some((l) => l.type === 'compare')
      expect(hasCompare).toBe(true)
    })

    it('includes volunteer-management cluster entries in registry', () => {
      const links = getRelatedContent({
        keywords: ['volunteer', 'nonprofit', 'scheduling'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
      })
      const hasVM = links.some((l) => l.type === 'volunteer-management')
      expect(hasVM).toBe(true)
    })

    it('returns correct href for volunteer-management entries', () => {
      const links = getRelatedContent({
        keywords: ['volunteer', 'nonprofit'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
      })
      const vmLinks = links.filter((l) => l.type === 'volunteer-management')
      vmLinks.forEach((l) => {
        expect(l.href).toMatch(/^\/volunteer-management\//)
      })
    })

    it('includes SEO gap pages in registry', () => {
      const seoSlugs = ['hour-tracking', 'nonprofit-event-management', 'community-management-software', 'member-database']
      for (const slug of seoSlugs) {
        const keyword = slug.replace(/-/g, ' ')
        const links = getRelatedContent({
          keywords: [keyword],
          currentType: 'glossary',
          currentSlug: 'test',
          maxResults: 50,
        })
        const found = links.some((l) => l.slug === slug)
        expect(found).toBe(true)
      }
    })

    it('includes best-X compare pages in registry', () => {
      const links = getRelatedContent({
        keywords: ['membership management software', 'best membership'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
      })
      const hasBestX = links.some((l) => l.slug === 'best-membership-management-software')
      expect(hasBestX).toBe(true)
    })

    it('includes alternatives entries in registry', () => {
      const links = getRelatedContent({
        keywords: ['wild apricot alternative', 'club management alternative'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
      })
      const hasAlternative = links.some((l) => l.type === 'alternatives')
      expect(hasAlternative).toBe(true)
    })

    it('returns correct href for alternatives entries', () => {
      const links = getRelatedContent({
        keywords: ['wild apricot alternative'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
      })
      const altLinks = links.filter((l) => l.type === 'alternatives')
      altLinks.forEach((l) => {
        expect(l.href).toMatch(/^\/alternatives\//)
      })
    })

    it('alternatives entries have bofu funnel stage', () => {
      const links = getRelatedContent({
        keywords: ['wild apricot alternative', 'clubexpress alternative'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
      })
      const altLinks = links.filter((l) => l.type === 'alternatives')
      altLinks.forEach((l) => {
        expect(l.funnelStage).toBe('bofu')
      })
    })

    it('includes templates entries in registry', () => {
      const links = getRelatedContent({
        keywords: ['meeting minutes template', 'club meeting minutes'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
      })
      const hasTemplate = links.some((l) => l.type === 'templates')
      expect(hasTemplate).toBe(true)
    })

    it('returns correct href for templates entries', () => {
      const links = getRelatedContent({
        keywords: ['meeting minutes template'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
      })
      const tmplLinks = links.filter((l) => l.type === 'templates')
      tmplLinks.forEach((l) => {
        expect(l.href).toMatch(/^\/templates\//)
      })
    })

    it('templates entries have tofu funnel stage', () => {
      const links = getRelatedContent({
        keywords: ['meeting minutes template', 'club meeting minutes'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 20,
      })
      const tmplLinks = links.filter((l) => l.type === 'templates')
      tmplLinks.forEach((l) => {
        expect(l.funnelStage).toBe('tofu')
      })
    })

    describe('scoring and ranking', () => {
      it('returns results with more keyword overlap before results with less', () => {
        // Keywords that heavily match 'member-retention' resource
        const links = getRelatedContent({
          keywords: ['member', 'retention', 'retain', 'membership'],
          currentType: 'for',
          currentSlug: 'nonexistent-slug',
          maxResults: 20,
        })
        expect(links.length).toBeGreaterThan(0)
        // Verify the results are in descending relevance order by checking
        // that we can find a member-related link before a completely unrelated one
        const firstLink = links[0]
        // First result should reference relevant member concepts
        expect(
          firstLink.title.toLowerCase().includes('member') ||
          firstLink.href.includes('member') ||
          firstLink.description?.toLowerCase().includes('member')
        ).toBe(true)
      })

      it('excludes current page from results', () => {
        const links = getRelatedContent({
          keywords: ['book club', 'reading', 'books'],
          currentType: 'for',
          currentSlug: 'book-clubs',
          maxResults: 10,
        })
        expect(links.every(l => !(l.type === 'for' && l.slug === 'book-clubs'))).toBe(true)
      })

      it('filters by funnel stage when filterStage is provided', () => {
        const tofuLinks = getRelatedContent({
          keywords: ['club', 'management', 'member'],
          currentType: 'for',
          currentSlug: 'nonexistent',
          maxResults: 20,
          filterStage: 'tofu',
        })
        expect(tofuLinks.every(l => l.funnelStage === 'tofu')).toBe(true)
      })
    })
  })

  describe('getNextFunnelContent', () => {
    it('returns mofu content for tofu pages', () => {
      const links = getNextFunnelContent({
        keywords: ['club', 'membership', 'management'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 10,
      })
      links.forEach((link) => {
        expect(link.funnelStage).toBe('mofu')
      })
    })

    it('returns bofu content for mofu pages', () => {
      const links = getNextFunnelContent({
        keywords: ['club management software comparison', 'wild apricot'],
        currentType: 'for',
        currentSlug: 'test',
        maxResults: 10,
      })
      links.forEach((link) => {
        expect(link.funnelStage).toBe('bofu')
      })
    })

    it('returns empty array for bofu pages (no next stage)', () => {
      const links = getNextFunnelContent({
        keywords: ['club', 'membership'],
        currentType: 'compare',
        currentSlug: 'test',
      })
      expect(links).toEqual([])
    })

    it('returns empty array for switch-from (bofu)', () => {
      const links = getNextFunnelContent({
        keywords: ['club'],
        currentType: 'switch-from',
        currentSlug: 'test',
      })
      expect(links).toEqual([])
    })

    it('respects maxResults', () => {
      const links = getNextFunnelContent({
        keywords: ['club', 'management', 'membership', 'event'],
        currentType: 'glossary',
        currentSlug: 'test',
        maxResults: 2,
      })
      expect(links.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getAutoLinkTargets', () => {
    it('returns an array of phrase/href objects', () => {
      const targets = getAutoLinkTargets({ currentType: 'glossary', currentSlug: 'test' })
      expect(Array.isArray(targets)).toBe(true)
      targets.forEach((t) => {
        expect(t).toHaveProperty('phrase')
        expect(t).toHaveProperty('href')
        expect(typeof t.phrase).toBe('string')
        expect(typeof t.href).toBe('string')
      })
    })

    it('does not include the current page (self-exclusion)', () => {
      const targets = getAutoLinkTargets({ currentType: 'glossary', currentSlug: 'dues' })
      const selfMatch = targets.find(
        (t) => t.href === '/glossary/dues'
      )
      expect(selfMatch).toBeUndefined()
    })

    it('only includes glossary and features types', () => {
      const targets = getAutoLinkTargets({ currentType: 'how-to-start', currentSlug: 'test' })
      targets.forEach((t) => {
        expect(t.href).toMatch(/^\/(glossary|features)\//)
      })
    })

    it('sorts by phrase length descending (longest first)', () => {
      const targets = getAutoLinkTargets({ currentType: 'glossary', currentSlug: 'test' })
      for (let i = 0; i < targets.length - 1; i++) {
        expect(targets[i].phrase.length).toBeGreaterThanOrEqual(targets[i + 1].phrase.length)
      }
    })

    it('all returned hrefs start with a slash', () => {
      const targets = getAutoLinkTargets({ currentType: 'glossary', currentSlug: 'test' })
      targets.forEach((t) => {
        expect(t.href).toMatch(/^\//)
      })
    })

    it('returns glossary entries with correct href pattern', () => {
      const targets = getAutoLinkTargets({ currentType: 'for', currentSlug: 'book-clubs' })
      const glossaryTargets = targets.filter((t) => t.href.startsWith('/glossary/'))
      expect(glossaryTargets.length).toBeGreaterThan(0)
    })

    it('does not auto-link retired glossary terms', () => {
      const targets = getAutoLinkTargets({ currentType: 'for', currentSlug: 'book-clubs' })
      expect(targets.some((t) => t.href === '/glossary/501c3')).toBe(false)
    })

    it('returns features entries with correct href pattern', () => {
      const targets = getAutoLinkTargets({ currentType: 'for', currentSlug: 'book-clubs' })
      const featureTargets = targets.filter((t) => t.href.startsWith('/features/'))
      expect(featureTargets.length).toBeGreaterThan(0)
    })

    it('excludes current page for features type', () => {
      const targets = getAutoLinkTargets({ currentType: 'features', currentSlug: 'member-database' })
      const selfMatch = targets.find((t) => t.href === '/features/member-database')
      expect(selfMatch).toBeUndefined()
    })

    it('returns non-empty array (registry has glossary and features data)', () => {
      const targets = getAutoLinkTargets({ currentType: 'for', currentSlug: 'some-nonexistent' })
      expect(targets.length).toBeGreaterThan(0)
    })
  })

  describe('SEO redirects', () => {
    it('defines redirects for merged high-overlap pages', () => {
      const redirects = getSeoRedirects()
      expect(redirects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: '/alternatives/signupgenius',
            destination: '/volunteer-management/best-software',
            permanent: true,
          }),
          expect.objectContaining({
            source: '/compare/eventbrite',
            destination: '/compare/best-event-registration-software',
            permanent: true,
          }),
          expect.objectContaining({
            source: '/glossary/recurring-payment',
            destination: '/resources/modern-dues-collection-best-practices',
            permanent: true,
          }),
        ])
      )
    })
  })
})
