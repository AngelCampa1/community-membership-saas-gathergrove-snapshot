import { render, screen } from '@testing-library/react'
import ClubTypesHubPage, { generateMetadata } from '../page'
import { CLUB_TYPES } from '@/lib/data/club-types'
import { RETAINED_CLUB_TYPE_SLUGS } from '@/lib/seo-content-config'

// The page only renders the retained subset of club types (20 out of ~80 total)
const RETAINED_CLUB_TYPES = CLUB_TYPES.filter((ct) =>
  (RETAINED_CLUB_TYPE_SLUGS as readonly string[]).includes(ct.slug)
)

describe('ClubTypesHubPage', () => {
  it('renders the page heading', () => {
    render(<ClubTypesHubPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /club type/i
    )
  })

  it('renders all retained club types', () => {
    render(<ClubTypesHubPage />)
    RETAINED_CLUB_TYPES.forEach((ct) => {
      expect(screen.getByText(ct.name)).toBeInTheDocument()
    })
  })

  it('renders links to each retained club type page', () => {
    render(<ClubTypesHubPage />)
    RETAINED_CLUB_TYPES.forEach((ct) => {
      const escaped = ct.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const link = screen.getByRole('link', { name: new RegExp(escaped) })
      expect(link).toHaveAttribute('href', `/for/${ct.slug}`)
    })
  })

  it('renders retained club type descriptions', () => {
    render(<ClubTypesHubPage />)
    RETAINED_CLUB_TYPES.forEach((ct) => {
      expect(screen.getByText(ct.description)).toBeInTheDocument()
    })
  })

  it('renders JSON-LD schema scripts', () => {
    const { container } = render(<ClubTypesHubPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(2) // ItemList + Breadcrumb
  })

  it('includes ItemList schema with all retained club types', () => {
    const { container } = render(<ClubTypesHubPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const itemList = schemas.find((s) => s['@type'] === 'ItemList')
    expect(itemList).toBeDefined()
    expect(itemList.numberOfItems).toBe(RETAINED_CLUB_TYPES.length)
  })

  it('includes BreadcrumbList schema', () => {
    const { container } = render(<ClubTypesHubPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement).toHaveLength(2) // Home + Club Types
  })

  it('renders a CTA section with register link', () => {
    render(<ClubTypesHubPage />)
    const registerLinks = screen.getAllByRole('link', { name: /get started|start free/i })
    expect(registerLinks.length).toBeGreaterThan(0)
    expect(registerLinks[0]).toHaveAttribute('href', '/register')
  })
})

describe('ClubTypesHubPage generateMetadata', () => {
  it('returns metadata with title and description', () => {
    const metadata = generateMetadata()
    const titleStr = typeof metadata.title === 'string' ? metadata.title : (metadata.title as { absolute?: string })?.absolute ?? ''
    expect(titleStr).toContain('GatherGrove')
    expect(metadata.description).toBeTruthy()
  })
})
