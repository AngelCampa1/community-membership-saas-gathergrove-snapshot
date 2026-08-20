import { USE_CASES, getUseCaseBySlug, getAllUseCaseSlugs } from '../use-cases'

describe('use-cases data', () => {
  it('has the expected core use cases', () => {
    expect(USE_CASES.length).toBeGreaterThanOrEqual(12)
  })

  it('all slugs are unique', () => {
    const slugs = USE_CASES.map((uc) => uc.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('all entries have required fields', () => {
    USE_CASES.forEach((uc) => {
      expect(uc.slug).toBeTruthy()
      expect(uc.title).toBeTruthy()
      expect(uc.description.length).toBeGreaterThan(30)
      expect(uc.problem.length).toBeGreaterThan(40)
      expect(uc.solution.length).toBeGreaterThan(40)
      expect(uc.longDescription.length).toBeGreaterThan(100)
      expect(uc.features.length).toBeGreaterThan(0)
      expect(uc.benefits.length).toBeGreaterThan(0)
      expect(uc.keywords.length).toBeGreaterThan(0)
      expect(uc.relatedClubTypes.length).toBeGreaterThan(0)
    })
  })

  it('getUseCaseBySlug returns correct entry', () => {
    const entry = getUseCaseBySlug('membership-management')
    expect(entry).toBeDefined()
    expect(entry!.title).toBe('Membership Management')
  })

  it('getUseCaseBySlug returns undefined for unknown slug', () => {
    expect(getUseCaseBySlug('nonexistent')).toBeUndefined()
  })

  it('getAllUseCaseSlugs returns all slugs', () => {
    const slugs = getAllUseCaseSlugs()
    expect(slugs).toHaveLength(USE_CASES.length)
    expect(slugs).toContain('membership-management')
    expect(slugs).toContain('event-planning')
    expect(slugs).toContain('mobile-app')
    expect(slugs).toContain('multi-location-management')
    expect(slugs).toContain('community-chat')
    expect(slugs).toContain('billing-payment-processing')
  })
})
