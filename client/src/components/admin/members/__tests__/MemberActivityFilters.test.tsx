/**
 * Tests for MemberActivityFilters.tsx - Member activity filtering UI (smoke tests)
 * Note: This component uses Select, Input, Button components with filter state
 * Full integration testing deferred due to complex filter interactions
 */

import React from 'react';
import { render } from '@testing-library/react';
import MemberActivityFilters from '../MemberActivityFilters';

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  FunnelIcon: () => <svg data-testid="funnel-icon" />,
  XMarkIcon: () => <svg data-testid="xmark-icon" />,
}));

describe('MemberActivityFilters', () => {
  const defaultProps = {
    filter: { activityLevel: 'All' as const },
    onFilterChange: jest.fn(),
    onClearFilters: jest.fn(),
    searchTerm: '',
    onSearchChange: jest.fn(),
    memberCount: 100,
    filteredCount: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(
        <MemberActivityFilters {...defaultProps} />
      )).not.toThrow();
    });

    it('accepts filter prop', () => {
      expect(() => render(
        <MemberActivityFilters
          {...defaultProps}
          filter={{ activityLevel: 'Active' }}
        />
      )).not.toThrow();
    });

    it('accepts onFilterChange prop', () => {
      const onFilterChange = jest.fn();
      expect(() => render(
        <MemberActivityFilters
          {...defaultProps}
          onFilterChange={onFilterChange}
        />
      )).not.toThrow();
    });

    it('accepts searchTerm prop', () => {
      expect(() => render(
        <MemberActivityFilters
          {...defaultProps}
          searchTerm="test search"
        />
      )).not.toThrow();
    });

    it('accepts member counts', () => {
      expect(() => render(
        <MemberActivityFilters
          {...defaultProps}
          memberCount={500}
          filteredCount={250}
        />
      )).not.toThrow();
    });

    it('renders filter interface', () => {
      const { container } = render(
        <MemberActivityFilters {...defaultProps} />
      );
      expect(container).toBeInTheDocument();
    });
  });
});
