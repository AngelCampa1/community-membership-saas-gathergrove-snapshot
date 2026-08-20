using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents an automated communication workflow
/// </summary>
[Table("CommunicationWorkflows")]
public class CommunicationWorkflow
{
    /// <summary>
    /// Unique identifier for the workflow
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// The club this workflow belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Name of the workflow
    /// </summary>
    [Required]
    [StringLength(200)]
    public string WorkflowName { get; set; } = string.Empty;

    /// <summary>
    /// Description of the workflow
    /// </summary>
    [StringLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Trigger type (MemberJoin, EventRSVP, MemberInactivity, CustomDate, MemberBehavior)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string TriggerType { get; set; } = string.Empty;

    /// <summary>
    /// Trigger configuration as JSON
    /// </summary>
    [Column(TypeName = "ntext")]
    public string? TriggerConfig { get; set; }

    /// <summary>
    /// Workflow steps as JSON array
    /// </summary>
    [Required]
    [Column(TypeName = "ntext")]
    public string WorkflowSteps { get; set; } = "[]";

    /// <summary>
    /// Member segment ID for targeting (null = all members)
    /// </summary>
    public int? SegmentId { get; set; }

    /// <summary>
    /// Whether the workflow is currently active
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = false;

    /// <summary>
    /// Number of times this workflow has been triggered
    /// </summary>
    [Required]
    public int TriggerCount { get; set; } = 0;

    /// <summary>
    /// Number of successful completions
    /// </summary>
    [Required]
    public int SuccessCount { get; set; } = 0;

    /// <summary>
    /// Number of failed executions
    /// </summary>
    [Required]
    public int FailureCount { get; set; } = 0;

    /// <summary>
    /// When the workflow was last triggered
    /// </summary>
    public DateTime? LastTriggeredAt { get; set; }

    /// <summary>
    /// User who created this workflow
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// When this workflow was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this workflow was last updated
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the club
    /// </summary>
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Navigation property for the user who created this workflow
    /// </summary>
    public virtual User CreatedByUser { get; set; } = null!;

    /// <summary>
    /// Navigation property for the target segment
    /// </summary>
    public virtual MemberSegment? Segment { get; set; }
}

