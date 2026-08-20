namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to schedule a communication
/// </summary>
public class ScheduleCommunicationRequest
{
    /// <summary>
    /// Type of communication (Email or Push)
    /// </summary>
    public string CommunicationType { get; set; } = "Email";

    /// <summary>
    /// Subject (for emails)
    /// </summary>
    public string? Subject { get; set; }

    /// <summary>
    /// Message body/content
    /// </summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// When to send (null = immediate)
    /// </summary>
    public DateTime? ScheduledFor { get; set; }

    /// <summary>
    /// Target segment ID
    /// </summary>
    public int? SegmentId { get; set; }

    /// <summary>
    /// Email template ID to use
    /// </summary>
    public int? TemplateId { get; set; }

    /// <summary>
    /// Workflow ID if triggered by workflow
    /// </summary>
    public int? WorkflowId { get; set; }

    /// <summary>
    /// For recurring campaigns
    /// </summary>
    public RecurringSchedule? RecurringSchedule { get; set; }
}

/// <summary>
/// Response for scheduled communication
/// </summary>
public class ScheduleCommunicationResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int CommunicationId { get; set; }
    public DateTime? ScheduledFor { get; set; }
}

/// <summary>
/// Scheduled communication details
/// </summary>
public class ScheduledCommunicationResponse
{
    public int CommunicationId { get; set; }
    public string CommunicationType { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public DateTime? ScheduledFor { get; set; }
    public DateTime CreatedAt { get; set; }
    public int RecipientCount { get; set; }
    public string Status { get; set; } = "Scheduled";
}

/// <summary>
/// Recurring schedule configuration
/// </summary>
public class RecurringSchedule
{
    /// <summary>
    /// Frequency (Daily, Weekly, Monthly)
    /// </summary>
    public string Frequency { get; set; } = "Weekly";

    /// <summary>
    /// Interval (e.g., every 2 weeks)
    /// </summary>
    public int Interval { get; set; } = 1;

    /// <summary>
    /// Day of week (for weekly)
    /// </summary>
    public int? DayOfWeek { get; set; }

    /// <summary>
    /// Day of month (for monthly)
    /// </summary>
    public int? DayOfMonth { get; set; }

    /// <summary>
    /// Time of day to send
    /// </summary>
    public TimeSpan TimeOfDay { get; set; }

    /// <summary>
    /// Time zone (IANA format, e.g., "America/New_York")
    /// </summary>
    public string TimeZone { get; set; } = "UTC";

    /// <summary>
    /// End date for recurring campaign
    /// </summary>
    public DateTime? EndDate { get; set; }
}

