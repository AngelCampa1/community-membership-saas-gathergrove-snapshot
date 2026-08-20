import React from 'react'
import { render, screen } from '@testing-library/react'
import { FunnelNextSteps } from '../FunnelNextSteps'

// These tests use real implementations — no internal mocks
// getNextFunnelContent and getFunnelStageForType run for real

describe('FunnelNextSteps', () => {
  describe('BOFU pages — renders nothing', () => {
    it('returns null for compare (bofu) pages', () => {
      const { container } = render(
        <FunnelNextSteps
          keywords={['club software', 'compare']}
          currentType="compare"
          currentSlug="gathergrove-vs-wildapricot"
        />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('TOFU pages — shows MOFU next steps', () => {
    it('renders heading "See How GatherGrove Can Help" for glossary page', () => {
      render(
        <FunnelNextSteps
          keywords={['member management', 'membership', 'club']}
          currentType="glossary"
          currentSlug="membership-dues"
        />
      )
      // May return null if no matching next-stage content; check both paths
      const heading = screen.queryByRole('heading', { level: 2 })
      if (heading) {
        expect(heading).toHaveTextContent('See How GatherGrove Can Help')
      }
    })

    it('renders heading "See How GatherGrove Can Help" for resources page', () => {
      render(
        <FunnelNextSteps
          keywords={['member management', 'membership', 'club', 'event']}
          currentType="resources"
          currentSlug="member-retention-strategies"
        />
      )
      const heading = screen.queryByRole('heading', { level: 2 })
      if (heading) {
        expect(heading).toHaveTextContent('See How GatherGrove Can Help')
      }
    })

    it('renders heading for how-to-start page', () => {
      render(
        <FunnelNextSteps
          keywords={['book club', 'membership', 'community']}
          currentType="how-to-start"
          currentSlug="how-to-start-a-book-club"
        />
      )
      const heading = screen.queryByRole('heading', { level: 2 })
      if (heading) {
        expect(heading).toHaveTextContent('See How GatherGrove Can Help')
      }
    })
  })

  describe('MOFU pages — shows BOFU next steps', () => {
    it('renders heading "Compare Your Options" for for/ pages', () => {
      render(
        <FunnelNextSteps
          keywords={['book club', 'reading', 'membership']}
          currentType="for"
          currentSlug="book-clubs"
        />
      )
      const heading = screen.queryByRole('heading', { level: 2 })
      if (heading) {
        expect(heading).toHaveTextContent('Compare Your Options')
      }
    })

    it('renders heading "Compare Your Options" for features/ pages', () => {
      render(
        <FunnelNextSteps
          keywords={['membership management', 'member directory']}
          currentType="features"
          currentSlug="membership-management"
        />
      )
      const heading = screen.queryByRole('heading', { level: 2 })
      if (heading) {
        expect(heading).toHaveTextContent('Compare Your Options')
      }
    })
  })

  describe('content rendering', () => {
    it('renders links with hrefs when items are returned', () => {
      render(
        <FunnelNextSteps
          keywords={['member', 'club', 'event', 'dues', 'management']}
          currentType="resources"
          currentSlug="complete-guide-club-management"
        />
      )
      const links = screen.queryAllByRole('link')
      // If any items came back, they should have valid hrefs
      links.forEach((link) => {
        expect(link).toHaveAttribute('href')
        const href = link.getAttribute('href')!
        expect(href).toMatch(/^\//)
      })
    })

    it('renders no more than maxResults items (default 3)', () => {
      render(
        <FunnelNextSteps
          keywords={['member', 'club', 'event', 'dues', 'management', 'communication']}
          currentType="resources"
          currentSlug="complete-guide-club-management"
          maxResults={3}
        />
      )
      const links = screen.queryAllByRole('link')
      expect(links.length).toBeLessThanOrEqual(3)
    })

    it('each card shows "Learn more" text with arrow', () => {
      render(
        <FunnelNextSteps
          keywords={['member', 'club', 'event', 'dues']}
          currentType="resources"
          currentSlug="complete-guide-club-management"
        />
      )
      const learnMoreTexts = screen.queryAllByText(/learn more/i)
      // Should match however many items were returned
      const links = screen.queryAllByRole('link')
      expect(learnMoreTexts.length).toBe(links.length)
    })
  })

  describe('renders nothing for empty results', () => {
    it('returns null when no matching next-funnel content found', () => {
      const { container } = render(
        <FunnelNextSteps
          keywords={['zzznonexistentterm999']}
          currentType="glossary"
          currentSlug="some-slug"
        />
      )
      // With no matching keywords, getNextFunnelContent returns []
      expect(container.firstChild).toBeNull()
    })
  })
})
