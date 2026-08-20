using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a custom field definition for member data collection
/// Allows clubs to define additional member properties beyond standard fields
/// </summary>
[Table("MemberCustomFields")]
public class MemberCustomField
{
    /// <summary>
    /// Unique identifier for the custom field
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// The club that owns this custom field
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Navigation property for the club
    /// </summary>
    [ForeignKey(nameof(ClubId))]
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Display name for the custom field
    /// </summary>
    [Required]
    [StringLength(100)]
    public string FieldName { get; set; } = string.Empty;

    /// <summary>
    /// Type of the field (Text, Number, Date, Boolean, Select, MultiSelect)
    /// </summary>
    [Required]
    [StringLength(20)]
    public string FieldType { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the field
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// JSON string containing field options for Select/MultiSelect types
    /// </summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? FieldOptions { get; set; }

    /// <summary>
    /// Whether this field is required for member registration
    /// </summary>
    public bool IsRequired { get; set; } = false;

    /// <summary>
    /// Display order for field presentation
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    /// <summary>
    /// Whether this field is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When this custom field was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Who created this custom field
    /// </summary>
    [Required]
    public int CreatedBy { get; set; }

    /// <summary>
    /// Navigation property for the creator
    /// </summary>
    [ForeignKey(nameof(CreatedBy))]
    public virtual User Creator { get; set; } = null!;

    /// <summary>
    /// When this custom field was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Who last updated this custom field
    /// </summary>
    public int? UpdatedBy { get; set; }

    /// <summary>
    /// Navigation property for the updater
    /// </summary>
    [ForeignKey(nameof(UpdatedBy))]
    public virtual User? Updater { get; set; }

    /// <summary>
    /// Navigation property for custom field values
    /// </summary>
    public virtual ICollection<MemberCustomFieldValue> CustomFieldValues { get; set; } = new List<MemberCustomFieldValue>();
}