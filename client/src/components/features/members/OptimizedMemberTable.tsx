'use client';

import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  Calendar,
  Activity,
  TrendingUp,
  Zap
} from "lucide-react";
import { VirtualMemberList, useVirtualListOptimization } from './VirtualMemberList';
import { MemberTable } from './MemberTable';
import { 
  useOptimizedMembers, 
  useOptimizedMembershipTypes, 
  useMemberListPerformance,
  memberCacheUtils,
  MemberFilters 
} from '@/hooks/useOptimizedMembers';
import { MemberResponse } from '@/services/memberService';
import { useAuth } from '@/hooks/useAuth';

interface OptimizedMemberTableProps {
  showArchived?: boolean;
  onViewDetails: (member: MemberResponse) => void;
  onRequestPayment: (member: MemberResponse) => void;
  onRecordPayment: (member: MemberResponse) => void;
  onEditMember: (member: MemberResponse) => void;
  onArchiveMember: (member: MemberResponse) => void;
  onUnarchiveMember?: (member: MemberResponse) => void;
  getDuesStatus?: (member: MemberResponse) => { status: string; color: string };
}

// Performance monitoring component
const PerformanceIndicator = memo(({ 
  isVirtualized, 
  memberCount, 
  renderTime 
}: { 
  isVirtualized: boolean; 
  memberCount: number;
  renderTime: number;
}) => {
  const getPerformanceColor = (time: number) => {
    if (time < 100) return 'text-success';
    if (time < 500) return 'text-warning';
    return 'text-destructive';
  };

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        {isVirtualized ? <Zap className="h-3 w-3 text-success" /> : <Activity className="h-3 w-3" />}
        <span>{isVirtualized ? 'Virtual' : 'Standard'}</span>
      </div>
      <div className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        <span>{memberCount} items</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={getPerformanceColor(renderTime)}>
          ~{Math.round(renderTime)}ms
        </span>
      </div>
    </div>
  );
});

PerformanceIndicator.displayName = 'PerformanceIndicator';

export const OptimizedMemberTable = memo<OptimizedMemberTableProps>(({
  showArchived = false,
  onViewDetails,
  onRequestPayment,
  onRecordPayment,
  onEditMember,
  onArchiveMember,
  onUnarchiveMember,
  getDuesStatus
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MemberFilters>({});

  // Performance monitoring
  const { trackRender, getPerformanceMetrics: _getPerformanceMetrics } = useMemberListPerformance();
  const [renderTime, setRenderTime] = useState(0);

  // Optimized data fetching
  const {
    data: paginatedData,
    isLoading,
    error,
    isFetching
  } = useOptimizedMembers({
    clubId: user?.clubId,
    searchTerm,
    page: currentPage,
    pageSize,
    filters,
    showArchived
  });

  // Membership types
  const { data: membershipTypes = [] } = useOptimizedMembershipTypes(user?.clubId);

  // Virtual scrolling optimization
  const { shouldUseVirtualScrolling, recommendedPageSize, estimatedHeight: _estimatedHeight } = useVirtualListOptimization(
    paginatedData?.totalCount || 0
  );

  // Measure container size for virtual scrolling
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height: Math.min(height, 600) }); // Max height of 600px
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Auto-optimize page size based on performance
  useEffect(() => {
    if (shouldUseVirtualScrolling && pageSize !== recommendedPageSize) {
      setPageSize(recommendedPageSize);
    }
  }, [shouldUseVirtualScrolling, recommendedPageSize, pageSize]);

  // Performance tracking
  useEffect(() => {
    const start = performance.now();
    trackRender();
    const end = performance.now();
    setRenderTime(end - start);
  }, [paginatedData, trackRender]);

  // Cache preloading
  useEffect(() => {
    if (user?.clubId && paginatedData?.hasNext) {
      memberCacheUtils.prefetchNextPage(queryClient, user.clubId, currentPage, pageSize);
    }
  }, [queryClient, user?.clubId, currentPage, pageSize, paginatedData?.hasNext]);

  // Search handler with debouncing built into the hook
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  // Page navigation
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Filter management
  const handleFilterChange = useCallback((key: keyof MemberFilters, value: string | number | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
    setCurrentPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return searchTerm.trim() !== '' || 
           Object.values(filters).some(value => value !== undefined && value !== '');
  }, [searchTerm, filters]);

  // Page number calculation
  const getPageNumbers = useMemo(() => {
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
        pages.push(-1);
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [paginatedData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading members...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-destructive mb-4">Error loading members</div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="glass-soft border-border/50 hover:glass"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const members = paginatedData?.members || [];

  return (
    <div className="space-y-6">
      {/* Performance Indicator (Development Only) */}
      <PerformanceIndicator
        isVirtualized={shouldUseVirtualScrolling && members.length > 0}
        memberCount={paginatedData?.totalCount || 0}
        renderTime={renderTime}
      />

      {/* Filters Panel */}
      {showFilters && (
        <Card className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <span>Advanced Filters</span>
            </CardTitle>
            <CardDescription>Optimize your search with powerful filtering options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Membership Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Membership Type</label>
                <Select
                  value={filters.membershipTypeId?.toString() || 'all'}
                  onValueChange={(value) => handleFilterChange('membershipTypeId', value === 'all' ? undefined : parseInt(value))}
                >
                  <SelectTrigger className="glass-soft border-border/50 focus:glass">
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
                  value={filters.duesStatus || 'all'}
                  onValueChange={(value) => handleFilterChange('duesStatus', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="glass-soft border-border/50 focus:glass">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Current">Current</SelectItem>
                    <SelectItem value="Upcoming">Expiring Soon</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Partial">Partial Payment</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Join Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Join Date Range</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      placeholder="From date"
                      value={filters.joinDateFrom || ''}
                      onChange={(e) => handleFilterChange('joinDateFrom', e.target.value)}
                      className="pl-10 glass-soft border-border/50 focus:glass"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      placeholder="To date"
                      value={filters.joinDateTo || ''}
                      onChange={(e) => handleFilterChange('joinDateTo', e.target.value)}
                      className="pl-10 glass-soft border-border/50 focus:glass"
                    />
                  </div>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  className="w-full glass-soft border-border/50 hover:glass"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 glass-soft border-border/50 focus:glass"
            />
            {isFetching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 glass-soft border-border/50 hover:glass"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {Object.values(filters).filter(v => v !== undefined && v !== '').length}
              </Badge>
            )}
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-2 glass-soft hover:glass"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>

        {/* Page Size Control */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden md:inline">Show:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20 glass-soft border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              {shouldUseVirtualScrolling && <SelectItem value="200">200</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Member List */}
      <Card className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span>
              {showArchived ? 'Archived' : 'Active'} Members ({paginatedData?.totalCount || 0})
            </span>
            {shouldUseVirtualScrolling && members.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Virtualized
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {searchTerm 
              ? `Search results for "${searchTerm}"`
              : `All ${showArchived ? 'archived' : 'active'} members`
            }
            {hasActiveFilters && (
              <span className="ml-2 text-primary">• Filters applied</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={containerRef} className="min-h-[400px]">
            {members.length === 0 ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm || hasActiveFilters ? 'No members found' : 'No members yet'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || hasActiveFilters
                      ? 'Try adjusting your search or filters'
                      : 'Add your first member to get started'
                    }
                  </p>
                </div>
              </div>
            ) : shouldUseVirtualScrolling && containerSize.width > 0 ? (
              <VirtualMemberList
                members={members}
                height={Math.min(containerSize.height || 600, 600)}
                width={containerSize.width}
                onViewDetails={onViewDetails}
                onRequestPayment={onRequestPayment}
                onRecordPayment={onRecordPayment}
                onEditMember={onEditMember}
                onArchiveMember={onArchiveMember}
                onUnarchiveMember={onUnarchiveMember}
                getDuesStatus={getDuesStatus}
                showArchived={showArchived}
                userClubTier={user?.clubTier}
              />
            ) : (
              <MemberTable
                members={members}
                onViewDetails={onViewDetails}
                onRequestPayment={onRequestPayment}
                onRecordPayment={onRecordPayment}
                onEditMember={onEditMember}
                onArchiveMember={onArchiveMember}
                getDuesStatus={getDuesStatus}
              />
            )}
          </div>

          {/* Pagination */}
          {paginatedData && paginatedData.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4 border-t border-border/30 mt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                Showing {((paginatedData.currentPage - 1) * paginatedData.pageSize) + 1} to{' '}
                {Math.min(paginatedData.currentPage * paginatedData.pageSize, paginatedData.totalCount)} of{' '}
                {paginatedData.totalCount} results
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!paginatedData.hasPrevious || isFetching}
                  className="glass-soft border-border/50 hover:glass"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {getPageNumbers.map((pageNum, index) => (
                  pageNum === -1 ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isFetching}
                      className={pageNum === currentPage
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-md'
                        : 'glass-soft border-border/50 hover:glass'
                      }
                    >
                      {pageNum}
                    </Button>
                  )
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!paginatedData.hasNext || isFetching}
                  className="glass-soft border-border/50 hover:glass"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

OptimizedMemberTable.displayName = 'OptimizedMemberTable';
