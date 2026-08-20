import React from 'react'
import { render, screen } from '@testing-library/react'
import { HubCrossLinks } from '../HubCrossLinks'

describe('HubCrossLinks', () => {
  const ALL_HUB_IDS = [
    'resources', 'glossary', 'how-to-start', 'for', 'features', 'compare',
    'alternatives', 'templates', 'volunteer-management',
  ]

  describe('renders cross-links excluding current hub', () => {
    it('excludes the current hub from results', () => {
      render(<HubCrossLinks currentHub="resources" />)
      const links = screen.getAllByRole('link')
      const hrefs = links.map((l) => l.getAttribute('href'))
      expect(hrefs).not.toContain('/resources')
      expect(hrefs).toContain('/glossary')
      expect(hrefs).toContain('/for')
      expect(hrefs).toContain('/compare')
      expect(hrefs).toContain('/alternatives')
      expect(hrefs).toContain('/templates')
      expect(hrefs).toContain('/volunteer-management')
    })

    it('shows 8 links when current hub is "resources"', () => {
      render(<HubCrossLinks currentHub="resources" />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(8)
    })

    it('shows 8 links for any hub', () => {
      ALL_HUB_IDS.forEach((hubId) => {
        const { unmount } = render(<HubCrossLinks currentHub={hubId} />)
        const links = screen.getAllByRole('link')
        expect(links).toHaveLength(8)
        unmount()
      })
    })

    it('does not link to current hub for each hub', () => {
      ALL_HUB_IDS.forEach((hubId) => {
        const { unmount } = render(<HubCrossLinks currentHub={hubId} />)
        const links = screen.getAllByRole('link')
        const hrefs = links.map((l) => l.getAttribute('href'))
        expect(hrefs).not.toContain(`/${hubId}`)
        unmount()
      })
    })
  })

  describe('stage badges', () => {
    it('shows "Learn" badge for tofu hubs (resources, glossary, how-to-start, templates)', () => {
      render(<HubCrossLinks currentHub="compare" />)
      const badges = screen.getAllByText('Learn')
      expect(badges.length).toBe(4) // resources, glossary, how-to-start, templates
    })

    it('shows "Explore" badge for mofu hubs (for, features, volunteer-management)', () => {
      render(<HubCrossLinks currentHub="compare" />)
      const badges = screen.getAllByText('Explore')
      expect(badges.length).toBe(3) // for, features, volunteer-management
    })

    it('shows "Compare" badge for bofu hubs (compare, alternatives) when not excluded', () => {
      render(<HubCrossLinks currentHub="resources" />)
      const badges = screen.getAllByText('Compare')
      expect(badges.length).toBe(2) // compare + alternatives
    })
  })

  describe('content and structure', () => {
    it('renders section heading "Explore More Resources"', () => {
      render(<HubCrossLinks currentHub="for" />)
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Explore More Resources')
    })

    it('renders hub titles and descriptions', () => {
      render(<HubCrossLinks currentHub="for" />)
      expect(screen.getByText('Resources & Guides')).toBeInTheDocument()
      expect(screen.getByText('Compare Platforms')).toBeInTheDocument()
    })

    it('all links have valid href starting with /', () => {
      render(<HubCrossLinks currentHub="glossary" />)
      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link.getAttribute('href')).toMatch(/^\//)
      })
    })
  })

  describe('unknown currentHub', () => {
    it('shows all 9 hubs when currentHub does not match any entry', () => {
      render(<HubCrossLinks currentHub="unknown-hub" />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(9)
    })
  })
})
