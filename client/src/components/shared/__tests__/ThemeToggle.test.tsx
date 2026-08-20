import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  it('renders nothing (returns null)', () => {
    const { container } = render(<ThemeToggle />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render a button', () => {
    const { queryByRole } = render(<ThemeToggle />);
    expect(queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render any visible text', () => {
    const { container } = render(<ThemeToggle />);
    expect(container.textContent).toBe('');
  });

  it('renders consistently across multiple renders', () => {
    const { container: c1 } = render(<ThemeToggle />);
    const { container: c2 } = render(<ThemeToggle />);
    expect(c1.firstChild).toBeNull();
    expect(c2.firstChild).toBeNull();
  });
});
