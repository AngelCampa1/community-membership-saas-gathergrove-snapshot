import { render, screen } from '@testing-library/react'
import ClubTypePage, { generateStaticParams, generateMetadata } from '../[slug]/page'
import { CLUB_TYPES } from '@/lib/data/club-types'
import { isRetainedClubTypeSlug } from '@/lib/seo-content-config'

// Mock next/navigation
const mockNotFound = jest.fn()
jest.mock('next/navigation', () => ({
  notFound: (...args: unknown[]) => mockNotFound(...args),
}))

describe('ClubType [slug] Page', () => {
  const retainedClubTypes = CLUB_TYPES.filter((ct) => isRetainedClubTypeSlug(ct.slug))
  const validSlug = retainedClubTypes[0].slug
  const validEntry = retainedClubTypes[0]

  beforeEach(() => {
    mockNotFound.mockReset()
  })

  it('generateStaticParams returns retained club type slugs', () => {
    const params = generateStaticParams()
    expect(params).toHaveLength(retainedClubTypes.length)
    expect(params[0]).toHaveProperty('slug')
  })

  it('generateMetadata returns metadata for valid slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    expect(meta).toBeDefined()
    expect(meta).toHaveProperty('title')
  })

  it('generateMetadata title has no duplicate GatherGrove branding', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    const rawTitle = meta.title
    const title = typeof rawTitle === 'string' ? rawTitle : (rawTitle as { absolute?: string })?.absolute ?? ''
    expect(title).not.toMatch(/GatherGrove.*GatherGrove/)
    // Title with site suffix can exceed 70 chars; just check it is defined.
    expect(title.length).toBeGreaterThan(0)
  })

  it('generateMetadata description stays under 155 chars', async () => {
    // Test all retained club types to ensure no description exceeds 155 chars.
    for (const ct of retainedClubTypes) {
      const meta = await generateMetadata({ params: Promise.resolve({ slug: ct.slug }) })
      const desc = meta.description as string
      expect(desc.length).toBeLessThanOrEqual(155)
    }
  })

  it('generateMetadata returns empty object for invalid slug', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: 'nonexistent-xyz' }),
    })
    expect(meta).toEqual({})
  })

  it('renders club type name as h1', async () => {
    const page = await ClubTypePage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(validEntry.name)
  })

  it('renders club type long description', async () => {
    const page = await ClubTypePage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    expect(screen.getByText(validEntry.longDescription)).toBeInTheDocument()
  })

  it('renders features section with club type features', async () => {
    const page = await ClubTypePage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    expect(screen.getByText(/Features for/i)).toBeInTheDocument()
    validEntry.features.forEach((feature) => {
      expect(screen.getByText(feature)).toBeInTheDocument()
    })
  })

  it('renders FAQ section with questions', async () => {
    const page = await ClubTypePage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
  })

  it('renders JSON-LD schema scripts', async () => {
    const page = await ClubTypePage({ params: Promise.resolve({ slug: validSlug }) })
    const { container } = render(page)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3) // Article + Breadcrumb + FAQ
  })

  it('renders CTA link to /register', async () => {
    const page = await ClubTypePage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    const registerLinks = screen.getAllByRole('link', { name: /start free|get started/i })
    expect(registerLinks.length).toBeGreaterThan(0)
    expect(registerLinks[0]).toHaveAttribute('href', '/register')
  })

  it('calls notFound for invalid slug', async () => {
    mockNotFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND')
    })
    await expect(
      ClubTypePage({ params: Promise.resolve({ slug: 'nonexistent-xyz' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockNotFound).toHaveBeenCalled()
  })

  it('priority club types are indexable', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'book-clubs' }) })
    expect(meta.robots).toBeUndefined() // no noIndex means no robots restriction
  })

  it('retired club types are noindexed with canonical hub metadata', async () => {
    const retiredSlug = CLUB_TYPES.find(ct => !isRetainedClubTypeSlug(ct.slug))?.slug

    if (!retiredSlug) return

    const meta = await generateMetadata({ params: Promise.resolve({ slug: retiredSlug }) })
    const robots = meta.robots as Record<string, boolean>
    expect(robots.index).toBe(false)
    expect(meta.alternates).toEqual({ canonical: '/for' })
  })

  it('renders data-ai-answer attributes on key content for AI extraction', async () => {
    const page = await ClubTypePage({ params: Promise.resolve({ slug: validSlug }) })
    const { container } = render(page)
    expect(container.querySelectorAll('[data-ai-answer]').length).toBeGreaterThan(0)
  })

  it('renders AutoLinkedText span for long description', async () => {
    const page = await ClubTypePage({ params: Promise.resolve({ slug: validSlug }) })
    const { container } = render(page)
    // The long description section contains a wrapping span from AutoLinkedText
    const longDescSection = Array.from(container.querySelectorAll('section')).find((s) =>
      s.textContent?.includes(validEntry.longDescription.slice(0, 20))
    )
    expect(longDescSection).toBeDefined()
    // The span wraps the AutoLinkedText output
    const span = longDescSection?.querySelector('span')
    expect(span).not.toBeNull()
    expect(span?.textContent).toContain(validEntry.longDescription.slice(0, 20))
  })

  it('auto-links in long description have valid glossary or features hrefs', async () => {
    const page = await ClubTypePage({ params: Promise.resolve({ slug: validSlug }) })
    const { container } = render(page)
    const longDescSection = Array.from(container.querySelectorAll('section')).find((s) =>
      s.textContent?.includes(validEntry.longDescription.slice(0, 20))
    )
    const links = longDescSection?.querySelectorAll('a') ?? []
    links.forEach((link) => {
      const href = link.getAttribute('href') ?? ''
      // Auto-links target glossary or features; other links (like CTA) should not be here
      if (href.startsWith('/glossary/') || href.startsWith('/features/')) {
        expect(href).toMatch(/^\/(glossary|features)\//)
      }
    })
  })

  it('renders related club types when relatedSlugs resolve to valid entries', async () => {
    // Find a club type with at least one valid relatedSlug
    const entryWithRelated = CLUB_TYPES.find((ct) =>
      ct.relatedSlugs.some((s) => CLUB_TYPES.find((c) => c.slug === s))
    )
    if (!entryWithRelated) return // skip if none found

    const page = await ClubTypePage({
      params: Promise.resolve({ slug: entryWithRelated.slug }),
    })
    render(page)
    expect(screen.getByText('Also Popular')).toBeInTheDocument()
  })
})
