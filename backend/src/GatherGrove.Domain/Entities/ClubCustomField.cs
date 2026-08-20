using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

[Table("ClubCustomFields")]
public class ClubCustomField
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int CustomFieldId { get; set; }

    [Required]
    public int ClubId { get; set; }

    [Required]
    [StringLength(255)]
    public string FieldLabel { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string FieldType { get; set; } = "Text"; // Supports: Text, Number, Boolean, Dropdown, Textarea

    /// <summary>
    /// Comma-separated dropdown options (only used for Dropdown field type)
    /// </summary>
    [StringLength(2000)]
    public string? DropdownOptions { get; set; }

    /// <summary>
    /// Indicates whether this custom field is required when creating or updating a member
    /// </summary>
    public bool IsRequired { get; set; } = false;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(ClubId))]
    public Club Club { get; set; } = null!;
}