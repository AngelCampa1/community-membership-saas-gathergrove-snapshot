"use client";

import { useState, useEffect } from'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from"@/components/ui/dialog";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { Textarea } from"@/components/ui/textarea";
import { DollarSign, Save, X } from"lucide-react";
import { toast } from'sonner';
import { useAuth } from'@/hooks/useAuth';
import { paymentService, PaymentResponse, UpdatePaymentRequest } from'@/services/paymentService';
import { MemberResponse } from'@/services/memberService';
import { ErrorHandler } from'@/lib/errorHandler';

interface EditPaymentModalProps {
  payment: PaymentResponse | null;
  member: MemberResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated: () => void;
}

export function EditPaymentModal({ 
  payment, 
  member,
  isOpen, 
  onClose, 
  onPaymentUpdated 
}: EditPaymentModalProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdatePaymentRequest>({
    amount: 0,
    paymentDate:'',
    paymentMethod:'',
    notes:''
  });

  // Load payment data when modal opens
  useEffect(() => {
    if (isOpen && payment) {
      setFormData({
        amount: payment.amount,
        paymentDate: payment.paymentDate.split('T')[0], // Convert to YYYY-MM-DD format
        paymentMethod: payment.paymentMethod,
        notes: payment.notes ||''
      });
    }
  }, [isOpen, payment]);

  const handleInputChange = (field: keyof UpdatePaymentRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!payment || !member || !user?.clubId) return;

    try {
      setSubmitting(true);
      
      await paymentService.updatePayment(user.clubId, member.id, payment.paymentId, formData);
      
      toast.success(`Payment updated successfully for ${member.fullName}`);
      onPaymentUpdated();
    } catch (error: unknown) {
      const apiError = ErrorHandler.handlePaymentError(error,'updating payment');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original payment data
    if (payment) {
      setFormData({
        amount: payment.amount,
        paymentDate: payment.paymentDate.split('T')[0],
        paymentMethod: payment.paymentMethod,
        notes: payment.notes ||''
      });
    }
    onClose();
  };

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Edit Payment - {member?.fullName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show that this is a Stripe payment if applicable */}
          {payment.paymentMethod ==='Stripe' && (
            <div className="bg-primary/10  border border-primary/20  rounded-lg p-3">
              <p className="text-sm text-primary">
                ⚠️ This is a Stripe payment and cannot be edited.
              </p>
            </div>
          )}

          {/* Payment Form - Only show for manual payments */}
          {payment.paymentMethod !=='Stripe' && (
            <>
              <div>
                <Label htmlFor="amount">Amount Paid *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    max="99999.99"
                    step="0.01"
                    value={formData.amount ||''}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: string) => handleInputChange('paymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notes', e.target.value)}
                  placeholder="Payment details, check number, etc."
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          {payment.paymentMethod !=='Stripe' && (
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.amount || !formData.paymentDate || !formData.paymentMethod || submitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ?'Updating...' :'Update Payment'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}