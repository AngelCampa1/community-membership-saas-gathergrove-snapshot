# Member Engagement API Implementation

## Overview
Complete implementation of Member Engagement functionality with 7 API endpoints following GatherGrove's established patterns.

## Files Created

### 1. Controller
- **File**: `/backend/src/GatherGrove.API/Controllers/MemberEngagementController.cs`
- **Description**: Main API controller with all 7 required endpoints
- **Authorization**: Club admin required for most endpoints, self-access allowed for individual member data
- **Features**: Output caching, pagination, filtering, comprehensive error handling

### 2. DTOs and Models
- **File**: `/backend/src/GatherGrove.Application/DTOs/MemberEngagementResponse.cs`
- **Description**: Complete set of request/response models:
  - `MemberEngagementResponse` - Individual member engagement data
  - `EngagementDashboardResponse` - Club dashboard data
  - `PaginatedEngagementResponse` - Paginated member lists
  - `TrackEngagementRequest` - Activity tracking request
  - `EngagementAlertsResponse` - Alert configuration
  - `ConfigureEngagementAlertsRequest` - Alert setup request
  - Supporting classes for statistics and trends

### 3. Service Interfaces
- **File**: `/backend/src/GatherGrove.Application/Services/IMemberEngagementService.cs`
- **Description**: Service contracts for:
  - `IMemberEngagementService` - Main engagement operations
  - `IEngagementScoringService` - Scoring calculations
  - `MemberBasicInfo` - Authorization helper
  - `EngagementScoringWeights` - Configurable scoring weights

### 4. Unit Tests
- **File**: `/backend/tests/unit-tests/MemberEngagementControllerTests.cs`
- **Description**: Comprehensive test coverage for all controller methods

## API Endpoints Implemented

### 1. GET /api/v1/members/{memberId}/engagement
- **Purpose**: Get individual member engagement score and metrics
- **Authorization**: Admin or self-access
- **Caching**: 5 minutes
- **Returns**: Detailed engagement data including scores, activity counts, history

### 2. GET /api/v1/clubs/{clubId}/engagement/dashboard
- **Purpose**: Get comprehensive engagement dashboard for club admins
- **Authorization**: Club admin only
- **Caching**: 10 minutes
- **Returns**: Club statistics, distribution, trends, top members, at-risk members

### 3. GET /api/v1/clubs/{clubId}/engagement/members
- **Purpose**: Get paginated list of members with engagement scores
- **Authorization**: Club admin only
- **Caching**: 3 minutes
- **Features**: Filtering by engagement level, sorting, search, pagination
- **Returns**: Paginated member engagement summaries

### 4. POST /api/v1/members/{memberId}/engagement/track
- **Purpose**: Track member activity for engagement calculation
- **Authorization**: Admin or self-access
- **Features**: Various activity types, session tracking
- **Returns**: Success confirmation

### 5. GET /api/v1/clubs/{clubId}/engagement/trends
- **Purpose**: Get engagement trends over time
- **Authorization**: Club admin only
- **Caching**: 30 minutes
- **Features**: Multiple time periods (7d, 30d, 90d, 1y), granularity options
- **Returns**: Historical trend data points

### 6. GET /api/v1/clubs/{clubId}/engagement/at-risk
- **Purpose**: Get members at risk of disengagement
- **Authorization**: Club admin only
- **Caching**: 5 minutes
- **Features**: Risk level filtering, pagination
- **Returns**: At-risk member identification

### 7. POST /api/v1/clubs/{clubId}/engagement/alerts
- **Purpose**: Configure engagement alerts
- **Authorization**: Club admin + Grow tier required
- **Features**: Low engagement and inactivity alerts, email notifications
- **Returns**: Alert configuration

### 8. GET /api/v1/clubs/{clubId}/engagement/alerts
- **Purpose**: Get current alert configuration
- **Authorization**: Club admin only
- **Caching**: 5 minutes
- **Returns**: Current alert settings

## Key Features

### Security & Authorization
- Uses existing `IClubAuthorizationService` for club access control
- Implements proper admin-only and self-access patterns
- Integrates with existing JWT authentication
- Grow tier verification for premium features

### Performance Optimization
- Output caching with appropriate TTL values
- Pagination for large datasets
- Efficient query patterns through service abstractions

### Error Handling
- Comprehensive exception handling with logging
- Proper HTTP status codes
- User-friendly error messages
- Input validation with data annotations

### Documentation
- Complete XML documentation for all endpoints
- OpenAPI examples and response codes
- Detailed parameter descriptions
- Usage examples in comments

## Integration Points

### Required Service Implementations
Services that need to be implemented to make the controller fully functional:

1. **IMemberEngagementService**
   - Connect to `MemberEngagementScore` entity
   - Implement dashboard calculations
   - Handle activity tracking
   - Manage alert configurations

2. **IEngagementScoringService**
   - Score calculation algorithms
   - Real-time score updates
   - Batch processing for club-wide calculations
   - Integration with existing member activities

### Database Integration
- Uses existing `MemberEngagementScore` entity
- Extends existing analytics tracking
- Integrates with member and club data

### Existing System Integration
- Extends `AnalyticsController` patterns
- Uses `MembersController` authorization patterns
- Follows GatherGrove DTO and error handling conventions
- Compatible with existing caching and logging infrastructure

## Next Steps

1. **Implement Service Classes**
   - Create concrete implementations of the service interfaces
   - Add database queries and business logic
   - Integrate with existing member and analytics data

2. **Register Services**
   - Add service registrations to `Program.cs`
   - Configure dependency injection

3. **Database Migration**
   - Ensure `MemberEngagementScore` entity is properly migrated
   - Add any additional tables for alerts configuration

4. **Frontend Integration**
   - Update frontend to call new engagement endpoints
   - Create engagement dashboard components
   - Add activity tracking calls

## Testing

- Comprehensive unit tests included
- Integration tests should be added for service implementations
- End-to-end testing for complete engagement workflows

## Performance Considerations

- Engagement score calculations should be async/background processes
- Consider read replicas for dashboard queries
- Implement proper indexing on engagement score queries
- Use background jobs for periodic score recalculation