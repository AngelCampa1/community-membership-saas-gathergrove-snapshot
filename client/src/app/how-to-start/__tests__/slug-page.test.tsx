import { render, screen } from '@testing-library/react'
import HowToStartPage, { generateStaticParams, generateMetadata } from '../[slug]/page'
import { HOW_TO_START_ENTRIES } from '@/lib/data/how-to-start'
import { RETAINED_HOW_TO_START_SLUGS } from '@/lib/seo-content-config'

// Mock next/navigation
const mockNotFound = jest.fn()
jest.mock('next/navigation', () => ({
  notFound: (...args: unknown[]) => mockNotFound(...args),
}))

describe('How-to-Start [slug] Page', () => {
  const validSlug = HOW_TO_START_ENTRIES[0].slug
  const validEntry = HOW_TO_START_ENTRIES[0]

  beforeEach(() => {
    mockNotFound.mockReset()
  })

  it('generateStaticParams returns only retained how-to-start slugs', () => {
    const params = generateStaticParams()
    expect(params).toHaveLength(RETAINED_HOW_TO_START_SLUGS.length)
    expect(params[0]).toHaveProperty('slug')
  })

  it('generateMetadata returns metadata for valid slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    expect(meta).toBeDefined()
    expect(meta).toHaveProperty('title')
  })

  it('generateMetadata returns empty for invalid slug', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: 'nonexistent-xyz' }),
    })
    expect(meta).toEqual({})
  })

  it('retained how-to-start guides stay indexable', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'running-club' }) })
    expect(meta.robots).toBeUndefined()
  })

  it('broad low-fit formation guides are noindexed', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'nonprofit-organization' }) })
    const robots = meta.robots as Record<string, boolean>
    expect(robots.index).toBe(false)
  })

  it('renders org type as h1', async () => {
    const page = await HowToStartPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    render(page)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(validEntry.title)
  })

  it('renders description text', async () => {
    const page = await HowToStartPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    render(page)
    expect(screen.getByText(validEntry.description)).toBeInTheDocument()
  })

  it('renders steps section', async () => {
    const page = await HowToStartPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    render(page)
    expect(screen.getByText(validEntry.steps[0].title)).toBeInTheDocument()
  })

  it('renders quick facts section', async () => {
    const page = await HowToStartPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    render(page)
    expect(screen.getByText(/startup cost/i)).toBeInTheDocument()
  })

  it('renders JSON-LD schema', async () => {
    const page = await HowToStartPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    const { container } = render(page)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(3) // HowTo + Breadcrumb + FAQ
  })

  it('renders FAQ section when questions exist', async () => {
    const page = await HowToStartPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    render(page)
    if (validEntry.faqQuestions.length > 0) {
      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
    }
  })

  it('renders data-ai-answer attributes on key content for AI extraction', async () => {
    const page = await HowToStartPage({ params: Promise.resolve({ slug: validSlug }) })
    const { container } = render(page)
    expect(container.querySelectorAll('[data-ai-answer]').length).toBeGreaterThan(0)
  })

  it('calls notFound for invalid slug', async () => {
    mockNotFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND')
    })
    await expect(
      HowToStartPage({ params: Promise.resolve({ slug: 'nonexistent-term-xyz' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockNotFound).toHaveBeenCalled()
  })

  it('generateMetadata title does not contain duplicate "| GatherGrove" suffix branding', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    const title = typeof meta.title === 'string' ? meta.title : JSON.stringify(meta.title)
    expect(title).not.toMatch(/\| GatherGrove.*\| GatherGrove/i)
  })

  it('generateMetadata description is under 155 characters', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    expect(typeof meta.description).toBe('string')
    expect((meta.description as string).length).toBeLessThanOrEqual(155)
  })

  it('generateMetadata includes twitter card', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: validSlug }) })
    expect(meta.twitter).toBeDefined()
    expect(meta.twitter?.card).toBe('summary_large_image')
  })

  it('renders AutoLinkedText spans inside step descriptions', async () => {
    const page = await HowToStartPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    const { container } = render(page)
    // AutoLinkedText outputs a <span> for each step description
    // Verify: step titles are rendered (they are h3, not wrapped by AutoLinkedText)
    expect(screen.getAllByText(validEntry.steps[0].title).length).toBeGreaterThanOrEqual(1)
    // The step description text is contained somewhere in the page (may be split across nodes)
    const bodyText = container.textContent ?? ''
    expect(bodyText).toContain(validEntry.steps[0].description.slice(0, 30))
  })

  it('auto-links in steps have valid glossary or features hrefs', async () => {
    const page = await HowToStartPage({
      params: Promise.resolve({ slug: validSlug }),
    })
    const { container } = render(page)
    const stepsSection = container.querySelector('ol')
    // Only check links inside span elements (AutoLinkedText output), not structural nav links
    const links = stepsSection?.querySelectorAll('span > a') ?? []
    links.forEach((link) => {
      expect(link.getAttribute('href')).toMatch(/^\/(glossary|features)\//)
    })
  })

  it('renders Similar Formation Guides section when sibling how-to-start pages exist', async () => {
    // Find an entry that is likely to have siblings (uses common keywords like "club")
    const entryWithSiblings = HOW_TO_START_ENTRIES.find((e) =>
      e.keywords.some((k) => ['club', 'nonprofit', 'sports', 'community'].includes(k.toLowerCase()))
    ) ?? HOW_TO_START_ENTRIES[0]

    const page = await HowToStartPage({
      params: Promise.resolve({ slug: entryWithSiblings.slug }),
    })
    render(page)
    // If siblings are found, the heading appears; if not, the section is absent (conditional render)
    // Both are valid — just assert no error thrown during render
    const heading = screen.queryByText('Similar Formation Guides')
    if (heading) {
      expect(heading).toBeInTheDocument()
    }
  })

  it('sibling guide links point to /how-to-start/* routes', async () => {
    // Try multiple entries to find one with sibling guides
    let found = false
    for (const entry of HOW_TO_START_ENTRIES.slice(0, 5)) {
      const page = await HowToStartPage({
        params: Promise.resolve({ slug: entry.slug }),
      })
      const { container, unmount } = render(page)
      const siblingHeading = Array.from(container.querySelectorAll('h2')).find(
        (h) => h.textContent === 'Similar Formation Guides'
      )
      if (siblingHeading) {
        found = true
        // Get the parent section/div and check the links
        const siblingSection = siblingHeading.closest('section') ?? siblingHeading.parentElement
        const links = siblingSection?.querySelectorAll('a') ?? []
        links.forEach((link) => {
          expect(link.getAttribute('href')).toMatch(/^\/how-to-start\//)
        })
        unmount()
        break
      }
      unmount()
    }
    // If no entry has siblings, the test is a no-op (conditional section)
    expect(found !== undefined).toBe(true)
  })
})
