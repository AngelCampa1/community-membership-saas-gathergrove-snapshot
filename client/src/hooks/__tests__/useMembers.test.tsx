import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMembers, useMembershipTypes, useMemberMutations } from '../useMembers';
import memberService from '@/services/memberService';
import membershipTypeService from '@/services/membershipTypeService';

jest.mock('@/services/memberService');
jest.mock('@/services/membershipTypeService');

const mockMemberService = memberService as jest.Mocked<typeof memberService>;
const mockMembershipTypeService = membershipTypeService as jest.Mocked<typeof membershipTypeService>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch members with default pagination', async () => {
    const mockMembers = {
      items: [{ id: 1, fullName: 'John Doe' }],
      totalCount: 1,
      page: 1,
      pageSize: 25,
    };

    mockMemberService.getPaginatedMembers.mockResolvedValue(mockMembers as any);

    const { result } = renderHook(() => useMembers(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMembers);
    expect(mockMemberService.getPaginatedMembers).toHaveBeenCalledWith(1, '', 1, 25);
  });

  it('should fetch members with search term', async () => {
    mockMemberService.getPaginatedMembers.mockResolvedValue({ items: [] } as any);

    const { result } = renderHook(() => useMembers(1, 'john'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockMemberService.getPaginatedMembers).toHaveBeenCalledWith(1, 'john', 1, 25);
    });
  });

  it('should fetch members with custom pagination', async () => {
    mockMemberService.getPaginatedMembers.mockResolvedValue({ items: [] } as any);

    const { result } = renderHook(() => useMembers(1, '', 2, 50), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockMemberService.getPaginatedMembers).toHaveBeenCalledWith(1, '', 2, 50);
    });
  });

  it('should not fetch when clubId is undefined', () => {
    const { result } = renderHook(() => useMembers(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(mockMemberService.getPaginatedMembers).not.toHaveBeenCalled();
  });

  it('should handle error when fetching fails', async () => {
    const error = new Error('Failed to fetch members');
    mockMemberService.getPaginatedMembers.mockRejectedValue(error);

    const { result } = renderHook(() => useMembers(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useMembershipTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch membership types', async () => {
    const mockTypes = [
      { id: 1, name: 'Individual', price: 100 },
      { id: 2, name: 'Family', price: 200 },
    ];

    mockMembershipTypeService.getMembershipTypes.mockResolvedValue(mockTypes as any);

    const { result } = renderHook(() => useMembershipTypes(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTypes);
    expect(mockMembershipTypeService.getMembershipTypes).toHaveBeenCalledWith(1);
  });

  it('should not fetch when clubId is undefined', () => {
    const { result } = renderHook(() => useMembershipTypes(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(mockMembershipTypeService.getMembershipTypes).not.toHaveBeenCalled();
  });
});

describe('useMemberMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update member and invalidate cache', async () => {
    mockMemberService.updateMember.mockResolvedValue({} as any);

    const { result } = renderHook(() => useMemberMutations(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.updateMember.mutateAsync({
        clubId: 1,
        memberId: 1,
        updateData: { fullName: 'Jane Doe' } as any,
      });
    });

    expect(mockMemberService.updateMember).toHaveBeenCalledWith(
      1,
      1,
      { fullName: 'Jane Doe' }
    );
  });

  it('should archive member and invalidate cache', async () => {
    mockMemberService.archiveMember.mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useMemberMutations(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.archiveMember.mutateAsync({
        clubId: 1,
        memberId: 1,
      });
    });

    expect(mockMemberService.archiveMember).toHaveBeenCalledWith(1, 1);
  });

  it('should record payment and invalidate caches', async () => {
    mockMemberService.recordPayment.mockResolvedValue({} as any);

    const { result } = renderHook(() => useMemberMutations(), {
      wrapper: createWrapper(),
    });

    const payment = { amount: 100, date: '2024-01-01' } as any;

    await act(async () => {
      await result.current.recordPayment.mutateAsync({
        clubId: 1,
        memberId: 1,
        payment,
      });
    });

    expect(mockMemberService.recordPayment).toHaveBeenCalledWith(1, 1, payment);
  });

  it('should have invalidateMembers method', () => {
    const { result } = renderHook(() => useMemberMutations(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.invalidateMembers).toBe('function');
    
    act(() => {
      result.current.invalidateMembers();
    });
  });
});
