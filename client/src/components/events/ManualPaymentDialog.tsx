'use client';

import { useState, useEffect } from 'react';
import { eventPaymentAdminService } from '@/services/eventPaymentAdminService';
import { memberService, MemberResponse } from '@/services/memberService';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/useToast';
import { AlertCircle } from 'lucide-react';

interface ManualPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: number;
  eventId: number;
  onSuccess: () => void;
}

export function ManualPaymentDialog({
  open,
  onOpenChange,
  clubId,
  eventId,
  onSuccess,
}: ManualPaymentDialogProps) {
  const toast = useToast();
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open, clubId]);

  const loadMembers = async () => {
    try {
      const data = await memberService.getMembers(clubId);
      setMembers(data);
    } catch {
      toast.error('Failed to load club members');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMemberId) {
      setError('Please select a member');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await eventPaymentAdminService.recordManualPayment(clubId, eventId, {
        eventId,
        memberId: selectedMemberId,
        amountPaid: parsedAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      toast.success(response.message || 'Manual payment recorded successfully');

      handleCancel();
      onSuccess();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to record payment';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally{
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedMemberId(null);
    setAmount('');
    setPaymentMethod('cash');
    setNotes('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Manual Payment</DialogTitle>
            <DialogDescription>
              Record a cash, check, or other manual payment for this event
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Member Selector */}
            <div className="space-y-2">
              <Label htmlFor="member">Select Member</Label>
              <Select
                value={selectedMemberId?.toString() || ''}
                onValueChange={(value) => setSelectedMemberId(Number(value))}
              >
                <SelectTrigger id="member">
                  <SelectValue placeholder="Select member..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.fullName} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Alert>
              <AlertDescription>
                This will create or update the RSVP for this member with a completed payment status.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

