namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Options for event data export operations
/// US-005 Data Export & Reporting Engine - Event export configuration
/// </summary>
public class EventExportOptions
{
    /// <summary>
    /// Include event attendance data
    /// </summary>
    public bool IncludeAttendance { get; set; }

    /// <summary>
    /// Include event engagement metrics
    /// </summary>
    public bool IncludeEngagement { get; set; }

    /// <summary>
    /// Include event financial data
    /// </summary>
    public bool IncludeFinancials { get; set; }

    /// <summary>
    /// Include event photos and media
    /// </summary>
    public bool IncludeMedia { get; set; }

    /// <summary>
    /// Include attendee feedback
    /// </summary>
    public bool IncludeFeedback { get; set; }

    /// <summary>
    /// Event types to filter by
    /// </summary>
    public List<string> EventTypes { get; set; } = new();

    /// <summary>
    /// Date range start
    /// </summary>
    public DateTime? DateFrom { get; set; }

    /// <summary>
    /// Date range end
    /// </summary>
    public DateTime? DateTo { get; set; }

    /// <summary>
    /// Date range start (alias for DateFrom)
    /// </summary>
    public DateTime? StartDate
    {
        get => DateFrom;
        set => DateFrom = value;
    }

    /// <summary>
    /// Date range end (alias for DateTo)
    /// </summary>
    public DateTime? EndDate
    {
        get => DateTo;
        set => DateTo = value;
    }

    /// <summary>
    /// Filter by specific event type
    /// </summary>
    public string? EventType { get; set; }

    /// <summary>
    /// Minimum attendee count filter
    /// </summary>
    public int? MinAttendees { get; set; }

    /// <summary>
    /// Maximum number of records to export
    /// </summary>
    public int? MaxRecords { get; set; }

    /// <summary>
    /// Additional custom filters
    /// </summary>
    public Dictionary<string, string> CustomFilters { get; set; } = new();

    /// <summary>
    /// Include attendance data
    /// </summary>
    public bool IncludeAttendanceData { get; set; }

    /// <summary>
    /// Include engagement metrics
    /// </summary>
    public bool IncludeEngagementMetrics { get; set; }

    /// <summary>
    /// Include registration data
    /// </summary>
    public bool IncludeRegistrationData { get; set; }

    /// <summary>
    /// Include attendee details
    /// </summary>
    public bool IncludeAttendeeDetails { get; set; }

    /// <summary>
    /// Include check-in times
    /// </summary>
    public bool IncludeCheckInTimes { get; set; }

    /// <summary>
    /// Include no-shows
    /// </summary>
    public bool IncludeNoShows { get; set; }

    /// <summary>
    /// Group by event type
    /// </summary>
    public bool GroupByEventType { get; set; }

    /// <summary>
    /// Include charts in export
    /// </summary>
    public bool IncludeCharts { get; set; }

    /// <summary>
    /// Include trend analysis
    /// </summary>
    public bool IncludeTrendAnalysis { get; set; }

    /// <summary>
    /// Chart types to include
    /// </summary>
    public List<string> ChartTypes { get; set; } = new();

    /// <summary>
    /// Group by month
    /// </summary>
    public bool GroupByMonth { get; set; }

    /// <summary>
    /// Include revenue data
    /// </summary>
    public bool IncludeRevenueData { get; set; }

    /// <summary>
    /// Include capacity analysis
    /// </summary>
    public bool IncludeCapacityAnalysis { get; set; }

    /// <summary>
    /// Report type
    /// </summary>
    public string ReportType { get; set; } = string.Empty;

    /// <summary>
    /// Include executive summary in report
    /// </summary>
    public bool IncludeExecutiveSummary { get; set; }

    /// <summary>
    /// Include photos in export
    /// </summary>
    public bool IncludePhotos { get; set; }

    /// <summary>
    /// Include testimonials in report
    /// </summary>
    public bool IncludeTestimonials { get; set; }

    /// <summary>
    /// Include detailed metrics
    /// </summary>
    public bool IncludeDetailedMetrics { get; set; }

    /// <summary>
    /// Include registration details
    /// </summary>
    public bool IncludeRegistrationDetails { get; set; }

    /// <summary>
    /// Include attendee list
    /// </summary>
    public bool IncludeAttendeeList { get; set; }

    /// <summary>
    /// Include metadata in export
    /// </summary>
    public bool IncludeMetadata { get; set; }

    /// <summary>
    /// Include API compatible format
    /// </summary>
    public bool IncludeApiCompatibleFormat { get; set; }

    /// <summary>
    /// Include nested attendance data
    /// </summary>
    public bool IncludeNestedAttendanceData { get; set; }

    /// <summary>
    /// Include social interactions
    /// </summary>
    public bool IncludeSocialInteractions { get; set; }

    /// <summary>
    /// Include post-event surveys
    /// </summary>
    public bool IncludePostEventSurveys { get; set; }

    /// <summary>
    /// Analyze retention rates
    /// </summary>
    public bool AnalyzeRetentionRates { get; set; }

    /// <summary>
    /// Include member participation data
    /// </summary>
    public bool IncludeMemberParticipation { get; set; }

    /// <summary>
    /// Include event preferences
    /// </summary>
    public bool IncludeEventPreferences { get; set; }

    /// <summary>
    /// Analyze member engagement
    /// </summary>
    public bool AnalyzeMemberEngagement { get; set; }

    /// <summary>
    /// Minimum attendance threshold
    /// </summary>
    public int MinAttendance { get; set; }

    /// <summary>
    /// Maximum attendance threshold
    /// </summary>
    public int? MaxAttendance { get; set; }

    /// <summary>
    /// Minimum engagement score
    /// </summary>
    public double? MinEngagementScore { get; set; }

    /// <summary>
    /// Venue types to include
    /// </summary>
    public List<string> VenueTypes { get; set; } = new();

    /// <summary>
    /// Include private events
    /// </summary>
    public bool IncludePrivateEvents { get; set; }

    /// <summary>
    /// Only successful events
    /// </summary>
    public bool OnlySuccessfulEvents { get; set; }
}