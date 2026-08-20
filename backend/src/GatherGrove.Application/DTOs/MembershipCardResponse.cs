namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for digital membership card data
/// </summary>
public class MembershipCardResponse
{
    /// <summary>
    /// Member's full name
    /// </summary>
    /// <example>David Lee</example>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Name of the membership type
    /// </summary>
    /// <example>Individual</example>
    public string MembershipTypeName { get; set; } = string.Empty;

    /// <summary>
    /// Date when membership expires (ISO 8601 format)
    /// </summary>
    /// <example>2026-05-28T00:00:00Z</example>
    public string MembershipExpiresAt { get; set; } = string.Empty;

    /// <summary>
    /// QR code data containing encoded membership information
    /// </summary>
    /// <example>GATHERGROVE_MEMBER_ID_123_EXP_20260528</example>
    public string QrCodeData { get; set; } = string.Empty;
}