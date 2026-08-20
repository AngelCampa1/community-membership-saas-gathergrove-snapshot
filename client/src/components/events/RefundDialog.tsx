'use client';

import { useState } from 'react';
import { eventPaymentAdminService } from '@/services/eventPaymentAdminService';
import { EventAttendeePaymentInfo } from '@/types/eventPayment';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/useToast';
import { AlertCircle } from 'lucide-react';

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendee: EventAttendeePaymentInfo;
  clubId: number;
  eventId: number;
  onSuccess: () => void;
}

export function RefundDialog({
  open,
  onOpenChange,
  attendee,
  clubId,
  eventId,
  onSuccess,
}: RefundDialogProps) {
  const toast = useToast();
  const [refundAmount, setRefundAmount] = useState(attendee.amountPaid?.toString() || '0');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid refund amount');
      return;
    }

    if (attendee.amountPaid && amount > attendee.amountPaid) {
      setError(`Refund amount cannot exceed the original payment of $${attendee.amountPaid.toFixed(2)}`);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the refund');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await eventPaymentAdminService.issueRefund(clubId, eventId, {
        eventId,
        rsvpId: attendee.rsvpId,
        amount,
        reason: reason.trim(),
      });

      toast.success(response.message || `Refund of $${amount.toFixed(2)} processed successfully`);

      onSuccess();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to process refund';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRefundAmount(attendee.amountPaid?.toString() || '0');
    setReason('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
            <DialogDescription>
              Process a refund for this event payment via Stripe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Attendee Information */}
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Attendee:</span> {attendee.name}
              </div>
              <div className="text-sm">
                <span className="font-medium">Email:</span> {attendee.email}
              </div>
              <div className="text-sm">
                <span className="font-medium">Original Payment:</span> $
                {attendee.amountPaid?.toFixed(2) || '0.00'}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Refund Amount */}
            <div className="space-y-2">
              <Label htmlFor="refundAmount">Refund Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="refundAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={attendee.amountPaid || 0}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="pl-7"
                  required
                />
              </div>
            </div>

            {/* Refund Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Refund</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for issuing this refund..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            {/* Warning */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action will process a refund via Stripe and update the payment status. This
                cannot be easily undone.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Issue Refund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

