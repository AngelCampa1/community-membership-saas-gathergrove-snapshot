import React from 'react'
import { render, screen } from '@testing-library/react'
import { DefinitionBox } from '../DefinitionBox'

describe('DefinitionBox', () => {
  it('renders term and definition', () => {
    render(<DefinitionBox term="Club Management" definition="Software for managing clubs" />)
    expect(screen.getByText('Club Management')).toBeInTheDocument()
    expect(screen.getByText('Software for managing clubs')).toBeInTheDocument()
  })

  it('has data-ai-definition attribute', () => {
    const { container } = render(<DefinitionBox term="Test" definition="Def" />)
    expect(container.querySelector('[data-ai-definition="true"]')).toBeInTheDocument()
  })

  it('generates id from term when slug not provided', () => {
    const { container } = render(<DefinitionBox term="Dues Automation" definition="Def" />)
    expect(container.querySelector('#definition-dues-automation')).toBeInTheDocument()
  })

  it('uses custom slug for id when provided', () => {
    const { container } = render(<DefinitionBox term="Test" definition="Def" slug="custom-id" />)
    expect(container.querySelector('#definition-custom-id')).toBeInTheDocument()
  })

  it('renders semantic dl/dt/dd elements', () => {
    const { container } = render(<DefinitionBox term="Term" definition="Def" />)
    expect(container.querySelector('dl')).toBeInTheDocument()
    expect(container.querySelector('dt')).toHaveTextContent('Term')
    expect(container.querySelector('dd')).toHaveTextContent('Def')
  })
})
