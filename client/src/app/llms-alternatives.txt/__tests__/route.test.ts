import { GET } from '../route'
import { ALTERNATIVES } from '@/lib/data/alternatives'
import { isRetainedAlternativeSlug } from '@/lib/seo-content-config'

describe('llms-alternatives.txt route', () => {
  it('returns a Response object', () => {
    const response = GET()
    expect(response).toBeInstanceOf(Response)
  })

  it('returns text/plain content type', () => {
    const response = GET()
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
  })

  it('sets cache headers', () => {
    const response = GET()
    expect(response.headers.get('Cache-Control')).toContain('public')
    expect(response.headers.get('Cache-Control')).toContain('max-age=3600')
    expect(response.headers.get('CDN-Cache-Control')).toBe('max-age=86400')
  })

  it('includes Last-Modified header', () => {
    const response = GET()
    expect(response.headers.get('Last-Modified')).toBeTruthy()
  })

  it('includes GatherGrove branding in title', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('GatherGrove')
    expect(text).toContain('Alternatives Reference')
  })

  it('includes only retained competitors from ALTERNATIVES data', async () => {
    const response = GET()
    const text = await response.text()
    for (const alt of ALTERNATIVES.filter((alternative) => isRetainedAlternativeSlug(alternative.slug))) {
      expect(text).toContain(alt.competitorName)
    }
    expect(text).not.toContain('SignUpGenius')
  })

  it('includes links to each retained alternative page', async () => {
    const response = GET()
    const text = await response.text()
    for (const alt of ALTERNATIVES.filter((alternative) => isRetainedAlternativeSlug(alternative.slug))) {
      expect(text).toContain(`/alternatives/${alt.slug}`)
    }
    expect(text).not.toContain('/alternatives/signupgenius')
  })

  it('includes pricing information', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('$9/mo')
    expect(text).toContain('$29/mo')
    expect(text).toContain('$200/mo')
  })

  it('includes FAQ section with Wild Apricot comparison', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('Wild Apricot')
    expect(text).toContain('ClubExpress')
  })

  it('includes links to pricing and full reference', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('/pricing')
    expect(text).toContain('/llms-pricing.txt')
    expect(text).toContain('/llms-full.txt')
    expect(text).toContain('/alternatives')
  })

  it('mentions no platform fees as a differentiator', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('No platform fees')
  })
})
