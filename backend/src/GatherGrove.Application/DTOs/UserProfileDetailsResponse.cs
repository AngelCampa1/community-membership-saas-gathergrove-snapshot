namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for user profile details (Mobile App Story M14)
/// </summary>
public class UserProfileDetailsResponse
{
    /// <summary>
    /// Member's full name
    /// </summary>
    /// <example>John Doe</example>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Member's email address
    /// </summary>
    /// <example>john@example.com</example>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Member's phone number (optional)
    /// </summary>
    /// <example>555-123-4567</example>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Member's membership type name
    /// </summary>
    /// <example>Individual</example>
    public string MembershipTypeName { get; set; } = string.Empty;

    /// <summary>
    /// Date until which the member's dues are paid
    /// </summary>
    /// <example>2024-02-15T00:00:00Z</example>
    public DateTime? DuesPaidUntil { get; set; }

    /// <summary>
    /// Custom field values for this member (only fields with values)
    /// </summary>
    public List<CustomFieldData> CustomFields { get; set; } = new List<CustomFieldData>();
}

/// <summary>
/// Simplified custom field data for mobile display
/// </summary>
public class CustomFieldData
{
    /// <summary>
    /// Custom field label
    /// </summary>
    /// <example>Emergency Contact</example>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Custom field value
    /// </summary>
    /// <example>Jane Smith (555) 123-4567</example>
    public string Value { get; set; } = string.Empty;
}