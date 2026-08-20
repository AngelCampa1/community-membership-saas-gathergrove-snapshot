import { GET } from '../route'
import { CLUB_TYPES } from '@/lib/data/club-types'
import { HOW_TO_START_ENTRIES } from '@/lib/data/how-to-start'
import { COMPARISONS } from '@/lib/data/comparisons'
import { ALTERNATIVES } from '@/lib/data/alternatives'
import {
  isRetainedAlternativeSlug,
  isRetainedClubTypeSlug,
  isRetainedComparisonSlug,
  isRetainedHowToStartSlug,
} from '@/lib/seo-content-config'

describe('llms.txt route', () => {
  it('returns a Response', () => {
    const response = GET()
    expect(response).toBeInstanceOf(Response)
  })

  it('returns text/plain content type', () => {
    const response = GET()
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
  })

  it('contains product name', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('GatherGrove')
  })

  it('contains core features section', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('## Core Features')
  })

  it('contains pricing section', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('## Pricing')
    expect(text).toContain('Grow')
    expect(text).toContain('Unlimited')
  })

  it('contains resource links', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('## Resource Library')
    expect(text).toContain('/resources/')
  })

  it('contains site links', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('/register')
    expect(text).toContain('/support')
  })

  it('has caching headers', () => {
    const response = GET()
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
    expect(response.headers.get('CDN-Cache-Control')).toBe('max-age=86400')
  })

  it('contains Core Entity Definition section', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('## Core Entity Definition')
    expect(text).toContain('Club Management Software')
  })

  it('contains Key Concepts section', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('## Key Concepts')
    expect(text).toContain('Dues automation')
  })

  it('contains Comparison Context section', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('## Comparison Context')
    expect(text).toContain('Wild Apricot')
  })

  it('references the correct dynamic club type count', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain(
      String(CLUB_TYPES.filter((clubType) => isRetainedClubTypeSlug(clubType.slug)).length)
    )
    // Must NOT contain the old hardcoded "20+" string
    expect(text).not.toContain('20+ more club types')
  })

  it('contains how-to-start guides section', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toMatch(/how.to.start/i)
    expect(text).toContain(
      String(HOW_TO_START_ENTRIES.filter((entry) => isRetainedHowToStartSlug(entry.slug)).length)
    )
  })

  it('lists only retained comparison and alternative slugs', async () => {
    const response = GET()
    const text = await response.text()
    COMPARISONS.filter((comparison) => isRetainedComparisonSlug(comparison.slug)).forEach((c) => {
      expect(text).toContain(c.slug)
    })
    ALTERNATIVES.filter((alternative) => isRetainedAlternativeSlug(alternative.slug)).forEach((alternative) => {
      expect(text).toContain(alternative.slug)
    })
    expect(text).not.toContain('signupgenius')
    expect(text).not.toContain('eventbrite')
  })
})
