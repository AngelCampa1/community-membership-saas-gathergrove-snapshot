# User Story: Create Paid Events

**Story ID:** EC-01  
**Feature:** Event Charging with Payment Links  
**Priority:** High (Phase 1)

## User Story
**As a** club admin  
**I want to** set a price when creating an event  
**So that** attendees can pay for event participation  

## Acceptance Criteria

- [ ] Event creation form includes optional "Event Price" field
- [ ] Can set price to $0 for free events (default)
- [ ] Can set different prices for members vs non-members
- [ ] Price validation (positive numbers, reasonable limits)
- [ ] Event displays as "Free" or shows price amount
- [ ] Can edit event price before event date

## Business Value
- Enables monetization of club events
- Supports premium event offerings
- Provides member benefits through discounted pricing
- Creates revenue streams beyond membership dues

## Technical Implementation Notes

### Database Changes
```sql
ALTER TABLE events ADD COLUMN (
  member_price DECIMAL(10,2) DEFAULT 0.00,
  non_member_price DECIMAL(10,2) DEFAULT 0.00,
  is_free BOOLEAN GENERATED ALWAYS AS (
    member_price = 0 AND non_member_price = 0
  ) STORED
);
```

### Frontend Changes
- Add pricing fields to EventForm component
- Update event display components to show pricing
- Add validation for price inputs

### Backend Changes
- Update Event model with pricing fields
- Modify event creation/update APIs
- Add price validation logic

### API Changes
```typescript
interface CreateEventRequest {
  // ... existing fields
  memberPrice?: number;
  nonMemberPrice?: number;
}

interface EventResponse {
  // ... existing fields
  memberPrice: number;
  nonMemberPrice: number;
  isFree: boolean;
}
```

## Dependencies
- Existing event management system
- Member authentication system

## Definition of Done
- [ ] Event creation supports pricing configuration
- [ ] Price validation prevents invalid values
- [ ] Events display pricing information correctly
- [ ] Free events clearly marked as "Free"
- [ ] Price editing works for future events
- [ ] Database migration successfully applied
- [ ] All existing events default to free

## Estimated Effort
**Medium** - 3-4 days development

## Related Stories
- EC-02: Generate Event Payment Links
- EC-03: Member Event Payment & Registration
- TI-01: Create Event with Target Audience