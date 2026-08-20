namespace GatherGrove.Application.DTOs.Communications;

/// <summary>
/// Response DTO for communication history entry
/// </summary>
public class CommunicationHistoryResponse
{
    /// <summary>
    /// Unique identifier for the communication
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Type of communication (Email or Push)
    /// </summary>
    public string CommunicationType { get; set; } = string.Empty;

    /// <summary>
    /// Subject of the communication (for emails)
    /// </summary>
    public string? Subject { get; set; }

    /// <summary>
    /// Body/content of the communication
    /// </summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// Number of recipients who received this communication
    /// </summary>
    public int RecipientCount { get; set; }

    /// <summary>
    /// Status of the communication (Sent, Failed, Pending)
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Name of the user who sent this communication
    /// </summary>
    public string SentByUserName { get; set; } = string.Empty;

    /// <summary>
    /// When the communication was sent
    /// </summary>
    public DateTime SentAt { get; set; }

    /// <summary>
    /// When this record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
