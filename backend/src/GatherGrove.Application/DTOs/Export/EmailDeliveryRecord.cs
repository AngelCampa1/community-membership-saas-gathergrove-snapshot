namespace GatherGrove.Application.DTOs.Export;

public class EmailDeliveryRecord
{
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Unique delivery identifier for tracking purposes
    /// </summary>
    public Guid DeliveryId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Club identifier associated with this email delivery
    /// </summary>
    public Guid ClubId { get; set; }
    public string Recipient { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string EmailType { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public EmailDeliveryStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public int AttachmentCount { get; set; }
    public DateTime? DeliveredAt { get; set; }

    /// <summary>
    /// Message identifier for email tracking purposes
    /// </summary>
    public string MessageId { get; set; } = string.Empty;

    /// <summary>
    /// Number of recipients for this email delivery
    /// </summary>
    public int RecipientCount { get; set; } = 1;
}

public enum EmailDeliveryStatus
{
    Pending,
    Sent,
    Delivered,
    Failed,
    Bounced
}