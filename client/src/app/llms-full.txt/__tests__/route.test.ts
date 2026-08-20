import { GET } from '../route'

describe('llms-full.txt route', () => {
  it('returns a Response', () => {
    const response = GET()
    expect(response).toBeInstanceOf(Response)
  })

  it('returns text/plain content type', () => {
    const response = GET()
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
  })

  it('contains full product overview', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('## Product Overview')
    expect(text).toContain('## Core Features')
    expect(text).toContain('## Pricing Details')
  })

  it('contains club type guides', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('## Club Type Guides')
    expect(text).toContain('/for/')
  })

  it('contains feature guides', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('## Feature Guides')
    expect(text).toContain('/features/')
  })

  it('is longer than the short version', async () => {
    const { GET: getShort } = await import('../../llms.txt/route')
    const shortText = await getShort().text()
    const fullText = await GET().text()
    expect(fullText.length).toBeGreaterThan(shortText.length)
  })

  it('has caching headers', () => {
    const response = GET()
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
    expect(response.headers.get('CDN-Cache-Control')).toBe('max-age=86400')
  })

  it('contains Frequently Asked by AI section', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('## Frequently Asked by AI')
    expect(text).toContain('best club management software')
  })
})
