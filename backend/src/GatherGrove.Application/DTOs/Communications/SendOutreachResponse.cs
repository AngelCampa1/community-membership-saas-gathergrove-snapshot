namespace GatherGrove.Application.DTOs.Communications;

/// <summary>
/// Response DTO for outreach operations
/// </summary>
public class SendOutreachResponse
{
    /// <summary>
    /// Whether the outreach was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Number of recipients the outreach was sent to
    /// </summary>
    public int SentCount { get; set; }

    /// <summary>
    /// Optional message with details
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// ID of the communication log entry
    /// </summary>
    public int? CommunicationLogId { get; set; }

    /// <summary>
    /// List of any errors that occurred
    /// </summary>
    public List<string> Errors { get; set; } = new();
}
