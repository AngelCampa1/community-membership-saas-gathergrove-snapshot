using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Aggregate analytics metrics for events
/// </summary>
public class EventAnalyticsMetrics
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int EventId { get; set; }

    [Required]
    public int ClubId { get; set; }

    // Overall Event Metrics
    [Required]
    public int TotalRegistrations { get; set; } = 0;

    [Required]
    public int TotalAttendees { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal AttendanceRate { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal NoShowRate { get; set; } = 0;

    // Engagement Metrics
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal AverageParticipationScore { get; set; } = 0;

    [Required]
    public int AverageSessionDuration { get; set; } = 0;

    [Required]
    public int TotalInteractions { get; set; } = 0;

    [Required]
    public int UniqueParticipants { get; set; } = 0;

    // Satisfaction Metrics
    [Column(TypeName = "decimal(3,1)")]
    public decimal? AverageSatisfactionRating { get; set; }

    [Column(TypeName = "decimal(4,1)")]
    public decimal? AverageNPS { get; set; }

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal SurveyResponseRate { get; set; } = 0;

    // Participation Distribution
    [Required]
    public int HighlyActiveCount { get; set; } = 0;

    [Required]
    public int ActiveCount { get; set; } = 0;

    [Required]
    public int ModerateCount { get; set; } = 0;

    [Required]
    public int PassiveCount { get; set; } = 0;

    [Required]
    public int DisengagedCount { get; set; } = 0;

    // Technology Metrics
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal MobileUsagePercentage { get; set; } = 0;

    [Required]
    public int TechnicalIssuesCount { get; set; } = 0;

    // Follow-up Metrics
    [Required]
    public int NetworkingConnectionsMade { get; set; } = 0;

    [Required]
    public int ResourceDownloads { get; set; } = 0;

    [Required]
    public int FollowUpEngagements { get; set; } = 0;

    // Member Engagement Impact
    [Required]
    [Column(TypeName = "decimal(8,2)")]
    public decimal TotalEngagementBoost { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(6,2)")]
    public decimal AverageEngagementBoost { get; set; } = 0;

    [Required]
    public int MembersWithBoost { get; set; } = 0;

    // Comparison Metrics
    [Column(TypeName = "decimal(6,2)")]
    public decimal? ComparedToClubAverage { get; set; }

    [Column(TypeName = "decimal(6,2)")]
    public decimal? ComparedToEventType { get; set; }

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal EventSuccessScore { get; set; } = 0;

    // Timestamps
    [Required]
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Additional properties expected by tests
    public int TotalEvents { get; set; }
    public double AverageAttendance { get; set; }
    public double EngagementScore { get; set; }
    public decimal RevenueGenerated { get; set; }
    public string TopPerformingEventType { get; set; } = string.Empty;

    // Navigation Properties
    public virtual Event Event { get; set; } = null!;
    public virtual Club Club { get; set; } = null!;
}