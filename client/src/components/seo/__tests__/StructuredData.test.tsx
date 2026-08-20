import React from 'react'
import { render } from '@testing-library/react'
import { StructuredData, schemas } from '../StructuredData'

describe('StructuredData', () => {
  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(<StructuredData />)).not.toThrow()
    })

    it('renders multiple script tags', () => {
      const { container } = render(<StructuredData />)
      const scripts = container.querySelectorAll('script[type="application/ld+json"]')
      expect(scripts.length).toBeGreaterThan(0)
    })

    it('renders 2 global schema script tags (Organization + WebSite)', () => {
      const { container } = render(<StructuredData />)
      const scripts = container.querySelectorAll('script[type="application/ld+json"]')
      expect(scripts.length).toBe(2)
    })
  })

  describe('Schema content validation', () => {
    it('organization schema has required fields', () => {
      expect(schemas.organization['@context']).toBe('https://schema.org')
      expect(schemas.organization['@type']).toBe('Organization')
      expect(schemas.organization.name).toBe('GatherGrove')
      expect(schemas.organization.url).toBeDefined()
    })

    it('website schema has correct type', () => {
      expect(schemas.website['@type']).toBe('WebSite')
      expect(schemas.website.name).toBe('GatherGrove')
    })

    it('does not include page-specific schemas globally', () => {
      // These schemas are now rendered contextually by their respective pages
      expect(schemas).not.toHaveProperty('product')
      expect(schemas).not.toHaveProperty('faq')
      expect(schemas).not.toHaveProperty('service')
      expect(schemas).not.toHaveProperty('article')
      expect(schemas).not.toHaveProperty('person')
    })
  })
})
