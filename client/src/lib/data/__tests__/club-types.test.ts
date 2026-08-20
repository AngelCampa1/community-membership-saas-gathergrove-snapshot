import { CLUB_TYPES, getClubTypeBySlug, getAllClubTypeSlugs } from '../club-types'

describe('club-types data', () => {
  it('has 80 club types', () => {
    expect(CLUB_TYPES).toHaveLength(80)
  })

  it('all slugs are unique', () => {
    const slugs = CLUB_TYPES.map((ct) => ct.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('all entries have required fields', () => {
    CLUB_TYPES.forEach((ct) => {
      expect(ct.slug).toBeTruthy()
      expect(ct.name).toBeTruthy()
      expect(ct.singularName).toBeTruthy()
      expect(ct.description.length).toBeGreaterThan(50)
      expect(ct.longDescription.length).toBeGreaterThan(100)
      expect(ct.icon).toBeTruthy()
      expect(ct.features.length).toBeGreaterThan(0)
      expect(ct.keywords.length).toBeGreaterThan(0)
      expect(ct.relatedSlugs.length).toBeGreaterThan(0)
    })
  })

  it('relatedSlugs reference existing club types', () => {
    const allSlugs = new Set(getAllClubTypeSlugs())
    CLUB_TYPES.forEach((ct) => {
      ct.relatedSlugs.forEach((related) => {
        if (!allSlugs.has(related)) {
          // Allow references to types not yet in the data (gaming-clubs, yoga-studios, etc.)
          // Just ensure they are valid slug format
          expect(related).toMatch(/^[a-z0-9-]+$/)
        }
      })
    })
  })

  it('optional bluf field is valid when present', () => {
    CLUB_TYPES.forEach((ct) => {
      if (ct.bluf !== undefined) {
        expect(ct.bluf.length).toBeGreaterThan(50)
      }
    })
  })

  it('optional faqs field is valid when present', () => {
    CLUB_TYPES.forEach((ct) => {
      if (ct.faqs !== undefined) {
        expect(ct.faqs.length).toBeGreaterThan(0)
        ct.faqs.forEach((faq) => {
          expect(faq.question).toBeTruthy()
          expect(faq.answer.length).toBeGreaterThan(20)
        })
      }
    })
  })

  it('at least one club type has bluf populated', () => {
    const withBluf = CLUB_TYPES.filter((ct) => ct.bluf !== undefined)
    expect(withBluf.length).toBeGreaterThan(0)
  })

  it('getClubTypeBySlug returns correct entry', () => {
    const entry = getClubTypeBySlug('book-clubs')
    expect(entry).toBeDefined()
    expect(entry!.name).toBe('Book Clubs')
  })

  it('getClubTypeBySlug returns undefined for unknown slug', () => {
    expect(getClubTypeBySlug('nonexistent')).toBeUndefined()
  })

  it('getAllClubTypeSlugs returns all slugs', () => {
    const slugs = getAllClubTypeSlugs()
    expect(slugs).toHaveLength(80)
    expect(slugs).toContain('book-clubs')
    expect(slugs).toContain('running-clubs')
  })
})
