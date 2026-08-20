import { COMPARISONS, getComparisonBySlug, getAllComparisonSlugs } from '../comparisons'

describe('comparisons data', () => {
  it('has at least 4 comparison entries', () => {
    expect(COMPARISONS.length).toBeGreaterThanOrEqual(4)
  })

  it('each entry has required fields', () => {
    for (const comparison of COMPARISONS) {
      expect(comparison.slug).toBeTruthy()
      expect(comparison.competitorName).toBeTruthy()
      expect(comparison.title).toBeTruthy()
      expect(comparison.description).toBeTruthy()
      expect(comparison.metaDescription).toBeTruthy()
      expect(comparison.intro).toBeTruthy()
      expect(comparison.verdict).toBeTruthy()
      expect(comparison.keywords.length).toBeGreaterThan(0)
      expect(comparison.features.length).toBeGreaterThan(0)
      expect(comparison.faq.length).toBeGreaterThan(0)
    }
  })

  it('each feature row has all three columns', () => {
    for (const comparison of COMPARISONS) {
      for (const feature of comparison.features) {
        expect(feature.feature).toBeTruthy()
        expect(feature.gathergrove).toBeTruthy()
        expect(feature.competitor).toBeTruthy()
      }
    }
  })

  it('each FAQ has question and answer', () => {
    for (const comparison of COMPARISONS) {
      for (const faq of comparison.faq) {
        expect(faq.question).toBeTruthy()
        expect(faq.answer).toBeTruthy()
      }
    }
  })

  describe('getComparisonBySlug', () => {
    it('returns a comparison by slug', () => {
      const result = getComparisonBySlug('wild-apricot')
      expect(result).toBeDefined()
      expect(result!.competitorName).toBe('Wild Apricot')
    })

    it('returns undefined for unknown slug', () => {
      const result = getComparisonBySlug('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('getAllComparisonSlugs', () => {
    it('returns all slugs', () => {
      const slugs = getAllComparisonSlugs()
      expect(slugs).toContain('wild-apricot')
      expect(slugs).toContain('clubexpress')
      expect(slugs).toContain('memberplanet')
      expect(slugs).toContain('spreadsheets')
    })

    it('includes teamup comparison', () => {
      const slugs = getAllComparisonSlugs()
      expect(slugs).toContain('teamup')
    })

    it('includes eventbrite comparison', () => {
      const slugs = getAllComparisonSlugs()
      expect(slugs).toContain('eventbrite')
    })
  })

  describe('honesty rule compliance', () => {
    it('does not contain fabricated user counts', () => {
      for (const comparison of COMPARISONS) {
        const allText = [
          comparison.intro,
          comparison.verdict,
          ...comparison.faq.map((f) => f.answer),
        ].join(' ')

        expect(allText).not.toMatch(/\d+\+?\s*(users|clubs|organizations)\s*(use|trust|love)/i)
        expect(allText).not.toMatch(/join\s+\d+/i)
      }
    })
  })
})
