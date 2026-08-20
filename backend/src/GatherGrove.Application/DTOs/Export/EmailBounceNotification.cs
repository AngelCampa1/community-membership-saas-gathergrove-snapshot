namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Notification for email bounce events
/// </summary>
public class EmailBounceNotification
{
    public string MessageId { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public string BounceType { get; set; } = string.Empty;
    public string BounceReason { get; set; } = string.Empty;
    public DateTime BouncedAt { get; set; }
    public string? OriginalSubject { get; set; }
    public string? DiagnosticCode { get; set; }
    public bool IsPermanent { get; set; }
}