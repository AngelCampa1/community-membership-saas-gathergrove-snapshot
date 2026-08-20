namespace GatherGrove.Application.DTOs;

/// <summary>
/// Result of bulk RSVP operation for event series
/// </summary>
public class BulkSeriesRsvpResult
{
    /// <summary>
    /// Number of RSVPs successfully created or updated
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// Number of RSVPs that failed
    /// </summary>
    public int ErrorCount { get; set; }

    /// <summary>
    /// Number of events skipped (capacity full or RSVP exists)
    /// </summary>
    public int SkippedCount { get; set; }

    /// <summary>
    /// Total number of events processed
    /// </summary>
    public int TotalEvents => SuccessCount + ErrorCount + SkippedCount;

    /// <summary>
    /// List of errors that occurred
    /// </summary>
    public List<BulkOperationError> Errors { get; set; } = new();

    /// <summary>
    /// List of successfully created RSVPs
    /// </summary>
    public List<EventRsvpResponse> SuccessfulRsvps { get; set; } = new();

    /// <summary>
    /// List of skipped event details
    /// </summary>
    public List<SkippedEventInfo> SkippedEvents { get; set; } = new();

    /// <summary>
    /// Whether the entire operation succeeded
    /// </summary>
    public bool IsFullSuccess => ErrorCount == 0 && SkippedCount == 0;

    /// <summary>
    /// Whether the operation had partial success
    /// </summary>
    public bool IsPartialSuccess => SuccessCount > 0 && (ErrorCount > 0 || SkippedCount > 0);
}

/// <summary>
/// Information about a skipped event
/// </summary>
public class SkippedEventInfo
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public SkipReason Reason { get; set; }
    public string? Details { get; set; }
}

/// <summary>
/// Reasons why an event might be skipped
/// </summary>
public enum SkipReason
{
    AtCapacity,
    RsvpExists,
    EventNotFound,
    Other
}
