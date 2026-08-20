"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Save, X, AlertTriangle } from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import memberService, { MemberResponse, RecordPaymentRequest } from '@/services/memberService';
import { MembershipTypeResponse } from '@/services/membershipTypeService';
import { ErrorHandler } from '@/lib/errorHandler';

interface RecordPaymentModalProps {
  member: MemberResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: () => void;
  membershipTypes: MembershipTypeResponse[];
  members?: MemberResponse[];
}

export function RecordPaymentModal({ 
  member, 
  isOpen, 
  onClose, 
  onPaymentRecorded,
  membershipTypes,
  members = []
}: RecordPaymentModalProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberResponse | null>(member);
  const [formData, setFormData] = useState<RecordPaymentRequest>({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    paymentMethod: '',
    notes: ''
  });

  // Set initial member selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMember(member);
    }
  }, [member, isOpen]);

  // Pre-fill amount with member's membership type dues amount when member is selected
  useEffect(() => {
    if (selectedMember && membershipTypes.length > 0) {
      const membershipType = membershipTypes.find(type => type.id === selectedMember.membershipTypeId);
      const defaultAmount = membershipType ? membershipType.duesAmount : 0;
      
      setFormData({
        amount: defaultAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        notes: ''
      });
    }
  }, [selectedMember, membershipTypes]);

  const handleInputChange = (field: keyof RecordPaymentRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!selectedMember || !user?.clubId) return;

    try {
      setSubmitting(true);
      const paymentResponse = await memberService.recordPayment(user.clubId, selectedMember.id, formData);
      
      // Show appropriate success message based on payment status
      const baseMessage = `Payment of $${formData.amount.toFixed(2)} recorded for ${selectedMember.fullName}`;
      const statusMessage = paymentResponse.paymentStatusMessage || "";
      
      if (paymentResponse.isPartialPayment) {
        toast.warning(`${baseMessage}. ${statusMessage}`, {
          duration: 6000, // Show longer for important partial payment info
        });
      } else {
        toast.success(`${baseMessage}. ${statusMessage}`);
      }
      
      // Reset form
      const membershipType = membershipTypes.find(type => type.id === selectedMember.membershipTypeId);
      const defaultAmount = membershipType ? membershipType.duesAmount : 0;
      setFormData({
        amount: defaultAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        notes: ''
      });
      
      onPaymentRecorded(); // Refresh the member data
      onClose();
    } catch (error: unknown) {
      const apiError = ErrorHandler.handlePaymentError(error, 'recording payment');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form with default amount
    if (selectedMember && membershipTypes.length > 0) {
      const membershipType = membershipTypes.find(type => type.id === selectedMember.membershipTypeId);
      const defaultAmount = membershipType ? membershipType.duesAmount : 0;
      setFormData({
        amount: defaultAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        notes: ''
      });
    } else {
      setFormData({
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        notes: ''
      });
    }
    setSelectedMember(null);
    onClose();
  };

  const getDuesStatus = (member: MemberResponse) => {
    const now = new Date();
    const duesPaidUntil = member.duesPaidUntil ? new Date(member.duesPaidUntil) : null;
    
    if (!duesPaidUntil) {
      return { status: 'Unpaid', color: 'destructive' as const };
    }
    
    if (duesPaidUntil > now) {
      return { 
        status: `Paid until ${duesPaidUntil.toLocaleDateString()}`, 
        color: 'default' as const 
      };
    }
    
    return { status: 'Expired', color: 'secondary' as const };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] glass-strong border-border/50 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {selectedMember ? `Record a Payment for ${selectedMember.fullName}` : 'Record a Payment'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Selection */}
          {!selectedMember && members.length > 0 && (
            <div>
              <Label className="text-base font-medium mb-3 block">Select Member for Payment</Label>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.fullName}</TableCell>
                        <TableCell>
                          <Badge variant={getDuesStatus(member).color}>
                            {getDuesStatus(member).status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => setSelectedMember(member)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Current Partial Payment Status */}
          {selectedMember?.hasPartialPayments && selectedMember?.outstandingBalance && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-warning mb-1">
                <AlertTriangle className="h-4 w-4" />
                Current Partial Payment Status
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-warning/80">Amount already paid:</span>
                  <span className="font-medium text-warning">${selectedMember.totalPaidCurrentPeriod.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warning/80">Outstanding balance:</span>
                  <span className="font-semibold text-warning">${selectedMember.outstandingBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Expected Amount Info */}
          {selectedMember && membershipTypes.length > 0 && (() => {
            const membershipType = membershipTypes.find(type => type.id === selectedMember.membershipTypeId);
            const expectedAmount = membershipType?.duesAmount || 0;
            const currentAmount = formData.amount || 0;
            const isPartial = currentAmount > 0 && currentAmount < expectedAmount;
            
            return (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary/80">Expected {membershipType?.duesFrequency || 'Annual'} Dues:</span>
                  <span className="font-semibold text-primary">${expectedAmount.toFixed(2)}</span>
                </div>
                {isPartial && (
                  <div className="mt-1 text-xs text-warning">
                    ⚠️ Partial payment - ${(expectedAmount - currentAmount).toFixed(2)} will remain outstanding
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* Payment Form - Only show when member is selected */}
          {selectedMember && (
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
                value={formData.amount || ''}
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
              placeholder="Paid at the monthly meeting, check #1234, etc."
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
          {selectedMember && (
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.amount || !formData.paymentDate || !formData.paymentMethod || submitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? 'Recording Payment...' : 'Save Payment'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 