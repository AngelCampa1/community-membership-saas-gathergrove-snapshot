namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for member custom field values
/// </summary>
public class MemberCustomFieldValueResponse
{
    /// <summary>
    /// Unique identifier for the custom field value
    /// </summary>
    /// <example>1</example>
    public int Id { get; set; }

    /// <summary>
    /// The custom field ID
    /// </summary>
    /// <example>1</example>
    public int CustomFieldId { get; set; }

    /// <summary>
    /// The custom field label
    /// </summary>
    /// <example>Emergency Contact Name</example>
    public string FieldLabel { get; set; } = string.Empty;

    /// <summary>
    /// The custom field type
    /// </summary>
    /// <example>Text</example>
    public string FieldType { get; set; } = string.Empty;

    /// <summary>
    /// The value for this custom field
    /// </summary>
    /// <example>Jane Smith (555) 123-4567</example>
    public string FieldValue { get; set; } = string.Empty;

    /// <summary>
    /// When this custom field value was last updated
    /// </summary>
    /// <example>2024-06-09T22:36:37Z</example>
    public DateTime UpdatedAt { get; set; }
}