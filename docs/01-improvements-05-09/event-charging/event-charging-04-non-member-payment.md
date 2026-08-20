# User Story: Non-Member Event Payment & Optional Membership

**Story ID:** EC-04  
**Feature:** Event Charging with Payment Links  
**Priority:** Medium (Phase 3)

## User Story
**As a** non-member  
**I want to** pay for an event and optionally become a member  
**So that** I can participate in club activities and potentially join the club  

## Acceptance Criteria

- [ ] Payment page shows non-member pricing
- [ ] Option to "Join as member" with membership benefits explanation
- [ ] If choosing membership, shows combined price (event + membership)
- [ ] Can complete payment without creating account (guest checkout)
- [ ] Option to create member account during/after payment
- [ ] Receives event confirmation regardless of membership choice

## Business Value
- Converts event attendees into club members
- Increases club membership through event exposure
- Provides flexible payment options for non-members
- Creates upselling opportunities

## Technical Implementation Notes

### Frontend Changes
- Add membership upgrade option to public event pages
- Implement guest checkout flow
- Create optional account creation after payment

### Backend Changes
- Calculate combined pricing (event + membership)
- Handle guest user payment processing
- Create member accounts for upgrade selections
- Send appropriate confirmations based on choice

### Payment Flow
```typescript
interface NonMemberEventPayment {
  eventPayment: {
    eventId: number;
    amount: number;
  };
  membershipUpgrade?: {
    membershipTypeId: number;
    amount: number;
  };
  guestInfo: {
    fullName: string;
    email: string;
    phone?: string;
  };
  createAccount: boolean;
}
```

### Database Changes
```sql
-- Extend event_payments to handle guest users
ALTER TABLE event_payments ADD COLUMN (
  guest_name VARCHAR(255) NULL,
  guest_email VARCHAR(255) NULL,
  guest_phone VARCHAR(20) NULL,
  membership_upgrade_id INT NULL,
  FOREIGN KEY (membership_upgrade_id) REFERENCES membership_payments(id)
);
```

## Dependencies
- EC-01: Create Paid Events
- EC-02: Generate Event Payment Links
- EC-03: Member Event Payment & Registration
- Existing membership system
- Payment processing system

## Definition of Done
- [ ] Non-member pricing displayed correctly
- [ ] Membership upgrade option clearly presented
- [ ] Combined pricing calculated accurately
- [ ] Guest checkout works without account creation
- [ ] Optional account creation post-payment functions
- [ ] Appropriate confirmations sent based on choice
- [ ] Member benefits clearly explained
- [ ] Payment processing handles both scenarios

## Estimated Effort
**Large** - 7-9 days development

## Related Stories
- EC-01: Create Paid Events
- EC-02: Generate Event Payment Links
- EC-03: Member Event Payment & Registration
- EC-05: Admin Event Payment Management