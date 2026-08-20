# US-011: Multi-Location/Chapter Support

**Status**: ⬜ Not Started  
**Priority**: P5 (Low)  
**Effort**: 10-12 days  
**Phase**: 5 - Enterprise Features  

## User Story

**As an** Unlimited tier admin with multiple locations  
**I want** to manage multiple chapters or locations  
**So that** I can centralize management while maintaining local autonomy

## Acceptance Criteria

- [ ] Add chapter/location creation and management
- [ ] Implement hierarchical admin permissions
- [ ] Add location-specific events and members
- [ ] Create cross-location reporting
- [ ] Add location-specific branding
- [ ] Implement location-based member directory
- [ ] Add cross-location member transfers

## Technical Implementation

### Database Schema Changes (Major)
```sql
-- Locations/Chapters
club_locations (
  id, parent_club_id, location_name, location_code,
  address, city, state, country, timezone,
  contact_email, contact_phone, is_active,
  created_at, settings_json
)

-- Location administrators
location_admins (
  id, location_id, user_id, permission_level,
  assigned_at, assigned_by
)

-- Location-specific members
members (
  -- Add location_id column
  location_id INT REFERENCES club_locations(id)
)

-- Location-specific events
events (
  -- Add location_id column
  location_id INT REFERENCES club_locations(id)
)

-- Cross-location member transfers
member_transfers (
  id, member_id, from_location_id, to_location_id,
  transfer_reason, requested_at, approved_at,
  approved_by, status
)

-- Location-specific branding
location_branding (
  id, location_id, custom_logo_url, color_scheme,
  custom_name_override, settings_json
)
```

### Multi-Tenant Architecture Updates
- **Data Isolation**: Ensure location-specific data segregation
- **Permission System**: Hierarchical permission inheritance
- **Context Switching**: Allow admins to switch between locations
- **Shared Resources**: Centralized templates, policies, branding guidelines

### New Components
- `LocationManager` - Create and manage locations
- `LocationSelector` - Switch between locations
- `HierarchicalPermissions` - Manage admin roles
- `CrossLocationReports` - Consolidated reporting
- `LocationBrandingManager` - Location-specific customization
- `MemberTransferSystem` - Handle member moves
- `LocationDashboard` - Location-specific overview

### Permission Hierarchy
1. **Super Admin**: Full access to all locations
2. **Regional Manager**: Access to subset of locations
3. **Location Admin**: Full access to single location
4. **Location Moderator**: Limited access to single location
5. **Staff**: Read-only access to single location

### Location Features
- **Independent Settings**: Each location can have custom settings
- **Shared Templates**: Use parent club's templates or create custom
- **Local Events**: Location-specific events and calendars
- **Local Members**: Location-based member management
- **Local Reporting**: Location-specific analytics
- **Cross-Location Events**: Events spanning multiple locations

### Cross-Location Reporting
- **Consolidated Dashboards**: All locations in one view
- **Comparative Analytics**: Compare performance across locations
- **Member Distribution**: See member counts by location
- **Event Attendance**: Cross-location event analysis
- **Financial Rollups**: Combined financial reporting

### Member Transfer System
- **Transfer Requests**: Members can request location changes
- **Approval Workflow**: Admins approve/deny transfers
- **Data Migration**: Move member history and preferences
- **Notification System**: Alert relevant parties of transfers
- **Audit Trail**: Track all transfer activities

### Location-Specific Branding
- Custom logos per location
- Location-specific color schemes
- Custom location names/titles
- Local contact information
- Location-specific messaging

### New Services
- `locationManagementService.ts` - Location operations
- `hierarchicalPermissionsService.ts` - Permission management
- `crossLocationReportingService.ts` - Multi-location analytics
- `memberTransferService.ts` - Transfer operations
- `locationBrandingService.ts` - Location customization

## Dependencies
- US-001: Unlimited Tier Authorization System (completed)
- US-003: White-Label Branding System (location-specific branding)
- Major database architecture changes

## Related Stories
- US-003: White-Label Branding System (extends to locations)
- US-008: Dedicated Account Management (complex setup support)

## Estimated Timeline
10-12 days including database migrations and comprehensive testing

## Risk Assessment
**High Risk** - Major architecture changes, data migration complexity, performance impact

### Technical Challenges
- **Data Migration**: Existing data must be assigned to locations
- **Performance**: Queries must remain fast with location filtering
- **Backup/Restore**: More complex with multi-location data
- **Security**: Ensure proper data isolation between locations

### Migration Strategy
1. **Phase 1**: Create location structure, migrate existing club as "Main Location"
2. **Phase 2**: Add location filtering to all queries
3. **Phase 3**: Enable location creation and management
4. **Phase 4**: Add cross-location features

## Success Metrics
- Location creation time <5 minutes
- Cross-location reports load in <3 seconds
- Member transfer process completion <24 hours
- Zero data leakage between locations

## Notes
This is the most complex feature in the unlimited tier, essentially creating a multi-tenant system within each club. Should only be implemented after all other features are stable.