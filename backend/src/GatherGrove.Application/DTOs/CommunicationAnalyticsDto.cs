namespace GatherGrove.Application.DTOs;

/// <summary>
/// Communication analytics summary response
/// </summary>
public class CommunicationAnalyticsResponse
{
    public int CommunicationId { get; set; }
    public int TotalSent { get; set; }
    public int TotalDelivered { get; set; }
    public int TotalOpened { get; set; }
    public int TotalClicked { get; set; }
    public int TotalUnsubscribed { get; set; }
    public int TotalBounced { get; set; }

    public decimal DeliveryRate { get; set; }
    public decimal OpenRate { get; set; }
    public decimal ClickRate { get; set; }
    public decimal UnsubscribeRate { get; set; }
    public decimal BounceRate { get; set; }

    /// <summary>
    /// Analytics by communication type
    /// </summary>
    public Dictionary<string, CommunicationTypeAnalytics> ByType { get; set; } = new();

    /// <summary>
    /// Analytics by device
    /// </summary>
    public Dictionary<string, int> ByDevice { get; set; } = new();

    /// <summary>
    /// Analytics by email client
    /// </summary>
    public Dictionary<string, int> ByEmailClient { get; set; } = new();

    /// <summary>
    /// Analytics by geographic location
    /// </summary>
    public Dictionary<string, int> ByLocation { get; set; } = new();

    /// <summary>
    /// Time-based engagement data
    /// </summary>
    public List<TimeBasedEngagement> TimeBasedData { get; set; } = new();
}

/// <summary>
/// Analytics for a specific communication type
/// </summary>
public class CommunicationTypeAnalytics
{
    public string CommunicationType { get; set; } = string.Empty;
    public int Sent { get; set; }
    public int Delivered { get; set; }
    public int Opened { get; set; }
    public int Clicked { get; set; }
    public decimal OpenRate { get; set; }
    public decimal ClickRate { get; set; }
}

/// <summary>
/// Time-based engagement data point
/// </summary>
public class TimeBasedEngagement
{
    public DateTime Date { get; set; }
    public int Sent { get; set; }
    public int Opened { get; set; }
    public int Clicked { get; set; }
    public decimal OpenRate { get; set; }
    public decimal ClickRate { get; set; }
}

/// <summary>
/// Individual communication analytics details
/// </summary>
public class CommunicationDetailsResponse
{
    public int CommunicationId { get; set; }
    public string CommunicationType { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public DateTime SentAt { get; set; }
    public int RecipientCount { get; set; }

    public int DeliveredCount { get; set; }
    public int OpenedCount { get; set; }
    public int ClickedCount { get; set; }
    public int UnsubscribedCount { get; set; }
    public int BouncedCount { get; set; }

    public decimal DeliveryRate { get; set; }
    public decimal OpenRate { get; set; }
    public decimal ClickRate { get; set; }

    /// <summary>
    /// List of recipients with their engagement
    /// </summary>
    public List<RecipientEngagement> Recipients { get; set; } = new();
}

/// <summary>
/// Recipient engagement details
/// </summary>
public class RecipientEngagement
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool Delivered { get; set; }
    public bool Opened { get; set; }
    public bool Clicked { get; set; }
    public bool Unsubscribed { get; set; }
    public bool Bounced { get; set; }
    public DateTime? OpenedAt { get; set; }
    public DateTime? ClickedAt { get; set; }
    public int OpenCount { get; set; }
    public int ClickCount { get; set; }
    public string? DeviceType { get; set; }
    public string? EmailClient { get; set; }
}

/// <summary>
/// Analytics filter request
/// </summary>
public class AnalyticsFilterRequest
{
    /// <summary>
    /// Start date for analytics (default: 30 days ago)
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// End date for analytics (default: today)
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Filter by communication type
    /// </summary>
    public string? CommunicationType { get; set; }

    /// <summary>
    /// Filter by template ID
    /// </summary>
    public int? TemplateId { get; set; }

    /// <summary>
    /// Filter by segment ID
    /// </summary>
    public int? SegmentId { get; set; }
}

/// <summary>
/// Track email open event
/// </summary>
public class TrackEmailOpenRequest
{
    public string TrackingId { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
    public string? IpAddress { get; set; }
}

/// <summary>
/// Track link click event
/// </summary>
public class TrackLinkClickRequest
{
    public string TrackingId { get; set; } = string.Empty;
    public string LinkUrl { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
    public string? IpAddress { get; set; }
}


/// <summary>
/// Daily statistics response
/// </summary>
public class DailyStatsResponse
{
    public DateTime Date { get; set; }
    public int TotalSent { get; set; }
    public int TotalOpened { get; set; }
    public int TotalClicked { get; set; }
}

/// <summary>
/// Communication dashboard statistics
/// </summary>
public class CommunicationDashboardResponse
{
    public int ClubId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalSent { get; set; }
    public int TotalOpened { get; set; }
    public int TotalClicked { get; set; }
    public int TotalBounced { get; set; }
    public decimal OpenRate { get; set; }
    public decimal ClickRate { get; set; }
    public decimal BounceRate { get; set; }
    public List<DailyStatsResponse> DailyStats { get; set; } = new();
}
