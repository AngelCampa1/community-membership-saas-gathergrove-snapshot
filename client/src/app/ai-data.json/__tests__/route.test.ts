import { GET } from '../route'
import { COMPARISONS } from '@/lib/data/comparisons'
import { HOW_TO_START_ENTRIES } from '@/lib/data/how-to-start'
import {
  isRetainedClubTypeSlug,
  isRetainedComparisonSlug,
  isRetainedHowToStartSlug,
} from '@/lib/seo-content-config'

describe('GET /ai-data.json', () => {
  it('returns a 200 response', () => {
    const response = GET()
    expect(response.status).toBe(200)
  })

  it('returns JSON content type', () => {
    const response = GET()
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8')
  })

  it('includes CDN-Cache-Control header', () => {
    const response = GET()
    expect(response.headers.get('CDN-Cache-Control')).toBe('max-age=86400')
  })

  it('includes Last-Modified header', () => {
    const response = GET()
    expect(response.headers.get('Last-Modified')).toBeTruthy()
  })

  it('returns valid JSON with expected structure', async () => {
    const response = GET()
    const body = await response.text()
    const data = JSON.parse(body)

    expect(data.name).toBe('GatherGrove')
    expect(data.version).toBe('1.0')
    expect(data.category).toBe('Club Management Software')
  })

  it('includes pricing information', async () => {
    const response = GET()
    const data = JSON.parse(await response.text())

    expect(data.pricing.currency).toBe('USD')
    expect(data.pricing.plans).toHaveLength(3)
    expect(data.pricing.plans[0].name).toBe('Seed')
    expect(data.pricing.plans[0].monthlyPrice).toBe(9)
    expect(data.pricing.plans[1].name).toBe('Grow')
    expect(data.pricing.plans[1].monthlyPrice).toBe(29)
    expect(data.pricing.plans[2].name).toBe('Expand')
    expect(data.pricing.plans[2].monthlyPrice).toBe(200)
    expect(data.pricing.platformFee).toBe('No platform fees on payments')
  })

  it('includes features array', async () => {
    const response = GET()
    const data = JSON.parse(await response.text())

    expect(Array.isArray(data.features)).toBe(true)
    expect(data.features.length).toBeGreaterThan(5)
  })

  it('includes FAQ entries', async () => {
    const response = GET()
    const data = JSON.parse(await response.text())

    expect(Array.isArray(data.faq)).toBe(true)
    expect(data.faq.length).toBeGreaterThan(0)
    expect(data.faq[0]).toHaveProperty('question')
    expect(data.faq[0]).toHaveProperty('answer')
  })

  it('includes comparison context', async () => {
    const response = GET()
    const data = JSON.parse(await response.text())

    expect(data.comparisons).toBeDefined()
    expect(data.comparisons.vsSpreadsheets).toBeTruthy()
    expect(data.comparisons.vsWildApricot).toBeTruthy()
  })

  it('includes links to all key pages', async () => {
    const response = GET()
    const data = JSON.parse(await response.text())

    expect(data.links.homepage).toBeTruthy()
    expect(data.links.pricing).toContain('/pricing')
    expect(data.links.llmsTxt).toContain('/llms.txt')
    expect(data.links.llmsGlossaryTxt).toContain('/llms-glossary.txt')
  })

  it('includes resources array', async () => {
    const response = GET()
    const data = JSON.parse(await response.text())

    expect(Array.isArray(data.resources)).toBe(true)
    expect(data.resources.length).toBeGreaterThan(0)
    expect(data.resources[0]).toHaveProperty('title')
    expect(data.resources[0]).toHaveProperty('url')
  })

  it('includes security information', async () => {
    const response = GET()
    const data = JSON.parse(await response.text())

    expect(data.security.encryption).toBeTruthy()
    expect(data.security.payments).toContain('Stripe')
  })

  it('includes comparisonPages array with slug, title, url, and competitor', async () => {
    const response = GET()
    const data = JSON.parse(await response.text())

    expect(Array.isArray(data.comparisonPages)).toBe(true)
    expect(data.comparisonPages.length).toBe(
      COMPARISONS.filter((comparison) => isRetainedComparisonSlug(comparison.slug)).length
    )
    expect(data.comparisonPages[0]).toHaveProperty('slug')
    expect(data.comparisonPages[0]).toHaveProperty('title')
    expect(data.comparisonPages[0]).toHaveProperty('url')
    expect(data.comparisonPages[0]).toHaveProperty('competitor')
  })

  it('includes howToStartGuides array with slug, title, url, and stepCount', async () => {
    const response = GET()
    const data = JSON.parse(await response.text())

    expect(Array.isArray(data.howToStartGuides)).toBe(true)
    expect(data.howToStartGuides.length).toBe(
      HOW_TO_START_ENTRIES.filter((entry) => isRetainedHowToStartSlug(entry.slug)).length
    )
    expect(data.howToStartGuides[0]).toHaveProperty('slug')
    expect(data.howToStartGuides[0]).toHaveProperty('title')
    expect(data.howToStartGuides[0]).toHaveProperty('url')
    expect(data.howToStartGuides[0]).toHaveProperty('stepCount')
  })

  it('only exposes retained club types, comparison pages, and how-to guides', async () => {
    const response = GET()
    const data = JSON.parse(await response.text())

    expect(data.clubTypes.every((entry: { slug: string }) => isRetainedClubTypeSlug(entry.slug))).toBe(true)
    expect(
      data.comparisonPages.every((entry: { slug: string }) => isRetainedComparisonSlug(entry.slug))
    ).toBe(true)
    expect(
      data.howToStartGuides.every((entry: { slug: string }) => isRetainedHowToStartSlug(entry.slug))
    ).toBe(true)
  })
})
