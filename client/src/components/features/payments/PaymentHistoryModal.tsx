"use client";

import { useState, useEffect, useCallback } from'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from"@/components/ui/dialog";
import { Button } from"@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from"@/components/ui/table";
import { Badge } from"@/components/ui/badge";
import { Edit2, Trash2, X, Clock, DollarSign } from"lucide-react";
import { toast } from'sonner';
import { useAuth } from'@/hooks/useAuth';
import { paymentService, PaymentResponse } from'@/services/paymentService';
import { MemberResponse } from'@/services/memberService';
import { EditPaymentModal } from'./EditPaymentModal';
import { ErrorHandler } from'@/lib/errorHandler';

interface PaymentHistoryModalProps {
  member: MemberResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated: () => void;
}

export function PaymentHistoryModal({ 
  member, 
  isOpen, 
  onClose, 
  onPaymentUpdated 
}: PaymentHistoryModalProps) {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadPayments = useCallback(async () => {
    if (!member || !user?.clubId) return;

    try {
      setLoading(true);
      const paymentsData = await paymentService.getMemberPayments(user.clubId, member.id);
      setPayments(paymentsData);
    } catch (error) {
      const apiError = ErrorHandler.handlePaymentError(error,'loading payment history');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setLoading(false);
    }
  }, [member, user?.clubId]);

  useEffect(() => {
    if (isOpen && member && user?.clubId) {
      loadPayments();
    }
  }, [isOpen, member, user?.clubId, loadPayments]);

  const handleEditPayment = (payment: PaymentResponse) => {
    setEditingPayment(payment);
    setIsEditModalOpen(true);
  };

  const handleDeletePayment = async (payment: PaymentResponse) => {
    if (!user?.clubId) return;

    // Only allow deleting manual payments
    if (payment.paymentMethod ==='Stripe') {
      ErrorHandler.showErrorToast('Stripe payments cannot be deleted');
      return;
    }

    if (!confirm(`Are you sure you want to delete this ${payment.paymentMethod} payment of $${payment.amount.toFixed(2)}? This action cannot be undone.`)) {
      return;
    }

    try {
      await paymentService.deletePayment(user.clubId, member!.id, payment.paymentId);
      toast.success('Payment deleted successfully');
      await loadPayments(); // Refresh payments
      onPaymentUpdated(); // Refresh parent data
    } catch (error) {
      const apiError = ErrorHandler.handlePaymentError(error,'deleting payment');
      ErrorHandler.showErrorToast(apiError);
    }
  };

  const handlePaymentUpdated = async () => {
    setIsEditModalOpen(false);
    setEditingPayment(null);
    await loadPayments(); // Refresh payments
    onPaymentUpdated(); // Refresh parent data
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style:'currency',
      currency:'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method.toLowerCase()) {
      case'stripe':
        return <Badge variant="default" className="bg-primary/10 text-primary   border border-primary/20">Stripe</Badge>;
      case'cash':
        return <Badge variant="secondary">Cash</Badge>;
      case'check':
        return <Badge variant="outline">Check</Badge>;
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Payment History - {member?.fullName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading payment history...</div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No payments found for this member.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.paymentId}>
                        <TableCell className="font-medium">
                          {formatDate(payment.paymentDate)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(payment.amount)}
                          {payment.isPartialPayment && (
                            <div className="text-xs text-warning">
                              Partial Payment
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(payment.paymentMethod)}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {payment.notes ||'-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {payment.paymentMethod !=='Stripe' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditPayment(payment)}
                                  className="h-8 w-8 p-0"
                                  title="Edit payment"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeletePayment(payment)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Delete payment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Modal */}
      <EditPaymentModal
        payment={editingPayment}
        member={member}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPayment(null);
        }}
        onPaymentUpdated={handlePaymentUpdated}
      />
    </>
  );
}