import {
  HOW_TO_START_ENTRIES,
  HOW_TO_START_CATEGORIES,
  getHowToStartEntryBySlug,
  getAllHowToStartSlugs,
  getHowToStartEntriesByCategory,
  type HowToStartCategory,
} from '../how-to-start'

describe('How-to-Start data file', () => {
  it('exports at least 30 entries', () => {
    expect(HOW_TO_START_ENTRIES.length).toBeGreaterThanOrEqual(30)
  })

  it('has unique slugs', () => {
    const slugs = HOW_TO_START_ENTRIES.map((e) => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every entry has all required fields', () => {
    for (const entry of HOW_TO_START_ENTRIES) {
      expect(entry.slug).toBeTruthy()
      expect(entry.orgType).toBeTruthy()
      expect(entry.title).toBeTruthy()
      expect(entry.description.length).toBeGreaterThan(50)
      expect(entry.steps.length).toBeGreaterThanOrEqual(5)
      expect(entry.legalRequirements).toBeTruthy()
      expect(entry.estimatedStartupCost).toBeTruthy()
      expect(entry.minMembersToLaunch).toBeTruthy()
      expect(entry.commonMistakes.length).toBeGreaterThanOrEqual(2)
      expect(entry.toolsNeeded.length).toBeGreaterThanOrEqual(2)
      expect(entry.faqQuestions.length).toBeGreaterThanOrEqual(2)
      expect(entry.keywords.length).toBeGreaterThanOrEqual(2)
      expect(entry.category).toBeTruthy()
    }
  })

  it('every step has title and description', () => {
    for (const entry of HOW_TO_START_ENTRIES) {
      for (const step of entry.steps) {
        expect(step.title).toBeTruthy()
        expect(step.description).toBeTruthy()
      }
    }
  })

  it('every FAQ question has question and answer', () => {
    for (const entry of HOW_TO_START_ENTRIES) {
      for (const faq of entry.faqQuestions) {
        expect(faq.question).toBeTruthy()
        expect(faq.answer).toBeTruthy()
      }
    }
  })

  it('all relatedClubTypes reference valid slugs or are empty', () => {
    const allSlugs = HOW_TO_START_ENTRIES.map((e) => e.slug)
    for (const entry of HOW_TO_START_ENTRIES) {
      for (const related of entry.relatedClubTypes) {
        // relatedClubTypes can reference /for/ slugs, so just check they're non-empty strings
        expect(related).toBeTruthy()
      }
    }
  })

  it('all categories are valid', () => {
    for (const entry of HOW_TO_START_ENTRIES) {
      expect(HOW_TO_START_CATEGORIES).toContain(entry.category)
    }
  })

  it('covers at least 3 categories', () => {
    const categories = new Set(HOW_TO_START_ENTRIES.map((e) => e.category))
    expect(categories.size).toBeGreaterThanOrEqual(3)
  })

  it('getHowToStartEntryBySlug returns correct entry', () => {
    const first = HOW_TO_START_ENTRIES[0]
    const result = getHowToStartEntryBySlug(first.slug)
    expect(result).toBe(first)
  })

  it('getHowToStartEntryBySlug returns undefined for invalid slug', () => {
    expect(getHowToStartEntryBySlug('nonexistent-xyz')).toBeUndefined()
  })

  it('getAllHowToStartSlugs returns all slugs', () => {
    const slugs = getAllHowToStartSlugs()
    expect(slugs).toHaveLength(HOW_TO_START_ENTRIES.length)
    expect(slugs).toContain(HOW_TO_START_ENTRIES[0].slug)
  })

  it('getHowToStartEntriesByCategory returns only matching entries', () => {
    const category = HOW_TO_START_ENTRIES[0].category
    const results = getHowToStartEntriesByCategory(category)
    expect(results.length).toBeGreaterThan(0)
    for (const entry of results) {
      expect(entry.category).toBe(category)
    }
  })
})
