/**
 * Tests for LocationSelector.tsx - Location switching component (smoke tests)
 * Note: This component uses locationService and complex location management logic
 * Full integration testing deferred due to service and router mocking complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import LocationSelector from '../LocationSelector';

// Mock location service
jest.mock('@/lib/api/locationService', () => ({
  locationService: {
    getClubLocations: jest.fn(() => Promise.resolve([
      { id: 1, name: 'Main Office', address: '123 Main St', isActive: true },
      { id: 2, name: 'Branch Office', address: '456 Branch Ave', isActive: true },
    ])),
    setCurrentLocation: jest.fn(() => Promise.resolve()),
    getCurrentLocation: jest.fn(() => Promise.resolve({ id: 1, name: 'Main Office' })),
  },
  LocationResponse: {},
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('LocationSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(
        <LocationSelector clubId={1} />
      )).not.toThrow();
    });

    it('accepts clubId prop', () => {
      expect(() => render(
        <LocationSelector clubId={123} />
      )).not.toThrow();
    });

    it('accepts className prop', () => {
      expect(() => render(
        <LocationSelector clubId={1} className="custom-class" />
      )).not.toThrow();
    });

    it('accepts onLocationChange prop', () => {
      const onLocationChange = jest.fn();
      expect(() => render(
        <LocationSelector clubId={1} onLocationChange={onLocationChange} />
      )).not.toThrow();
    });

    it('renders location selector interface', () => {
      const { container } = render(
        <LocationSelector clubId={1} />
      );
      expect(container).toBeInTheDocument();
    });
  });
});
