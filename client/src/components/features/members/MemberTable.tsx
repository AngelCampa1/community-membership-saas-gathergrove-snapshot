import React, { memo, useMemo } from'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from"@/components/ui/table";
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from"@/components/ui/dropdown-menu";
import { MoreVertical, Archive, DollarSign, Edit, Receipt } from"lucide-react";
import { MemberResponse } from'@/services/memberService';
import { format } from'date-fns';

interface MemberTableProps {
  members: MemberResponse[];
  onViewDetails: (member: MemberResponse) => void;
  onRequestPayment: (member: MemberResponse) => void;
  onRecordPayment: (member: MemberResponse) => void;
  onEditMember: (member: MemberResponse) => void;
  onArchiveMember: (member: MemberResponse) => void;
  getDuesStatus?: (member: MemberResponse) => { status: string; color: string };
}

interface MemberRowProps {
  member: MemberResponse;
  onViewDetails: (member: MemberResponse) => void;
  onRequestPayment: (member: MemberResponse) => void;
  onRecordPayment: (member: MemberResponse) => void;
  onEditMember: (member: MemberResponse) => void;
  onArchiveMember: (member: MemberResponse) => void;
  getDuesStatus?: (member: MemberResponse) => { status: string; color: string };
}

const MemberRow = memo<MemberRowProps>(({ member, onViewDetails, onRequestPayment, onRecordPayment, onEditMember, onArchiveMember, getDuesStatus }) => {
  const defaultGetDuesStatus = useMemo(() => (member: MemberResponse) => {
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
  }, []);

  const duesStatusInfo = useMemo(() => 
    (getDuesStatus || defaultGetDuesStatus)(member), 
    [member, getDuesStatus, defaultGetDuesStatus]
  );

  const getBadgeVariant = useMemo(() => {
    switch (duesStatusInfo.color) {
      case'default': return'default';
      case'destructive': return'destructive';
      case'secondary': return'secondary';
      case'outline': return'outline';
      default: return'outline';
    }
  }, [duesStatusInfo.color]);

  const getStatusVariant = useMemo(() => {
    switch (member.status) {
      case'Active': return'default';
      case'Inactive': return'secondary';
      case'Archived': return'outline';
      default: return'outline';
    }
  }, [member.status]);

  const formattedJoinDate = useMemo(() => {
    try {
      return format(new Date(member.joinDate),'MMM dd, yyyy');
    } catch {
      return'Invalid date';
    }
  }, [member.joinDate]);

  const formattedDuesPaidUntil = useMemo(() => {
    if (!member.duesPaidUntil) return'Never';
    try {
      return format(new Date(member.duesPaidUntil),'MMM dd, yyyy');
    } catch {
      return'Invalid date';
    }
  }, [member.duesPaidUntil]);

  return (
    <TableRow key={member.id} className="cursor-pointer hover:bg-primary/5 transition-all duration-200 group border-border/30">
      <TableCell onClick={() => onViewDetails(member)} className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 px-4 py-3">
        {member.fullName}
      </TableCell>
      <TableCell onClick={() => onViewDetails(member)} className="text-muted-foreground group-hover:text-foreground/90 transition-colors duration-200 px-4 py-3">
        {member.email}
      </TableCell>
      <TableCell onClick={() => onViewDetails(member)} className="font-medium text-foreground/90 px-4 py-3">
        {member.membershipTypeName}
      </TableCell>
      <TableCell onClick={() => onViewDetails(member)} className="px-4 py-3">
        <Badge variant={getStatusVariant} className="shadow-sm glass-soft border-border/30">
          {member.status}
        </Badge>
      </TableCell>
      <TableCell onClick={() => onViewDetails(member)} className="px-4 py-3">
        <Badge variant={getBadgeVariant} className="shadow-sm glass-soft border-border/30">
          {duesStatusInfo.status}
        </Badge>
      </TableCell>
      <TableCell onClick={() => onViewDetails(member)} className="text-muted-foreground font-medium px-4 py-3">
        {formattedJoinDate}
      </TableCell>
      <TableCell onClick={() => onViewDetails(member)} className="text-muted-foreground font-medium px-4 py-3">
        {formattedDuesPaidUntil}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()} className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:shadow-md transition-all duration-200 rounded-full">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-strong border-border/50 backdrop-blur-xl shadow-xl">
            <DropdownMenuItem onClick={() => onEditMember(member)} className="cursor-pointer hover:bg-primary/5 transition-colors duration-200">
              <Edit className="mr-2 h-4 w-4 text-primary" />
              Edit member
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRequestPayment(member)} className="cursor-pointer hover:bg-primary/5 transition-colors duration-200">
              <DollarSign className="mr-2 h-4 w-4 text-success" />
              Request payment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRecordPayment(member)} className="cursor-pointer hover:bg-primary/5 transition-colors duration-200">
              <Receipt className="mr-2 h-4 w-4 text-primary" />
              Record payment
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onArchiveMember(member)}
              className="text-destructive cursor-pointer hover:bg-destructive/10  transition-colors duration-200"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

MemberRow.displayName ='MemberRow';

export const MemberTable = memo<MemberTableProps>(({ 
  members, 
  onViewDetails, 
  onRequestPayment, 
  onRecordPayment, 
  onEditMember, 
  onArchiveMember,
  getDuesStatus
}) => {
  return (
    <div className="glass border border-border/50 rounded-xl overflow-hidden shadow-lg hover:glass-strong transition-all duration-300">
      <Table>
        <TableHeader className="bg-gradient-to-r from-muted/60 to-muted/40 backdrop-blur-md border-b border-border/50">
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="font-semibold text-foreground px-4 py-4">Name</TableHead>
            <TableHead className="font-semibold text-foreground px-4 py-4">Email</TableHead>
            <TableHead className="font-semibold text-foreground px-4 py-4">Membership Type</TableHead>
            <TableHead className="font-semibold text-foreground px-4 py-4">Status</TableHead>
            <TableHead className="font-semibold text-foreground px-4 py-4">Dues Status</TableHead>
            <TableHead className="font-semibold text-foreground px-4 py-4">Join Date</TableHead>
            <TableHead className="font-semibold text-foreground px-4 py-4">Dues Paid Until</TableHead>
            <TableHead className="w-[50px] font-semibold text-foreground px-4 py-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              onViewDetails={onViewDetails}
              onRequestPayment={onRequestPayment}
              onRecordPayment={onRecordPayment}
              onEditMember={onEditMember}
              onArchiveMember={onArchiveMember}
              getDuesStatus={getDuesStatus}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

MemberTable.displayName ='MemberTable';