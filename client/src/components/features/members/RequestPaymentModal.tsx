'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MemberResponse } from '@/services/memberService';
import { paymentService } from '@/services/paymentService';
import { DollarSign } from 'lucide-react';
import { ErrorHandler } from '@/lib/errorHandler';

interface RequestPaymentModalProps {
  member: MemberResponse | null;
  clubId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestPaymentModal({ member, clubId, isOpen, onClose }: RequestPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form and pre-fill description when modal opens with a member
  useEffect(() => {
    if (isOpen && member) {
      setAmount('');
      const currentDate = new Date();
      const monthYear = currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      setDescription(`Monthly dues for ${monthYear}`);
    } else if (!isOpen) {
      // Reset form when modal closes
      setAmount('');
      setDescription('');
    }
  }, [isOpen, member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!member) return;

    // Validation
    const amountNumber = parseFloat(amount);
    if (!amount || isNaN(amountNumber) || amountNumber <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await paymentService.requestPayment(clubId, member.id, {
        amount: amountNumber,
        description: description.trim(),
      });

      toast.success(`Payment request sent to ${member.fullName}`);
      
      // Reset form and close modal
      setAmount('');
      setDescription('');
      onClose();
    } catch (error) {
      const apiError = ErrorHandler.handlePaymentError(error, 'sending payment request');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Don't render modal if it's not open or member is null
  if (!isOpen || !member) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] glass-strong border-border/50 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Request Payment
          </DialogTitle>
          <DialogDescription>
            Send a secure payment request to {member?.fullName}. They will receive an email with a link to pay online.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              max="99999.99"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this payment for? (e.g., Monthly dues for January 2025)"
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          <div className="bg-primary/10 rounded-lg p-3 text-sm text-primary">
            <p className="font-medium mb-1">What happens next:</p>
                         <ul className="text-xs space-y-1">
               <li>• {member?.fullName} will receive an email with a secure payment link</li>
               <li>• The link expires in 24 hours</li>
               <li>• Payment is processed through your connected Stripe account</li>
               <li>• Member&apos;s dues status will be updated automatically</li>
             </ul>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Payment Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 