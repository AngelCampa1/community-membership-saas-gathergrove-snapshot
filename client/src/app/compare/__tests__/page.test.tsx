import React from 'react'
import { render, screen } from '@testing-library/react'
import ComparePage from '../page'

jest.mock('@/components/shared/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}))

jest.mock('@/components/shared/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}))

describe('ComparePage', () => {
  it('renders without crashing', () => {
    expect(() => render(<ComparePage />)).not.toThrow()
  })

  it('renders the page heading', () => {
    render(<ComparePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/compare club management/i)
  })

  it('renders comparison cards for each competitor', () => {
    render(<ComparePage />)
    expect(screen.getByText(/GatherGrove vs Wild Apricot/i)).toBeInTheDocument()
    expect(screen.getByText(/GatherGrove vs ClubExpress/i)).toBeInTheDocument()
    expect(screen.getByText(/GatherGrove vs MemberPlanet/i)).toBeInTheDocument()
    expect(screen.getByText(/GatherGrove vs Spreadsheets/i)).toBeInTheDocument()
  })

  it('renders links to individual comparison pages', () => {
    render(<ComparePage />)
    const links = screen.getAllByRole('link')
    const compareLinks = links.filter((l) => l.getAttribute('href')?.startsWith('/compare/'))
    expect(compareLinks.length).toBeGreaterThanOrEqual(4)
  })

  it('renders CTA section with register link', () => {
    render(<ComparePage />)
    const registerLinks = screen.getAllByRole('link').filter(
      (l) => l.getAttribute('href') === '/register'
    )
    expect(registerLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders JSON-LD scripts', () => {
    const { container } = render(<ComparePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBe(2) // ItemList + Breadcrumb
  })

  it('does not contain fabricated user counts', () => {
    render(<ComparePage />)
    const body = document.body.textContent || ''
    expect(body).not.toMatch(/\d+\+?\s*(users|clubs|organizations)\s*(use|trust|love)/i)
  })
})

describe('ComparePage — Best-Of Rankings section', () => {
  it('renders the "Best-Of Rankings" heading', () => {
    render(<ComparePage />)
    expect(screen.getByText('Best-Of Rankings')).toBeInTheDocument()
  })

  it('links to /compare/best-membership-management-software', () => {
    render(<ComparePage />)
    const link = screen.getByRole('link', { name: /best membership management software/i })
    expect(link).toHaveAttribute('href', '/compare/best-membership-management-software')
  })

  it('renders description for best-membership-management-software', () => {
    render(<ComparePage />)
    expect(screen.getByText(/ranked review of the best membership management software/i)).toBeInTheDocument()
  })

  it('links to /compare/best-club-management-software', () => {
    render(<ComparePage />)
    const link = screen.getByRole('link', { name: /best club management software/i })
    expect(link).toHaveAttribute('href', '/compare/best-club-management-software')
  })

  it('renders description for best-club-management-software', () => {
    render(<ComparePage />)
    expect(screen.getByText(/ranked review of the best club management software/i)).toBeInTheDocument()
  })

  it('links to /compare/best-event-registration-software', () => {
    render(<ComparePage />)
    const link = screen.getByRole('link', { name: /best event registration software/i })
    expect(link).toHaveAttribute('href', '/compare/best-event-registration-software')
  })

  it('renders description for best-event-registration-software', () => {
    render(<ComparePage />)
    expect(screen.getByText(/ranked review of the best event registration software/i)).toBeInTheDocument()
  })
})
