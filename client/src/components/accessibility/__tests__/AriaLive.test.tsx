/**
 * Tests for AriaLive.tsx - ARIA live region component and hook
 * Following boundary mocking pattern: test real component behavior
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import AriaLive, { useAriaLive } from '../AriaLive';

describe('AriaLive component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<AriaLive />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('role', 'status');
    });

    it('renders with message', () => {
      const { getByText } = render(<AriaLive message="Test message" />);

      expect(getByText('Test message')).toBeInTheDocument();
    });

    it('applies sr-only class by default', () => {
      const { container } = render(<AriaLive message="Test" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveClass('sr-only');
    });

    it('applies custom className', () => {
      const { container } = render(<AriaLive message="Test" className="custom-class" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveClass('custom-class');
    });
  });

  describe('Politeness levels', () => {
    it('renders with polite politeness', () => {
      const { container } = render(<AriaLive message="Test" politeness="polite" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('renders with assertive politeness', () => {
      const { container } = render(<AriaLive message="Test" politeness="assertive" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('renders with off politeness', () => {
      const { container } = render(<AriaLive message="Test" politeness="off" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-live', 'off');
    });
  });

  describe('ARIA attributes', () => {
    it('sets aria-atomic to true by default', () => {
      const { container } = render(<AriaLive message="Test" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('sets aria-atomic to false when specified', () => {
      const { container } = render(<AriaLive message="Test" atomic={false} />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-atomic', 'false');
    });

    it('sets aria-relevant to "text additions" by default', () => {
      const { container } = render(<AriaLive message="Test" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-relevant', 'text additions');
    });

    it('sets custom aria-relevant value', () => {
      const { container } = render(<AriaLive message="Test" relevant="all" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-relevant', 'all');
    });

    it('always includes role="status"', () => {
      const { container } = render(<AriaLive message="Test" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('role', 'status');
    });
  });

  describe('Message updates', () => {
    it('updates message when prop changes', () => {
      const { rerender, getByText } = render(<AriaLive message="Initial message" />);

      expect(getByText('Initial message')).toBeInTheDocument();

      rerender(<AriaLive message="Updated message" />);

      expect(getByText('Updated message')).toBeInTheDocument();
    });

    it('renders empty when no message provided', () => {
      const { container } = render(<AriaLive />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion.textContent).toBe('');
    });
  });

  describe('Accessibility compliance', () => {
    it('provides correct ARIA live region structure', () => {
      const { container } = render(<AriaLive message="Test" />);
      const liveRegion = container.firstChild as HTMLElement;

      // Should have all required ARIA attributes
      expect(liveRegion).toHaveAttribute('aria-live');
      expect(liveRegion).toHaveAttribute('aria-atomic');
      expect(liveRegion).toHaveAttribute('aria-relevant');
      expect(liveRegion).toHaveAttribute('role');
    });

    it('is hidden from visual users but available to screen readers', () => {
      const { container } = render(<AriaLive message="Test" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveClass('sr-only');
    });
  });
});

describe('useAriaLive hook', () => {
  const TestComponent = ({ message, politeness }: { message?: string; politeness?: 'polite' | 'assertive' }) => {
    const { announce } = useAriaLive();

    return (
      <>
        <div aria-live="polite" id="polite-announcer"></div>
        <div aria-live="assertive" id="assertive-announcer"></div>
        <button
          onClick={() => announce(message || 'Test announcement', politeness)}
        >
          Announce
        </button>
      </>
    );
  };

  beforeEach(() => {
    // Clear any existing live regions
    document.body.innerHTML = '';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('announce function', () => {
    it('announces to polite live region by default', () => {
      const { getByRole } = render(<TestComponent message="Test message" />);

      act(() => {
        getByRole('button').click();
      });

      const politeAnnouncer = document.getElementById('polite-announcer');
      expect(politeAnnouncer?.textContent).toBe('Test message');
    });

    it('announces to assertive live region when specified', () => {
      const { getByRole } = render(<TestComponent message="Urgent message" politeness="assertive" />);

      act(() => {
        getByRole('button').click();
      });

      const assertiveAnnouncer = document.getElementById('assertive-announcer');
      expect(assertiveAnnouncer?.textContent).toBe('Urgent message');
    });

    it('clears message after 1 second', () => {
      const { getByRole } = render(<TestComponent message="Temporary message" />);

      act(() => {
        getByRole('button').click();
      });

      const politeAnnouncer = document.getElementById('polite-announcer');
      expect(politeAnnouncer?.textContent).toBe('Temporary message');

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(politeAnnouncer?.textContent).toBe('');
    });

    it('does nothing if live region does not exist', () => {
      const TestNoRegion = () => {
        const { announce } = useAriaLive();
        return <button onClick={() => announce('Test')}>Announce</button>;
      };

      const { getByRole } = render(<TestNoRegion />);

      // Should not throw error
      expect(() => {
        act(() => {
          getByRole('button').click();
        });
      }).not.toThrow();
    });
  });

  describe('Message queuing', () => {
    it('handles multiple announcements', () => {
      const { getByRole } = render(<TestComponent />);

      act(() => {
        const { announce } = useAriaLive();
        announce('First message');
        announce('Second message');
      });

      const politeAnnouncer = document.getElementById('polite-announcer');
      // Last message wins
      expect(politeAnnouncer?.textContent).toBe('Second message');
    });

    it('clears each message after timeout', () => {
      const { getByRole } = render(<TestComponent message="Message 1" />);

      act(() => {
        getByRole('button').click();
      });

      const politeAnnouncer = document.getElementById('polite-announcer');
      expect(politeAnnouncer?.textContent).toBe('Message 1');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(politeAnnouncer?.textContent).toBe('Message 1'); // Still there

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(politeAnnouncer?.textContent).toBe(''); // Cleared
    });
  });

  describe('Integration with AriaLive component', () => {
    it('works with AriaLive component', () => {
      const IntegratedTest = () => {
        const { announce } = useAriaLive();

        return (
          <>
            <AriaLive politeness="polite" />
            <button onClick={() => announce('Integrated announcement')}>
              Announce
            </button>
          </>
        );
      };

      const { getByRole, container } = render(<IntegratedTest />);

      act(() => {
        getByRole('button').click();
      });

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toBe('Integrated announcement');
    });

    it('supports both polite and assertive announcements', () => {
      const MultiPolitenessTest = () => {
        const { announce } = useAriaLive();

        return (
          <>
            <AriaLive politeness="polite" />
            <AriaLive politeness="assertive" />
            <button onClick={() => announce('Polite', 'polite')}>Polite</button>
            <button onClick={() => announce('Assertive', 'assertive')}>Assertive</button>
          </>
        );
      };

      const { getAllByRole } = render(<MultiPolitenessTest />);
      const buttons = getAllByRole('button');

      act(() => {
        buttons[0].click(); // Polite
      });

      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('Polite');

      act(() => {
        buttons[1].click(); // Assertive
      });

      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      expect(assertiveRegion?.textContent).toBe('Assertive');
    });
  });
});
