# User Story: Communication History by Member Type

**Story ID:** MT-03  
**Feature:** Member Type Targeting in Communications  
**Priority:** Low (Phase 4)

## User Story
**As a** club admin  
**I want to** see which member types received past communications  
**So that** I can track communication patterns and avoid over/under-messaging segments  

## Acceptance Criteria

- [ ] Communication history shows targeted member types
- [ ] Can filter communication history by member type
- [ ] Shows recipient breakdown in communication details
- [ ] Displays engagement metrics by member type (if available)

## Business Value
- Prevents communication fatigue in specific segments
- Identifies under-communicated member types
- Provides insights for communication strategy
- Supports compliance with communication preferences

## Technical Implementation Notes

### Frontend Changes
- Add member type columns to communication history
- Implement filtering by member type
- Enhance communication detail views

### Backend Changes
- Store member type targeting data in communication logs
- Add filtering capabilities to history APIs
- Aggregate engagement data by member type

### Database Changes
```sql
-- Add to communications table
ALTER TABLE communications 
ADD COLUMN target_member_type_ids JSON;

-- Or create relationship table
CREATE TABLE communication_member_types (
  communication_id INT,
  member_type_id INT,
  PRIMARY KEY (communication_id, member_type_id)
);
```

## Dependencies
- MT-01: Select Member Types for Communications
- Existing communication history system

## Definition of Done
- [ ] Historical data preserved for member type targeting
- [ ] Filtering works across all communication types
- [ ] Performance maintained with large communication histories
- [ ] Clear visualization of targeting patterns
- [ ] Export capabilities include member type data

## Estimated Effort
**Medium** - 4-6 days development

## Related Stories
- MT-01: Select Member Types for Communications
- MT-02: Preview Targeted Communication Recipients