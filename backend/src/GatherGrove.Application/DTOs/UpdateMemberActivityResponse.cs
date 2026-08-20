using System;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response after updating member activity
/// </summary>
public class UpdateMemberActivityResponse
{
    /// <summary>
    /// Member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Updated engagement score
    /// </summary>
    public decimal EngagementScore { get; set; }

    /// <summary>
    /// Previous engagement score
    /// </summary>
    public decimal PreviousScore { get; set; }

    /// <summary>
    /// Score change amount
    /// </summary>
    public decimal ScoreChange { get; set; }

    /// <summary>
    /// Engagement level after update
    /// </summary>
    public string EngagementLevel { get; set; } = string.Empty;

    /// <summary>
    /// When the score was updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Activity type that triggered the update
    /// </summary>
    public string ActivityType { get; set; } = string.Empty;
}