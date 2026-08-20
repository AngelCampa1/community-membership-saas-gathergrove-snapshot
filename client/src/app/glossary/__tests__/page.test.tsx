import { render, screen } from '@testing-library/react'
import GlossaryHubPage from '../page'
import { GLOSSARY_ENTRIES, GLOSSARY_CATEGORIES } from '@/lib/data/glossary'
import { RETAINED_GLOSSARY_SLUGS } from '@/lib/seo-content-config'

// The page only renders the retained subset of glossary entries
const RETAINED_GLOSSARY_ENTRIES = GLOSSARY_ENTRIES.filter((e) =>
  (RETAINED_GLOSSARY_SLUGS as readonly string[]).includes(e.slug)
)
// Only categories that actually have retained entries are rendered
const RENDERED_CATEGORIES = GLOSSARY_CATEGORIES.filter((cat) =>
  RETAINED_GLOSSARY_ENTRIES.some((e) => e.category === cat)
)

describe('Glossary Hub Page', () => {
  it('renders the page heading', () => {
    render(<GlossaryHubPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Club Management Glossary'
    )
  })

  it('renders all retained category sections', () => {
    render(<GlossaryHubPage />)
    const h2s = screen.getAllByRole('heading', { level: 2 })
    // One h2 per rendered category + 1 for CTA
    expect(h2s.length).toBeGreaterThanOrEqual(RENDERED_CATEGORIES.length)
  })

  it('renders links to retained glossary term pages', () => {
    render(<GlossaryHubPage />)
    const links = screen.getAllByRole('link')
    // Should have at least one link per retained entry + nav/CTA links
    expect(links.length).toBeGreaterThanOrEqual(RETAINED_GLOSSARY_ENTRIES.length)
  })

  it('renders CTA section', () => {
    render(<GlossaryHubPage />)
    expect(screen.getByText(/Ready to simplify your club management/i)).toBeInTheDocument()
  })

  it('renders JSON-LD scripts', () => {
    const { container } = render(<GlossaryHubPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(2) // ItemList + Breadcrumb
  })

  it('includes ItemList schema with retained entries', () => {
    const { container } = render(<GlossaryHubPage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.innerHTML))
    const itemList = schemas.find((s) => s['@type'] === 'ItemList')
    expect(itemList).toBeDefined()
    expect(itemList.itemListElement.length).toBe(RETAINED_GLOSSARY_ENTRIES.length)
  })
})
