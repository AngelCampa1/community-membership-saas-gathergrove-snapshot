import { createPageMetadata } from '../marketing-metadata'
import { SITE_URL } from '../site-config'

describe('createPageMetadata', () => {
  const base = {
    title: 'Test Page',
    description: 'A test page description',
    slug: 'test-page',
  }

  it('appends site name to title', () => {
    const meta = createPageMetadata(base)
    expect(meta.title).toEqual({ absolute: 'Test Page | GatherGrove' })
  })

  it('sets canonical URL from slug', () => {
    const meta = createPageMetadata(base)
    expect(meta.alternates?.canonical).toBe('/test-page')
  })

  it('sets OpenGraph metadata', () => {
    const meta = createPageMetadata(base)
    const og = meta.openGraph as Record<string, unknown>
    expect(og.title).toBe('Test Page | GatherGrove')
    expect(og.description).toBe(base.description)
    expect(og.url).toBe(`${SITE_URL}/test-page`)
  })

  it('sets Twitter card metadata', () => {
    const meta = createPageMetadata(base)
    const tw = meta.twitter as Record<string, unknown>
    expect(tw.card).toBe('summary_large_image')
    expect(tw.title).toBe('Test Page | GatherGrove')
  })

  it('uses default OG image when not specified', () => {
    const meta = createPageMetadata(base)
    const og = meta.openGraph as Record<string, unknown>
    expect(og.images).toContain('/og-image.png')
  })

  it('uses custom OG image when specified', () => {
    const meta = createPageMetadata({ ...base, ogImagePath: '/custom-og.png' })
    const og = meta.openGraph as Record<string, unknown>
    expect(og.images).toContain('/custom-og.png')
  })

  it('includes keywords when provided', () => {
    const meta = createPageMetadata({ ...base, keywords: 'club, management' })
    expect(meta.keywords).toBe('club, management')
  })

  it('omits keywords when not provided', () => {
    const meta = createPageMetadata(base)
    expect(meta.keywords).toBeUndefined()
  })

  it('sets noindex but keeps follow:true when noIndex is requested', () => {
    const meta = createPageMetadata({ ...base, noIndex: true })
    const robots = meta.robots as Record<string, boolean>
    expect(robots.index).toBe(false)
    expect(robots.follow).toBe(true)
  })

  it('does not set robots when noIndex is false', () => {
    const meta = createPageMetadata(base)
    expect(meta.robots).toBeUndefined()
  })
})
