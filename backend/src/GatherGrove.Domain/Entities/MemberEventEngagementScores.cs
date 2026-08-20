using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Member-level event engagement scoring and analytics
/// </summary>
public class MemberEventEngagementScores
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int MemberId { get; set; }

    // Overall Event Engagement Metrics
    [Required]
    public int TotalEventsAttended { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal EventAttendanceRate { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal AverageEventEngagementScore { get; set; } = 0;

    // Event Participation Patterns
    [Required]
    public string PreferredEventTypes { get; set; } = "[]";

    [StringLength(100)]
    public string? PreferredEventTimes { get; set; }

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal ConsistencyScore { get; set; } = 0;

    // Engagement Quality Metrics
    [Required]
    public int HighEngagementEventsCount { get; set; } = 0;

    [Required]
    public int LowEngagementEventsCount { get; set; } = 0;

    [Column(TypeName = "decimal(3,1)")]
    public decimal? AverageSatisfactionRating { get; set; }

    // Social Engagement
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal NetworkingScore { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal PeerInfluenceScore { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal CommunityContribution { get; set; } = 0;

    // Predictive Metrics
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal EventRetentionProbability { get; set; } = 50.0m;

    [Required]
    [StringLength(10)]
    public string EngagementTrend { get; set; } = "stable";

    [Required]
    [StringLength(10)]
    public string RiskLevel { get; set; } = "low";

    // Rolling Window Metrics (Last 90 days)
    [Required]
    public int Recent90DayEvents { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal Recent90DayEngagementScore { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(6,2)")]
    public decimal Recent90DayTrend { get; set; } = 0;

    // Integration with Main Engagement Score
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal ContributionToOverallScore { get; set; } = 0;

    public DateTime? LastEngagementScoreUpdate { get; set; }

    // Timestamps
    [Required]
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public virtual Member Member { get; set; } = null!;
}