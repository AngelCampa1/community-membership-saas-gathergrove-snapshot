import { GET } from '../route'

describe('GET /llms-glossary.txt', () => {
  it('returns a 200 response', () => {
    const response = GET()
    expect(response.status).toBe(200)
  })

  it('returns text/plain content type', () => {
    const response = GET()
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
  })

  it('includes CDN-Cache-Control header', () => {
    const response = GET()
    expect(response.headers.get('CDN-Cache-Control')).toBe('max-age=86400')
  })

  it('includes Last-Modified header', () => {
    const response = GET()
    expect(response.headers.get('Last-Modified')).toBeTruthy()
  })

  it('contains glossary title and version', async () => {
    const response = GET()
    const body = await response.text()
    expect(body).toContain('# GatherGrove - Club Management Glossary')
    expect(body).toContain('Version: 1.0')
    expect(body).toContain('Last updated:')
  })

  it('contains glossary category sections', async () => {
    const response = GET()
    const body = await response.text()
    expect(body).toContain('## Governance')
    expect(body).toContain('## Membership')
    expect(body).toContain('## Financial')
  })

  it('contains glossary entry definitions', async () => {
    const response = GET()
    const body = await response.text()
    // Should contain at least some glossary terms with URLs
    expect(body).toContain('/glossary/')
    expect(body).toContain('Category:')
  })

  it('contains links to other LLM resources', async () => {
    const response = GET()
    const body = await response.text()
    expect(body).toContain('/llms-full.txt')
    expect(body).toContain('/llms-pricing.txt')
  })
})
