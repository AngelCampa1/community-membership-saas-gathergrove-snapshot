import React from 'react'
import { render } from '@testing-library/react'
import { JsonLd } from '../JsonLd'

describe('JsonLd', () => {
  it('renders a script tag with application/ld+json type', () => {
    const schema = { '@type': 'Organization', name: 'Test' }
    const { container } = render(<JsonLd schema={schema} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
  })

  it('serializes the schema as JSON', () => {
    const schema = { '@type': 'Organization', name: 'GatherGrove' }
    const { container } = render(<JsonLd schema={schema} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const content = script?.innerHTML ?? ''
    // The < is escaped as \u003c, so parse accordingly
    const parsed = JSON.parse(content)
    expect(parsed['@type']).toBe('Organization')
    expect(parsed.name).toBe('GatherGrove')
  })

  it('escapes <, >, and & characters to prevent injection', () => {
    const schema = { text: '</script><script>alert("xss")</script>', amp: 'a&b>c' }
    const { container } = render(<JsonLd schema={schema} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const content = script?.innerHTML ?? ''
    expect(content).not.toContain('</script>')
    expect(content).toContain('\\u003c')
    expect(content).toContain('\\u003e')
    expect(content).toContain('\\u0026')
  })

  it('handles arrays of schemas', () => {
    const schemas = [
      { '@type': 'Organization', name: 'Org' },
      { '@type': 'WebSite', name: 'Site' },
    ]
    const { container } = render(<JsonLd schema={schemas} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const parsed = JSON.parse(script?.innerHTML ?? '[]')
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(2)
  })

  it('handles null and empty objects', () => {
    const { container } = render(<JsonLd schema={{}} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(JSON.parse(script?.innerHTML ?? '')).toEqual({})
  })
})
