using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Request DTO for event data export operations
/// US-005 Data Export & Reporting Engine - Event export request model
/// </summary>
public class EventExportRequest
{
    /// <summary>
    /// Export format (CSV, Excel, PDF, JSON)
    /// </summary>
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Include attendance data in export
    /// </summary>
    public bool IncludeAttendanceData { get; set; }

    /// <summary>
    /// Include engagement metrics in export
    /// </summary>
    public bool IncludeEngagementMetrics { get; set; }

    /// <summary>
    /// Event types to include in export
    /// </summary>
    public List<string> EventTypes { get; set; } = new();

    /// <summary>
    /// Start date for event data range
    /// </summary>
    public DateTime DateFrom { get; set; }

    /// <summary>
    /// End date for event data range
    /// </summary>
    public DateTime DateTo { get; set; }

    /// <summary>
    /// Include event photos
    /// </summary>
    public bool IncludePhotos { get; set; }

    /// <summary>
    /// Include feedback/reviews
    /// </summary>
    public bool IncludeFeedback { get; set; }

    /// <summary>
    /// Include financial information for events
    /// </summary>
    public bool IncludeFinancialData { get; set; }

    /// <summary>
    /// Minimum number of attendees to include event
    /// </summary>
    public int? MinAttendees { get; set; }

    /// <summary>
    /// Event status filter
    /// </summary>
    public string? StatusFilter { get; set; }
}