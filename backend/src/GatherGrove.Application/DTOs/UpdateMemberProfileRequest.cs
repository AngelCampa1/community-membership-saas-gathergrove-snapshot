using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for updating member profile (Mobile App Story M03)
/// </summary>
public class UpdateMemberProfileRequest
{
    /// <summary>
    /// Member's full name
    /// </summary>
    [Required(ErrorMessage = "Full name is required")]
    [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Member's phone number (optional)
    /// </summary>
    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Member's address (optional)
    /// </summary>
    [StringLength(200, ErrorMessage = "Address cannot exceed 200 characters")]
    public string? Address { get; set; }

    /// <summary>
    /// Legacy field ignored by the API. Messaging consent is no longer used.
    /// </summary>
    public bool HasSmsConsent { get; set; }

    /// <summary>
    /// Custom field values for this member
    /// </summary>
    public List<MemberCustomFieldValueRequest> CustomFieldValues { get; set; } = new List<MemberCustomFieldValueRequest>();
}
