import React from 'react'
import { render, screen } from '@testing-library/react'
import { ResourceArticleFooter } from '../ResourceArticleFooter'
import type { ResourceEntry } from '@/lib/data/resources'

const baseResource: ResourceEntry = {
  slug: 'member-retention-strategies',
  title: 'Member Retention Strategies',
  seoTitle: 'Member Retention Strategies [2026]',
  description: 'Evidence-based approaches to keep members engaged.',
  category: 'Best Practices',
  readTime: '8 min read',
  datePublished: '2024-01-01',
  dateModified: '2025-12-01',
  keywords: ['member retention', 'club membership', 'engagement'],
  relatedSlugs: ['community-building-strategies', 'new-member-onboarding-best-practices'],
}

describe('ResourceArticleFooter', () => {
  it('renders related articles section when relatedSlugs are provided', () => {
    render(<ResourceArticleFooter resource={baseResource} />)
    expect(screen.getByText('Related Articles')).toBeInTheDocument()
  })

  it('links to related articles', () => {
    render(<ResourceArticleFooter resource={baseResource} />)
    const communityLinks = screen.getAllByRole('link', { name: /Community Building/i })
    // At least one link to the related resource should exist in the Related Articles section
    const relatedLink = communityLinks.find((l) => l.getAttribute('href') === '/resources/community-building-strategies')
    expect(relatedLink).toBeTruthy()
  })

  it('does not render Related Articles section when no relatedSlugs', () => {
    const resourceWithoutRelated: ResourceEntry = { ...baseResource, relatedSlugs: undefined }
    render(<ResourceArticleFooter resource={resourceWithoutRelated} />)
    expect(screen.queryByText('Related Articles')).not.toBeInTheDocument()
  })

  it('renders Explore More section with cross-silo links', () => {
    render(<ResourceArticleFooter resource={baseResource} />)
    expect(screen.getByText('Explore More')).toBeInTheDocument()
  })

  it('renders the FunnelCta with TOFU heading', () => {
    render(<ResourceArticleFooter resource={baseResource} />)
    expect(screen.getByText('Ready to put these strategies into practice?')).toBeInTheDocument()
  })

  it('renders empty relatedSlugs array without crashing', () => {
    const resourceEmptyRelated: ResourceEntry = { ...baseResource, relatedSlugs: [] }
    render(<ResourceArticleFooter resource={resourceEmptyRelated} />)
    expect(screen.queryByText('Related Articles')).not.toBeInTheDocument()
  })

  it('renders start free trial link in cta', () => {
    render(<ResourceArticleFooter resource={baseResource} />)
    // FunnelCta tofu stage shows "See How GatherGrove Helps"
    const ctaLink = screen.getByRole('link', { name: /See How GatherGrove Helps/i })
    expect(ctaLink).toHaveAttribute('href', '/features')
  })
})
