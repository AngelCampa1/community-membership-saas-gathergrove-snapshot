using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a predefined filter template for creating segments
/// </summary>
[Table("SegmentFilterTemplates")]
public class SegmentFilterTemplate
{
    /// <summary>
    /// Unique identifier for the template
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// The name of the template
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of what this template filters
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Category for organizing templates
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Category { get; set; } = "General";

    /// <summary>
    /// Filter criteria as JSON string
    /// </summary>
    [Required]
    [Column(TypeName = "ntext")]
    public string FilterCriteria { get; set; } = string.Empty;

    /// <summary>
    /// Whether this is a system-provided template
    /// </summary>
    [Required]
    public bool IsSystemTemplate { get; set; } = false;

    /// <summary>
    /// Whether the template is active
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// How many times this template has been used
    /// </summary>
    [Required]
    public int UsageCount { get; set; } = 0;

    /// <summary>
    /// When this template was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When this template was last updated
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}