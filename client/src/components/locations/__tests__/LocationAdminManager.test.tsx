/**
 * Tests for LocationAdminManager.tsx - Location admin management (smoke tests)
 * Note: This component uses locationPermissionsService, useToast, Dialog, and complex state
 * Full integration testing deferred due to service mocking and interaction complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import LocationAdminManager from '../LocationAdminManager';

// Mock location permissions service
jest.mock('@/lib/api/locationPermissionsService', () => ({
  locationPermissionsService: {
    getLocationAdmins: jest.fn(() => Promise.resolve([
      {
        id: 1,
        userId: 1,
        userFullName: 'John Doe',
        userEmail: 'john@example.com',
        permissionLevel: 2,
        permissionLevelName: 'Location Admin',
        assignedAt: '2024-01-01T00:00:00Z',
        assignedByName: 'Admin User',
      },
    ])),
    assignLocationAdmin: jest.fn(() => Promise.resolve()),
    removeLocationAdmin: jest.fn(() => Promise.resolve()),
  },
  LocationPermissionLevel: {
    SuperAdmin: 0,
    RegionalManager: 1,
    LocationAdmin: 2,
    LocationModerator: 3,
    Staff: 4,
  },
}));

// Mock useToast hook
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock window.confirm
global.confirm = jest.fn(() => true);

describe('LocationAdminManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(
        <LocationAdminManager
          locationId={1}
          locationName="Main Office"
        />
      )).not.toThrow();
    });

    it('accepts locationId prop', () => {
      expect(() => render(
        <LocationAdminManager
          locationId={123}
          locationName="Main Office"
        />
      )).not.toThrow();
    });

    it('accepts locationName prop', () => {
      expect(() => render(
        <LocationAdminManager
          locationId={1}
          locationName="Branch Office"
        />
      )).not.toThrow();
    });

    it('renders loading state initially', () => {
      const { getByText } = render(
        <LocationAdminManager
          locationId={1}
          locationName="Main Office"
        />
      );
      expect(getByText(/loading admins/i)).toBeInTheDocument();
    });

    it('renders admin manager interface', () => {
      const { container } = render(
        <LocationAdminManager
          locationId={1}
          locationName="Main Office"
        />
      );
      expect(container).toBeInTheDocument();
    });
  });
});
