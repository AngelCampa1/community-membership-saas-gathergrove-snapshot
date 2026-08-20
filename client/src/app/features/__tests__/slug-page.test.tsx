import { render, screen } from '@testing-library/react'
import UseCasePage, { generateStaticParams, generateMetadata } from '../[slug]/page'
import { USE_CASES } from '@/lib/data/use-cases'

// Mock next/navigation
const mockNotFound = jest.fn()
jest.mock('next/navigation', () => ({
  notFound: (...args: unknown[]) => mockNotFound(...args),
}))

describe('Features [slug] Page', () => {
  const validSlug = USE_CASES[0].slug
  const validEntry = USE_CASES[0]

  beforeEach(() => {
    mockNotFound.mockReset()
  })

  it('generateStaticParams returns all use case slugs', () => {
    const params = generateStaticParams()
    expect(params).toHaveLength(USE_CASES.length)
    expect(params[0]).toHaveProperty('slug')
  })

  it('generateMetadata returns metadata for valid slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    expect(meta).toBeDefined()
    expect(meta).toHaveProperty('title')
  })

  it('generateMetadata returns empty object for invalid slug', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: 'nonexistent-xyz' }),
    })
    expect(meta).toEqual({})
  })

  it('renders use case title as h1', async () => {
    const page = await UseCasePage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(validEntry.title)
  })

  it('renders use case description', async () => {
    const page = await UseCasePage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    expect(screen.getByText(validEntry.description)).toBeInTheDocument()
  })

  it('renders features section', async () => {
    const page = await UseCasePage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    expect(screen.getByText(/what you get/i)).toBeInTheDocument()
    validEntry.features.forEach((feature) => {
      expect(screen.getByText(feature)).toBeInTheDocument()
    })
  })

  it('renders FAQ section', async () => {
    const page = await UseCasePage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument()
  })

  it('renders JSON-LD schema scripts', async () => {
    const page = await UseCasePage({ params: Promise.resolve({ slug: validSlug }) })
    const { container } = render(page)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3) // Article + Breadcrumb + FAQ
  })

  it('renders data-ai-answer attributes on key content for AI extraction', async () => {
    const page = await UseCasePage({ params: Promise.resolve({ slug: validSlug }) })
    const { container } = render(page)
    expect(container.querySelectorAll('[data-ai-answer]').length).toBeGreaterThan(0)
  })

  it('renders CTA link to /register', async () => {
    const page = await UseCasePage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    const registerLinks = screen.getAllByRole('link', { name: /start free/i })
    expect(registerLinks.length).toBeGreaterThan(0)
    expect(registerLinks[0]).toHaveAttribute('href', '/register')
  })

  it('calls notFound for invalid slug', async () => {
    mockNotFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND')
    })
    await expect(
      UseCasePage({ params: Promise.resolve({ slug: 'nonexistent-xyz' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockNotFound).toHaveBeenCalled()
  })

  it('generateMetadata title does not contain duplicate "| GatherGrove" suffix branding', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    // createPageMetadata appends "| GatherGrove" - the passed title must not already contain "| GatherGrove"
    expect(title).not.toMatch(/\| GatherGrove.*\| GatherGrove/i)
  })

  it('generateMetadata description is under 155 characters', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    expect(typeof meta.description).toBe('string')
    expect((meta.description as string).length).toBeLessThanOrEqual(155)
  })

  it('generateMetadata includes twitter card', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    expect(meta.twitter).toBeDefined()
    expect(meta.twitter?.card).toBe('summary_large_image')
  })
})
