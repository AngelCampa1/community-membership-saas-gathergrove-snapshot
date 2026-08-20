# User Story: Admin Event Payment Management

**Story ID:** EC-05  
**Feature:** Event Charging with Payment Links  
**Priority:** Medium (Phase 3)

## User Story
**As a** club admin  
**I want to** see who has paid for my events and manage payments  
**So that** I can track event revenue and handle payment issues  

## Acceptance Criteria

- [ ] Event details show list of paid attendees
- [ ] Shows payment status, amount paid, and payment date
- [ ] Can see total event revenue
- [ ] Can issue refunds if needed
- [ ] Can manually mark someone as paid (for cash payments)
- [ ] Export attendee list with payment information

## Business Value
- Provides financial oversight of event revenue
- Enables customer service for payment issues
- Supports cash payment scenarios
- Facilitates event planning and capacity management

## Technical Implementation Notes

### Frontend Changes
- Add payment management tab to event details page
- Create payment status dashboard
- Implement refund interface
- Add manual payment recording form

### Backend Changes
- Create admin APIs for payment management
- Implement refund processing
- Add manual payment recording
- Generate payment reports and exports

### Admin Interface Components
```typescript
interface EventPaymentManagement {
  eventId: number;
  totalRevenue: number;
  totalAttendees: number;
  paymentSummary: {
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
  };
  attendeeList: EventAttendee[];
}

interface EventAttendee {
  id: number;
  name: string;
  email: string;
  memberStatus: 'member' | 'non-member' | 'guest';
  paymentStatus: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  canRefund: boolean;
}
```

### Export Features
- CSV export with payment details
- Financial summary reports
- Integration with existing reporting system

## Dependencies
- EC-01: Create Paid Events
- EC-03: Member Event Payment & Registration
- EC-04: Non-Member Event Payment & Optional Membership
- Existing admin interface
- Payment processing system

## Definition of Done
- [ ] Complete payment overview for each event
- [ ] Refund processing functionality
- [ ] Manual payment recording works
- [ ] Export functionality provides complete data
- [ ] Financial summaries accurate
- [ ] Payment status tracking reliable
- [ ] Admin permissions properly enforced

## Estimated Effort
**Large** - 6-8 days development

## Related Stories
- EC-01: Create Paid Events
- EC-03: Member Event Payment & Registration
- EC-04: Non-Member Event Payment & Optional Membership