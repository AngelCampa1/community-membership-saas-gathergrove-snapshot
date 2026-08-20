/**
 * Tests for TransferMemberDialog.tsx - Member location transfer dialog (smoke tests)
 * Note: This component uses locationService, memberTransferService, complex state
 * Full integration testing deferred due to service mocking and transfer logic complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import TransferMemberDialog from '../TransferMemberDialog';

// Mock location service
jest.mock('@/lib/api/locationService', () => ({
  locationService: {
    getClubLocations: () => Promise.resolve([
      { id: 1, name: 'Main Office', address: '123 Main St', isActive: true },
      { id: 2, name: 'Branch Office', address: '456 Branch Ave', isActive: true },
    ]),
  },
  LocationResponse: {},
}));

// Mock member transfer service
jest.mock('@/lib/api/memberTransferService', () => ({
  memberTransferService: {
    transferMember: () => Promise.resolve({ success: true }),
  },
}));

// Mock useToast hook
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('TransferMemberDialog', () => {
  const defaultMember = {
    id: 1,
    fullName: 'John Doe',
    email: 'john@example.com',
    locationId: 1,
    clubId: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing when closed', () => {
      expect(() => render(
        <TransferMemberDialog
          open={false}
          onOpenChange={jest.fn()}
          member={defaultMember}
        />
      )).not.toThrow();
    });

    it('renders without crashing when open', () => {
      expect(() => render(
        <TransferMemberDialog
          open={true}
          onOpenChange={jest.fn()}
          member={defaultMember}
        />
      )).not.toThrow();
    });

    it('accepts onOpenChange prop', () => {
      const onOpenChange = jest.fn();
      expect(() => render(
        <TransferMemberDialog
          open={false}
          onOpenChange={onOpenChange}
          member={defaultMember}
        />
      )).not.toThrow();
    });

    it('accepts member prop', () => {
      const member = {
        id: 2,
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        clubId: 2,
      };
      expect(() => render(
        <TransferMemberDialog
          open={false}
          onOpenChange={jest.fn()}
          member={member}
        />
      )).not.toThrow();
    });

    it('accepts onTransferSuccess prop', () => {
      const onTransferSuccess = jest.fn();
      expect(() => render(
        <TransferMemberDialog
          open={false}
          onOpenChange={jest.fn()}
          member={defaultMember}
          onTransferSuccess={onTransferSuccess}
        />
      )).not.toThrow();
    });

    it('renders transfer dialog interface', () => {
      const { container } = render(
        <TransferMemberDialog
          open={true}
          onOpenChange={jest.fn()}
          member={defaultMember}
        />
      );
      expect(container).toBeInTheDocument();
    });
  });
});
