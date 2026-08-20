using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for updating member information
/// </summary>
public class UpdateMemberRequest
{
    /// <summary>
    /// Member's full name
    /// </summary>
    [Required(ErrorMessage = "Full name is required")]
    [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Member's email address
    /// </summary>
    [Required(ErrorMessage = "Email address is required")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Member's phone number (optional)
    /// </summary>
    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Member's address (optional)
    /// </summary>
    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
    public string? Address { get; set; }

    /// <summary>
    /// The membership type for this member
    /// </summary>
    [Required(ErrorMessage = "Membership type is required")]
    public int MembershipTypeId { get; set; }

    /// <summary>
    /// Legacy field ignored by the API. Messaging consent is no longer used.
    /// </summary>
    public bool HasSmsConsent { get; set; } = false;

    /// <summary>
    /// Custom field values for this member
    /// </summary>
    public List<MemberCustomFieldValueRequest> CustomFieldValues { get; set; } = new List<MemberCustomFieldValueRequest>();
}
