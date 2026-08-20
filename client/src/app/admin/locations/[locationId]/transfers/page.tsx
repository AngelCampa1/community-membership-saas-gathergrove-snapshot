'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, ArrowRight, User, Calendar } from 'lucide-react';
import {
  memberTransferService,
  type MemberTransferResponse,
  MemberTransferStatus,
} from '@/lib/api/memberTransferService';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function TransferApprovalsPage() {
  const params = useParams();
  const toast = useToast();
  const [pendingTransfers, setPendingTransfers] = useState<MemberTransferResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    transfer: MemberTransferResponse | null;
    action: 'approve' | 'deny';
  }>({ open: false, transfer: null, action: 'approve' });
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Parse locationId after hooks are initialized
  const locationId = params?.locationId ? parseInt(params.locationId as string) : null;

  useEffect(() => {
    if (locationId) {
      loadPendingTransfers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const loadPendingTransfers = async () => {
    if (!locationId) return;

    try {
      setLoading(true);
      const data = await memberTransferService.getPendingTransfers(locationId);
      setPendingTransfers(data);
    } catch (error) {
      logger.error('locations', 'Error loading pending member transfers', { error, locationId });
      toast.error('Failed to load pending transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalDialog.transfer) return;

    try {
      setProcessing(true);
      await memberTransferService.approveTransfer(approvalDialog.transfer.id, {
        approvalNotes: notes.trim() || undefined,
      });

      toast.success(`${approvalDialog.transfer.memberName} has been transferred successfully`);

      setApprovalDialog({ open: false, transfer: null, action: 'approve' });
      setNotes('');
      loadPendingTransfers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve transfer');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!approvalDialog.transfer || !notes.trim()) {
      toast.error('Please provide a reason for denying this transfer');
      return;
    }

    try {
      setProcessing(true);
      await memberTransferService.denyTransfer(approvalDialog.transfer.id, {
        denialReason: notes.trim(),
      });

      toast.success(`Transfer request for ${approvalDialog.transfer.memberName} has been denied`);

      setApprovalDialog({ open: false, transfer: null, action: 'deny' });
      setNotes('');
      loadPendingTransfers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to deny transfer');
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalDialog = (transfer: MemberTransferResponse, action: 'approve' | 'deny') => {
    setApprovalDialog({ open: true, transfer, action });
    setNotes('');
  };

  const getStatusBadge = (status: MemberTransferStatus) => {
    const variants: Record<MemberTransferStatus, { variant: any; label: string }> = {
      [MemberTransferStatus.Pending]: { variant: 'default', label: 'Pending' },
      [MemberTransferStatus.Approved]: { variant: 'default', label: 'Approved' },
      [MemberTransferStatus.Rejected]: { variant: 'destructive', label: 'Denied' },
      [MemberTransferStatus.Cancelled]: { variant: 'secondary', label: 'Cancelled' },
      [MemberTransferStatus.Completed]: { variant: 'default', label: 'Completed' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Handle invalid location ID - after all hooks
  if (!locationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Invalid location ID</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading transfers...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Member Transfer Requests</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve member transfers to this location
        </p>
      </div>

      {pendingTransfers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Transfers</h3>
            <p className="text-muted-foreground text-center">
              There are no pending transfer requests for this location
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingTransfers.map((transfer) => (
            <Card key={transfer.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {transfer.memberName}
                    </CardTitle>
                    <CardDescription className="mt-1">{transfer.memberEmail}</CardDescription>
                  </div>
                  {getStatusBadge(transfer.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Transfer Path */}
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">From</div>
                    <div className="font-medium">{transfer.fromLocationName}</div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-primary" />
                  <div className="flex-1 text-right">
                    <div className="text-sm text-muted-foreground">To</div>
                    <div className="font-medium">{transfer.toLocationName}</div>
                  </div>
                </div>

                {/* Transfer Details */}
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Reason:</span>
                    <p className="mt-1 text-sm">{transfer.transferReason}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Requested {new Date(transfer.requestedAt).toLocaleDateString()}
                    </div>
                    <div>by {transfer.requestedByName}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                {transfer.status === MemberTransferStatus.Pending && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => openApprovalDialog(transfer, 'approve')}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve Transfer
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => openApprovalDialog(transfer, 'deny')}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Deny Transfer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval/Denial Dialog */}
      <Dialog
        open={approvalDialog.open}
        onOpenChange={(open) => setApprovalDialog({ ...approvalDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.action === 'approve' ? 'Approve Transfer' : 'Deny Transfer'}
            </DialogTitle>
            <DialogDescription>
              {approvalDialog.action === 'approve'
                ? `Approve the transfer of ${approvalDialog.transfer?.memberName} to this location`
                : `Provide a reason for denying this transfer request`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {approvalDialog.transfer && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="font-medium">{approvalDialog.transfer.memberName}</div>
                <div className="text-sm text-muted-foreground">
                  {approvalDialog.transfer.fromLocationName} → {approvalDialog.transfer.toLocationName}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">
                {approvalDialog.action === 'approve' ? 'Approval Notes (Optional)' : 'Reason for Denial *'}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  approvalDialog.action === 'approve'
                    ? 'Add any notes about this approval...'
                    : 'Explain why this transfer is being denied...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalDialog({ open: false, transfer: null, action: 'approve' })}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={approvalDialog.action === 'approve' ? handleApprove : handleDeny}
              disabled={processing || (approvalDialog.action === 'deny' && !notes.trim())}
              variant={approvalDialog.action === 'approve' ? 'default' : 'destructive'}
            >
              {processing
                ? 'Processing...'
                : approvalDialog.action === 'approve'
                ? 'Approve'
                : 'Deny'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
