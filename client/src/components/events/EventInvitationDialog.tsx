"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Bell, Users, Search, UserCheck, User } from "lucide-react";
import { toast } from "sonner";
import { ErrorHandler } from "@/lib/errorHandler";
import { eventService } from "@/services/eventService";
import { logger } from "@/lib/logger";
import memberService, { MemberResponse } from "@/services/memberService";
import { EventResponse, SendEventInvitationsRequest } from "@/types/event";
import { useAuth } from "@/hooks/useAuth";
import { useClubTier } from "@/hooks/useClubTier";

interface EventInvitationDialogProps {
  open: boolean;
  onClose: () => void;
  event: EventResponse;
  onInvitationsSent?: () => void;
}

export function EventInvitationDialog({
  open,
  onClose,
  event,
  onInvitationsSent
}: EventInvitationDialogProps) {
  const { user } = useAuth();
  const { canSendInvitations } = useClubTier();
  
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [inviteAllMembers, setInviteAllMembers] = useState(true);
  const [invitationMethods, setInvitationMethods] = useState<('email' | 'push')[]>(['email']);

  const loadMembers = useCallback(async () => {
    if (!user?.clubId) return;

    try {
      setMembersLoading(true);
      const membersData = await memberService.getMembers(user.clubId);
      setMembers(membersData);
    } catch (error) {
      logger.error('events', 'Failed to load members for invitations', { error, clubId: user.clubId, eventId: event.id });
      const apiError = ErrorHandler.handleApiError(error, { context: 'loading members' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setMembersLoading(false);
    }
  }, [user?.clubId]);

  // Load members when dialog opens
  useEffect(() => {
    if (open && user?.clubId) {
      loadMembers();
    }
  }, [open, user?.clubId, loadMembers]);

  // Filter members based on search term
  const filteredMembers = members.filter(member =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get members who already have RSVPs for this event
  const invitedMemberIds = event.rsvps?.map(rsvp => rsvp.memberId) || [];
  const uninvitedMembers = filteredMembers.filter(member => 
    !invitedMemberIds.includes(member.id)
  );

  const handleMemberToggle = (memberId: number, checked: boolean) => {
    if (checked) {
      setSelectedMemberIds(prev => [...prev, memberId]);
    } else {
      setSelectedMemberIds(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleSelectAll = () => {
    setSelectedMemberIds(uninvitedMembers.map(member => member.id));
  };

  const handleSelectNone = () => {
    setSelectedMemberIds([]);
  };

  const handleInvitationMethodToggle = (method: 'email' | 'push', checked: boolean) => {
    if (checked) {
      setInvitationMethods(prev => [...prev, method]);
    } else {
      setInvitationMethods(prev => prev.filter(m => m !== method));
    }
  };

  const handleSendInvitations = async () => {
    if (!user?.clubId || !canSendInvitations) return;

    if (invitationMethods.length === 0) {
      toast.error("Please select at least one invitation method");
      return;
    }

    if (!inviteAllMembers && selectedMemberIds.length === 0) {
      toast.error("Please select at least one member to invite");
      return;
    }

    // Declared outside the try so the catch block can log it. Previously this
    // lived inside the try, so on a send failure the catch's logger.error threw
    // a ReferenceError before ErrorHandler ran — the user never saw the error toast.
    const request: SendEventInvitationsRequest = {
      methods: invitationMethods,
      memberIds: inviteAllMembers ? undefined : selectedMemberIds
    };

    try {
      setIsLoading(true);

      const result = await eventService.sendEventInvitations(user.clubId, event.id, request);
      
      toast.success(`Invitations sent to ${result.sentCount} members`);
      onInvitationsSent?.();
      onClose();
    } catch (error) {
      logger.error('events', 'Failed to send event invitations', { error, clubId: user.clubId, eventId: event.id, request });
      const apiError = ErrorHandler.handleApiError(error, { context: 'sending invitations' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSearchTerm("");
    setSelectedMemberIds([]);
    setInviteAllMembers(true);
    setInvitationMethods(['email']);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!canSendInvitations) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Event Invitations
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Upgrade Required
            </h3>
            <p className="text-muted-foreground mb-4">
              Event invitations are only available for Grow tier subscribers.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Event Invitations
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Invite members to &ldquo;{event.name}&rdquo;
          </p>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-hidden">
          {/* Invitation Methods */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Invitation Methods</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailMethod"
                  checked={invitationMethods.includes('email')}
                  onCheckedChange={(checked) => handleInvitationMethodToggle('email', checked as boolean)}
                />
                <Label htmlFor="emailMethod" className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  Email notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pushMethod"
                  checked={invitationMethods.includes('push')}
                  onCheckedChange={(checked) => handleInvitationMethodToggle('push', checked as boolean)}
                />
                <Label htmlFor="pushMethod" className="flex items-center gap-2 text-sm">
                  <Bell className="h-4 w-4" />
                  App push notifications
                </Label>
              </div>
            </div>
          </div>

          {/* Member Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Select Recipients</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inviteAll"
                checked={inviteAllMembers}
                onCheckedChange={(checked) => setInviteAllMembers(checked === true)}
              />
              <Label htmlFor="inviteAll" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Invite all club members
              </Label>
            </div>

            {!inviteAllMembers && (
              <div className="space-y-3 border rounded-lg p-4 bg-muted">
                {/* Search and Quick Actions */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={uninvitedMembers.length === 0}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectNone}
                    disabled={selectedMemberIds.length === 0}
                  >
                    Select None
                  </Button>
                </div>

                {/* Member List */}
                <div className="text-sm text-muted-foreground mb-2">
                  {selectedMemberIds.length} of {uninvitedMembers.length} members selected
                  {invitedMemberIds.length > 0 && (
                    <span className="ml-2">
                      ({invitedMemberIds.length} already invited)
                    </span>
                  )}
                </div>

                <ScrollArea className="h-48 w-full">
                  {membersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-muted-foreground mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading members...</p>
                      </div>
                    </div>
                  ) : uninvitedMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <UserCheck className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? "No members found matching search" : "All members have already been invited"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {uninvitedMembers.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted">
                          <Checkbox
                            id={`member-${member.id}`}
                            checked={selectedMemberIds.includes(member.id)}
                            onCheckedChange={(checked) => handleMemberToggle(member.id, checked as boolean)}
                          />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {member.fullName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {member.membershipTypeName}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendInvitations} 
            disabled={isLoading || invitationMethods.length === 0}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Invitations
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}