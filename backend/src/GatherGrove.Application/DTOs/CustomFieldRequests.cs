using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for creating a new custom field
/// </summary>
public class CreateCustomFieldRequest
{
    /// <summary>
    /// The club this field belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Label/name of the field
    /// </summary>
    [Required]
    [StringLength(255, MinimumLength = 1)]
    public string FieldLabel { get; set; } = string.Empty;

    /// <summary>
    /// Type of field (Text, Number, Boolean, Dropdown, Textarea)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string FieldType { get; set; } = string.Empty;

    /// <summary>
    /// Comma-separated dropdown options (required for Dropdown type)
    /// </summary>
    [StringLength(2000)]
    public string? DropdownOptions { get; set; }

    /// <summary>
    /// Whether this field is required
    /// </summary>
    public bool IsRequired { get; set; } = false;

    /// <summary>
    /// User creating this field
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }
}

/// <summary>
/// Request for updating an existing custom field
/// </summary>
public class UpdateCustomFieldRequest
{
    /// <summary>
    /// ID of the field to update
    /// </summary>
    [Required]
    public int CustomFieldId { get; set; }

    /// <summary>
    /// Updated label/name of the field
    /// </summary>
    [Required]
    [StringLength(255, MinimumLength = 1)]
    public string FieldLabel { get; set; } = string.Empty;

    /// <summary>
    /// Updated type of field
    /// </summary>
    [Required]
    [StringLength(50)]
    public string FieldType { get; set; } = string.Empty;

    /// <summary>
    /// Updated dropdown options
    /// </summary>
    [StringLength(2000)]
    public string? DropdownOptions { get; set; }

    /// <summary>
    /// Updated required flag
    /// </summary>
    public bool IsRequired { get; set; } = false;

    /// <summary>
    /// User updating this field
    /// </summary>
    [Required]
    public int UpdatedByUserId { get; set; }
}

/// <summary>
/// Request for setting a custom field value for a member
/// </summary>
public class SetCustomFieldValueRequest
{
    /// <summary>
    /// ID of the member
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// ID of the custom field
    /// </summary>
    [Required]
    public int CustomFieldId { get; set; }

    /// <summary>
    /// Value to set for the field
    /// </summary>
    [Required]
    public string FieldValue { get; set; } = string.Empty;

    /// <summary>
    /// User setting this value
    /// </summary>
    [Required]
    public int UpdatedByUserId { get; set; }
}