# User Story: Create Event with Target Audience

**Story ID:** TI-01  
**Feature:** Targeted Event Invitations  
**Priority:** Medium (Phase 2)

## User Story
**As a** club admin  
**I want to** select specific member types when creating an event  
**So that** I can plan events for relevant audience segments  

## Acceptance Criteria

- [ ] Event creation includes "Target Audience" section
- [ ] Can select specific member types for invitation
- [ ] Shows member count for each selected type
- [ ] Can select "All Members" as default
- [ ] Target audience affects automatic invitation sending
- [ ] Can change target audience before sending invitations

## Business Value
- Creates more relevant events for specific member segments
- Improves event attendance through better targeting
- Reduces invitation fatigue for irrelevant events
- Enables specialized programming for different member types

## Technical Implementation Notes

### Frontend Changes
- Add target audience section to event creation form
- Reuse member type selector component from communications
- Show preview of target audience size

### Backend Changes
- Store target member types with event data
- Use targeting for automatic invitation sending
- Allow modification of targeting before invitations sent

### Database Changes
```sql
-- Add targeting to events table
ALTER TABLE events ADD COLUMN target_member_type_ids JSON;

-- Or create relationship table
CREATE TABLE event_target_audiences (
  event_id INT,
  member_type_id INT,
  PRIMARY KEY (event_id, member_type_id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (member_type_id) REFERENCES membership_types(id)
);
```

### API Changes
```typescript
interface CreateEventRequest {
  // ... existing fields
  targetMemberTypeIds?: number[];
  targetAllMembers?: boolean; // default true
}

interface EventResponse {
  // ... existing fields
  targetMemberTypeIds: number[];
  targetAllMembers: boolean;
  estimatedInviteCount: number;
}
```

## Dependencies
- Existing event management system
- Member type selector component (from MT-01)
- Event invitation system

## Definition of Done
- [ ] Event creation supports target audience selection
- [ ] Target audience data stored with event
- [ ] Member count preview works accurately
- [ ] Default to "All Members" maintains compatibility
- [ ] Target audience can be modified before invitations
- [ ] Integration with invitation sending system

## Estimated Effort
**Medium** - 4-5 days development

## Related Stories
- MT-01: Select Member Types for Communications
- TI-02: Send Targeted Event Invitations
- TI-03: Member Type Event Visibility
- EC-01: Create Paid Events