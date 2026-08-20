/**
 * useMembers Tests - Full Coverage
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { useMembers, useMembershipTypes, useMemberMutations } from '../useMembers';
import memberService from '@/services/memberService';
import membershipTypeService from '@/services/membershipTypeService';

// Unmock React Query to use real implementation
jest.unmock('@tanstack/react-query');

// Mock services
jest.mock('@/services/memberService');
jest.mock('@/services/membershipTypeService');

describe('useMembers Hooks', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useMembers', () => {
    const mockMembers = {
      items: [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Smith' },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    };

    it('should fetch members successfully with clubId', async () => {
      // Arrange
      (memberService.getPaginatedMembers as jest.Mock).mockResolvedValue(mockMembers);

      // Act
      const { result } = renderHook(
        () => useMembers(1, '', 1, 25),
        { wrapper: createWrapper() }
      );

      // Assert
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMembers);
      expect(memberService.getPaginatedMembers).toHaveBeenCalledWith(1, '', 1, 25);
    });

    it('should not fetch when clubId is undefined', () => {
      // Arrange & Act
      const { result } = renderHook(
        () => useMembers(undefined, '', 1, 25),
        { wrapper: createWrapper() }
      );

      // Assert
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(memberService.getPaginatedMembers).not.toHaveBeenCalled();
    });

    it('should handle error when clubId becomes undefined during refetch', async () => {
      // Arrange
      (memberService.getPaginatedMembers as jest.Mock).mockResolvedValue(mockMembers);
      const wrapper = createWrapper();

      // Act - start with valid clubId
      const { result, rerender } = renderHook(
        ({ clubId }) => useMembers(clubId, '', 1, 25),
        { wrapper, initialProps: { clubId: 1 as number | undefined } }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Clear the mock and change to undefined clubId
      jest.clearAllMocks();
      rerender({ clubId: undefined });

      // Assert - query should be disabled
      await waitFor(() => {
        expect(result.current.fetchStatus).toBe('idle');
      });

      expect(memberService.getPaginatedMembers).not.toHaveBeenCalled();
    });

    it('should fetch with different search term', async () => {
      // Arrange
      (memberService.getPaginatedMembers as jest.Mock).mockResolvedValue(mockMembers);

      // Act
      const { result } = renderHook(
        () => useMembers(1, 'john', 1, 25),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(memberService.getPaginatedMembers).toHaveBeenCalledWith(1, 'john', 1, 25);
    });

    it('should fetch with different page number', async () => {
      // Arrange
      (memberService.getPaginatedMembers as jest.Mock).mockResolvedValue(mockMembers);

      // Act
      const { result } = renderHook(
        () => useMembers(1, '', 2, 25),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(memberService.getPaginatedMembers).toHaveBeenCalledWith(1, '', 2, 25);
    });

    it('should fetch with different page size', async () => {
      // Arrange
      (memberService.getPaginatedMembers as jest.Mock).mockResolvedValue(mockMembers);

      // Act
      const { result } = renderHook(
        () => useMembers(1, '', 1, 50),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(memberService.getPaginatedMembers).toHaveBeenCalledWith(1, '', 1, 50);
    });

    it('should fetch with all custom parameters', async () => {
      // Arrange
      (memberService.getPaginatedMembers as jest.Mock).mockResolvedValue(mockMembers);

      // Act
      const { result } = renderHook(
        () => useMembers(5, 'search term', 3, 100),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(memberService.getPaginatedMembers).toHaveBeenCalledWith(5, 'search term', 3, 100);
    });

    it('should handle API errors', async () => {
      // Arrange
      const mockError = new Error('API Error');
      (memberService.getPaginatedMembers as jest.Mock).mockRejectedValue(mockError);

      // Act
      const { result } = renderHook(
        () => useMembers(1, '', 1, 25),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should use correct query key with all parameters', async () => {
      // Arrange
      (memberService.getPaginatedMembers as jest.Mock).mockResolvedValue(mockMembers);

      // Act
      const { result } = renderHook(
        () => useMembers(1, 'test', 2, 50),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - verify query is cached with correct key
      const cachedData = queryClient.getQueryData(['members', 1, 'test', 2, 50]);
      expect(cachedData).toEqual(mockMembers);
    });

    it('should return different data for different clubIds', async () => {
      // Arrange
      const mockMembers1 = { ...mockMembers, items: [{ id: 1, firstName: 'Club1' }] };
      const mockMembers2 = { ...mockMembers, items: [{ id: 2, firstName: 'Club2' }] };

      (memberService.getPaginatedMembers as jest.Mock)
        .mockResolvedValueOnce(mockMembers1)
        .mockResolvedValueOnce(mockMembers2);

      const wrapper = createWrapper();

      // Act
      const { result: result1 } = renderHook(() => useMembers(1), { wrapper });
      const { result: result2 } = renderHook(() => useMembers(2), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      expect(result1.current.data).toEqual(mockMembers1);
      expect(result2.current.data).toEqual(mockMembers2);
    });

    it('should use default values for optional parameters', async () => {
      // Arrange
      (memberService.getPaginatedMembers as jest.Mock).mockResolvedValue(mockMembers);

      // Act
      const { result } = renderHook(() => useMembers(1), { wrapper: createWrapper() });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(memberService.getPaginatedMembers).toHaveBeenCalledWith(1, '', 1, 25);
    });
  });

  describe('useMembershipTypes', () => {
    const mockMembershipTypes = [
      { id: 1, name: 'Regular', price: 100 },
      { id: 2, name: 'Premium', price: 200 },
    ];

    it('should fetch membership types successfully with clubId', async () => {
      // Arrange
      (membershipTypeService.getMembershipTypes as jest.Mock).mockResolvedValue(mockMembershipTypes);

      // Act
      const { result } = renderHook(
        () => useMembershipTypes(1),
        { wrapper: createWrapper() }
      );

      // Assert
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMembershipTypes);
      expect(membershipTypeService.getMembershipTypes).toHaveBeenCalledWith(1);
    });

    it('should not fetch when clubId is undefined', () => {
      // Arrange & Act
      const { result } = renderHook(
        () => useMembershipTypes(undefined),
        { wrapper: createWrapper() }
      );

      // Assert
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(membershipTypeService.getMembershipTypes).not.toHaveBeenCalled();
    });

    it('should fetch membership types for different clubIds', async () => {
      // Arrange
      const mockTypes1 = [{ id: 1, name: 'Type1' }];
      const mockTypes2 = [{ id: 2, name: 'Type2' }];

      (membershipTypeService.getMembershipTypes as jest.Mock)
        .mockResolvedValueOnce(mockTypes1)
        .mockResolvedValueOnce(mockTypes2);

      const wrapper = createWrapper();

      // Act
      const { result: result1 } = renderHook(() => useMembershipTypes(1), { wrapper });
      const { result: result2 } = renderHook(() => useMembershipTypes(2), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      expect(result1.current.data).toEqual(mockTypes1);
      expect(result2.current.data).toEqual(mockTypes2);
    });

    it('should handle API errors', async () => {
      // Arrange
      const mockError = new Error('API Error');
      (membershipTypeService.getMembershipTypes as jest.Mock).mockRejectedValue(mockError);

      // Act
      const { result } = renderHook(
        () => useMembershipTypes(1),
        { wrapper: createWrapper() }
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should use correct query key', async () => {
      // Arrange
      (membershipTypeService.getMembershipTypes as jest.Mock).mockResolvedValue(mockMembershipTypes);

      // Act
      const { result } = renderHook(
        () => useMembershipTypes(1),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert - verify query is cached with correct key
      const cachedData = queryClient.getQueryData(['membershipTypes', 1]);
      expect(cachedData).toEqual(mockMembershipTypes);
    });

    it('should handle clubId change from valid to undefined', async () => {
      // Arrange
      (membershipTypeService.getMembershipTypes as jest.Mock).mockResolvedValue(mockMembershipTypes);
      const wrapper = createWrapper();

      // Act - start with valid clubId
      const { result, rerender } = renderHook(
        ({ clubId }) => useMembershipTypes(clubId),
        { wrapper, initialProps: { clubId: 1 as number | undefined } }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Change to undefined clubId
      jest.clearAllMocks();
      rerender({ clubId: undefined });

      // Assert - query should be disabled
      await waitFor(() => {
        expect(result.current.fetchStatus).toBe('idle');
      });

      expect(membershipTypeService.getMembershipTypes).not.toHaveBeenCalled();
    });
  });

  describe('useMemberMutations', () => {
    const mockUpdateData = { firstName: 'Updated', lastName: 'Name' };
    const mockPaymentData = { amount: 100, date: '2025-01-01' };

    beforeEach(() => {
      (memberService.updateMember as jest.Mock).mockResolvedValue({ success: true });
      (memberService.archiveMember as jest.Mock).mockResolvedValue({ success: true });
      (memberService.recordPayment as jest.Mock).mockResolvedValue({ success: true });
    });

    it('should update member successfully and invalidate queries', async () => {
      // Arrange
      const wrapper = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      // Act
      const { result } = renderHook(() => useMemberMutations(), { wrapper });

      await waitFor(() => {
        result.current.updateMember.mutate({
          clubId: 1,
          memberId: 10,
          updateData: mockUpdateData,
        });
      });

      // Assert
      await waitFor(() => {
        expect(result.current.updateMember.isSuccess).toBe(true);
      });

      expect(memberService.updateMember).toHaveBeenCalledWith(1, 10, mockUpdateData);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['members'] });
    });

    it('should archive member successfully and invalidate queries', async () => {
      // Arrange
      const wrapper = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      // Act
      const { result } = renderHook(() => useMemberMutations(), { wrapper });

      await waitFor(() => {
        result.current.archiveMember.mutate({
          clubId: 1,
          memberId: 10,
        });
      });

      // Assert
      await waitFor(() => {
        expect(result.current.archiveMember.isSuccess).toBe(true);
      });

      expect(memberService.archiveMember).toHaveBeenCalledWith(1, 10);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['members'] });
    });

    it('should record payment successfully and invalidate members and dashboard queries', async () => {
      // Arrange
      const wrapper = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      // Act
      const { result } = renderHook(() => useMemberMutations(), { wrapper });

      await waitFor(() => {
        result.current.recordPayment.mutate({
          clubId: 1,
          memberId: 10,
          payment: mockPaymentData,
        });
      });

      // Assert
      await waitFor(() => {
        expect(result.current.recordPayment.isSuccess).toBe(true);
      });

      expect(memberService.recordPayment).toHaveBeenCalledWith(1, 10, mockPaymentData);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['members'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
    });

    it('should handle updateMember error', async () => {
      // Arrange
      const mockError = new Error('Update failed');
      (memberService.updateMember as jest.Mock).mockRejectedValue(mockError);
      const wrapper = createWrapper();

      // Act
      const { result } = renderHook(() => useMemberMutations(), { wrapper });

      await waitFor(() => {
        result.current.updateMember.mutate({
          clubId: 1,
          memberId: 10,
          updateData: mockUpdateData,
        });
      });

      // Assert
      await waitFor(() => {
        expect(result.current.updateMember.isError).toBe(true);
      });

      expect(result.current.updateMember.error).toEqual(mockError);
    });

    it('should handle archiveMember error', async () => {
      // Arrange
      const mockError = new Error('Archive failed');
      (memberService.archiveMember as jest.Mock).mockRejectedValue(mockError);
      const wrapper = createWrapper();

      // Act
      const { result } = renderHook(() => useMemberMutations(), { wrapper });

      await waitFor(() => {
        result.current.archiveMember.mutate({
          clubId: 1,
          memberId: 10,
        });
      });

      // Assert
      await waitFor(() => {
        expect(result.current.archiveMember.isError).toBe(true);
      });

      expect(result.current.archiveMember.error).toEqual(mockError);
    });

    it('should handle recordPayment error', async () => {
      // Arrange
      const mockError = new Error('Payment recording failed');
      (memberService.recordPayment as jest.Mock).mockRejectedValue(mockError);
      const wrapper = createWrapper();

      // Act
      const { result } = renderHook(() => useMemberMutations(), { wrapper });

      await waitFor(() => {
        result.current.recordPayment.mutate({
          clubId: 1,
          memberId: 10,
          payment: mockPaymentData,
        });
      });

      // Assert
      await waitFor(() => {
        expect(result.current.recordPayment.isError).toBe(true);
      });

      expect(result.current.recordPayment.error).toEqual(mockError);
    });

    it('should manually invalidate members queries', async () => {
      // Arrange
      const wrapper = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      // Act
      const { result } = renderHook(() => useMemberMutations(), { wrapper });
      result.current.invalidateMembers();

      // Assert
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['members'] });
    });

    it('should return all mutation objects and invalidate function', () => {
      // Arrange & Act
      const { result } = renderHook(() => useMemberMutations(), { wrapper: createWrapper() });

      // Assert
      expect(result.current.updateMember).toBeDefined();
      expect(result.current.archiveMember).toBeDefined();
      expect(result.current.recordPayment).toBeDefined();
      expect(result.current.invalidateMembers).toBeDefined();
      expect(typeof result.current.invalidateMembers).toBe('function');
    });

    it('should allow multiple mutations sequentially', async () => {
      // Arrange
      const wrapper = createWrapper();

      // Act
      const { result } = renderHook(() => useMemberMutations(), { wrapper });

      // First mutation
      await waitFor(() => {
        result.current.updateMember.mutate({
          clubId: 1,
          memberId: 10,
          updateData: mockUpdateData,
        });
      });

      await waitFor(() => {
        expect(result.current.updateMember.isSuccess).toBe(true);
      });

      // Second mutation
      await waitFor(() => {
        result.current.archiveMember.mutate({
          clubId: 1,
          memberId: 10,
        });
      });

      await waitFor(() => {
        expect(result.current.archiveMember.isSuccess).toBe(true);
      });

      // Assert
      expect(memberService.updateMember).toHaveBeenCalledWith(1, 10, mockUpdateData);
      expect(memberService.archiveMember).toHaveBeenCalledWith(1, 10);
    });

    it('should track mutation loading states', async () => {
      // Arrange
      const wrapper = createWrapper();
      (memberService.updateMember as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      // Act
      const { result } = renderHook(() => useMemberMutations(), { wrapper });

      expect(result.current.updateMember.isPending).toBe(false);

      await waitFor(() => {
        result.current.updateMember.mutate({
          clubId: 1,
          memberId: 10,
          updateData: mockUpdateData,
        });
      });

      // Assert - mutation should be pending initially
      await waitFor(() => {
        expect(result.current.updateMember.isPending || result.current.updateMember.isSuccess).toBe(true);
      });
    });

    it('should reset mutation state after error', async () => {
      // Arrange
      const mockError = new Error('Test error');
      (memberService.updateMember as jest.Mock).mockRejectedValue(mockError);
      const wrapper = createWrapper();

      // Act
      const { result } = renderHook(() => useMemberMutations(), { wrapper });

      await waitFor(() => {
        result.current.updateMember.mutate({
          clubId: 1,
          memberId: 10,
          updateData: mockUpdateData,
        });
      });

      await waitFor(() => {
        expect(result.current.updateMember.isError).toBe(true);
      });

      // Reset mutation
      await waitFor(() => {
        result.current.updateMember.reset();
      });

      // Assert - wait for reset to take effect
      await waitFor(() => {
        expect(result.current.updateMember.isIdle).toBe(true);
      });
      expect(result.current.updateMember.isError).toBe(false);
    });
  });
});
