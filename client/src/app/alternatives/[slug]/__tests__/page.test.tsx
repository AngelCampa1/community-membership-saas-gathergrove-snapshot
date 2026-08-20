import React from 'react'
import { render, screen } from '@testing-library/react'
import AlternativesSlugPage, { generateMetadata } from '../page'

jest.mock('@/components/shared/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}))

jest.mock('@/components/shared/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}))

jest.mock('@/components/pseo/FunnelCta', () => ({
  FunnelCta: () => <div data-testid="funnel-cta">CTA</div>,
}))

jest.mock('@/components/seo/Breadcrumbs', () => ({
  Breadcrumbs: () => <nav data-testid="breadcrumbs">Breadcrumbs</nav>,
}))

const validSlug = 'wild-apricot'

describe('AlternativesSlugPage', () => {
  it('renders the page for a valid slug', async () => {
    const page = await AlternativesSlugPage({ params: Promise.resolve({ slug: validSlug }) })
    const { container } = render(page)
    expect(container).toBeInTheDocument()
  })

  it('renders the page title', async () => {
    const page = await AlternativesSlugPage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders data-ai-answer attributes for AI extraction', async () => {
    const page = await AlternativesSlugPage({ params: Promise.resolve({ slug: validSlug }) })
    const { container } = render(page)
    expect(container.querySelectorAll('[data-ai-answer]').length).toBeGreaterThan(0)
  })

  it('renders FAQ section', async () => {
    const page = await AlternativesSlugPage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument()
  })

  it('renders alternatives section heading', async () => {
    const page = await AlternativesSlugPage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    const headings = screen.getAllByRole('heading')
    const altHeading = headings.find((h) => /top wild apricot alternatives/i.test(h.textContent ?? ''))
    expect(altHeading).toBeInTheDocument()
  })

  it('renders JSON-LD scripts', async () => {
    const page = await AlternativesSlugPage({ params: Promise.resolve({ slug: validSlug }) })
    const { container } = render(page)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThan(0)
  })

  it('links to the compare page when compareSlug is set', async () => {
    const page = await AlternativesSlugPage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs.some((h) => h?.includes('/compare/wild-apricot'))).toBe(true)
  })

  it('renders why switch reasons', async () => {
    const page = await AlternativesSlugPage({ params: Promise.resolve({ slug: validSlug }) })
    render(page)
    expect(screen.getByText(/why clubs look for/i)).toBeInTheDocument()
  })

  it('renders notFound for unknown slug', async () => {
    await expect(
      AlternativesSlugPage({ params: Promise.resolve({ slug: 'nonexistent' }) })
    ).rejects.toThrow()
  })
})

describe('AlternativesSlugPage generateMetadata', () => {
  it('returns metadata for valid slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    expect(meta).toBeDefined()
    expect(meta).toHaveProperty('title')
  })

  it('title does not contain double GatherGrove branding', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    const gatherGroveCount = (title.match(/GatherGrove/gi) ?? []).length
    expect(gatherGroveCount).toBeLessThanOrEqual(1)
  })

  it('description is under 155 characters', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    expect(typeof meta.description).toBe('string')
    expect((meta.description as string).length).toBeLessThanOrEqual(155)
  })

  it('includes twitter card metadata', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    expect(meta.twitter).toBeDefined()
    expect(meta.twitter?.card).toBe('summary_large_image')
  })

  it('returns empty object for invalid slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'nonexistent-xyz' }) })
    expect(meta).toEqual({})
  })
})
