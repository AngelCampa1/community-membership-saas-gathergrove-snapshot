import { FEATURE_PAGES, SPECIALIZED_FEATURE_PAGES } from '../feature-pages'
import { USE_CASES } from '../use-cases'

describe('feature page registry', () => {
  it('includes core and specialized feature pages', () => {
    expect(FEATURE_PAGES).toHaveLength(USE_CASES.length + SPECIALIZED_FEATURE_PAGES.length)
    expect(FEATURE_PAGES.map((page) => page.slug)).toEqual(
      expect.arrayContaining([
        'membership-management',
        'mobile-app',
        'multi-location-management',
        'community-chat',
        'billing-payment-processing',
        'nonprofit-event-management',
        'community-management-software',
        'member-database',
      ])
    )
  })

  it('gives every feature a deep /features URL', () => {
    FEATURE_PAGES.forEach((page) => {
      expect(page.url).toBe(`/features/${page.slug}`)
      expect(page.description.length).toBeGreaterThan(30)
      expect(page.keywords.length).toBeGreaterThan(0)
    })
  })

  it('has unique slugs and URLs', () => {
    const slugs = FEATURE_PAGES.map((page) => page.slug)
    const urls = FEATURE_PAGES.map((page) => page.url)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(new Set(urls).size).toBe(urls.length)
  })
})
