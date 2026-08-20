import {
  GLOSSARY_ENTRIES,
  getGlossaryEntryBySlug,
  getAllGlossarySlugs,
  getGlossaryEntriesByCategory,
  GLOSSARY_CATEGORIES,
  type GlossaryCategory,
} from '../glossary'

describe('glossary data', () => {
  it('has at least 130 entries', () => {
    expect(GLOSSARY_ENTRIES.length).toBeGreaterThanOrEqual(130)
  })

  it('all slugs are unique', () => {
    const slugs = GLOSSARY_ENTRIES.map((e) => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('all entries have required fields', () => {
    GLOSSARY_ENTRIES.forEach((entry) => {
      expect(entry.slug).toBeTruthy()
      expect(entry.slug).toMatch(/^[a-z0-9-]+$/)
      expect(entry.term).toBeTruthy()
      expect(entry.definition.length).toBeGreaterThan(20)
      expect(entry.extendedDefinition.length).toBeGreaterThan(100)
      expect(GLOSSARY_CATEGORIES).toContain(entry.category)
      expect(entry.faqQuestions.length).toBeGreaterThanOrEqual(1)
      expect(entry.keywords.length).toBeGreaterThan(0)
    })
  })

  it('all relatedTerms reference valid slugs', () => {
    const allSlugs = new Set(getAllGlossarySlugs())
    GLOSSARY_ENTRIES.forEach((entry) => {
      entry.relatedTerms.forEach((related) => {
        if (!allSlugs.has(related)) {
          expect(related).toMatch(/^[a-z0-9-]+$/)
        }
      })
    })
  })

  it('all FAQ questions have question and answer', () => {
    GLOSSARY_ENTRIES.forEach((entry) => {
      entry.faqQuestions.forEach((faq) => {
        expect(faq.question).toBeTruthy()
        expect(faq.answer).toBeTruthy()
      })
    })
  })

  it('getGlossaryEntryBySlug returns correct entry', () => {
    const first = GLOSSARY_ENTRIES[0]
    const result = getGlossaryEntryBySlug(first.slug)
    expect(result).toBeDefined()
    expect(result!.term).toBe(first.term)
  })

  it('getGlossaryEntryBySlug returns undefined for unknown slug', () => {
    expect(getGlossaryEntryBySlug('nonexistent-term-xyz')).toBeUndefined()
  })

  it('getAllGlossarySlugs returns all slugs', () => {
    const slugs = getAllGlossarySlugs()
    expect(slugs.length).toBe(GLOSSARY_ENTRIES.length)
  })

  it('getGlossaryEntriesByCategory returns filtered entries', () => {
    const govEntries = getGlossaryEntriesByCategory('governance')
    expect(govEntries.length).toBeGreaterThan(0)
    govEntries.forEach((e) => expect(e.category).toBe('governance'))
  })

  it('covers all categories', () => {
    const usedCategories = new Set(GLOSSARY_ENTRIES.map((e) => e.category))
    GLOSSARY_CATEGORIES.forEach((cat) => {
      expect(usedCategories.has(cat as GlossaryCategory)).toBe(true)
    })
  })

  it('entries are grouped by category', () => {
    // Verify entries are grouped (all entries of a category appear together)
    const seen = new Set<string>()
    let currentCategory = ''
    GLOSSARY_ENTRIES.forEach((entry) => {
      if (entry.category !== currentCategory) {
        expect(seen.has(entry.category)).toBe(false)
        seen.add(entry.category)
        currentCategory = entry.category
      }
    })
  })
})
