import { GET } from '../route'
import { HOW_TO_START_ENTRIES } from '@/lib/data/how-to-start'
import { isRetainedHowToStartSlug } from '@/lib/seo-content-config'

describe('GET /llms-how-to.txt', () => {
  let response: Response
  let text: string

  beforeAll(async () => {
    response = GET()
    text = await response.text()
  })

  const retainedEntries = HOW_TO_START_ENTRIES.filter((entry) =>
    isRetainedHowToStartSlug(entry.slug)
  )

  it('returns 200 status', () => {
    expect(response.status).toBe(200)
  })

  it('returns text/plain content type', () => {
    expect(response.headers.get('Content-Type')).toContain('text/plain')
  })

  it('includes correct guide count', () => {
    expect(text).toContain(String(retainedEntries.length))
  })

  it('includes all how-to-start entry titles', () => {
    retainedEntries.forEach((e) => {
      expect(text).toContain(e.title)
    })
  })

  it('includes all entry slugs as URLs', () => {
    retainedEntries.forEach((e) => {
      expect(text).toContain(`/how-to-start/${e.slug}`)
    })
  })

  it('includes estimated startup cost for each entry', () => {
    retainedEntries.forEach((e) => {
      expect(text).toContain(e.estimatedStartupCost)
    })
  })

  it('includes all category sections', () => {
    expect(text).toMatch(/## Sports/i)
    expect(text).toMatch(/## Community/i)
    expect(text).toMatch(/## Hobby/i)
    expect(text).toMatch(/## Professional/i)
    expect(text).toMatch(/## Youth/i)
  })

  it('includes GatherGrove branding', () => {
    expect(text).toContain('GatherGrove')
  })

  it('includes a link to the how-to-start hub', () => {
    expect(text).toContain('/how-to-start')
  })

  it('sets cache headers', () => {
    expect(response.headers.get('Cache-Control')).toContain('public')
    expect(response.headers.get('Cache-Control')).toContain('max-age=3600')
  })

  it('sets Last-Modified header', () => {
    expect(response.headers.get('Last-Modified')).toBeTruthy()
  })
})
