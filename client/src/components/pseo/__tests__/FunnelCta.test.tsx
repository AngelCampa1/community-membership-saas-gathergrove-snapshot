import React from 'react'
import { render, screen } from '@testing-library/react'
import { FunnelCta } from '../FunnelCta'

describe('FunnelCta', () => {
  describe('TOFU stage', () => {
    it('renders with tofu defaults when no heading/description given', () => {
      render(<FunnelCta currentStage="tofu" />)
      expect(screen.getByText('Ready to simplify your club management?')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /See How GatherGrove Helps/i })).toHaveAttribute('href', '/features')
      expect(screen.getByRole('link', { name: /Explore More Guides/i })).toHaveAttribute('href', '/resources')
    })

    it('renders custom heading and description', () => {
      render(
        <FunnelCta
          currentStage="tofu"
          heading="Custom Heading"
          description="Custom description text"
        />
      )
      expect(screen.getByText('Custom Heading')).toBeInTheDocument()
      expect(screen.getByText('Custom description text')).toBeInTheDocument()
    })

    it('uses nextStepHref and nextStepText when provided', () => {
      render(
        <FunnelCta
          currentStage="tofu"
          heading="Test"
          nextStepHref="/features/event-management"
          nextStepText="Explore Event Tools"
        />
      )
      const link = screen.getByRole('link', { name: /Explore Event Tools/i })
      expect(link).toHaveAttribute('href', '/features/event-management')
    })
  })

  describe('MOFU stage', () => {
    it('renders mofu defaults', () => {
      render(<FunnelCta currentStage="mofu" />)
      expect(screen.getByRole('link', { name: /Start Free Trial/i })).toHaveAttribute('href', '/register')
      expect(screen.getByRole('link', { name: /Compare Options/i })).toHaveAttribute('href', '/compare')
    })

    it('renders custom heading for mofu', () => {
      render(<FunnelCta currentStage="mofu" heading="Start Managing Today" description="Free for 30 days." />)
      expect(screen.getByText('Start Managing Today')).toBeInTheDocument()
      expect(screen.getByText('Free for 30 days.')).toBeInTheDocument()
    })
  })

  describe('BOFU stage', () => {
    it('renders bofu defaults', () => {
      render(<FunnelCta currentStage="bofu" />)
      expect(screen.getByRole('link', { name: /Start Free Trial/i })).toHaveAttribute('href', '/register')
      expect(screen.getByRole('link', { name: /See Pricing/i })).toHaveAttribute('href', '/pricing')
    })
  })

  describe('default content', () => {
    it('shows default heading when no heading or description given', () => {
      render(<FunnelCta currentStage="mofu" />)
      expect(screen.getByText('Ready to simplify your club management?')).toBeInTheDocument()
      expect(screen.getByText('Start with a 30-day free trial on any plan. Cancel anytime.')).toBeInTheDocument()
    })

    it('does not render heading element when heading is provided but description is not', () => {
      render(<FunnelCta currentStage="tofu" heading="Only Heading" />)
      expect(screen.getByText('Only Heading')).toBeInTheDocument()
      // default fallback should not appear when heading is provided
      expect(screen.queryByText('Ready to simplify your club management?')).not.toBeInTheDocument()
    })
  })

  describe('link structure', () => {
    it('renders exactly two links', () => {
      render(<FunnelCta currentStage="mofu" />)
      const links = screen.getAllByRole('link')
      expect(links.length).toBe(2)
    })

    it('secondary link always uses stage defaults regardless of nextStepHref', () => {
      render(
        <FunnelCta
          currentStage="mofu"
          nextStepHref="/custom"
          nextStepText="Custom"
        />
      )
      // Secondary is always compare for mofu
      expect(screen.getByRole('link', { name: /Compare Options/i })).toHaveAttribute('href', '/compare')
    })
  })
})
