import { ALTERNATIVES, getAlternativeBySlug, getAllAlternativeSlugs } from '../alternatives'

describe('alternatives data', () => {
  it('has 6 entries', () => {
    expect(ALTERNATIVES).toHaveLength(6)
  })

  it('includes expected slugs', () => {
    const slugs = getAllAlternativeSlugs()
    expect(slugs).toContain('wild-apricot')
    expect(slugs).toContain('clubexpress')
    expect(slugs).toContain('memberplanet')
    expect(slugs).toContain('spreadsheets')
    expect(slugs).toContain('signupgenius')
    expect(slugs).toContain('teamsnap')
  })

  it('all slugs are unique', () => {
    const slugs = ALTERNATIVES.map((a) => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('each entry has required fields', () => {
    for (const alt of ALTERNATIVES) {
      expect(alt.slug).toBeTruthy()
      expect(alt.competitorName).toBeTruthy()
      expect(alt.title).toBeTruthy()
      expect(alt.metaDescription).toBeTruthy()
      expect(alt.bluf.length).toBeGreaterThan(50)
      expect(alt.intro.length).toBeGreaterThan(50)
      expect(alt.whySwitchReasons.length).toBeGreaterThan(0)
      expect(alt.alternatives.length).toBeGreaterThan(0)
      expect(alt.faq.length).toBeGreaterThan(0)
      expect(alt.keywords.length).toBeGreaterThan(0)
    }
  })

  it('each alternative has name, bestFor, and pricing', () => {
    for (const entry of ALTERNATIVES) {
      for (const alt of entry.alternatives) {
        expect(alt.name).toBeTruthy()
        expect(alt.bestFor).toBeTruthy()
        expect(alt.pricing).toBeTruthy()
      }
    }
  })

  it('each FAQ has question and answer', () => {
    for (const entry of ALTERNATIVES) {
      for (const faq of entry.faq) {
        expect(faq.question).toBeTruthy()
        expect(faq.answer.length).toBeGreaterThan(20)
      }
    }
  })

  describe('getAlternativeBySlug', () => {
    it('returns the correct entry', () => {
      const result = getAlternativeBySlug('wild-apricot')
      expect(result).toBeDefined()
      expect(result!.competitorName).toBe('Wild Apricot')
    })

    it('returns undefined for unknown slug', () => {
      expect(getAlternativeBySlug('nonexistent')).toBeUndefined()
    })
  })

  describe('honesty rule compliance', () => {
    it('does not contain fabricated user counts', () => {
      for (const entry of ALTERNATIVES) {
        const allText = [
          entry.bluf,
          entry.intro,
          ...entry.faq.map((f) => f.answer),
          ...entry.whySwitchReasons,
        ].join(' ')
        expect(allText).not.toMatch(/\d+\+?\s*(users|clubs|organizations)\s*(use|trust|love)/i)
        expect(allText).not.toMatch(/join\s+\d+/i)
      }
    })
  })
})
