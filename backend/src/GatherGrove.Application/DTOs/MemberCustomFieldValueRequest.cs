using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for member custom field values
/// </summary>
public class MemberCustomFieldValueRequest
{
    /// <summary>
    /// The custom field ID
    /// </summary>
    /// <example>1</example>
    [Required(ErrorMessage = "Custom field ID is required")]
    public int CustomFieldId { get; set; }

    /// <summary>
    /// The value for this custom field
    /// </summary>
    /// <example>John's Emergency Contact</example>
    [Required(ErrorMessage = "Field value is required")]
    [StringLength(1000, ErrorMessage = "Field value cannot exceed 1000 characters")]
    public string FieldValue { get; set; } = string.Empty;
}