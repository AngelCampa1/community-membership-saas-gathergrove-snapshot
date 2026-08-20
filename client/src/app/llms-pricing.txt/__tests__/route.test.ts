import { GET } from '../route'

describe('llms-pricing.txt route', () => {
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
  })

  it('includes both pricing plans', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('Grow Plan')
    expect(text).toContain('Expand Plan')
  })

  it('includes monthly and annual prices', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('$29/month')
    expect(text).toContain('$200/month')
    expect(text).toContain('$290/year')
    expect(text).toContain('$2,000/year')
  })

  it('includes no platform fee and Stripe details', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('No platform fees')
    expect(text).toContain('Stripe')
  })

  it('includes free trial information', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('30 days')
  })

  it('includes links', async () => {
    const response = GET()
    const text = await response.text()
    expect(text).toContain('/register')
    expect(text).toContain('/llms-full.txt')
  })
})
