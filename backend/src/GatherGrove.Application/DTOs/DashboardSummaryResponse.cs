namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for dashboard summary data
/// </summary>
public class DashboardSummaryResponse
{
    /// <summary>
    /// Current subscription tier of the club (e.g., "Sprout", "Grow")
    /// </summary>
    /// <example>Sprout</example>
    public string CurrentTier { get; set; } = string.Empty;

    /// <summary>
    /// Total number of active members in the club
    /// </summary>
    /// <example>1</example>
    public int MemberCount { get; set; }

    /// <summary>
    /// Maximum number of members allowed for the current tier
    /// </summary>
    /// <example>50</example>
    public int MemberLimit { get; set; }

    /// <summary>
    /// Total dues collected this year in USD
    /// </summary>
    /// <example>0.00</example>
    public decimal DuesCollectedYTD { get; set; }

    /// <summary>
    /// Number of events scheduled for the future
    /// </summary>
    /// <example>0</example>
    public int UpcomingEventCount { get; set; }
}