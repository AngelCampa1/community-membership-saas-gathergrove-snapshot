import { render, screen } from '@testing-library/react'
import HowToStartHubPage from '../page'
import { HOW_TO_START_ENTRIES, HOW_TO_START_CATEGORIES } from '@/lib/data/how-to-start'
import { RETAINED_HOW_TO_START_SLUGS } from '@/lib/seo-content-config'

// The page only renders the retained subset of how-to-start entries
const RETAINED_HOW_TO_START_ENTRIES = HOW_TO_START_ENTRIES.filter((e) =>
  (RETAINED_HOW_TO_START_SLUGS as readonly string[]).includes(e.slug)
)
// Only categories that have retained entries are rendered
const RENDERED_CATEGORIES = HOW_TO_START_CATEGORIES.filter((cat) =>
  RETAINED_HOW_TO_START_ENTRIES.some((e) => e.category === cat)
)

describe('How-to-Start Hub Page', () => {
  it('renders the page heading', () => {
    render(<HowToStartHubPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'How to Start a Club'
    )
  })

  it('renders category sections', () => {
    render(<HowToStartHubPage />)
    const h2s = screen.getAllByRole('heading', { level: 2 })
    expect(h2s.length).toBeGreaterThanOrEqual(1)
  })

  it('renders links to how-to-start pages', () => {
    render(<HowToStartHubPage />)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(RETAINED_HOW_TO_START_ENTRIES.length)
  })

  it('renders at least one retained entry', () => {
    render(<HowToStartHubPage />)
    // Verify at least one retained entry title is displayed
    const firstRetained = RETAINED_HOW_TO_START_ENTRIES[0]
    if (firstRetained) {
      expect(screen.getByText(firstRetained.title)).toBeInTheDocument()
    } else {
      expect(RETAINED_HOW_TO_START_ENTRIES.length).toBeGreaterThan(0)
    }
  })

  it('renders CTA section', () => {
    render(<HowToStartHubPage />)
    const ctaLinks = screen.getAllByText(/start free trial/i)
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders JSON-LD scripts', () => {
    const { container } = render(<HowToStartHubPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(2) // ItemList + Breadcrumb
  })
})
