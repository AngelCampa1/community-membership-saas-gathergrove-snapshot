namespace GatherGrove.Application.DTOs.Communications;

/// <summary>
/// Response DTO for email usage statistics
/// </summary>
public class EmailUsageStatsResponse
{
    /// <summary>
    /// Current club tier (Sprout/Grow)
    /// </summary>
    public string ClubTier { get; set; } = string.Empty;

    /// <summary>
    /// Number of admin communications sent this month (excludes system emails like activation, payment requests)
    /// </summary>
    public int EmailsSentThisMonth { get; set; }

    /// <summary>
    /// Admin communication limit for current tier (null if unlimited)
    /// </summary>
    public int? MonthlyEmailLimit { get; set; }

    /// <summary>
    /// Number of active members (potential recipients)
    /// </summary>
    public int ActiveMemberCount { get; set; }

    /// <summary>
    /// Whether sending to all members would exceed the limit
    /// </summary>
    public bool WouldExceedLimit { get; set; }

    /// <summary>
    /// Remaining admin communications available this month (null if unlimited)
    /// </summary>
    public int? RemainingEmails { get; set; }

    /// <summary>
    /// The current month being tracked
    /// </summary>
    public DateTime CurrentMonth { get; set; }
}