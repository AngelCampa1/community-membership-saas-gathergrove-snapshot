# User Story: Select Member Types for Communications

**Story ID:** MT-01  
**Feature:** Member Type Targeting in Communications  
**Priority:** High (Phase 1)

## User Story
**As a** club admin  
**I want to** select specific member types when creating communications  
**So that** I can send targeted messages to relevant member segments  

## Acceptance Criteria

- [ ] Communications interface shows member type selector (checkboxes/multi-select)
- [ ] Can select one or multiple member types (e.g., "Premium", "Student", "Regular")
- [ ] Shows count of members in each selected type
- [ ] Can still select "All Members" as default option
- [ ] Works across all communication types (Email, SMS, WhatsApp, Push)

## Business Value
- Reduces irrelevant messages for members
- Improves engagement rates for communications
- Enables targeted marketing for premium services
- Reduces communication costs (especially for SMS/WhatsApp)

## Technical Implementation Notes

### Frontend Changes
- Enhance communication forms (`/admin/communications/new`) to include member type filtering
- Add reusable member type selector component
- Update recipient count calculations based on selected types

### Backend Changes
- Modify communication service APIs to accept `memberTypeIds` parameter
- Update recipient query logic to filter by member types
- Ensure SMS consent filtering works with member type targeting

### API Changes
```typescript
interface SendCommunicationRequest {
  subject?: string;
  body: string;
  memberTypeIds?: number[]; // New field
  // ... existing fields
}
```

## Dependencies
- Existing membership types system
- Current communication infrastructure
- Member type data integrity

## Definition of Done
- [ ] UI allows member type selection in all communication channels
- [ ] API correctly filters recipients by selected member types
- [ ] Recipient counts update dynamically based on selection
- [ ] All communication types (Email, SMS, WhatsApp, Push) support targeting
- [ ] Backwards compatibility maintained (default to "All Members")
- [ ] Tests cover member type filtering scenarios

## Estimated Effort
**Medium** - 3-5 days development

## Related Stories
- MT-02: Preview Targeted Communication Recipients
- MT-03: Communication History by Member Type