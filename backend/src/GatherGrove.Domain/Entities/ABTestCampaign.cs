using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents an A/B test campaign for communications
/// </summary>
[Table("ABTestCampaigns")]
public class ABTestCampaign
{
    /// <summary>
    /// Unique identifier for the A/B test campaign
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// The club this campaign belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Name of the campaign
    /// </summary>
    [Required]
    [StringLength(200)]
    public string CampaignName { get; set; } = string.Empty;

    /// <summary>
    /// Description of what is being tested
    /// </summary>
    [StringLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Type of test (SubjectLine, Content, SendTime)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string TestType { get; set; } = string.Empty;

    /// <summary>
    /// Template ID for variant A
    /// </summary>
    public int? VariantATemplateId { get; set; }

    /// <summary>
    /// Subject line for variant A
    /// </summary>
    [StringLength(500)]
    public string? VariantASubject { get; set; }

    /// <summary>
    /// Content for variant A (if not using template)
    /// </summary>
    [Column(TypeName = "ntext")]
    public string? VariantAContent { get; set; }

    /// <summary>
    /// Template ID for variant B
    /// </summary>
    public int? VariantBTemplateId { get; set; }

    /// <summary>
    /// Subject line for variant B
    /// </summary>
    [StringLength(500)]
    public string? VariantBSubject { get; set; }

    /// <summary>
    /// Content for variant B (if not using template)
    /// </summary>
    [Column(TypeName = "ntext")]
    public string? VariantBContent { get; set; }

    /// <summary>
    /// Percentage of audience to include in test (e.g., 50 for 50%)
    /// </summary>
    [Required]
    public int TestPercentage { get; set; } = 50;

    /// <summary>
    /// Minimum sample size before declaring winner
    /// </summary>
    [Required]
    public int MinimumSampleSize { get; set; } = 100;

    /// <summary>
    /// Required confidence level for statistical significance (e.g., 95)
    /// </summary>
    [Required]
    public decimal ConfidenceLevel { get; set; } = 95.0m;

    /// <summary>
    /// Status of the campaign (Draft, Running, Completed, Cancelled)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Draft";

    /// <summary>
    /// ID of the winning variant (null if test not complete)
    /// </summary>
    public int? WinnerId { get; set; }

    /// <summary>
    /// Winning variant name (A or B)
    /// </summary>
    [StringLength(10)]
    public string? WinnerVariant { get; set; }

    /// <summary>
    /// Statistical significance achieved (as percentage)
    /// </summary>
    public decimal? StatisticalSignificance { get; set; }

    /// <summary>
    /// Member segment ID for targeting (null = all members)
    /// </summary>
    public int? SegmentId { get; set; }

    /// <summary>
    /// When the test started
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// When the test ended
    /// </summary>
    public DateTime? EndedAt { get; set; }

    /// <summary>
    /// User who created this campaign
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// When this campaign was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this campaign was last updated
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the club
    /// </summary>
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Navigation property for variant A template
    /// </summary>
    public virtual EmailTemplate? VariantATemplate { get; set; }

    /// <summary>
    /// Navigation property for variant B template
    /// </summary>
    public virtual EmailTemplate? VariantBTemplate { get; set; }

    /// <summary>
    /// Navigation property for the user who created this campaign
    /// </summary>
    public virtual User CreatedByUser { get; set; } = null!;

    /// <summary>
    /// Navigation property for the target segment
    /// </summary>
    public virtual MemberSegment? Segment { get; set; }
}

