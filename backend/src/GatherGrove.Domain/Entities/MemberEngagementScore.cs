using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Tracks member engagement scores for unlimited tier analytics
/// </summary>
public class MemberEngagementScore
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int MemberId { get; set; }

    [Required]
    public int ClubId { get; set; }

    [Required]
    public decimal OverallScore { get; set; }

    public decimal LoginScore { get; set; }
    public decimal EventScore { get; set; }
    public decimal CommunicationScore { get; set; }
    public decimal FeatureUsageScore { get; set; }
    public decimal ProfileCompletenessScore { get; set; }

    [Required]
    public DateTime CalculatedDate { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Login activity metrics
    public int LoginCount7Days { get; set; }
    public int LoginCount30Days { get; set; }
    public int LoginCount90Days { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public int LoginStreakDays { get; set; }
    public decimal AverageSessionDurationMinutes { get; set; }

    // Activity classification
    [StringLength(20)]
    public string ActivityLevel { get; set; } = "Unknown"; // "HighlyActive", "Moderate", "Inactive"

    // BUG FIX: Changed default from "Unknown" to "Red" since "Unknown" is not a valid EngagementLevel enum value
    [StringLength(20)]
    public string EngagementLevel { get; set; } = "Red"; // For DbContext compatibility - must match EngagementLevel enum

    public int DaysSinceLastLogin { get; set; }
    public bool IsAtRisk { get; set; } // True if member hasn't logged in for 30+ days

    // Navigation properties
    public Member Member { get; set; } = null!;
    public Club Club { get; set; } = null!;
}