using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing member engagement information for communications
/// </summary>
public class MemberEngagementResponse
{
    /// <summary>
    /// Member ID
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// Club ID
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Member's full name
    /// </summary>
    [Required]
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Member's email address
    /// </summary>
    [Required]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Overall engagement score
    /// </summary>
    public decimal OverallScore { get; set; }

    /// <summary>
    /// Engagement level classification
    /// </summary>
    public string EngagementLevel { get; set; } = "Unknown";

    /// <summary>
    /// Activity level classification
    /// </summary>
    public string ActivityLevel { get; set; } = "Unknown";

    /// <summary>
    /// Whether the member is at risk of disengagement
    /// </summary>
    public bool IsAtRisk { get; set; }

    /// <summary>
    /// Number of days since last login
    /// </summary>
    public int DaysSinceLastLogin { get; set; }

    /// <summary>
    /// Last activity date
    /// </summary>
    public DateTime? LastActivityDate { get; set; }

    /// <summary>
    /// Login count in last 7 days
    /// </summary>
    public int LoginCount7Days { get; set; }

    /// <summary>
    /// Login count in last 30 days
    /// </summary>
    public int LoginCount30Days { get; set; }

    /// <summary>
    /// Member name for display
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Member email for communication
    /// </summary>
    public string MemberEmail { get; set; } = string.Empty;

    /// <summary>
    /// Engagement score (alias for OverallScore)
    /// </summary>
    public decimal EngagementScore { get; set; }

    /// <summary>
    /// Activity counts breakdown
    /// </summary>
    public ActivityCountsResponse? ActivityCounts { get; set; }

    /// <summary>
    /// Recent activities list
    /// </summary>
    public List<RecentActivityResponse> RecentActivities { get; set; } = new();
}