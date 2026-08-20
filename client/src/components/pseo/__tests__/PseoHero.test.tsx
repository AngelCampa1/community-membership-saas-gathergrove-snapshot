import { render, screen } from '@testing-library/react'
import { PseoHero } from '../PseoHero'

describe('PseoHero', () => {
  it('renders title and description', () => {
    render(
      <PseoHero
        badge="Feature"
        title="Test Title"
        description="Test description text"
      />
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Title')
    expect(screen.getByText('Test description text')).toBeInTheDocument()
  })

  it('renders badge text', () => {
    render(
      <PseoHero
        badge="Glossary"
        title="Title"
        description="Desc"
      />
    )
    expect(screen.getByText('Glossary')).toBeInTheDocument()
  })

  it('renders last updated date when provided', () => {
    render(
      <PseoHero
        badge="Feature"
        title="Title"
        description="Desc"
        lastUpdated="2026-03-16"
      />
    )
    expect(screen.getByText(/March 2026/)).toBeInTheDocument()
  })

  it('renders CTA link to /register by default', () => {
    render(
      <PseoHero
        badge="Feature"
        title="Title"
        description="Desc"
      />
    )
    const link = screen.getByRole('link', { name: /start free/i })
    expect(link).toHaveAttribute('href', '/register')
  })

  it('renders custom CTA when provided', () => {
    render(
      <PseoHero
        badge="Feature"
        title="Title"
        description="Desc"
        ctaText="Learn More"
        ctaHref="/features"
      />
    )
    const link = screen.getByRole('link', { name: /learn more/i })
    expect(link).toHaveAttribute('href', '/features')
  })

  it('renders secondary CTA when provided', () => {
    render(
      <PseoHero
        badge="Feature"
        title="Title"
        description="Desc"
        secondaryCtaText="Read Guide"
        secondaryCtaHref="/resources/guide"
      />
    )
    const link = screen.getByRole('link', { name: /read guide/i })
    expect(link).toHaveAttribute('href', '/resources/guide')
  })

  it('does not render secondary CTA when not provided', () => {
    render(
      <PseoHero
        badge="Feature"
        title="Title"
        description="Desc"
      />
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
  })
})
