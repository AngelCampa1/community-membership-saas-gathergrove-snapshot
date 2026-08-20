using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// AI-driven event recommendations for members
/// </summary>
public class EventRecommendations
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int MemberId { get; set; }

    [Required]
    public int EventId { get; set; }

    // Recommendation Scoring
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal RecommendationScore { get; set; }

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal ConfidenceLevel { get; set; }

    // Recommendation Factors (JSON for detailed breakdown)
    [Required]
    public string RecommendationFactors { get; set; } = "{}";

    // Reason Categories
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal PastEngagementFactor { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal InterestAlignmentFactor { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal SocialConnectionsFactor { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal TimingPreferenceFactor { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal DiversityFactor { get; set; } = 0;

    // Status Tracking
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "active";

    public DateTime? PresentedAt { get; set; }
    public DateTime? ResponseAt { get; set; }

    // A/B Testing
    [StringLength(10)]
    public string? TestGroup { get; set; }

    [Required]
    [StringLength(50)]
    public string RecommendationMethod { get; set; } = "algorithm_v1";

    // Timestamps
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime ExpiresAt { get; set; }

    // Navigation Properties
    public virtual Member Member { get; set; } = null!;
    public virtual Event Event { get; set; } = null!;
}