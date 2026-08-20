import React from 'react'
import { render, screen } from '@testing-library/react'
import ComparisonPage from '../page'

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}))

jest.mock('@/components/shared/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}))

jest.mock('@/components/shared/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}))

describe('ComparisonPage', () => {
  it('renders Wild Apricot comparison page', async () => {
    const page = await ComparisonPage({ params: Promise.resolve({ slug: 'wild-apricot' }) })
    render(page)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/GatherGrove vs Wild Apricot/i)
  })

  it('renders comparison table', async () => {
    const page = await ComparisonPage({ params: Promise.resolve({ slug: 'wild-apricot' }) })
    render(page)
    expect(screen.getByText('Feature Comparison')).toBeInTheDocument()
    expect(screen.getAllByText('Starting Price').length).toBeGreaterThanOrEqual(1)
  })

  it('renders FAQ section', async () => {
    const page = await ComparisonPage({ params: Promise.resolve({ slug: 'wild-apricot' }) })
    render(page)
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
  })

  it('renders verdict section', async () => {
    const page = await ComparisonPage({ params: Promise.resolve({ slug: 'wild-apricot' }) })
    render(page)
    expect(screen.getByText('Our Honest Take')).toBeInTheDocument()
  })

  it('renders JSON-LD scripts', async () => {
    const page = await ComparisonPage({ params: Promise.resolve({ slug: 'spreadsheets' }) })
    const { container } = render(page)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBe(2) // FAQ + Breadcrumb
  })

  it('renders CTA with register link', async () => {
    const page = await ComparisonPage({ params: Promise.resolve({ slug: 'clubexpress' }) })
    render(page)
    const registerLinks = screen.getAllByRole('link').filter(
      (l) => l.getAttribute('href') === '/register'
    )
    expect(registerLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders data-ai-answer attributes', async () => {
    const page = await ComparisonPage({ params: Promise.resolve({ slug: 'wild-apricot' }) })
    const { container } = render(page)
    const aiAnswerElements = container.querySelectorAll('[data-ai-answer="true"]')
    expect(aiAnswerElements.length).toBeGreaterThan(0)
  })
})

import { generateMetadata } from '../page'

describe('ComparisonPage generateMetadata', () => {
  it('returns metadata for valid slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'wild-apricot' }) })
    expect(meta).toBeDefined()
    expect(meta).toHaveProperty('title')
  })

  it('title does not contain duplicate "| GatherGrove" suffix branding', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'wild-apricot' }) })
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    // Should not have "| GatherGrove" appearing twice (double-brand suffix)
    expect(title).not.toMatch(/\| GatherGrove.*\| GatherGrove/i)
  })

  it('description is under 155 characters', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'wild-apricot' }) })
    expect(typeof meta.description).toBe('string')
    expect((meta.description as string).length).toBeLessThanOrEqual(155)
  })

  it('includes twitter card metadata', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'wild-apricot' }) })
    expect(meta.twitter).toBeDefined()
    expect(meta.twitter?.card).toBe('summary_large_image')
  })

  it('returns empty object for invalid slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'nonexistent-xyz' }) })
    expect(meta).toEqual({})
  })
})
