'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Settings, Crown, User, Mail, Trash2, X } from 'lucide-react';
import { adminService, type ClubAdminResponse, type AdminInviteResponse } from '@/services/adminService';
import { billingService } from '@/services/billingService';
import { InviteAdminModal } from '@/components/features/admin/InviteAdminModal';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { ErrorHandler } from '@/lib/errorHandler';

export default function ClubAdminsPage() {
  const [admins, setAdmins] = useState<ClubAdminResponse[]>([]);
  const [pendingInvites, setPendingInvites] = useState<AdminInviteResponse[]>([]);
  const [clubTier, setClubTier] = useState<string>('Grow');
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Get club ID from authenticated user
  const clubId = user?.clubId || 0;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get billing status to check tier
      const billingStatus = await billingService.getBillingStatus();
      setClubTier(billingStatus.currentTier);

      // Get admins and pending invites
      const [adminsData, invitesData] = await Promise.all([
        adminService.getClubAdmins(clubId),
        adminService.getPendingInvites(clubId)
      ]);

      setAdmins(adminsData);
      setPendingInvites(invitesData);
    } catch (error) {
      logger.error('admins', 'Error loading admin data', { error, clubId });
      const apiError = ErrorHandler.handleApiError(error, { context: 'loading administrator information' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (clubId > 0) {
      loadData();
    }
  }, [clubId, loadData]);

  const handleInviteSubmit = async (email: string) => {
    try {
      await adminService.createAdminInvite(clubId, { email });
      toast.success(`Invitation sent to ${email}`);
      setShowInviteModal(false);
      await loadData(); // Refresh the data
    } catch (error: unknown) {
      logger.error('admins', 'Error sending invitation', { error, email, clubId });
      const apiError = ErrorHandler.handleApiError(error, { context: 'sending invitation' });
      ErrorHandler.showErrorToast(apiError);
    }
  };

  const handleCancelInvite = async (inviteId: number) => {
    try {
      await adminService.cancelInvite(clubId, inviteId);
      toast.success('Invitation cancelled successfully');
      await loadData(); // Refresh the data
    } catch (error: unknown) {
      logger.error('admins', 'Error cancelling invitation', { error, inviteId, clubId });
      const apiError = ErrorHandler.handleApiError(error, { context: 'cancelling invitation' });
      ErrorHandler.showErrorToast(apiError);
    }
  };

  const handleRemoveAdmin = async (userId: number, fullName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${fullName} as an administrator?`)) {
      return;
    }

    try {
      await adminService.removeAdmin(clubId, userId);
      toast.success(`${fullName} has been removed as an administrator`);
      await loadData(); // Refresh the data
    } catch (error: unknown) {
      logger.error('admins', 'Error removing admin', { error, userId, clubId });
      const apiError = ErrorHandler.handleApiError(error, { context: 'removing administrator' });
      ErrorHandler.showErrorToast(apiError);
    }
  };

  const isExpandTier = clubTier === 'Expand' || clubTier === 'Unlimited';
  const canManageAdmins = clubTier === 'Grow' || isExpandTier;
  const adminLimit = isExpandTier ? null : 3;
  const canInviteMore = canManageAdmins && (adminLimit === null || admins.length + pendingInvites.length < adminLimit);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Club Administrators</h1>
        </div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Club Administrators</h1>
          <Badge variant={clubTier === 'Grow' ? 'default' : 'secondary'}>
            {clubTier} Tier
          </Badge>
        </div>
        
        {canInviteMore && (
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2"
            data-testid="invite-admin-button"
          >
            <UserPlus className="h-4 w-4" />
            Invite New Admin
          </Button>
        )}
      </div>

      {/* Tier restriction notice */}
      {!canManageAdmins && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription>
            Administrator invitations are only available for clubs on the Grow tier.
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal ml-1"
              onClick={() => router.push('/admin/billing')}
            >
              Upgrade to Grow
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Admin limit notice */}
      {canManageAdmins && adminLimit !== null && !canInviteMore && (
        <Alert>
          <AlertDescription>
            Your club has reached the {adminLimit}-admin limit.
            Remove an admin or cancel an invite to add someone new.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Administrators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current Administrators ({admins.length})
          </CardTitle>
          <CardDescription>
            People who currently have administrative access to your club
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admins.map((admin) => (
              <div key={admin.userId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {admin.role === 'Primary' ? (
                      <Crown className="h-5 w-5 text-warning" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{admin.fullName}</span>
                      {admin.isCurrentUser && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {admin.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={admin.role === 'Primary' ? 'default' : 'secondary'}>
                    {admin.role}
                  </Badge>
                  {admin.role !== 'Primary' && !admin.isCurrentUser && canManageAdmins && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.userId, admin.fullName)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid={`remove-admin-${admin.userId}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvites.length})
            </CardTitle>
            <CardDescription>
              Invitations that have been sent but not yet accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvites.map((invite) => (
                <div key={invite.inviteId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{invite.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Invited by {invite.invitedByName} • 
                        Expires {new Date(invite.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Pending</Badge>
                    {canManageAdmins && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.inviteId)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        data-testid={`cancel-invite-${invite.inviteId}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      <InviteAdminModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onSubmit={handleInviteSubmit}
      />
    </div>
  );
} 
