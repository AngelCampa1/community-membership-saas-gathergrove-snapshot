import React from 'react'
import { render, screen } from '@testing-library/react'
import FAQPage from '../page'

describe('FAQPage', () => {
  it('renders the page without crashing', () => {
    expect(() => render(<FAQPage />)).not.toThrow()
  })

  it('renders the FAQ heading', () => {
    render(<FAQPage />)
    expect(
      screen.getByRole('heading', { name: /frequently asked questions/i })
    ).toBeInTheDocument()
  })

  it('renders "Start Free Trial" link(s) to /register', () => {
    render(<FAQPage />)
    const links = screen.getAllByRole('link', { name: /start free trial/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    links.forEach((link) => expect(link).toHaveAttribute('href', '/register'))
  })

  it('renders a "Browse Resources" link to /resources', () => {
    render(<FAQPage />)
    const link = screen.getByRole('link', { name: /browse resources/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/resources')
  })

  it('renders a "Browse Glossary" link to /glossary', () => {
    render(<FAQPage />)
    const link = screen.getByRole('link', { name: /browse glossary/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/glossary')
  })

  it('renders a "Formation Guides" link to /how-to-start', () => {
    render(<FAQPage />)
    const links = screen.getAllByRole('link', { name: /formation guides/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute('href', '/how-to-start')
  })

  it('renders a "Solutions by Club Type" link to /for', () => {
    render(<FAQPage />)
    const link = screen.getByRole('link', { name: /solutions by club type/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/for')
  })
})
