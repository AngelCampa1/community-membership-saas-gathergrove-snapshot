# EventEngagementService Usage Guide

## Overview

The `EventEngagementService` provides comprehensive event engagement analysis and tracking capabilities for GatherGrove. It integrates seamlessly with the existing `MemberEngagementService` and `EngagementScoringService` to provide deep insights into how events impact member engagement and provide data-driven recommendations.

## Key Features

### 1. Event Attendance & Participation Tracking
- Record event attendance with timestamps and notes
- Update event RSVPs with engagement score recalculation
- Track member attendance history over configurable time periods
- Real-time engagement score updates after event activities

### 2. Event Engagement Scoring & Analytics
- Calculate comprehensive engagement scores for individual events
- Analyze event impact on member engagement over time
- Generate event engagement trends and patterns
- Identify top-performing events and low-engagement members

### 3. Event Recommendations & Predictions
- AI-driven event recommendations based on member engagement patterns
- Attendance prediction algorithms using historical data
- Optimal event timing recommendations based on member preferences
- Personalized event suggestions with scoring and reasoning

### 4. Real-time Updates & Batch Processing
- Automatic engagement score updates after event activities
- Batch processing for multiple engagement updates
- Integration with existing engagement scoring system
- Performance-optimized bulk operations

## Service Registration

Add the service to your DI container in `Program.cs`:

```csharp
// Register the EventEngagementService
builder.Services.AddScoped<IEventEngagementService, EventEngagementService>();
```

## Basic Usage Examples

### Recording Event Attendance

```csharp
public class EventController : ControllerBase
{
    private readonly IEventEngagementService _eventEngagementService;

    public EventController(IEventEngagementService eventEngagementService)
    {
        _eventEngagementService = eventEngagementService;
    }

    [HttpPost("events/{eventId}/attendance")]
    public async Task<ActionResult<EventAttendance>> RecordAttendance(
        int eventId, 
        [FromBody] RecordAttendanceRequest request)
    {
        try
        {
            var attendance = await _eventEngagementService.RecordEventAttendanceAsync(
                eventId, 
                request.MemberId, 
                request.AttendedAt, 
                request.Notes);
                
            return Ok(attendance);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
```

### Updating Event RSVPs

```csharp
[HttpPut("events/{eventId}/rsvp")]
public async Task<ActionResult<EventRsvp>> UpdateRsvp(
    int eventId, 
    [FromBody] UpdateRsvpRequest request)
{
    var rsvp = await _eventEngagementService.UpdateEventRsvpAsync(
        eventId, 
        request.MemberId, 
        request.RsvpStatus);
        
    return Ok(rsvp);
}
```

### Calculating Event Engagement Metrics

```csharp
[HttpGet("events/{eventId}/engagement-metrics")]
public async Task<ActionResult<EventEngagementMetrics>> GetEventMetrics(int eventId)
{
    var metrics = await _eventEngagementService.CalculateEventEngagementScoreAsync(eventId);
    return Ok(metrics);
}
```

### Generating Event Recommendations

```csharp
[HttpGet("members/{memberId}/event-recommendations")]
public async Task<ActionResult<List<EventRecommendation>>> GetRecommendations(
    int memberId, 
    [FromQuery] int limit = 5)
{
    var recommendations = await _eventEngagementService.GetEventRecommendationsAsync(
        memberId, 
        limit);
        
    return Ok(recommendations);
}
```

## Advanced Usage Scenarios

### Event Impact Analysis

```csharp
public async Task<EventImpactReport> GenerateEventImpactReport(int eventId)
{
    // Analyze the impact of a specific event on member engagement
    var impact = await _eventEngagementService.AnalyzeEventImpactAsync(eventId);
    
    // Generate comprehensive analytics report
    var report = await _eventEngagementService.GenerateEventReportAsync(eventId);
    
    return new EventImpactReport
    {
        Impact = impact,
        Analytics = report,
        Recommendations = await GenerateImprovementRecommendations(impact)
    };
}
```

### Club-Wide Engagement Monitoring

```csharp
public async Task<ClubEngagementDashboard> GetClubDashboard(int clubId)
{
    // Get comprehensive club overview
    var overview = await _eventEngagementService.GetClubEventOverviewAsync(clubId);
    
    // Get engagement trends
    var trends = await _eventEngagementService.GetEventEngagementTrendsAsync(clubId, 90);
    
    // Identify at-risk members
    var lowEngagementMembers = await _eventEngagementService
        .GetLowEventEngagementMembersAsync(clubId, threshold: 30m);
    
    return new ClubEngagementDashboard
    {
        Overview = overview,
        Trends = trends,
        AtRiskMembers = lowEngagementMembers,
        TopEvents = overview.TopEvents
    };
}
```

### Batch Processing Event Updates

```csharp
public async Task<BatchUpdateResult> ProcessEventActivityBatch(
    List<EventActivityDto> activities)
{
    var updates = activities.Select(a => new EventEngagementUpdate
    {
        MemberId = a.MemberId,
        EventId = a.EventId,
        ActivityType = a.ActivityType,
        ActivityTime = a.Timestamp,
        Metadata = a.AdditionalData
    }).ToList();
    
    return await _eventEngagementService.ProcessBatchEventEngagementUpdatesAsync(updates);
}
```

## Integration with Existing Systems

### MemberEngagementService Integration

The EventEngagementService automatically integrates with the existing MemberEngagementService:

```csharp
// This happens automatically when recording attendance or RSVPs
var attendance = await _eventEngagementService.RecordEventAttendanceAsync(eventId, memberId);

// The service automatically calls:
// - _memberEngagementService.UpdateEngagementOnActivity()
// - _engagementScoringService.CalculateActivityScore()
```

### Real-time Engagement Updates

Event activities automatically trigger engagement score recalculations:

```csharp
// These activities automatically update member engagement scores
await _eventEngagementService.RecordEventAttendanceAsync(eventId, memberId);
await _eventEngagementService.UpdateEventRsvpAsync(eventId, memberId, "Attending");

// Manual engagement updates after custom activities
await _eventEngagementService.UpdateEngagementAfterEventActivityAsync(
    memberId, 
    "custom_event_activity", 
    eventId, 
    customMetadata);
```

## Configuration Options

### Event Scoring Weights

The service uses configurable weights for different event activities:

```csharp
// Default weights (can be customized in service constructor)
private readonly Dictionary<string, decimal> _eventScoreWeights = new()
{
    ["rsvp"] = 0.3m,           // 30% - RSVPing to events
    ["attendance"] = 0.5m,     // 50% - Actually attending events  
    ["consistency"] = 0.2m     // 20% - Consistent participation
};
```

### Time-based Analysis Periods

Various methods accept configurable time periods:

```csharp
// Analyze last 90 days of event engagement
var memberScore = await _eventEngagementService
    .CalculateMemberEventScoreAsync(memberId, daysBack: 90);

// Get 6-month attendance history
var history = await _eventEngagementService
    .GetMemberAttendanceHistoryAsync(memberId, daysBack: 180);

// Analyze quarterly trends
var trends = await _eventEngagementService
    .GetEventEngagementTrendsAsync(clubId, daysBack: 90);
```

## Performance Considerations

### Bulk Operations

Use batch processing for multiple updates:

```csharp
// Efficient batch processing instead of individual calls
var batchUpdates = memberActivities.Select(a => new EventEngagementUpdate
{
    MemberId = a.MemberId,
    EventId = a.EventId,
    ActivityType = a.Type,
    ActivityTime = a.Timestamp,
    Metadata = a.Data
}).ToList();

var result = await _eventEngagementService
    .ProcessBatchEventEngagementUpdatesAsync(batchUpdates);
```

### Caching Recommendations

Consider caching expensive operations:

```csharp
// Cache event recommendations for active sessions
[ResponseCache(Duration = 300)] // 5 minutes
public async Task<ActionResult> GetCachedRecommendations(int memberId)
{
    return Ok(await _eventEngagementService.GetEventRecommendationsAsync(memberId));
}
```

### Async Processing

Heavy calculations run asynchronously:

```csharp
// Engagement updates happen in background tasks
_ = Task.Run(async () =>
{
    await _eventEngagementService.UpdateEngagementAfterEventActivityAsync(
        memberId, activityType, eventId, metadata);
});
```

## Error Handling

The service includes comprehensive error handling:

```csharp
try
{
    var attendance = await _eventEngagementService
        .RecordEventAttendanceAsync(eventId, memberId);
}
catch (ArgumentException ex)
{
    // Handle invalid input (non-existent event/member)
    return BadRequest($"Invalid request: {ex.Message}");
}
catch (InvalidOperationException ex)
{
    // Handle business logic violations
    return Conflict($"Operation failed: {ex.Message}");
}
catch (Exception ex)
{
    // Handle unexpected errors
    _logger.LogError(ex, "Unexpected error recording attendance");
    return StatusCode(500, "An unexpected error occurred");
}
```

## Monitoring and Logging

The service provides detailed logging for monitoring:

```csharp
// All major operations are logged
_logger.LogInformation(
    "Recording event attendance for member {MemberId} at event {EventId}", 
    memberId, eventId);

_logger.LogInformation(
    "Calculated engagement score for event {EventId}: {Score}", 
    eventId, engagementScore);

_logger.LogWarning(
    "Attendance already recorded for member {MemberId} at event {EventId}", 
    memberId, eventId);
```

## Testing

The service includes comprehensive unit and integration tests:

```csharp
// Unit tests for individual methods
[Fact]
public async Task RecordEventAttendanceAsync_ValidInput_CreatesAttendanceRecord()
{
    // Arrange
    var eventId = 1;
    var memberId = 1;
    
    // Act
    var result = await _service.RecordEventAttendanceAsync(eventId, memberId);
    
    // Assert
    Assert.NotNull(result);
    Assert.Equal(eventId, result.EventId);
    Assert.Equal(memberId, result.MemberId);
}

// Integration tests for complete workflows
[Fact]
public async Task CompleteEventEngagementWorkflow_RealisticScenario_WorksEndToEnd()
{
    // Test complete workflow from RSVP to attendance to analytics
}
```

## Migration Guide

To integrate the EventEngagementService into an existing GatherGrove installation:

1. **Add Service Registration**: Register the service in your DI container
2. **Update Controllers**: Add event engagement endpoints to your controllers
3. **Database Migration**: Ensure EventAttendance and EventRsvp tables exist
4. **Background Jobs**: Consider adding scheduled jobs for trend analysis
5. **Frontend Integration**: Update UI to display engagement metrics and recommendations

## API Endpoints Example

```csharp
[Route("api/events")]
public class EventEngagementController : ControllerBase
{
    [HttpPost("{eventId}/attendance")]
    public Task<EventAttendance> RecordAttendance(int eventId, RecordAttendanceRequest request)

    [HttpPut("{eventId}/rsvp")]  
    public Task<EventRsvp> UpdateRsvp(int eventId, UpdateRsvpRequest request)

    [HttpGet("{eventId}/metrics")]
    public Task<EventEngagementMetrics> GetEventMetrics(int eventId)

    [HttpGet("{eventId}/impact")]
    public Task<EventImpactAnalysis> GetEventImpact(int eventId)

    [HttpGet("clubs/{clubId}/overview")]
    public Task<ClubEventEngagementOverview> GetClubOverview(int clubId)

    [HttpGet("members/{memberId}/recommendations")]
    public Task<List<EventRecommendation>> GetRecommendations(int memberId, int limit = 5)

    [HttpGet("clubs/{clubId}/trends")]
    public Task<EventEngagementTrends> GetEngagementTrends(int clubId, int daysBack = 90)
}
```

This EventEngagementService provides a comprehensive foundation for event engagement analysis in GatherGrove, with room for customization and extension based on specific club management needs.