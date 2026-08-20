import { render, screen } from '@testing-library/react'
import { AutoLinkedText } from '../AutoLinkedText'

// Mock next/link to render as a plain anchor so we can assert href
jest.mock('next/link', () => {
  const MockLink = ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

// Mock getAutoLinkTargets to have predictable, deterministic targets in tests
jest.mock('@/lib/data/content-links', () => ({
  getAutoLinkTargets: jest.fn(),
}))

import { getAutoLinkTargets } from '@/lib/data/content-links'
const mockGetAutoLinkTargets = getAutoLinkTargets as jest.MockedFunction<typeof getAutoLinkTargets>

const MOCK_TARGETS = [
  { phrase: 'membership management', href: '/features/member-management' },
  { phrase: 'member dues', href: '/glossary/member-dues' },
  { phrase: 'membership', href: '/glossary/membership' },
  { phrase: 'event', href: '/glossary/event' },
]

describe('AutoLinkedText', () => {
  beforeEach(() => {
    mockGetAutoLinkTargets.mockReturnValue(MOCK_TARGETS)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders plain text when no matches found', () => {
    mockGetAutoLinkTargets.mockReturnValue([])
    render(
      <AutoLinkedText
        text="Some text with no matching phrases at all"
        currentType="glossary"
        currentSlug="dues"
      />
    )
    expect(screen.getByText('Some text with no matching phrases at all')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders a link when a matching phrase is found in text', () => {
    render(
      <AutoLinkedText
        text="Use membership management to track your members."
        currentType="glossary"
        currentSlug="test"
      />
    )
    const link = screen.getByRole('link', { name: 'membership management' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/features/member-management')
  })

  it('respects maxLinks limit (default 3)', () => {
    // Text has membership management, member dues, membership, event — 4 potential matches
    // But longest-first sorting means: "membership management" (20), "member dues" (10), "membership" (10), "event" (5)
    // With maxLinks=3, only first 3 non-overlapping matches should be linked
    render(
      <AutoLinkedText
        text="membership management and member dues are about membership. We also track each event."
        currentType="glossary"
        currentSlug="test"
      />
    )
    const links = screen.getAllByRole('link')
    expect(links.length).toBeLessThanOrEqual(3)
  })

  it('respects explicit maxLinks=1', () => {
    render(
      <AutoLinkedText
        text="membership management and member dues"
        currentType="glossary"
        currentSlug="test"
        maxLinks={1}
      />
    )
    const links = screen.getAllByRole('link')
    expect(links.length).toBe(1)
  })

  it('passes currentType and currentSlug to getAutoLinkTargets', () => {
    render(
      <AutoLinkedText
        text="some membership text"
        currentType="how-to-start"
        currentSlug="my-club"
      />
    )
    expect(mockGetAutoLinkTargets).toHaveBeenCalledWith({
      currentType: 'how-to-start',
      currentSlug: 'my-club',
    })
  })

  it('applies className to the wrapping span', () => {
    const { container } = render(
      <AutoLinkedText
        text="some text"
        currentType="glossary"
        currentSlug="test"
        className="my-custom-class"
      />
    )
    const span = container.querySelector('span')
    expect(span).toHaveClass('my-custom-class')
  })

  it('does not create overlapping links', () => {
    // "membership management" and "membership" overlap — only the longer one should be linked
    // because targets are sorted longest-first
    render(
      <AutoLinkedText
        text="membership management is great"
        currentType="glossary"
        currentSlug="test"
      />
    )
    // Should have exactly 1 link (membership management), not 2 (would overlap with membership)
    const links = screen.getAllByRole('link')
    expect(links.length).toBe(1)
    expect(links[0]).toHaveAttribute('href', '/features/member-management')
  })

  it('does not match partial words (word boundary enforcement)', () => {
    mockGetAutoLinkTargets.mockReturnValue([
      { phrase: 'event', href: '/glossary/event' },
    ])
    render(
      <AutoLinkedText
        text="eventful day at the eventroom but no standalone match here"
        currentType="glossary"
        currentSlug="test"
      />
    )
    // "event" is embedded inside "eventful" and "eventroom" — word boundary check should prevent linking
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('matches phrase that is a whole word even at start of string', () => {
    mockGetAutoLinkTargets.mockReturnValue([
      { phrase: 'membership', href: '/glossary/membership' },
    ])
    render(
      <AutoLinkedText
        text="membership is important for clubs"
        currentType="glossary"
        currentSlug="test"
      />
    )
    const link = screen.getByRole('link', { name: 'membership' })
    expect(link).toBeInTheDocument()
  })

  it('matches phrase that is a whole word at end of string', () => {
    mockGetAutoLinkTargets.mockReturnValue([
      { phrase: 'membership', href: '/glossary/membership' },
    ])
    render(
      <AutoLinkedText
        text="clubs rely on membership"
        currentType="glossary"
        currentSlug="test"
      />
    )
    const link = screen.getByRole('link', { name: 'membership' })
    expect(link).toBeInTheDocument()
  })

  it('renders remaining text outside matched phrases as plain text nodes', () => {
    mockGetAutoLinkTargets.mockReturnValue([
      { phrase: 'membership', href: '/glossary/membership' },
    ])
    const { container } = render(
      <AutoLinkedText
        text="Track membership records daily"
        currentType="glossary"
        currentSlug="test"
      />
    )
    // The link is present
    expect(screen.getByRole('link', { name: 'membership' })).toBeInTheDocument()
    // The wrapping span contains all the text including the non-linked parts
    const span = container.querySelector('span')
    expect(span?.textContent).toBe('Track membership records daily')
  })

  it('renders wrapping span even when no matches', () => {
    mockGetAutoLinkTargets.mockReturnValue([])
    const { container } = render(
      <AutoLinkedText text="no matches here" currentType="glossary" currentSlug="test" />
    )
    expect(container.querySelector('span')).toBeInTheDocument()
  })

  it('applies link styles to matched phrases', () => {
    mockGetAutoLinkTargets.mockReturnValue([
      { phrase: 'membership', href: '/glossary/membership' },
    ])
    render(
      <AutoLinkedText
        text="Track membership records"
        currentType="glossary"
        currentSlug="test"
      />
    )
    const link = screen.getByRole('link', { name: 'membership' })
    expect(link).toHaveClass('text-emerald-700')
  })
})
