import React from 'react'
import { render, screen } from '@testing-library/react'
import AlternativesPage from '../page'

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

describe('AlternativesPage (hub)', () => {
  it('renders the page heading', () => {
    render(<AlternativesPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders links to all alternative slugs', () => {
    render(<AlternativesPage />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs.some((h) => h?.includes('/alternatives/wild-apricot'))).toBe(true)
    expect(hrefs.some((h) => h?.includes('/alternatives/clubexpress'))).toBe(true)
    expect(hrefs.some((h) => h?.includes('/alternatives/memberplanet'))).toBe(true)
    expect(hrefs.some((h) => h?.includes('/alternatives/spreadsheets'))).toBe(true)
  })

  it('renders data-ai-answer attributes for AI extraction', () => {
    const { container } = render(<AlternativesPage />)
    expect(container.querySelectorAll('[data-ai-answer]').length).toBeGreaterThan(0)
  })

  it('renders a JSON-LD script tag', () => {
    const { container } = render(<AlternativesPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThan(0)
  })
})
