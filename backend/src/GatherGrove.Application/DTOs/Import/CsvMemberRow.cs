using CsvHelper.Configuration.Attributes;

namespace GatherGrove.Application.DTOs.Import;

/// <summary>
/// Represents a member row from CSV import
/// </summary>
public class CsvMemberRow
{
    [Name("FullName")]
    public string FullName { get; set; } = string.Empty;

    [Name("Email")]
    public string Email { get; set; } = string.Empty;

    [Name("PhoneNumber")]
    public string? PhoneNumber { get; set; }

    [Name("MembershipType")]
    public string MembershipType { get; set; } = string.Empty;

    [Name("Address")]
    public string? Address { get; set; }

    [Name("HasSmsConsent")]
    public string? HasSmsConsent { get; set; }

    [Name("JoinDate")]
    public string? JoinDate { get; set; }

    // Custom fields will be handled separately as they're dynamic
    public Dictionary<string, string> CustomFields { get; set; } = new();

    // Helper property to track row number for error reporting
    public int RowNumber { get; set; }
}