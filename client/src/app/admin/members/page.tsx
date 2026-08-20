"use client";

import { useState, useEffect, useCallback } from'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from"@/components/ui/dialog";
import { Input } from"@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from"@/components/ui/table";
import { Badge } from"@/components/ui/badge";
import { Users, Plus, Search, ChevronLeft, ChevronRight, MoreVertical, Archive, DollarSign, Edit, Receipt, Filter, X, Calendar, Upload, Activity } from"lucide-react";
import { toast } from'sonner';
import { useAuth } from'@/hooks/useAuth';
import { logger } from'@/lib/logger';
import memberService, { PaginatedMembersResponse, MemberResponse } from'@/services/memberService';
import { featureAnalyticsService } from'@/services/featureAnalyticsService';
import { ErrorHandler } from'@/lib/errorHandler';
import { useMembershipTypes } from'@/hooks/useMembers';
import { MemberDetailsModal } from'@/components/features/members/MemberDetailsModal';
import { RequestPaymentModal } from'@/components/features/members/RequestPaymentModal';
import { RecordPaymentModal } from'@/components/features/members/RecordPaymentModal';
import { AddMemberModal } from'@/components/features/members/AddMemberModal';
import { ImportMembersModal } from'@/components/features/members/ImportMembersModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from"@/components/ui/dropdown-menu";
import { MemberEngagementScore } from'@/components/engagement';

// Filter interface for type safety
interface MemberFilters {
  membershipTypeId?: number;
  duesStatus?:'Current' |'Overdue' |'Upcoming' |'Unpaid' |'Partial';
  joinDateFrom?: string;
  joinDateTo?: string;
  engagementLevel?:'high' |'medium' |'low' |'inactive';
}

export default function MembersPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [routeProtectionChecked, setRouteProtectionChecked] = useState(false);
  const [paginatedData, setPaginatedData] = useState<PaginatedMembersResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MemberFilters>({});
  // Per-member engagement scores (memberId -> overall 0-100 score). Empty when the
  // engagement analytics feature is unavailable (e.g. non-Expand tier) — in that
  // case the engagement filter degrades to a no-op instead of emptying the table.
  const [engagementScores, setEngagementScores] = useState<Map<number, number>>(new Map());
  const pageSize = 25;

  // Use React Query hook for membership types
  const { data: membershipTypes = [], isLoading: membershipTypesLoading, error: membershipTypesError } = useMembershipTypes(user?.clubId) || {};
  
  // Debug logging (disabled in tests)
  useEffect(() => {
    if (process.env.NODE_ENV !=='test') {
      logger.debug('members','Auth state changed', {
        hasUser: !!user,
        hasClubId: !!user?.clubId,
        authLoading
      });
    }
  }, [user, authLoading]);

  // Give RouteProtection time to handle redirects for unauthenticated users
  useEffect(() => {
    if (!authLoading) {
      // Use a small delay to allow RouteProtection's useEffect to run first
      const timer = setTimeout(() => {
        setRouteProtectionChecked(true);
      }, 100); // Small delay to ensure RouteProtection has a chance to redirect
      
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  // Handle membership types error
  useEffect(() => {
    if (membershipTypesError) {
      ErrorHandler.showErrorToast(membershipTypesError,'Unable to load membership types. Some features may not work properly.');
    }
  }, [membershipTypesError]);

  // Load per-member engagement scores so the Engagement Level filter can be applied.
  // Failures (e.g. 403 on non-Expand tiers) are swallowed — the filter then no-ops.
  useEffect(() => {
    const clubId = user?.clubId;
    if (!clubId) return;
    let cancelled = false;
    (async () => {
      try {
        const analytics = await featureAnalyticsService.getMemberEngagementAnalytics(clubId);
        if (cancelled) return;
        const scores = new Map<number, number>();
        for (const summary of analytics.memberScores) {
          scores.set(summary.memberId, summary.overallScore);
        }
        setEngagementScores(scores);
      } catch (error) {
        if (cancelled) return;
        logger.debug('members','Engagement scores unavailable; engagement filter disabled', { error });
        setEngagementScores(new Map());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.clubId]);

  // Modal states
  const [selectedMember, setSelectedMember] = useState<MemberResponse | null>(null);
  const [memberDetailsModalOpen, setMemberDetailsModalOpen] = useState(false);
  const [requestPaymentModalOpen, setRequestPaymentModalOpen] = useState(false);
  const [memberToRequestPayment, setMemberToRequestPayment] = useState<MemberResponse | null>(null);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [memberToRecordPayment, setMemberToRecordPayment] = useState<MemberResponse | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Archive states
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [memberToArchive, setMemberToArchive] = useState<MemberResponse | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
  const [memberToUnarchive, setMemberToUnarchive] = useState<MemberResponse | null>(null);
  const [unarchiving, setUnarchiving] = useState(false);


  const getDuesStatus = useCallback((member: MemberResponse) => {
    if (!member.duesPaidUntil) {
      // Check if member has partial payments
      if (member.hasPartialPayments && member.outstandingBalance) {
        return { 
          status: `Partial: $${member.outstandingBalance.toFixed(2)} remaining` as const, 
          color:'secondary' as const 
        };
      }
      return { status:'Unpaid' as const, color:'destructive' as const };
    }

    const today = new Date();
    const duesDate = new Date(member.duesPaidUntil);
    
    const diffTime = duesDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status:'Overdue' as const, color:'destructive' as const };
    } else if (diffDays <= 30) {
      return { status:'Expiring Soon' as const, color:'secondary' as const };
    } else {
      return { status:'Current' as const, color:'default' as const };
    }
  }, []);

  // Helper function to apply column filters
  const applyColumnFilters = useCallback((members: MemberResponse[]): MemberResponse[] => {
    return members.filter(member => {
      // Membership Type filter
      if (filters.membershipTypeId && member.membershipTypeId !== filters.membershipTypeId) {
        return false;
      }

      // Dues Status filter
      if (filters.duesStatus) {
        const memberDuesStatus = getDuesStatus(member).status;
        
        // Handle"Partial" filter specially since it has dynamic text
        if (filters.duesStatus ==='Partial') {
          if (!memberDuesStatus.startsWith('Partial:')) {
            return false;
          }
        } else if (memberDuesStatus !== filters.duesStatus) {
          return false;
        }
      }

      // Engagement Level filter — bucket the member's overall engagement score into
      // the same ranges advertised in the filter UI. Only applied when engagement
      // data has actually loaded; otherwise the filter is a no-op so tiers without
      // engagement analytics don't see an empty table.
      if (filters.engagementLevel && engagementScores.size > 0) {
        const score = engagementScores.get(member.id) ?? 0;
        const level =
          score >= 80 ?'high' :
          score >= 50 ?'medium' :
          score >= 20 ?'low' :'inactive';
        if (level !== filters.engagementLevel) {
          return false;
        }
      }

      // Join Date range filter
      if (filters.joinDateFrom || filters.joinDateTo) {
        const joinDate = new Date(member.joinDate);
        
        if (filters.joinDateFrom) {
          const fromDate = new Date(filters.joinDateFrom);
          if (joinDate < fromDate) {
            return false;
          }
        }
        
        if (filters.joinDateTo) {
          const toDate = new Date(filters.joinDateTo);
          // Set to end of day for the'to' date
          toDate.setHours(23, 59, 59, 999);
          if (joinDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [filters, getDuesStatus, engagementScores]);


  const loadMembers = useCallback(async () => {
    if (!user?.clubId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      if (showArchived) {
        // For archived members, use getMembers API and filter by status
        const allMembersData = await memberService.getMembers(user.clubId);
        
        // Add defensive check for array
        if (!Array.isArray(allMembersData)) {
          logger.warn('members','Invalid members data received', {
            dataType: typeof allMembersData,
            clubId: user.clubId
          });
          setPaginatedData({
            members: [],
            totalCount: 0,
            currentPage: 1,
            totalPages: 1,
            pageSize,
            hasPrevious: false,
            hasNext: false
          });
          return;
        }
        
        let filteredMembers = allMembersData.filter(member => member.status ==='Archived');
        
        // Apply search filter if exists
        if (searchTerm.trim()) {
          filteredMembers = filteredMembers.filter(member => 
            member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // Apply column filters
        filteredMembers = applyColumnFilters(filteredMembers);

        // Simple pagination for archived members
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedMembers = filteredMembers.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredMembers.length / pageSize);

        // Create pagination response for archived members
        const archivedPaginatedData: PaginatedMembersResponse = {
          members: paginatedMembers,
          totalCount: filteredMembers.length,
          currentPage,
          totalPages,
          pageSize,
          hasPrevious: currentPage > 1,
          hasNext: currentPage < totalPages,
          search: searchTerm.trim() || undefined
        };
        
        setPaginatedData(archivedPaginatedData);
      } else {
        // For active members, use existing paginated API
        let data = await memberService.getPaginatedMembers(
          user.clubId, 
          searchTerm.trim() || undefined, 
          currentPage, 
          pageSize
        );
        
        // Apply column filters to the returned members
        const filteredMembers = applyColumnFilters(data.members);
        
        // Recalculate pagination if filters reduced the results
        if (filteredMembers.length !== data.members.length) {
          // Get all active members to apply filters properly
          const allActiveMembers = await memberService.getMembers(user.clubId);
          
          // Add defensive check for array
          if (!Array.isArray(allActiveMembers)) {
            logger.warn('members','Invalid active members data received', {
              dataType: typeof allActiveMembers,
              clubId: user.clubId
            });
            setPaginatedData({
              members: [],
              totalCount: 0,
              currentPage: 1,
              totalPages: 1,
              pageSize,
              hasPrevious: false,
              hasNext: false
            });
            return;
          }
          
          let allFilteredMembers = allActiveMembers.filter(member => member.status !=='Archived');
          
          // Apply search filter
          if (searchTerm.trim()) {
            allFilteredMembers = allFilteredMembers.filter(member => 
              member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              member.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          
          // Apply column filters
          allFilteredMembers = applyColumnFilters(allFilteredMembers);
          
          // Paginate the filtered results
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedMembers = allFilteredMembers.slice(startIndex, endIndex);
          const totalPages = Math.ceil(allFilteredMembers.length / pageSize);
          
          data = {
            members: paginatedMembers,
            totalCount: allFilteredMembers.length,
            currentPage,
            totalPages,
            pageSize,
            hasPrevious: currentPage > 1,
            hasNext: currentPage < totalPages,
            search: searchTerm.trim() || undefined
          };
        }
        
        setPaginatedData(data);
      }
    } catch (error) {
      ErrorHandler.showErrorToast(error,'Unable to load members. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, searchTerm, showArchived, applyColumnFilters]);

  // Load members when page changes, search changes, archive toggle changes, or filters change
  useEffect(() => {
    if (user?.clubId) {
      // Add a small delay for search to allow debounced input
      const timer = setTimeout(() => {
        loadMembers();
      }, searchTerm.trim() ? 300 : 0); // 300ms delay for search, immediate for other changes
      
      return () => clearTimeout(timer);
    }
  }, [currentPage, user, showArchived, searchTerm, filters, loadMembers]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPageNumbers = () => {
    if (!paginatedData) return [];
    
    const totalPages = paginatedData.totalPages;
    const current = paginatedData.currentPage;
    const pages: number[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleMemberRowClick = (member: MemberResponse) => {
    setSelectedMember(member);
    setMemberDetailsModalOpen(true);
  };

  const handleMemberDetailsModalClose = () => {
    setSelectedMember(null);
    setMemberDetailsModalOpen(false);
  };

  const handleMemberUpdated = async () => {
    // Reload members when a member is updated
    await loadMembers();

    // Close the modal
    // Note: Toast is already shown by MemberDetailsModal.handleSave()
    handleMemberDetailsModalClose();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm.trim() !=='' || 
           Object.values(filters).some(value => value !== undefined && value !=='');
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof MemberFilters, value: string | number | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value ==='' ? undefined : value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Archive member
  const handleArchiveMember = async () => {
    if (!memberToArchive || !user?.clubId) return;

    try {
      setArchiving(true);
      await memberService.archiveMember(user.clubId, memberToArchive.id);
      
      toast.success(`${memberToArchive.fullName} has been archived`);
      
      // Refresh data
      await loadMembers();
      
      // Close dialog
      setArchiveDialogOpen(false);
      setMemberToArchive(null);
    } catch (error) {
              ErrorHandler.showErrorToast(error,'Failed to archive member');
    } finally {
      setArchiving(false);
    }
  };

  // Unarchive member
  const handleUnarchiveMember = async () => {
    if (!memberToUnarchive || !user?.clubId) return;

    try {
      setUnarchiving(true);
      await memberService.unarchiveMember(user.clubId, memberToUnarchive.id);
      
      toast.success(`${memberToUnarchive.fullName} has been unarchived`);
      
      // Refresh data
      await loadMembers();
      
      // Close dialog
      setUnarchiveDialogOpen(false);
      setMemberToUnarchive(null);
    } catch (error) {
      ErrorHandler.showErrorToast(error, `Unable to unarchive ${memberToUnarchive.fullName}. Please try again.`);
    } finally {
      setUnarchiving(false);
    }
  };

  // Show loading while auth is being checked OR while waiting for RouteProtection
  if (authLoading || !routeProtectionChecked) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">
            {authLoading ?"Checking authentication..." :"Loading..."}
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated after RouteProtection has had time to redirect, show fallback
  // This should rarely occur if RouteProtection is working correctly
  if (!user) {
    logger.error('members','No user found after RouteProtection check', {
      authLoading,
      routeProtectionChecked
    });
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-destructive">Authentication required. Redirecting to login...</div>
        </div>
      </div>
    );
  }

  // If user doesn't have a clubId, show error
  if (!user.clubId) {
    logger.error('members','User has no clubId', {
      userId: user.userId,
      email: user.email
    });
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-muted-foreground">Unable to load members. User is not associated with a club.</div>
        </div>
      </div>
    );
  }

  // Show loading while data is being fetched
  if ((loading && !paginatedData) || membershipTypesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" data-testid="loading-spinner"></div>
          <div className="text-muted-foreground">Loading members...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-6 glass border border-border/50 rounded-2xl shadow-lg p-8">
        {/* Action Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Toggle between Active and Archived members */}
          <div className="flex items-center gap-2 glass-soft rounded-lg p-1">
            <Button
              variant={showArchived ?"outline" :"default"}
              size="sm"
              onClick={() => setShowArchived(false)}
              className={`transition-all duration-200 ${!showArchived ?'bg-gradient-to-r from-primary to-success text-white shadow-md' :'glass-soft border-border/50 hover:glass'}`}
            >
              Active
            </Button>
            <Button
              variant={showArchived ?"default" :"outline"}
              size="sm"
              onClick={() => setShowArchived(true)}
              className={`transition-all duration-200 ${showArchived ?'bg-gradient-to-r from-primary to-success text-white shadow-md' :'glass-soft border-border/50 hover:glass'}`}
            >
              Archived
            </Button>
          </div>
        </div>
        
        {/* Clean Action Bar */}
        <div className="flex items-center justify-between gap-4">
          {/* Filter Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 glass-soft border-border/50 hover:glass transition-all duration-200"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters() && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {Object.values(filters).filter(v => v !== undefined && v !=='').length}
              </Badge>
            )}
          </Button>
          
          {/* Clear Filters (when active) */}
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-2 glass-soft hover:glass transition-all duration-200"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
          
          {/* Action Buttons - Right Side */}
          {!showArchived && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                className="flex items-center gap-2 glass-soft border-border/50 hover:glass transition-all duration-200"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Button
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Member</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <span>Filter Options</span>
            </CardTitle>
            <CardDescription>Filter members by specific criteria to find exactly who you're looking for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Membership Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Membership Type</label>
                <Select
                  value={filters.membershipTypeId?.toString() ||'all'}
                  onValueChange={(value) => handleFilterChange('membershipTypeId', value ==='all' ? undefined : parseInt(value))}
                >
                  <SelectTrigger data-testid="select-membership-type" className="glass-soft border-border/50 focus:glass transition-all duration-200">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {membershipTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dues Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Dues Status</label>
                <Select
                  value={filters.duesStatus ||'all'}
                  onValueChange={(value) => handleFilterChange('duesStatus', value ==='all' ? undefined : value)}
                >
                  <SelectTrigger data-testid="select-dues-status" className="glass-soft border-border/50 focus:glass transition-all duration-200">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Current">Current</SelectItem>
                    <SelectItem value="Upcoming">Upcoming (Due in 30 days)</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Partial">Partial Payment</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Engagement Level Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Engagement Level</label>
                <Select
                  value={filters.engagementLevel ||'all'}
                  onValueChange={(value) => handleFilterChange('engagementLevel', value ==='all' ? undefined : value)}
                >
                  <SelectTrigger data-testid="select-engagement-level" className="glass-soft border-border/50 focus:glass transition-all duration-200">
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-success" />
                        High (80-100%)
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-warning" />
                        Medium (50-79%)
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-warning" />
                        Low (20-49%)
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-destructive" />
                        Inactive (&lt;20%)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Join Date Range Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Join Date Range</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      placeholder="From date"
                      value={filters.joinDateFrom ||''}
                      onChange={(e) => handleFilterChange('joinDateFrom', e.target.value)}
                      className="pl-10 glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
                      data-testid="input-join-date-from"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      placeholder="To date"
                      value={filters.joinDateTo ||''}
                      onChange={(e) => handleFilterChange('joinDateTo', e.target.value)}
                      className="pl-10 glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
                      data-testid="input-join-date-to"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters() && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  className="w-full glass-soft border-border/50 hover:glass transition-all duration-200"
                  data-testid="button-clear-filters"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <Card className="mb-6 glass border-border/50 hover:glass-strong transition-all duration-300 shadow-lg">
        <CardContent className="pt-6">
          <div className="relative">
            <div className="absolute left-3 top-3 p-1 rounded-md bg-gradient-to-br from-primary/10 to-success/10">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <Input
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-12 glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span>{showArchived ?'Archived' :'Active'} Members ({paginatedData?.totalCount || 0})</span>
          </CardTitle>
          <CardDescription>
            {searchTerm 
              ? `Search results for "${searchTerm}" in ${showArchived ? 'archived' : 'active'} members`
              : `All ${showArchived ?'archived' :'active'} members in your club`
            }
            {hasActiveFilters() && Object.values(filters).some(v => v !== undefined && v !=='') && (
              <span className="ml-2 text-primary">• Filters applied</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedData?.members.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-6">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-success/20   rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 bg-gradient-to-br from-background to-muted/20 rounded-full flex items-center justify-center">
                    <Users className="h-10 w-10 text-primary animate-bounce" style={{ animationDelay:'0.5s' }} />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {searchTerm || hasActiveFilters() ?'No members found' :'No members yet'}
              </h3>
              <div className="max-w-md mx-auto mb-8">
                <p className="text-muted-foreground leading-relaxed">
                  {searchTerm || hasActiveFilters()
                    ?'No members match your current search or filters. Try adjusting your criteria or clear the filters to see all members.'
                    : user?.clubTier ==='Unlimited' || user?.clubTier ==='Expand'
                    ?'Welcome to Expand. Add up to 2,000 members as your club grows.'
                    :'Get started by adding your first club member to begin building your community.'
                  }
                </p>
              </div>
              {!searchTerm && !hasActiveFilters() && !showArchived && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => setAddDialogOpen(true)}
                      className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Your First Member
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setImportDialogOpen(true)}
                      className="px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Import Members
                    </Button>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {user?.clubTier ==='Unlimited' || user?.clubTier ==='Expand'
                        ?'Import up to 2,000 members at once with Expand'
                        :'You can also import members from a CSV file'
                      }
                    </p>
                    {(user?.clubTier ==='Unlimited' || user?.clubTier ==='Expand') && (
                      <div className="flex items-center justify-center gap-2 text-xs text-success-foreground">
                        <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
                        <span>Expand capacity • Up to 2,000 members</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Responsive Data Display */}
              <div className="space-y-4">
                {/* Desktop Table - Hidden on mobile */}
                <div className="hidden lg:block">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Membership Type</TableHead>
                          <TableHead>Engagement</TableHead>
                          <TableHead>Dues Status</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData?.members.map((member) => (
                          <TableRow 
                            key={member.id}
                            className="cursor-pointer hover:glass transition-all duration-200 hover:scale-[1.01]"
                            onClick={() => handleMemberRowClick(member)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-[200px]" title={member.fullName}>
                                  {member.fullName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="max-w-xs truncate block" title={member.email}>
                                {member.email}
                              </span>
                            </TableCell>
                            <TableCell>{member.phoneNumber ||'—'}</TableCell>
                            <TableCell>{member.membershipTypeName}</TableCell>
                            <TableCell>
                              <MemberEngagementScore
                                memberId={String(member.id)}
                                score={engagementScores.get(member.id)}
                                isCompact={true}
                              />
                            </TableCell>
                            <TableCell>
                              <Badge variant={getDuesStatus(member).color}>
                                {getDuesStatus(member).status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(member.joinDate)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-4 w-4" data-testid="more-vertical" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {!showArchived && (
                                    <>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMember(member);
                                        setMemberDetailsModalOpen(true);
                                      }}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Member
                                      </DropdownMenuItem>
                                      
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        setMemberToRecordPayment(member);
                                        setRecordPaymentModalOpen(true);
                                      }}>
                                        <Receipt className="h-4 w-4 mr-2" />
                                        Record Payment
                                      </DropdownMenuItem>
                                      
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        setMemberToRequestPayment(member);
                                        setRequestPaymentModalOpen(true);
                                      }}>
                                        <DollarSign className="h-4 w-4 mr-2" />
                                        Request Payment
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  
                                  {showArchived ? (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      setMemberToUnarchive(member);
                                      setUnarchiveDialogOpen(true);
                                    }}>
                                      <Users className="h-4 w-4 mr-2" />
                                      Unarchive
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      setMemberToArchive(member);
                                      setArchiveDialogOpen(true);
                                    }}>
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Mobile Card Layout - Visible on mobile/tablet */}
                <div className="lg:hidden space-y-3">
                  {paginatedData?.members.map((member) => (
                    <div 
                      key={member.id}
                      className="p-4 rounded-lg border glass-soft hover:glass transition-all duration-200 cursor-pointer"
                      onClick={() => handleMemberRowClick(member)}
                    >
                      {/* Header: Name and Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground flex items-center gap-2">
                            {member.fullName}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{member.email}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {!showArchived && (
                              <>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMember(member);
                                  setMemberDetailsModalOpen(true);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Member
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setMemberToRecordPayment(member);
                                  setRecordPaymentModalOpen(true);
                                }}>
                                  <Receipt className="h-4 w-4 mr-2" />
                                  Record Payment
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setMemberToRequestPayment(member);
                                  setRequestPaymentModalOpen(true);
                                }}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Request Payment
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {showArchived ? (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setMemberToUnarchive(member);
                                setUnarchiveDialogOpen(true);
                              }}>
                                <Users className="h-4 w-4 mr-2" />
                                Unarchive
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setMemberToArchive(member);
                                setArchiveDialogOpen(true);
                              }}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {member.phoneNumber && (
                          <div>
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="ml-2 font-medium">{member.phoneNumber}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2 font-medium">{member.membershipTypeName}</span>
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-4">
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant={getDuesStatus(member).color} className="ml-2">
                              {getDuesStatus(member).status}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Joined {formatDate(member.joinDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination Controls */}
              {paginatedData && paginatedData.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="hidden sm:inline">
                      Showing {((paginatedData.currentPage - 1) * paginatedData.pageSize) + 1} to{''}
                      {Math.min(paginatedData.currentPage * paginatedData.pageSize, paginatedData.totalCount)} of{''}
                      {paginatedData.totalCount} results
                    </span>
                    <span className="sm:hidden">
                      Page {paginatedData.currentPage} / {paginatedData.totalPages}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!paginatedData.hasPrevious || loading}
                      className="glass-soft border-border/50 hover:glass transition-all duration-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ?"default" :"outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={pageNum === currentPage ?'bg-gradient-to-r from-primary to-success text-white shadow-md' :'glass-soft border-border/50 hover:glass transition-all duration-200'}
                      >
                        {pageNum}
                      </Button>
                    ))}

                    {/* Next Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!paginatedData.hasNext || loading}
                      className="glass-soft border-border/50 hover:glass transition-all duration-200"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Story 15: Member Details Modal */}
      <MemberDetailsModal
        member={selectedMember}
        isOpen={memberDetailsModalOpen}
        onClose={handleMemberDetailsModalClose}
        membershipTypes={membershipTypes}
        onMemberUpdated={handleMemberUpdated}
      />

      {/* Story 16: Archive Confirmation Modal */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-warning/20 to-warning/20">
                <Archive className="h-5 w-5 text-warning" />
              </div>
              <span>Archive Member</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to archive {memberToArchive?.fullName}? Archived members will no longer appear in the active member list.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)} className="glass-soft border-border/50 hover:glass transition-all duration-200">
              Cancel
            </Button>
            <Button onClick={handleArchiveMember} disabled={archiving} className="bg-gradient-to-r from-warning to-warning hover:from-warning/90 hover:to-warning/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]">
              {archiving ?'Archiving...' :'Archive Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bug #7: Unarchive Confirmation Modal */}
      <Dialog open={unarchiveDialogOpen} onOpenChange={setUnarchiveDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-success/20 to-success/20">
                <Users className="h-5 w-5 text-success" />
              </div>
              <span>Unarchive Member</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to unarchive {memberToUnarchive?.fullName}? This member will become active and appear in the active member list again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setUnarchiveDialogOpen(false)} className="glass-soft border-border/50 hover:glass transition-all duration-200">
              Cancel
            </Button>
            <Button onClick={handleUnarchiveMember} disabled={unarchiving} className="bg-gradient-to-r from-success to-success hover:from-success/90 hover:to-success/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]">
              {unarchiving ?'Unarchiving...' :'Unarchive Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Story 19: Request Payment Modal */}
      <RequestPaymentModal
        member={memberToRequestPayment}
        clubId={user?.clubId || 0}
        isOpen={requestPaymentModalOpen}
        onClose={() => setRequestPaymentModalOpen(false)}
      />

      {/* Story 20: Record Payment Modal */}
      <RecordPaymentModal
        member={memberToRecordPayment}
        isOpen={recordPaymentModalOpen}
        onClose={() => setRecordPaymentModalOpen(false)}
        onPaymentRecorded={loadMembers}
        membershipTypes={membershipTypes}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        membershipTypes={membershipTypes}
        onMemberAdded={loadMembers}
      />

      {/* Import Members Modal */}
      <ImportMembersModal
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        clubId={user?.clubId || 0}
        onSuccess={() => {
          setImportDialogOpen(false);
          loadMembers();
        }}
      />
      </div>
    </div>
  );
} 
