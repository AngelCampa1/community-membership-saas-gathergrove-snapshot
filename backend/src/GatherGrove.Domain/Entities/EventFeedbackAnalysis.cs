using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Event feedback and sentiment analysis
/// </summary>
public class EventFeedbackAnalysis
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int EventId { get; set; }

    [Required]
    public int MemberId { get; set; }

    // Survey Response Data
    [StringLength(50)]
    public string? SurveyResponseId { get; set; }

    [Required]
    [Column(TypeName = "decimal(3,1)")]
    public decimal OverallSatisfaction { get; set; }

    [Required]
    public int NetPromoterScore { get; set; }

    // Detailed Ratings
    [Column(TypeName = "decimal(3,1)")]
    public decimal? ContentQualityRating { get; set; }

    [Column(TypeName = "decimal(3,1)")]
    public decimal? PresentationRating { get; set; }

    [Column(TypeName = "decimal(3,1)")]
    public decimal? OrganizationRating { get; set; }

    [Column(TypeName = "decimal(3,1)")]
    public decimal? NetworkingRating { get; set; }

    [Column(TypeName = "decimal(3,1)")]
    public decimal? TechnologyRating { get; set; }

    // Text Feedback
    public string? PositiveFeedback { get; set; }
    public string? NegativeFeedback { get; set; }
    public string? Suggestions { get; set; }

    // Sentiment Analysis (if implemented)
    [Column(TypeName = "decimal(4,2)")]
    public decimal? SentimentScore { get; set; }

    [StringLength(20)]
    public string? SentimentLabel { get; set; }

    [Required]
    public string KeyTopics { get; set; } = "[]";

    // Engagement Impact
    public bool? WillAttendFutureEvents { get; set; }
    public bool? WouldRecommendToOthers { get; set; }

    [StringLength(20)]
    public string? EngagementMotivation { get; set; }

    // Response Metadata
    public int? ResponseDuration { get; set; }

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal ResponseCompleteness { get; set; } = 100.0m;

    // Timestamps
    [Required]
    public DateTime ResponseDate { get; set; }

    public DateTime? ProcessedAt { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public virtual Event Event { get; set; } = null!;
    public virtual Member Member { get; set; } = null!;
}