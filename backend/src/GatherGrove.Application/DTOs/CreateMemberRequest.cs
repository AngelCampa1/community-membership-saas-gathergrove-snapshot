using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for creating a new member
/// </summary>
public class CreateMemberRequest
{
    /// <summary>
    /// The membership type ID for this member
    /// </summary>
    /// <example>1</example>
    [Required(ErrorMessage = "Membership type is required")]
    public int MembershipTypeId { get; set; }

    /// <summary>
    /// Member's full name
    /// </summary>
    /// <example>John Smith</example>
    [Required(ErrorMessage = "Full name is required")]
    [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Member's email address
    /// </summary>
    /// <example>john.smith@example.com</example>
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Please provide a valid email address")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Member's phone number (optional)
    /// </summary>
    /// <example>(555) 123-4567</example>
    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Member's address (optional)
    /// </summary>
    /// <example>123 Main St, Anytown, ST 12345</example>
    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
    public string? Address { get; set; }

    /// <summary>
    /// Date when the member joined the club (defaults to today if not provided)
    /// </summary>
    /// <example>2024-01-15</example>
    public DateTime? JoinDate { get; set; }

    /// <summary>
    /// Legacy field ignored by the API. Messaging consent is no longer used.
    /// </summary>
    /// <example>false</example>
    public bool HasSmsConsent { get; set; } = false;

    /// <summary>
    /// Custom field values for this member
    /// </summary>
    public List<MemberCustomFieldValueRequest> CustomFieldValues { get; set; } = new List<MemberCustomFieldValueRequest>();
}
