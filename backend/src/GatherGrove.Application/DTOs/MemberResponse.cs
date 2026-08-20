namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for member operations
/// </summary>
public class MemberResponse
{
    /// <summary>
    /// Unique identifier for the member
    /// </summary>
    /// <example>1</example>
    public int Id { get; set; }

    /// <summary>
    /// The club this member belongs to
    /// </summary>
    /// <example>1</example>
    public int ClubId { get; set; }

    /// <summary>
    /// The membership type for this member
    /// </summary>
    /// <example>1</example>
    public int MembershipTypeId { get; set; }

    /// <summary>
    /// Name of the membership type
    /// </summary>
    /// <example>Individual</example>
    public string MembershipTypeName { get; set; } = string.Empty;

    /// <summary>
    /// Member's full name
    /// </summary>
    /// <example>John Smith</example>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Member's email address
    /// </summary>
    /// <example>john.smith@example.com</example>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Member's phone number
    /// </summary>
    /// <example>(555) 123-4567</example>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Member's address
    /// </summary>
    /// <example>123 Main St, Anytown, ST 12345</example>
    public string? Address { get; set; }

    /// <summary>
    /// Current status of the member
    /// </summary>
    /// <example>Active</example>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Date when the member joined the club
    /// </summary>
    /// <example>2024-01-15T00:00:00Z</example>
    public DateTime JoinDate { get; set; }

    /// <summary>
    /// Date until which the member's dues are paid
    /// </summary>
    /// <example>2024-02-15T00:00:00Z</example>
    public DateTime? DuesPaidUntil { get; set; }

    /// <summary>
    /// Legacy SMS consent flag retained for compatibility. New writes keep this false.
    /// </summary>
    /// <example>true</example>
    public bool HasSmsConsent { get; set; }

    /// <summary>
    /// When this member record was created
    /// </summary>
    /// <example>2024-01-15T10:30:00Z</example>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this member record was last updated
    /// </summary>
    /// <example>2024-01-15T10:30:00Z</example>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Custom field values for this member
    /// </summary>
    public List<MemberCustomFieldValueResponse> CustomFieldValues { get; set; } = new List<MemberCustomFieldValueResponse>();

    /// <summary>
    /// Total amount paid towards current dues period
    /// </summary>
    public decimal TotalPaidCurrentPeriod { get; set; }

    /// <summary>
    /// Expected dues amount for the current period
    /// </summary>
    public decimal ExpectedDuesAmount { get; set; }

    /// <summary>
    /// Outstanding balance for current dues period (null if fully paid or overpaid)
    /// </summary>
    public decimal? OutstandingBalance { get; set; }

    /// <summary>
    /// Whether member has made partial payments towards current dues
    /// </summary>
    public bool HasPartialPayments { get; set; }

    /// <summary>
    /// Frequency of dues payment for the membership type
    /// </summary>
    public string DuesFrequency { get; set; } = string.Empty;
}
