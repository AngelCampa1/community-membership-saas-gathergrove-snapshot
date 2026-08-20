# User Story: Generate Event Payment Links

**Story ID:** EC-02  
**Feature:** Event Charging with Payment Links  
**Priority:** Medium (Phase 2)

## User Story
**As a** club admin  
**I want to** get a shareable payment link for my paid event  
**So that** I can promote the event and allow online registration/payment  

## Acceptance Criteria

- [x] Paid events automatically generate unique payment links
- [x] Link is shareable via copy/paste
- [x] Link works for both members and non-members
- [x] Link includes event details and pricing
- [x] Admin can access link from event management page
- [x] Link remains valid until event date passes

## Business Value
- Enables event promotion through social media and email
- Reduces manual registration overhead
- Allows viral event sharing
- Supports external event marketing

## Technical Implementation Notes

### Frontend Changes
- Add "Share Event" or "Get Payment Link" button to event management
- Create public event registration page (no authentication required)
- Implement copy-to-clipboard functionality

### Backend Changes
- Generate secure, unique URLs for each paid event
- Create public API endpoints for event registration
- Implement public event display logic

### URL Structure
```
https://gathergrove.club/events/pay/{uniqueEventToken}
```

### New Components
```typescript
// Public event registration page
interface PublicEventPage {
  eventToken: string;
  event: EventResponse;
  memberPrice: number;
  nonMemberPrice: number;
}
```

### Security Considerations
- Use cryptographically secure tokens
- Validate event exists and is payable
- Rate limiting on public endpoints
- CSRF protection for payment forms

## Dependencies
- EC-01: Create Paid Events
- Existing payment processing system

## Definition of Done
- [x] Unique payment links generated for all paid events
- [x] Public event pages render without authentication
- [x] Links remain functional until event passes
- [x] Copy-to-clipboard functionality works
- [x] SEO-friendly public event pages
- [x] Secure token generation implemented
- [x] Error handling for invalid/expired links

**Status:** ✅ **COMPLETED** - 2025-09-30

## Estimated Effort
**Large** - 5-7 days development

## Related Stories
- EC-01: Create Paid Events
- EC-03: Member Event Payment & Registration
- EC-04: Non-Member Event Payment & Optional Membership