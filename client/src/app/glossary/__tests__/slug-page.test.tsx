import { render, screen } from '@testing-library/react'
import GlossaryTermPage, { generateStaticParams, generateMetadata } from '../[slug]/page'
import { GLOSSARY_ENTRIES } from '@/lib/data/glossary'
import { RETAINED_GLOSSARY_SLUGS } from '@/lib/seo-content-config'

// Mock next/navigation
const mockNotFound = jest.fn()
const mockPermanentRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  notFound: (...args: unknown[]) => mockNotFound(...args),
  permanentRedirect: (...args: unknown[]) => mockPermanentRedirect(...args),
}))

describe('Glossary [slug] Page', () => {
  const validEntry = GLOSSARY_ENTRIES.find((entry) => RETAINED_GLOSSARY_SLUGS.includes(entry.slug as typeof RETAINED_GLOSSARY_SLUGS[number]))!
  const validSlug = validEntry.slug

  beforeEach(() => {
    mockNotFound.mockReset()
    mockPermanentRedirect.mockReset()
  })

  it('generateStaticParams returns only retained glossary slugs', () => {
    const params = generateStaticParams()
    expect(params).toHaveLength(RETAINED_GLOSSARY_SLUGS.length)
    expect(params[0]).toHaveProperty('slug')
  })

  it('generateMetadata returns metadata for valid slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    expect(meta).toBeDefined()
    expect(meta).toHaveProperty('title')
  })

  it('generateMetadata returns empty for invalid slug', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: 'nonexistent-xyz' }),
    })
    expect(meta).toEqual({})
  })

  it('retained strategic glossary terms stay indexable', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'event-registration' }) })
    expect(meta.robots).toBeUndefined()
  })

  it('broad low-fit glossary terms are noindexed', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: '501c3' }) })
    const robots = meta.robots as Record<string, boolean>
    expect(robots.index).toBe(false)
  })

  it('renders term as h1', async () => {
    const page = await GlossaryTermPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    render(page)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(validEntry.term)
  })

  it('renders definition text', async () => {
    const page = await GlossaryTermPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    render(page)
    expect(screen.getByText(validEntry.definition)).toBeInTheDocument()
  })

  it('renders extended definition section', async () => {
    const page = await GlossaryTermPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    render(page)
    expect(screen.getByText(/Understanding/)).toBeInTheDocument()
  })

  it('renders JSON-LD schema', async () => {
    const page = await GlossaryTermPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    const { container } = render(page)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3) // DefinedTerm + Breadcrumb + FAQ
  })

  it('renders FAQ section when questions exist', async () => {
    const page = await GlossaryTermPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    render(page)
    if (validEntry.faqQuestions.length > 0) {
      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
    }
  })

  it('calls notFound for invalid slug', async () => {
    mockNotFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND')
    })
    await expect(
      GlossaryTermPage({ params: Promise.resolve({ slug: 'nonexistent-term-xyz' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockNotFound).toHaveBeenCalled()
  })

  it('permanently redirects retired glossary pages to their consolidation target', async () => {
    mockPermanentRedirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    await expect(
      GlossaryTermPage({ params: Promise.resolve({ slug: '501c3' }) })
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(mockPermanentRedirect).toHaveBeenCalledWith('/glossary')
  })

  it('renders AutoLinkedText wrapper span in extended definition section', async () => {
    const page = await GlossaryTermPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    const { container } = render(page)
    // The extended definition section renders a wrapping span from AutoLinkedText
    const extendedSection = container.querySelector('section.bg-gray-50')
    expect(extendedSection).not.toBeNull()
    const span = extendedSection?.querySelector('span')
    expect(span).not.toBeNull()
    // The span's text content should contain the extendedDefinition text
    expect(span?.textContent).toContain(validEntry.extendedDefinition.slice(0, 20))
  })

  it('auto-links produce anchor tags in extended definition when matches exist', async () => {
    const page = await GlossaryTermPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    const { container } = render(page)
    const extendedSection = container.querySelector('section.bg-gray-50')
    // If any glossary/feature phrase matches, an <a> link will appear inside the section
    // This is an integration test — either 0 or more links are acceptable,
    // but if any exist they must have valid hrefs
    const links = extendedSection?.querySelectorAll('a') ?? []
    links.forEach((link) => {
      expect(link.getAttribute('href')).toMatch(/^\/(glossary|features)\//)
    })
  })
})
