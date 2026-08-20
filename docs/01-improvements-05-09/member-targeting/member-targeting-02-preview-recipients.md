# User Story: Preview Targeted Communication Recipients

**Story ID:** MT-02  
**Feature:** Member Type Targeting in Communications  
**Priority:** Medium (Phase 2)

## User Story
**As a** club admin  
**I want to** see exactly which members will receive my targeted communication  
**So that** I can verify I'm reaching the intended audience  

## Acceptance Criteria

- [ ] Shows recipient count per selected member type
- [ ] Displays total recipient count across all selected types
- [ ] Preview shows breakdown like "25 Premium members, 18 Student members (43 total)"
- [ ] Warns if selected types have no active members
- [ ] Shows overlap if member has multiple types

## Business Value
- Prevents miscommunication by showing exact audience
- Builds confidence in targeting accuracy
- Helps admins understand member distribution
- Reduces communication errors

## Technical Implementation Notes

### Frontend Changes
- Add recipient preview component to communication forms
- Real-time updates when member type selection changes
- Warning indicators for empty member types

### Backend Changes
- Create API endpoint for recipient preview
- Calculate member counts efficiently
- Handle member type overlaps and consent filtering

### API Changes
```typescript
interface RecipientPreview {
  memberTypeName: string;
  memberTypeId: number;
  totalMembers: number;
  eligibleMembers: number; // After consent filtering
}

interface PreviewResponse {
  memberTypes: RecipientPreview[];
  totalRecipients: number;
  warnings: string[];
}
```

## Dependencies
- MT-01: Select Member Types for Communications
- Existing member consent system

## Definition of Done
- [ ] Preview updates in real-time as selections change
- [ ] Accurate recipient counts for each member type
- [ ] Clear warnings for edge cases (no members, no consent)
- [ ] Performance optimized for large member bases
- [ ] Handles all communication types consistently

## Estimated Effort
**Small** - 2-3 days development

## Related Stories
- MT-01: Select Member Types for Communications
- MT-03: Communication History by Member Type