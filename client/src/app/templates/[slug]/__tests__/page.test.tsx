// TDD: tests written before implementation of templates/[slug]/page.tsx
import { render, screen } from '@testing-library/react'
import TemplateSlugPage, { generateStaticParams, generateMetadata } from '../page'
import { TEMPLATES } from '@/lib/data/templates'

// Mock next/navigation
const mockNotFound = jest.fn()
jest.mock('next/navigation', () => ({
  notFound: (...args: unknown[]) => mockNotFound(...args),
}))


const PRIMARY_SLUG = 'meeting-minutes-template'
const PRIMARY_ENTRY = TEMPLATES.find((t) => t.slug === PRIMARY_SLUG)!

describe('generateStaticParams', () => {
  it('returns an array with one entry per template', () => {
    const params = generateStaticParams()
    expect(params).toHaveLength(TEMPLATES.length)
  })

  it('includes meeting-minutes-template slug', () => {
    const params = generateStaticParams()
    expect(params.some((p) => p.slug === PRIMARY_SLUG)).toBe(true)
  })

  it('every param has a slug property', () => {
    const params = generateStaticParams()
    for (const p of params) {
      expect(typeof p.slug).toBe('string')
      expect(p.slug.length).toBeGreaterThan(0)
    }
  })
})

describe('generateMetadata', () => {
  it('returns metadata with correct title for meeting-minutes-template', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    const title = typeof metadata.title === 'string' ? metadata.title : JSON.stringify(metadata.title)
    expect(title).toContain('Meeting Minutes Template')
  })

  it('returns empty object for unknown slug', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'does-not-exist' }),
    })
    expect(metadata).toEqual({})
  })

  it('includes description in metadata', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    expect(metadata.description).toBeDefined()
    expect(typeof metadata.description).toBe('string')
  })

  it('sets canonical alternates', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    expect(String(metadata.alternates?.canonical)).toContain(PRIMARY_SLUG)
  })

  it('title does not contain double GatherGrove branding', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    const title = typeof metadata.title === 'string' ? metadata.title : JSON.stringify(metadata.title)
    const gatherGroveCount = (title.match(/GatherGrove/gi) ?? []).length
    expect(gatherGroveCount).toBeLessThanOrEqual(1)
  })

  it('description is under 155 characters', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    expect(typeof metadata.description).toBe('string')
    expect((metadata.description as string).length).toBeLessThanOrEqual(155)
  })

  it('includes twitter card metadata', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    expect(metadata.twitter).toBeDefined()
    expect(metadata.twitter?.card).toBe('summary_large_image')
  })
})

describe('TemplateSlugPage — meeting-minutes-template', () => {
  beforeEach(() => {
    mockNotFound.mockReset()
  })

  it('renders the template title as h1', async () => {
    const page = await TemplateSlugPage({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    render(page)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(PRIMARY_ENTRY.title)
  })

  it('renders template body in a pre block', async () => {
    const page = await TemplateSlugPage({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    const { container } = render(page)
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre?.textContent).toContain('ATTENDEES')
  })

  it('renders at least two CopyButton instances', async () => {
    const page = await TemplateSlugPage({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    render(page)
    const copyButtons = screen.getAllByRole('button', { name: /copy template/i })
    expect(copyButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('renders the "How to use this template" heading', async () => {
    const page = await TemplateSlugPage({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    render(page)
    expect(
      screen.getByRole('heading', { name: /how to use this template/i })
    ).toBeInTheDocument()
  })

  it('renders at least the first step title', async () => {
    const page = await TemplateSlugPage({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    render(page)
    expect(screen.getByText(PRIMARY_ENTRY.steps[0].title)).toBeInTheDocument()
  })

  it('renders FAQ questions', async () => {
    const page = await TemplateSlugPage({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    render(page)
    // First FAQ question should appear on the page
    expect(screen.getByText(PRIMARY_ENTRY.faqQuestions[0].question)).toBeInTheDocument()
  })

  it('renders breadcrumb containing "Templates"', async () => {
    const page = await TemplateSlugPage({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    render(page)
    expect(screen.getAllByText('Templates').length).toBeGreaterThanOrEqual(1)
  })

  it('renders links to related templates', async () => {
    const page = await TemplateSlugPage({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    render(page)
    const relatedLinks = screen.getAllByRole('link').filter((l) =>
      PRIMARY_ENTRY.relatedTemplates.some((slug) =>
        (l.getAttribute('href') ?? '').includes(slug)
      )
    )
    expect(relatedLinks.length).toBeGreaterThanOrEqual(
      PRIMARY_ENTRY.relatedTemplates.length
    )
  })

  it('renders JSON-LD schema scripts', async () => {
    const page = await TemplateSlugPage({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    const { container } = render(page)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3)
  })

  it('does not call notFound for a valid slug', async () => {
    await TemplateSlugPage({
      params: Promise.resolve({ slug: PRIMARY_SLUG }),
    })
    expect(mockNotFound).not.toHaveBeenCalled()
  })
})

describe('TemplateSlugPage — unknown slug', () => {
  beforeEach(() => {
    mockNotFound.mockReset()
  })

  it('calls notFound() for an unknown slug', async () => {
    await TemplateSlugPage({
      params: Promise.resolve({ slug: 'does-not-exist' }),
    })
    expect(mockNotFound).toHaveBeenCalled()
  })
})
