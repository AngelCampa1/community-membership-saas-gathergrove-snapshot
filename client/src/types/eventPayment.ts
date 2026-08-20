export interface EventPaymentOverview {
  eventId: number;
  eventName: string;
  totalRevenue: number;
  totalAttendees: number;
  paymentSummary: PaymentSummaryStats;
  attendees: EventAttendeePaymentInfo[];
}

export interface PaymentSummaryStats {
  completed: number;
  pending: number;
  failed: number;
  refunded: number;
  manualPayments: number;
}

export interface EventAttendeePaymentInfo {
  rsvpId: number;
  memberId?: number;
  name: string;
  email: string;
  memberStatus: 'member' | 'non-member' | 'guest';
  paymentStatus: string;
  amountPaid?: number;
  paymentDate?: string;
  paymentMethod?: string;
  canRefund: boolean;
  stripePaymentIntentId?: string;
}

export interface IssueRefundRequest {
  eventId: number;
  rsvpId: number;
  amount: number;
  reason: string;
}

export interface RecordManualPaymentRequest {
  eventId: number;
  memberId: number;
  amountPaid: number;
  paymentMethod: string;
  notes?: string;
}

export interface EventRefundResponse {
  success: boolean;
  refundId: string;
  message: string;
}

export interface ManualPaymentResponse {
  success: boolean;
  rsvpId: number;
  message: string;
}

