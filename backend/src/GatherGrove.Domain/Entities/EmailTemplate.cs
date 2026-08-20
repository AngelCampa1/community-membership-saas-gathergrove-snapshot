using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents an email template for club communications
/// </summary>
[Table("EmailTemplates")]
public class EmailTemplate
{
    /// <summary>
    /// Unique identifier for the email template
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// The club this template belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Name of the template
    /// </summary>
    [Required]
    [StringLength(200)]
    public string TemplateName { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the template
    /// </summary>
    [StringLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// HTML content of the template
    /// </summary>
    [Required]
    [Column(TypeName = "ntext")]
    public string TemplateHtml { get; set; } = string.Empty;

    /// <summary>
    /// JSON representation for the email builder (GrapesJS/Unlayer format)
    /// </summary>
    [Column(TypeName = "ntext")]
    public string? TemplateJson { get; set; }

    /// <summary>
    /// Preview thumbnail URL or base64 image
    /// </summary>
    [StringLength(2000)]
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// Whether this is a system-provided template
    /// </summary>
    [Required]
    public bool IsSystemTemplate { get; set; } = false;

    /// <summary>
    /// Whether the template is currently active
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Version number for template versioning
    /// </summary>
    [Required]
    public int Version { get; set; } = 1;

    /// <summary>
    /// User who created this template
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// When this template was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// User who last updated this template
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// When this template was last updated
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// When this template was last used
    /// </summary>
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// Number of times this template has been used
    /// </summary>
    [Required]
    public int UsageCount { get; set; } = 0;

    /// <summary>
    /// Navigation property for the club
    /// </summary>
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Navigation property for the user who created this template
    /// </summary>
    public virtual User CreatedByUser { get; set; } = null!;

    /// <summary>
    /// Navigation property for the user who last updated this template
    /// </summary>
    public virtual User? UpdatedByUser { get; set; }
}

