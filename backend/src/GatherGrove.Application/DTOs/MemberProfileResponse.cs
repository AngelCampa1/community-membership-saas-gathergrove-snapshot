namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response DTO for member profile operations (Mobile App Story M02)
/// </summary>
public class MemberProfileResponse
{
    /// <summary>
    /// Member ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Club ID
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Club name
    /// </summary>
    public string ClubName { get; set; } = string.Empty;

    /// <summary>
    /// Membership type ID
    /// </summary>
    public int MembershipTypeId { get; set; }

    /// <summary>
    /// Membership type name
    /// </summary>
    public string MembershipTypeName { get; set; } = string.Empty;

    /// <summary>
    /// Member's full name
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Member's email address
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Member's phone number (optional)
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Member's address (optional)
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// Member status (Active, Inactive, etc.)
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Date the member joined
    /// </summary>
    public DateTime JoinDate { get; set; }

    /// <summary>
    /// Date until which dues are paid (optional)
    /// </summary>
    public DateTime? DuesPaidUntil { get; set; }

    /// <summary>
    /// Legacy SMS consent flag retained for compatibility. New writes keep this false.
    /// </summary>
    public bool HasSmsConsent { get; set; }

    /// <summary>
    /// When this member record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this member record was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Custom field values for this member
    /// </summary>
    public List<MemberCustomFieldValueResponse> CustomFieldValues { get; set; } = new List<MemberCustomFieldValueResponse>();
}
