# User Story: Member Event Payment & Registration

**Story ID:** EC-03  
**Feature:** Event Charging with Payment Links  
**Priority:** High (Phase 1)

## User Story
**As a** member  
**I want to** pay for an event through a payment link  
**So that** I can register and secure my spot at the event  

## Acceptance Criteria

- [ ] Payment link shows event details (name, date, location, description)
- [ ] Shows member price if logged in as member
- [ ] Can pay using existing payment methods (same as dues payment)
- [ ] Receives confirmation email after successful payment
- [ ] Automatically added to event RSVP list upon payment
- [ ] Can view paid events in member dashboard

## Business Value
- Seamless payment experience using familiar interface
- Automatic event registration reduces admin overhead
- Member pricing incentivizes membership retention
- Integrated experience with existing member portal

## Technical Implementation Notes

### Frontend Changes
- Enhance public event page to detect member authentication
- Integrate existing payment component
- Add event registration to member dashboard

### Backend Changes
- Detect member status for pricing
- Process payments using existing payment service
- Automatically create RSVP upon successful payment
- Send confirmation emails

### Payment Flow
```typescript
interface EventPaymentRequest {
  eventId: number;
  paymentMethodId: string;
  memberStatus: 'member' | 'non-member';
}

interface EventPaymentResponse {
  success: boolean;
  paymentId: string;
  rsvpId: number;
  confirmationNumber: string;
}
```

### Database Changes
```sql
CREATE TABLE event_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  member_id INT NULL, -- NULL for non-members
  payment_id VARCHAR(255) NOT NULL, -- From existing payment system
  amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending', 'completed', 'failed', 'refunded'),
  confirmation_number VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
);
```

## Dependencies
- EC-01: Create Paid Events
- EC-02: Generate Event Payment Links
- Existing payment processing system
- Email notification system

## Definition of Done
- [ ] Members pay at member price when authenticated
- [ ] Payment uses existing payment methods and UI
- [ ] RSVP automatically created upon successful payment
- [ ] Confirmation email sent with event details
- [ ] Paid events appear in member dashboard
- [ ] Payment status tracked in database
- [ ] Error handling for payment failures
- [ ] Duplicate payment prevention

## Estimated Effort
**Large** - 6-8 days development

## Related Stories
- EC-01: Create Paid Events
- EC-02: Generate Event Payment Links
- EC-04: Non-Member Event Payment & Optional Membership
- EC-05: Admin Event Payment Management