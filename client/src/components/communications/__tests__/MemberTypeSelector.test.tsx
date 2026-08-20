/**
 * Tests for MemberTypeSelector.tsx - Member targeting component (smoke tests)
 * Note: This component uses communicationService, complex state management, and async data
 * Full integration testing deferred due to service mocking complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import MemberTypeSelector from '../MemberTypeSelector';

// Mock communication service
jest.mock('@/services/communicationService', () => ({
  communicationService: {
    getMembershipTypes: jest.fn(() => Promise.resolve([
      { id: 1, name: 'Regular Member', count: 50 },
      { id: 2, name: 'Premium Member', count: 25 },
    ])),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  }),
}));

describe('MemberTypeSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(
        <MemberTypeSelector
          clubId={1}
          selectedMemberTypes={[]}
          onSelectionChange={jest.fn()}
        />
      )).not.toThrow();
    });

    it('accepts clubId prop', () => {
      expect(() => render(
        <MemberTypeSelector
          clubId={123}
          selectedMemberTypes={[]}
          onSelectionChange={jest.fn()}
        />
      )).not.toThrow();
    });

    it('accepts selectedMemberTypes prop', () => {
      expect(() => render(
        <MemberTypeSelector
          clubId={1}
          selectedMemberTypes={[1, 2]}
          onSelectionChange={jest.fn()}
        />
      )).not.toThrow();
    });

    it('accepts onSelectionChange prop', () => {
      const onSelectionChange = jest.fn();
      expect(() => render(
        <MemberTypeSelector
          clubId={1}
          selectedMemberTypes={[]}
          onSelectionChange={onSelectionChange}
        />
      )).not.toThrow();
    });

    it('accepts className prop', () => {
      expect(() => render(
        <MemberTypeSelector
          clubId={1}
          selectedMemberTypes={[]}
          onSelectionChange={jest.fn()}
          className="custom-class"
        />
      )).not.toThrow();
    });

    it('renders member type selector interface', () => {
      const { container } = render(
        <MemberTypeSelector
          clubId={1}
          selectedMemberTypes={[]}
          onSelectionChange={jest.fn()}
        />
      );
      expect(container).toBeInTheDocument();
    });
  });
});
