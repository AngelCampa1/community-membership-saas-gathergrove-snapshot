using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Tracks individual feature usage events for engagement analytics
/// </summary>
public class FeatureUsageEvent
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int MemberId { get; set; }

    [Required]
    public int ClubId { get; set; }

    [Required]
    [StringLength(100)]
    public string FeatureName { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Platform { get; set; } = string.Empty; // "web", "mobile"

    [Required]
    [StringLength(128)]
    public string SessionId { get; set; } = string.Empty;

    [Required]
    public DateTime UsedAt { get; set; }

    // Additional context
    [StringLength(200)]
    public string? Action { get; set; }

    [StringLength(500)]
    public string? Context { get; set; }

    public decimal? Duration { get; set; } // Duration in seconds for timed features

    // JSON metadata field for additional context
    public string? Metadata { get; set; }

    // Member tenure at time of usage
    public int MemberTenureDays { get; set; }
    public int MemberTenure { get; set; } // For DbContext compatibility

    // Engagement weight for scoring
    public decimal EngagementWeight { get; set; } = 1.0m;

    // Navigation properties
    public Member Member { get; set; } = null!;
    public Club Club { get; set; } = null!;
    public AnalyticsSession? Session { get; set; }
}