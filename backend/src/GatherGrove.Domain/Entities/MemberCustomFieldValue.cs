using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a value for a custom field assigned to a specific member
/// Links members to their custom field data
/// </summary>
[Table("MemberCustomFieldValues")]
public class MemberCustomFieldValue
{
    /// <summary>
    /// Unique identifier for the custom field value
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// The member this value belongs to
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// Navigation property for the member
    /// </summary>
    [ForeignKey(nameof(MemberId))]
    public virtual Member Member { get; set; } = null!;

    /// <summary>
    /// The custom field this value is for
    /// </summary>
    [Required]
    public int CustomFieldId { get; set; }

    /// <summary>
    /// Navigation property for the custom field
    /// </summary>
    [ForeignKey(nameof(CustomFieldId))]
    public virtual MemberCustomField CustomField { get; set; } = null!;

    /// <summary>
    /// The actual value stored as a string (can be parsed based on field type)
    /// </summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? Value { get; set; }

    /// <summary>
    /// When this value was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When this value was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Who last updated this value
    /// </summary>
    public int? UpdatedBy { get; set; }

    /// <summary>
    /// Navigation property for the updater
    /// </summary>
    [ForeignKey(nameof(UpdatedBy))]
    public virtual User? Updater { get; set; }
}