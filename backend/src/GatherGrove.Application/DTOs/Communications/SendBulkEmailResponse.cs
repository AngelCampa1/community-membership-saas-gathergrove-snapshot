namespace GatherGrove.Application.DTOs.Communications;

/// <summary>
/// Response DTO for bulk email sending operation
/// </summary>
public class SendBulkEmailResponse
{
    /// <summary>
    /// Whether the operation was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Message describing the result
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Number of recipients the email was sent to
    /// </summary>
    public int RecipientCount { get; set; }

    /// <summary>
    /// ID of the communications log entry created
    /// </summary>
    public int? CommunicationLogId { get; set; }
}