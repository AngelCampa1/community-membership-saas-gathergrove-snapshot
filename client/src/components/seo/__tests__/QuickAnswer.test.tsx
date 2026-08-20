import React from 'react'
import { render, screen } from '@testing-library/react'
import { QuickAnswer } from '../QuickAnswer'

describe('QuickAnswer', () => {
  it('renders question and answer', () => {
    render(<QuickAnswer question="What is GatherGrove?" answer="A club management platform." />)
    expect(screen.getByText('What is GatherGrove?')).toBeInTheDocument()
    expect(screen.getByText(/A club management platform/)).toBeInTheDocument()
  })

  it('has data-ai-answer attribute', () => {
    const { container } = render(<QuickAnswer question="Q?" answer="A." />)
    expect(container.querySelector('[data-ai-answer="true"]')).toBeInTheDocument()
  })

  it('has region role with aria-label', () => {
    render(<QuickAnswer question="Test?" answer="Answer." />)
    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Quick answer: Test?')
  })

  it('renders question as h3', () => {
    render(<QuickAnswer question="Question?" answer="Answer." />)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Question?')
  })

  it('bolds the first sentence of the answer', () => {
    const { container } = render(
      <QuickAnswer question="Q?" answer="First sentence. Second sentence." />
    )
    const strong = container.querySelector('strong')
    expect(strong).toHaveTextContent('First sentence.')
  })
})
