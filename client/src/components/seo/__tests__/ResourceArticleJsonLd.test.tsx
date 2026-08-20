import React from 'react'
import { render } from '@testing-library/react'
import { ResourceArticleJsonLd } from '../ResourceArticleJsonLd'
import type { ResourceEntry } from '@/lib/data/resources'

const mockResource: ResourceEntry = {
  slug: 'test-article',
  title: 'Test Article Title',
  seoTitle: 'Test SEO Title',
  description: 'Test description for the article.',
  category: 'Test Category',
  readTime: '5 min read',
  datePublished: '2024-01-01',
  dateModified: '2025-06-01',
  keywords: ['test', 'article'],
}

describe('ResourceArticleJsonLd', () => {
  it('renders without crashing', () => {
    expect(() => render(<ResourceArticleJsonLd resource={mockResource} />)).not.toThrow()
  })

  it('renders 3 JSON-LD script tags (Article + Breadcrumb + Person)', () => {
    const { container } = render(<ResourceArticleJsonLd resource={mockResource} />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBe(3)
  })

  it('includes Person schema for author E-E-A-T signals', () => {
    const { container } = render(<ResourceArticleJsonLd resource={mockResource} />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const personJson = JSON.parse(scripts[2].textContent || '{}')
    expect(personJson['@type']).toBe('Person')
    expect(personJson.name).toBe('Angel Campa')
  })

  it('includes Article schema with correct headline', () => {
    const { container } = render(<ResourceArticleJsonLd resource={mockResource} />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const articleJson = JSON.parse(scripts[0].textContent || '{}')
    expect(articleJson['@type']).toBe('Article')
    expect(articleJson.headline).toBe('Test Article Title')
    expect(articleJson.description).toBe('Test description for the article.')
    expect(articleJson.datePublished).toBe('2024-01-01')
    expect(articleJson.dateModified).toBe('2025-06-01')
  })

  it('includes Breadcrumb schema with 3 items (Home > Resources > Article)', () => {
    const { container } = render(<ResourceArticleJsonLd resource={mockResource} />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const breadcrumbJson = JSON.parse(scripts[1].textContent || '{}')
    expect(breadcrumbJson['@type']).toBe('BreadcrumbList')
    expect(breadcrumbJson.itemListElement).toHaveLength(3)
    expect(breadcrumbJson.itemListElement[0].name).toBe('Home')
    expect(breadcrumbJson.itemListElement[1].name).toBe('Resources')
    expect(breadcrumbJson.itemListElement[2].name).toBe('Test Article Title')
  })

  it('includes speakable CSS selectors in Article schema', () => {
    const { container } = render(<ResourceArticleJsonLd resource={mockResource} />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const articleJson = JSON.parse(scripts[0].textContent || '{}')
    expect(articleJson.speakable).toBeDefined()
    expect(articleJson.speakable.cssSelector).toContain('#key-takeaways')
    expect(articleJson.speakable.cssSelector).toContain('[data-ai-answer]')
  })

  it('includes keywords from resource', () => {
    const { container } = render(<ResourceArticleJsonLd resource={mockResource} />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const articleJson = JSON.parse(scripts[0].textContent || '{}')
    expect(articleJson.keywords).toEqual(['test', 'article'])
  })
})
