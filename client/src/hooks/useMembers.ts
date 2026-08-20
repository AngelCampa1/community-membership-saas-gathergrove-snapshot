import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import memberService, { UpdateMemberRequest, RecordPaymentRequest } from '@/services/memberService';
import membershipTypeService from '@/services/membershipTypeService';

export interface MemberFilters {
  membershipTypeId?: number;
  duesStatus?: 'Current' | 'Overdue' | 'Upcoming' | 'Unpaid' | 'Partial';
  joinDateFrom?: string;
  joinDateTo?: string;
}

export function useMembers(
  clubId?: number,
  searchTerm: string = '',
  page: number = 1,
  pageSize: number = 25
) {
  return useQuery({
    queryKey: ['members', clubId, searchTerm, page, pageSize],
    queryFn: () => {
      if (!clubId) throw new Error('Club ID is required');
      return memberService.getPaginatedMembers(clubId, searchTerm, page, pageSize);
    },
    enabled: !!clubId,
    staleTime: 2 * 60 * 1000, // 2 minutes for member data
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false, // Don't refetch on window focus for this data
  });
}

export function useMembershipTypes(clubId?: number) {
  return useQuery({
    queryKey: ['membershipTypes', clubId],
    queryFn: () => {
      if (!clubId) throw new Error('Club ID is required');
      return membershipTypeService.getMembershipTypes(clubId);
    },
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000, // 5 minutes - reduced from 30 min for better UX after changes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

export function useMemberMutations() {
  const queryClient = useQueryClient();

  const invalidateMembers = () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
  };

  const updateMemberMutation = useMutation({
    mutationFn: (data: { clubId: number; memberId: number; updateData: UpdateMemberRequest }) => 
      memberService.updateMember(data.clubId, data.memberId, data.updateData),
    onSuccess: () => {
      invalidateMembers();
    },
  });

  const archiveMemberMutation = useMutation({
    mutationFn: (data: { clubId: number; memberId: number }) => 
      memberService.archiveMember(data.clubId, data.memberId),
    onSuccess: () => {
      invalidateMembers();
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: { clubId: number; memberId: number; payment: RecordPaymentRequest }) => 
      memberService.recordPayment(data.clubId, data.memberId, data.payment),
    onSuccess: () => {
      invalidateMembers();
      // Also invalidate dashboard as payment affects stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    updateMember: updateMemberMutation,
    archiveMember: archiveMemberMutation,
    recordPayment: recordPaymentMutation,
    invalidateMembers,
  };
}
