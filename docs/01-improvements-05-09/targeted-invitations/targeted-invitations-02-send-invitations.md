# User Story: Send Targeted Event Invitations

**Story ID:** TI-02  
**Feature:** Targeted Event Invitations  
**Priority:** Medium (Phase 3)

## User Story
**As a** club admin  
**I want to** send event invitations only to selected member types  
**So that** relevant members receive appropriate event invitations  

## Acceptance Criteria

- [ ] "Send Invitations" respects selected member types
- [ ] Shows invitation count before sending
- [ ] Confirms which member types will receive invitations
- [ ] Can choose invitation method (Email, Push, both)
- [ ] Can send additional invitations to other member types later
- [ ] Tracks invitation delivery by member type

## Business Value
- Reduces irrelevant event notifications
- Improves invitation open rates and engagement
- Supports specialized event programming
- Provides targeted event marketing capabilities

## Technical Implementation Notes

### Frontend Changes
- Modify event invitation dialog to show targeting info
- Add confirmation step showing targeted member types
- Allow method selection (Email, Push, both) per target

### Backend Changes
- Filter invitation recipients by target member types
- Track invitation sending by member type
- Support multiple invitation rounds to different types

### Enhanced Invitation System
```typescript
interface SendTargetedInvitationsRequest {
  eventId: number;
  targetMemberTypeIds?: number[]; // Override event defaults
  methods: ('email' | 'push')[];
  includeAllMembers?: boolean; // Override targeting
}

interface InvitationSummary {
  eventId: number;
  sentByMemberType: {
    memberTypeId: number;
    memberTypeName: string;
    invitationsSent: number;
    method: string[];
  }[];
  totalInvitationsSent: number;
  previousInvitationRounds: InvitationRound[];
}
```

### Invitation Tracking
```sql
CREATE TABLE event_invitation_rounds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  target_member_type_ids JSON,
  methods JSON,
  sent_count INT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id)
);
```

## Dependencies
- TI-01: Create Event with Target Audience
- Existing event invitation system
- Member type system

## Definition of Done
- [ ] Invitations sent only to targeted member types
- [ ] Clear confirmation of targeting before sending
- [ ] Multiple invitation rounds supported
- [ ] Invitation tracking by member type works
- [ ] Method selection (Email/Push) functions correctly
- [ ] Override options allow flexibility
- [ ] Performance optimized for large member bases

## Estimated Effort
**Large** - 5-7 days development

## Related Stories
- TI-01: Create Event with Target Audience
- TI-03: Member Type Event Visibility
- MT-01: Select Member Types for Communications