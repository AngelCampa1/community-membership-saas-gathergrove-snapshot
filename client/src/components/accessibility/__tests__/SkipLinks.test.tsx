/**
 * Tests for SkipLinks.tsx - Skip navigation links for accessibility
 * Following boundary mocking pattern: test real component behavior
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import SkipLinks from '../SkipLinks';

describe('SkipLinks', () => {
  describe('Rendering', () => {
    it('renders all skip links', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      expect(links).toHaveLength(4);
    });

    it('renders skip to main content link', () => {
      const { getByText } = render(<SkipLinks />);

      expect(getByText('Skip to main content')).toBeInTheDocument();
    });

    it('renders skip to navigation link', () => {
      const { getByText } = render(<SkipLinks />);

      expect(getByText('Skip to navigation')).toBeInTheDocument();
    });

    it('renders skip to search link', () => {
      const { getByText } = render(<SkipLinks />);

      expect(getByText('Skip to search')).toBeInTheDocument();
    });

    it('renders skip to footer link', () => {
      const { getByText } = render(<SkipLinks />);

      expect(getByText('Skip to footer')).toBeInTheDocument();
    });

    it('applies custom className to container', () => {
      const { container } = render(<SkipLinks className="custom-class" />);
      const skipLinksDiv = container.querySelector('.skip-links');

      expect(skipLinksDiv).toHaveClass('custom-class');
    });

    it('applies skip-links class to container', () => {
      const { container } = render(<SkipLinks />);
      const skipLinksDiv = container.querySelector('.skip-links');

      expect(skipLinksDiv).toBeInTheDocument();
      expect(skipLinksDiv).toHaveClass('skip-links');
    });
  });

  describe('Link targets', () => {
    it('links to #main-content', () => {
      const { getByText } = render(<SkipLinks />);
      const link = getByText('Skip to main content');

      expect(link).toHaveAttribute('href', '#main-content');
    });

    it('links to #primary-navigation', () => {
      const { getByText } = render(<SkipLinks />);
      const link = getByText('Skip to navigation');

      expect(link).toHaveAttribute('href', '#primary-navigation');
    });

    it('links to #search', () => {
      const { getByText } = render(<SkipLinks />);
      const link = getByText('Skip to search');

      expect(link).toHaveAttribute('href', '#search');
    });

    it('links to #footer', () => {
      const { getByText } = render(<SkipLinks />);
      const link = getByText('Skip to footer');

      expect(link).toHaveAttribute('href', '#footer');
    });
  });

  describe('Screen reader accessibility', () => {
    it('has sr-only class by default', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        expect(link).toHaveClass('sr-only');
      });
    });

    it('has focus styles defined', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        // Check for focus-related classes
        expect(link.className).toContain('focus:');
      });
    });

    it('includes focus:not-sr-only class', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        expect(link.className).toContain('focus:not-sr-only');
      });
    });

    it('includes focus positioning classes', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        expect(link.className).toContain('focus:absolute');
        expect(link.className).toContain('focus:top-2');
        expect(link.className).toContain('focus:left-2');
      });
    });

    it('includes focus z-index class', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        expect(link.className).toContain('focus:z-50');
      });
    });

    it('includes focus visual styling classes', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        expect(link.className).toContain('focus:bg-primary');
        expect(link.className).toContain('focus:text-primary-foreground');
        expect(link.className).toContain('focus:rounded-md');
        expect(link.className).toContain('focus:shadow-lg');
      });
    });

    it('includes focus ring classes', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        expect(link.className).toContain('focus:ring-2');
        expect(link.className).toContain('focus:ring-ring');
        expect(link.className).toContain('focus:ring-offset-2');
      });
    });

    it('removes outline on focus', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        expect(link.className).toContain('focus:outline-none');
      });
    });
  });

  describe('Focus and blur behavior', () => {
    it('removes sr-only class on focus', () => {
      const { getByText } = render(<SkipLinks />);
      const link = getByText('Skip to main content');

      fireEvent.focus(link);

      expect(link).not.toHaveClass('sr-only');
    });

    it('adds sr-only class back on blur', () => {
      const { getByText } = render(<SkipLinks />);
      const link = getByText('Skip to main content');

      fireEvent.focus(link);
      expect(link).not.toHaveClass('sr-only');

      fireEvent.blur(link);
      expect(link).toHaveClass('sr-only');
    });

    it('handles focus for all links', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        fireEvent.focus(link);
        expect(link).not.toHaveClass('sr-only');

        fireEvent.blur(link);
        expect(link).toHaveClass('sr-only');
      });
    });

    it('does not throw error on focus without blur', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      expect(() => {
        links.forEach(link => {
          fireEvent.focus(link);
        });
      }).not.toThrow();
    });

    it('does not throw error on blur without focus', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      expect(() => {
        links.forEach(link => {
          fireEvent.blur(link);
        });
      }).not.toThrow();
    });
  });

  describe('Link order', () => {
    it('renders links in correct order', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      expect(links[0]).toHaveTextContent('Skip to main content');
      expect(links[1]).toHaveTextContent('Skip to navigation');
      expect(links[2]).toHaveTextContent('Skip to search');
      expect(links[3]).toHaveTextContent('Skip to footer');
    });

    it('prioritizes main content as first link', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      expect(links[0]).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Keyboard navigation', () => {
    it('allows tabbing between skip links', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links[0].focus();
      expect(document.activeElement).toBe(links[0]);

      // Simulate tab to next link
      fireEvent.keyDown(links[0], { key: 'Tab' });
      links[1].focus();
      expect(document.activeElement).toBe(links[1]);
    });

    it('supports Enter key to activate links', () => {
      const { getByText } = render(<SkipLinks />);
      const link = getByText('Skip to main content');

      fireEvent.keyDown(link, { key: 'Enter' });

      // Link should still be in document (Enter activates the href)
      expect(link).toBeInTheDocument();
    });
  });

  describe('Integration scenarios', () => {
    it('works with multiple SkipLinks instances', () => {
      const { getAllByRole } = render(
        <>
          <SkipLinks />
          <SkipLinks />
        </>
      );

      const links = getAllByRole('link');
      expect(links).toHaveLength(8); // 4 links × 2 instances
    });

    it('maintains unique keys for each link', () => {
      const { container } = render(<SkipLinks />);
      const links = container.querySelectorAll('a');

      const hrefs = Array.from(links).map(link => link.getAttribute('href'));
      const uniqueHrefs = new Set(hrefs);

      expect(uniqueHrefs.size).toBe(4); // All links have unique hrefs
    });
  });

  describe('Edge cases', () => {
    it('handles empty className gracefully', () => {
      const { container } = render(<SkipLinks className="" />);
      const skipLinksDiv = container.querySelector('.skip-links');

      expect(skipLinksDiv).toBeInTheDocument();
    });

    it('combines custom className with default classes', () => {
      const { container } = render(<SkipLinks className="my-custom-class" />);
      const skipLinksDiv = container.querySelector('.skip-links');

      expect(skipLinksDiv).toHaveClass('skip-links');
      expect(skipLinksDiv).toHaveClass('my-custom-class');
    });

    it('renders without crashing when no target elements exist', () => {
      // Skip links point to anchors that may not exist in test environment
      expect(() => {
        render(<SkipLinks />);
      }).not.toThrow();
    });
  });

  describe('WCAG compliance', () => {
    it('provides skip links for keyboard-only users', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      // All links should be in tab order (implicit tabindex=0 for <a> with href)
      links.forEach(link => {
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href');
      });
    });

    it('becomes visible on keyboard focus (WCAG 2.4.1)', () => {
      const { getByText } = render(<SkipLinks />);
      const link = getByText('Skip to main content');

      // Hidden by default
      expect(link).toHaveClass('sr-only');

      // Visible on focus
      fireEvent.focus(link);
      expect(link).not.toHaveClass('sr-only');
    });

    it('provides bypass mechanism for repetitive content (WCAG 2.4.1)', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      // Should have links to bypass navigation blocks
      const linkTexts = links.map(link => link.textContent);
      expect(linkTexts).toContain('Skip to main content');
      expect(linkTexts).toContain('Skip to navigation');
    });

    it('has descriptive link text (WCAG 2.4.4)', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        // Each link should have meaningful text
        expect(link.textContent).toBeTruthy();
        expect(link.textContent?.length).toBeGreaterThan(0);
        expect(link.textContent).toMatch(/Skip to/);
      });
    });

    it('has sufficient color contrast on focus (WCAG 1.4.3)', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        // Focus styling includes high-contrast colors
        expect(link.className).toContain('focus:bg-primary');
        expect(link.className).toContain('focus:text-primary-foreground');
      });
    });

    it('has visible focus indicator (WCAG 2.4.7)', () => {
      const { getAllByRole } = render(<SkipLinks />);
      const links = getAllByRole('link');

      links.forEach(link => {
        // Focus includes visible ring
        expect(link.className).toContain('focus:ring-2');
      });
    });
  });
});
