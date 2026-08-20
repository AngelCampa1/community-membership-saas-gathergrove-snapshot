import { render, screen } from '@testing-library/react'
import FeaturesHubPage, { generateMetadata } from '../page'
import { USE_CASES } from '@/lib/data/use-cases'
import { FEATURE_PAGES } from '@/lib/data/feature-pages'

describe('FeaturesHubPage', () => {
  it('renders the page heading', () => {
    render(<FeaturesHubPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /club management features/i
    )
  })

  it('renders all use cases', () => {
    render(<FeaturesHubPage />)
    USE_CASES.forEach((uc) => {
      expect(screen.getByText(uc.title)).toBeInTheDocument()
    })
  })

  it('renders links to each feature page', () => {
    render(<FeaturesHubPage />)
    USE_CASES.forEach((uc) => {
      const link = screen.getByRole('link', { name: new RegExp(uc.title) })
      expect(link).toHaveAttribute('href', `/features/${uc.slug}`)
    })
  })

  it('renders use case descriptions', () => {
    render(<FeaturesHubPage />)
    USE_CASES.forEach((uc) => {
      expect(screen.getByText(uc.problem)).toBeInTheDocument()
      expect(screen.getByText(uc.solution)).toBeInTheDocument()
    })
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<FeaturesHubPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(2) // ItemList + Breadcrumb
  })

  it('includes ItemList schema with all use cases', () => {
    const { container } = render(<FeaturesHubPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const itemList = schemas.find((s) => s['@type'] === 'ItemList')
    expect(itemList).toBeDefined()
    expect(itemList.numberOfItems).toBe(FEATURE_PAGES.length)
  })

  it('includes BreadcrumbList schema', () => {
    const { container } = render(<FeaturesHubPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(2) // Home + Features
  })

  it('renders a CTA section with register link', () => {
    render(<FeaturesHubPage />)
    const registerLinks = screen.getAllByRole('link', { name: /get started|start free/i })
    expect(registerLinks.length).toBeGreaterThan(0)
    expect(registerLinks[0]).toHaveAttribute('href', '/register')
  })
})

describe('FeaturesHubPage generateMetadata', () => {
  it('returns metadata with title and description', () => {
    const metadata = generateMetadata()
    const titleStr = typeof metadata.title === 'string' ? metadata.title : (metadata.title as { absolute?: string })?.absolute ?? ''
    expect(titleStr).toContain('GatherGrove')
    expect(metadata.description).toBeTruthy()
  })
})

describe('FeaturesHubPage - Specialized Solutions section', () => {
  it('renders the "Specialized Solutions" section heading', () => {
    render(<FeaturesHubPage />)
    expect(screen.getByText('Specialized Solutions')).toBeInTheDocument()
  })

  it('links to /features/nonprofit-event-management', () => {
    render(<FeaturesHubPage />)
    const link = screen.getByRole('link', { name: /nonprofit event management/i })
    expect(link).toHaveAttribute('href', '/features/nonprofit-event-management')
  })

  it('renders description for nonprofit-event-management card', () => {
    render(<FeaturesHubPage />)
    expect(screen.getByText(/online registration, ticketing/i)).toBeInTheDocument()
  })

  it('links to /features/community-management-software', () => {
    render(<FeaturesHubPage />)
    const link = screen.getByRole('link', { name: /community management software/i })
    expect(link).toHaveAttribute('href', '/features/community-management-software')
  })

  it('renders description for community-management-software card', () => {
    render(<FeaturesHubPage />)
    expect(screen.getByText(/member directory, event coordination/i)).toBeInTheDocument()
  })

  it('links to /features/member-database', () => {
    render(<FeaturesHubPage />)
    const link = screen.getByRole('link', { name: /member database software/i })
    expect(link).toHaveAttribute('href', '/features/member-database')
  })

  it('renders description for member-database card', () => {
    render(<FeaturesHubPage />)
    expect(screen.getByText(/structured member profiles with custom fields/i)).toBeInTheDocument()
  })
})
