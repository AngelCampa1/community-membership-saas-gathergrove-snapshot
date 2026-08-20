namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for lead capture
/// </summary>
public class CaptureLeadResponse
{
    /// <summary>
    /// Whether the lead was captured successfully
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Message to display to the user
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Optional lead ID for tracking
    /// </summary>
    public string? LeadId { get; set; }
}