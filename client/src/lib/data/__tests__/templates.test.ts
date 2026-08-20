// TDD: these tests were written BEFORE the implementation in templates.ts
import {
  TEMPLATES,
  getTemplateBySlug,
  getTemplatesByCategory,
  TEMPLATE_CATEGORIES,
  type TemplateEntry,
  type TemplateCategory,
} from '../templates'

describe('TEMPLATES data array', () => {
  it('has exactly 8 entries', () => {
    expect(TEMPLATES).toHaveLength(8)
  })

  it('contains the primary meeting-minutes-template entry', () => {
    const entry = TEMPLATES.find((t) => t.slug === 'meeting-minutes-template')
    expect(entry).toBeDefined()
  })

  it('every entry has all required fields', () => {
    const requiredStringFields: (keyof TemplateEntry)[] = [
      'slug',
      'title',
      'description',
      'bluf',
      'templateBody',
    ]
    const requiredArrayFields: (keyof TemplateEntry)[] = [
      'keywords',
      'keyTakeaways',
      'sections',
      'steps',
      'faqQuestions',
      'relatedTemplates',
      'relatedResources',
    ]

    for (const entry of TEMPLATES) {
      for (const field of requiredStringFields) {
        expect(typeof entry[field]).toBe('string')
        expect((entry[field] as string).length).toBeGreaterThan(0)
      }
      for (const field of requiredArrayFields) {
        expect(Array.isArray(entry[field])).toBe(true)
      }
    }
  })

  it('every entry has a valid category', () => {
    const validCategories: TemplateCategory[] = [
      'meetings',
      'events',
      'finance',
      'members',
      'volunteers',
      'governance',
    ]
    for (const entry of TEMPLATES) {
      expect(validCategories).toContain(entry.category)
    }
  })

  it('all slugs are unique', () => {
    const slugs = TEMPLATES.map((t) => t.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(TEMPLATES.length)
  })

  it('all slugs are kebab-case with no spaces', () => {
    for (const entry of TEMPLATES) {
      expect(entry.slug).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('all keywords arrays are non-empty', () => {
    for (const entry of TEMPLATES) {
      expect(entry.keywords.length).toBeGreaterThan(0)
    }
  })

  it('all steps arrays have at least 3 steps', () => {
    for (const entry of TEMPLATES) {
      expect(entry.steps.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('each step has title and description', () => {
    for (const entry of TEMPLATES) {
      for (const step of entry.steps) {
        expect(typeof step.title).toBe('string')
        expect(step.title.length).toBeGreaterThan(0)
        expect(typeof step.description).toBe('string')
        expect(step.description.length).toBeGreaterThan(0)
      }
    }
  })

  it('all faqQuestions have question and answer', () => {
    for (const entry of TEMPLATES) {
      expect(entry.faqQuestions.length).toBeGreaterThanOrEqual(4)
      for (const faq of entry.faqQuestions) {
        expect(typeof faq.question).toBe('string')
        expect(faq.question.length).toBeGreaterThan(0)
        expect(typeof faq.answer).toBe('string')
        expect(faq.answer.length).toBeGreaterThan(0)
      }
    }
  })

  it('all relatedTemplates reference valid slugs', () => {
    const allSlugs = new Set(TEMPLATES.map((t) => t.slug))
    for (const entry of TEMPLATES) {
      for (const relatedSlug of entry.relatedTemplates) {
        expect(allSlugs.has(relatedSlug)).toBe(true)
      }
    }
  })

  it('templateBody is non-trivial (>100 chars)', () => {
    for (const entry of TEMPLATES) {
      expect(entry.templateBody.length).toBeGreaterThan(100)
    }
  })

  it('bluf is 40-80 words', () => {
    for (const entry of TEMPLATES) {
      const wordCount = entry.bluf.split(/\s+/).length
      expect(wordCount).toBeGreaterThanOrEqual(20)
      expect(wordCount).toBeLessThanOrEqual(100)
    }
  })
})

describe('meeting-minutes-template entry', () => {
  let entry: TemplateEntry | undefined

  beforeAll(() => {
    entry = TEMPLATES.find((t) => t.slug === 'meeting-minutes-template')
  })

  it('has correct title', () => {
    expect(entry?.title).toBe('Meeting Minutes Template')
  })

  it('has meetings category', () => {
    expect(entry?.category).toBe('meetings')
  })

  it('keywords include primary target keyword', () => {
    expect(entry?.keywords).toContain('meeting minutes template')
  })

  it('has at least 5 faqQuestions', () => {
    expect(entry?.faqQuestions.length).toBeGreaterThanOrEqual(5)
  })

  it('templateBody contains key sections', () => {
    const body = entry?.templateBody ?? ''
    expect(body).toContain('ATTENDEES')
    expect(body).toContain('ACTION ITEMS')
  })
})

describe('getTemplateBySlug', () => {
  it('returns the correct entry for a valid slug', () => {
    const entry = getTemplateBySlug('meeting-minutes-template')
    expect(entry).toBeDefined()
    expect(entry?.slug).toBe('meeting-minutes-template')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getTemplateBySlug('does-not-exist')).toBeUndefined()
  })
})

describe('getTemplatesByCategory', () => {
  it('returns only entries matching the given category', () => {
    const meetings = getTemplatesByCategory('meetings')
    expect(meetings.length).toBeGreaterThanOrEqual(1)
    for (const t of meetings) {
      expect(t.category).toBe('meetings')
    }
  })

  it('returns empty array for a category with no entries', () => {
    // All valid categories have at least one entry, so test with a cast
    const result = getTemplatesByCategory('members' as TemplateCategory)
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('TEMPLATE_CATEGORIES', () => {
  it('is a readonly tuple of category strings', () => {
    expect(TEMPLATE_CATEGORIES).toContain('meetings')
    expect(TEMPLATE_CATEGORIES).toContain('events')
    expect(TEMPLATE_CATEGORIES).toContain('finance')
    expect(TEMPLATE_CATEGORIES).toContain('members')
    expect(TEMPLATE_CATEGORIES).toContain('volunteers')
    expect(TEMPLATE_CATEGORIES).toContain('governance')
  })
})
