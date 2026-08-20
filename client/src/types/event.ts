export interface Event {
  id: number;
  clubId: number;
  name: string;
  eventDateTime: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  memberPrice?: number | null;
  nonMemberPrice?: number | null;
  isFree?: boolean;
  paymentToken?: string;
}

export interface CreateEventRequest {
  name: string;
  eventDateTime: string;
  location: string;
  description: string;
  sendInvitations?: boolean;
  invitationMethods?: ('email' | 'push')[];
  memberPrice?: number | null;
  nonMemberPrice?: number | null;
  isFree?: boolean;
}

export interface UpdateEventRequest {
  name: string;
  eventDateTime: string;
  location: string;
  description: string;
  sendInvitations?: boolean;
  invitationMethods?: ('email' | 'push')[];
  memberPrice?: number | null;
  nonMemberPrice?: number | null;
  isFree?: boolean;
}

export interface EventResponse {
  id: number;
  clubId: number;
  name: string;
  eventDateTime: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  rsvps?: EventRsvpResponse[];
  attendeeCount: number;
  totalRsvpCount: number;
  memberPrice?: number | null;
  nonMemberPrice?: number | null;
  isFree?: boolean;
  paymentToken?: string;
  isPaid?: boolean;
}

export interface EventRsvpResponse {
  id: number;
  eventId: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  rsvpStatus: string;
  createdAt: string;
  updatedAt: string;
  // Payment fields (EC-03)
  paidAmount?: number | null;
  stripePaymentIntentId?: string | null;
  paymentStatus?: string | null;
}

export interface UpdateRsvpRequest {
  rsvpStatus: string;
}

export interface SendEventInvitationsRequest {
  methods: ('email' | 'push')[];
  memberIds?: number[];
}

export interface SendEventInvitationsResponse {
  message: string;
  sentCount: number;
}

export interface PublicEventResponse {
  id: number;
  name: string;
  description: string;
  eventDateTime: string;
  location: string;
  memberPrice?: number | null;
  nonMemberPrice?: number | null;
  isFree?: boolean;
}

export interface PaymentLinkResponse {
  paymentToken: string;
  paymentLink: string;
  expiresAt: string;
}

// EC-03: Member Event Payment interfaces
export interface PayEventRequest {
  eventId: number;
  paymentMethodId: string;
}

export interface EventPaymentResponse {
  success: boolean;
  paymentId: string;
  rsvpId: number;
  confirmationNumber: string;
  amountPaid: number;
  eventName: string;
  eventDateTime: string;
  eventLocation: string;
  clubName: string;
}

export interface NonMemberEventPaymentRequest {
  eventId: number;
  paymentMethodId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  membershipTypeId?: number;
  createAccount: boolean;
  password?: string;
}

export interface NonMemberEventPaymentResponse {
  success: boolean;
  paymentId: string;
  rsvpId: number;
  confirmationNumber: string;
  eventAmount: number;
  membershipAmount?: number;
  totalAmount: number;
  membershipCreated: boolean;
  accountCreated: boolean;
  memberId?: number;
  eventName: string;
  eventDateTime: string;
  eventLocation: string;
  clubName: string;
}

export interface MembershipTypeOption {
  id: number;
  clubId: number;
  name: string;
  description: string;
  duesAmount: number;
  duesFrequency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
} 