import { RESOURCES, getResourceBySlug, getAllResourceSlugs, getFeaturedResource } from '../resources'

describe('resources data', () => {
  it('has the correct number of resources', () => {
    expect(RESOURCES.length).toBeGreaterThanOrEqual(16)
  })

  it('all slugs are unique', () => {
    const slugs = RESOURCES.map((r) => r.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('all entries have required fields', () => {
    RESOURCES.forEach((r) => {
      expect(r.slug).toBeTruthy()
      expect(r.title).toBeTruthy()
      expect(r.description).toBeTruthy()
      expect(r.category).toBeTruthy()
      expect(r.readTime).toBeTruthy()
      expect(r.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(r.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(r.keywords.length).toBeGreaterThan(0)
    })
  })

  it('all entries have SEO-optimized titles with bracket or number pattern', () => {
    RESOURCES.forEach((r) => {
      expect(r.seoTitle).toBeTruthy()
      const hasBracket = /\[.*\]/.test(r.seoTitle!)
      const hasNumber = /\d/.test(r.seoTitle!)
      expect(hasBracket || hasNumber).toBe(true)
    })
  })

  it('getResourceBySlug returns correct resource', () => {
    const resource = getResourceBySlug('complete-guide-club-management')
    expect(resource).toBeDefined()
    expect(resource!.title).toContain('Complete Guide')
  })

  it('getResourceBySlug returns undefined for unknown slug', () => {
    expect(getResourceBySlug('nonexistent')).toBeUndefined()
  })

  it('getAllResourceSlugs returns all slugs', () => {
    const slugs = getAllResourceSlugs()
    expect(slugs.length).toBeGreaterThanOrEqual(16)
    expect(slugs).toContain('complete-guide-club-management')
    expect(slugs).toContain('template-library')
    expect(slugs).toContain('volunteer-hour-tracking-guide')
    expect(slugs).toContain('nonprofit-membership-management-guide')
  })

  it('has exactly one featured resource', () => {
    const featured = getFeaturedResource()
    expect(featured).toBeDefined()
    expect(featured!.featured).toBe(true)
    expect(RESOURCES.filter((r) => r.featured)).toHaveLength(1)
  })
})
