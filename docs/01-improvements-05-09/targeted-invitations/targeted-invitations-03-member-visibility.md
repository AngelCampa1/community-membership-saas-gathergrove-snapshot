# User Story: Member Type Event Visibility

**Story ID:** TI-03  
**Feature:** Targeted Event Invitations  
**Priority:** Low (Phase 4)

## User Story
**As a** member  
**I want to** see events that are relevant to my membership type  
**So that** I don't miss activities designed for members like me  

## Acceptance Criteria

- [ ] Member dashboard prioritizes events targeted to their type
- [ ] Can still see all public events
- [ ] Events show if they're "Recommended for [MemberType]"
- [ ] Targeted events appear prominently in member communications
- [ ] Can filter events by relevance to their membership type

## Business Value
- Improves member experience with relevant content
- Increases event attendance through better visibility
- Enhances perceived value of membership types
- Reduces information overload for members

## Technical Implementation Notes

### Frontend Changes
- Modify member event displays to show relevance
- Add filtering options for event relevance
- Highlight targeted events in member dashboard

### Backend Changes
- API endpoint to get events relevant to member's type
- Logic to determine event relevance
- Maintain access to all public events

### Member Event API
```typescript
interface MemberEventView {
  upcomingEvents: {
    targetedToMe: EventResponse[];
    otherEvents: EventResponse[];
  };
  pastEvents: {
    targetedToMe: EventResponse[];
    otherEvents: EventResponse[];
  };
}

interface EventResponse {
  // ... existing fields
  isTargetedToMember?: boolean;
  targetedMemberTypes?: string[];
  relevanceScore?: number;
}
```

### UI Enhancements
- "Recommended for You" section
- Visual indicators for targeted events
- Filter toggles: "All Events" | "Recommended" | "Other"

## Dependencies
- TI-01: Create Event with Target Audience
- TI-02: Send Targeted Event Invitations
- Existing member dashboard
- Member authentication system

## Definition of Done
- [ ] Targeted events prominently displayed for relevant members
- [ ] All public events remain accessible
- [ ] Clear visual indicators for event relevance
- [ ] Filtering options work correctly
- [ ] Performance optimized for member dashboard
- [ ] Relevance logic accurately implemented

## Estimated Effort
**Medium** - 4-5 days development

## Related Stories
- TI-01: Create Event with Target Audience
- TI-02: Send Targeted Event Invitations
- Member dashboard improvements