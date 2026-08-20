import React, { memo, useMemo, useCallback } from'react';
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from"@/components/ui/dropdown-menu";
import { MoreVertical, Archive, DollarSign, Edit, Receipt, Users } from"lucide-react";
import { MemberResponse } from'@/services/memberService';
import { format } from'date-fns';
import { MemberEngagementScore } from'@/components/engagement';

interface VirtualMemberListProps {
  members: MemberResponse[];
  height: number;
  width: number;
  onViewDetails: (member: MemberResponse) => void;
  onRequestPayment: (member: MemberResponse) => void;
  onRecordPayment: (member: MemberResponse) => void;
  onEditMember: (member: MemberResponse) => void;
  onArchiveMember: (member: MemberResponse) => void;
  onUnarchiveMember?: (member: MemberResponse) => void;
  getDuesStatus?: (member: MemberResponse) => { status: string; color: string };
  showArchived?: boolean;
  userClubTier?: string;
}

interface MemberRowData {
  members: MemberResponse[];
  onViewDetails: (member: MemberResponse) => void;
  onRequestPayment: (member: MemberResponse) => void;
  onRecordPayment: (member: MemberResponse) => void;
  onEditMember: (member: MemberResponse) => void;
  onArchiveMember: (member: MemberResponse) => void;
  onUnarchiveMember?: (member: MemberResponse) => void;
  getDuesStatus: (member: MemberResponse) => { status: string; color: string };
  showArchived: boolean;
  userClubTier?: string;
}

interface MemberRowProps {
  index: number;
  style: React.CSSProperties;
  data: MemberRowData;
}

// Default dues status function
const defaultGetDuesStatus = (member: MemberResponse) => {
  if (!member.duesPaidUntil) {
    if (member.hasPartialPayments && member.outstandingBalance) {
      return { 
        status: `Partial: $${member.outstandingBalance.toFixed(2)} remaining`, 
        color:'secondary' 
      };
    }
    return { status:'Unpaid', color:'destructive' };
  }

  const today = new Date();
  const duesDate = new Date(member.duesPaidUntil);
  
  const diffTime = duesDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status:'Overdue', color:'destructive' };
  } else if (diffDays <= 30) {
    return { status:'Expiring Soon', color:'secondary' };
  } else {
    return { status:'Current', color:'default' };
  }
};

// Memoized member row component
const MemberRow = memo<MemberRowProps>(({ index, style, data }) => {
  const member = data.members[index];
  
  const duesStatusInfo = useMemo(() =>
    data.getDuesStatus(member),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- data is a stable object reference from parent
    [member]
  );

  const getBadgeVariant = useMemo(() => {
    switch (duesStatusInfo.color) {
      case'default': return'default' as const;
      case'destructive': return'destructive' as const;
      case'secondary': return'secondary' as const;
      case'outline': return'outline' as const;
      default: return'outline' as const;
    }
  }, [duesStatusInfo.color]);

  const _getStatusVariant = useMemo(() => {
    switch (member.status) {
      case'Active': return'default' as const;
      case'Inactive': return'secondary' as const;
      case'Archived': return'outline' as const;
      default: return'outline' as const;
    }
  }, [member.status]);

  const formattedJoinDate = useMemo(() => {
    try {
      return format(new Date(member.joinDate),'MMM dd, yyyy');
    } catch {
      return'Invalid date';
    }
  }, [member.joinDate]);

  const handleRowClick = useCallback(() => {
    data.onViewDetails(member);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- data callbacks are stable references from parent
  }, [member]);

  const handleEditMember = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onEditMember(member);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- data callbacks are stable references from parent
  }, [member]);

  const handleRecordPayment = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onRecordPayment(member);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- data callbacks are stable references from parent
  }, [member]);

  const handleRequestPayment = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onRequestPayment(member);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- data callbacks are stable references from parent
  }, [member]);

  const handleArchiveMember = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onArchiveMember(member);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- data callbacks are stable references from parent
  }, [member]);

  const handleUnarchiveMember = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onUnarchiveMember?.(member);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- data callbacks are stable references from parent
  }, [member]);

  return (
    <div
      style={style}
      className="flex items-center gap-4 p-4 border-b border-border/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
      onClick={handleRowClick}
    >
      {/* Member Info - Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-8 lg:gap-4 lg:items-center lg:w-full">
        {/* Name */}
        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            {member.fullName}
          </div>
        </div>
        
        {/* Email */}
        <div className="text-muted-foreground group-hover:text-foreground/90 transition-colors truncate">
          {member.email}
        </div>
        
        {/* Phone */}
        <div className="text-muted-foreground">
          {member.phoneNumber ||'—'}
        </div>
        
        {/* Membership Type */}
        <div className="font-medium text-foreground/90">
          {member.membershipTypeName}
        </div>
        
        {/* Engagement */}
        <div>
          <MemberEngagementScore memberId={String(member.id)} isCompact={true} />
        </div>
        
        {/* Dues Status */}
        <div>
          <Badge variant={getBadgeVariant} className="shadow-sm">
            {duesStatusInfo.status}
          </Badge>
        </div>
        
        {/* Join Date */}
        <div className="text-muted-foreground font-medium">
          {formattedJoinDate}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:shadow-md transition-all duration-200 rounded-full">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-border/50 backdrop-blur-xl shadow-xl">
              {!data.showArchived && (
                <>
                  <DropdownMenuItem onClick={handleEditMember} className="cursor-pointer hover:bg-primary/5 transition-colors duration-200">
                    <Edit className="mr-2 h-4 w-4 text-primary" />
                    Edit member
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRequestPayment} className="cursor-pointer hover:bg-primary/5 transition-colors duration-200">
                    <DollarSign className="mr-2 h-4 w-4 text-success" />
                    Request payment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRecordPayment} className="cursor-pointer hover:bg-primary/5 transition-colors duration-200">
                    <Receipt className="mr-2 h-4 w-4 text-primary" />
                    Record payment
                  </DropdownMenuItem>
                </>
              )}
              
              {data.showArchived ? (
                <DropdownMenuItem
                  onClick={handleUnarchiveMember}
                  className="cursor-pointer hover:bg-primary/5 transition-colors duration-200"
                >
                  <Users className="mr-2 h-4 w-4 text-success" />
                  Unarchive member
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={handleArchiveMember}
                  className="text-destructive cursor-pointer hover:bg-destructive/10  transition-colors duration-200"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive member
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Member Info - Mobile Layout */}
      <div className="lg:hidden w-full">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="font-medium text-foreground flex items-center gap-2">
              {member.fullName}
            </div>
            <div className="text-sm text-muted-foreground">{member.email}</div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {!data.showArchived && (
                  <>
                    <DropdownMenuItem onClick={handleEditMember}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Member
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleRecordPayment}>
                      <Receipt className="h-4 w-4 mr-2" />
                      Record Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleRequestPayment}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Request Payment
                    </DropdownMenuItem>
                  </>
                )}
                {data.showArchived ? (
                  <DropdownMenuItem onClick={handleUnarchiveMember}>
                    <Users className="h-4 w-4 mr-2" />
                    Unarchive
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleArchiveMember}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
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
          <div className="sm:col-span-2 flex items-center justify-between">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={getBadgeVariant} className="ml-2">
                {duesStatusInfo.status}
              </Badge>
            </div>
            <div className="text-muted-foreground text-xs">
              Joined {formattedJoinDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MemberRow.displayName ='MemberRow';

// Header component for virtual list
const VirtualListHeader = memo(() => (
  <div className="hidden lg:grid lg:grid-cols-8 lg:gap-4 lg:items-center lg:p-4 lg:border-b lg:border-border/50 bg-gradient-to-r from-muted/60 to-muted/40 backdrop-blur-md font-semibold text-foreground">
    <div>Name</div>
    <div>Email</div>
    <div>Phone</div>
    <div>Membership Type</div>
    <div>Engagement</div>
    <div>Dues Status</div>
    <div>Join Date</div>
    <div className="text-center">Actions</div>
  </div>
));

VirtualListHeader.displayName ='VirtualListHeader';

// Main virtual member list component
export const VirtualMemberList = memo<VirtualMemberListProps>(({ 
  members, 
  height, 
  width,
  onViewDetails, 
  onRequestPayment, 
  onRecordPayment, 
  onEditMember, 
  onArchiveMember,
  onUnarchiveMember,
  getDuesStatus = defaultGetDuesStatus,
  showArchived = false,
  userClubTier
}) => {
  const itemData = useMemo<MemberRowData>(() => ({
    members,
    onViewDetails,
    onRequestPayment,
    onRecordPayment,
    onEditMember,
    onArchiveMember,
    onUnarchiveMember,
    getDuesStatus,
    showArchived,
    userClubTier
  }), [
    members,
    onViewDetails,
    onRequestPayment,
    onRecordPayment,
    onEditMember,
    onArchiveMember,
    onUnarchiveMember,
    getDuesStatus,
    showArchived,
    userClubTier
  ]);

  const itemSize = useMemo(() => {
    // Dynamic item height based on screen size
    return window.innerWidth >= 1024 ? 80 : 120; // Larger on mobile due to card layout
  }, []);

  const effectiveHeight = useMemo(() => {
    const headerHeight = window.innerWidth >= 1024 ? 60 : 0; // Header only on desktop
    return height - headerHeight;
  }, [height]);

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No members to display</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="glass border border-border/50 rounded-xl overflow-hidden shadow-lg hover:glass-strong transition-all duration-300"
      style={{ height, width }}
    >
      <VirtualListHeader />
      <div style={{ height: effectiveHeight, overflowY:'auto' }}>
        {members.map((member, index) => (
          <MemberRow
            key={member.id}
            index={index}
            style={{ height: itemSize }}
            data={itemData}
          />
        ))}
      </div>
    </div>
  );
});

VirtualMemberList.displayName ='VirtualMemberList';

// Custom hook for virtual list optimization
export const useVirtualListOptimization = (totalItems: number) => {
  const recommendedPageSize = useMemo(() => {
    // Optimize page size based on total items and viewport
    if (totalItems <= 100) return 25;
    if (totalItems <= 500) return 50;
    if (totalItems <= 1000) return 100;
    return 200; // For very large datasets
  }, [totalItems]);

  const shouldUseVirtualScrolling = useMemo(() => {
    return totalItems > 100; // Use virtual scrolling for > 100 items
  }, [totalItems]);

  const estimatedHeight = useMemo(() => {
    const itemHeight = window.innerWidth >= 1024 ? 80 : 120;
    const headerHeight = window.innerWidth >= 1024 ? 60 : 0;
    const maxVisibleItems = Math.min(totalItems, 10); // Show max 10 items initially
    
    return (maxVisibleItems * itemHeight) + headerHeight;
  }, [totalItems]);

  return {
    recommendedPageSize,
    shouldUseVirtualScrolling,
    estimatedHeight
  };
};
