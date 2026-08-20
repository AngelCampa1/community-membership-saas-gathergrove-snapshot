namespace GatherGrove.Domain.Entities;

/// <summary>
/// Logs all communications sent to club members
/// </summary>
public class CommunicationsLog
{
    /// <summary>
    /// Unique identifier for the communications log entry
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The club this communication belongs to
    /// </summary>
    public int ClubId { get; set; }

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
    /// JSON array of recipient email addresses for audit purposes
    /// </summary>
    public string Recipients { get; set; } = string.Empty;

    /// <summary>
    /// Status of the communication (Sent, Failed, Pending)
    /// </summary>
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// User who sent this communication
    /// </summary>
    public int SentByUserId { get; set; }

    /// <summary>
    /// When the communication was sent
    /// </summary>
    public DateTime SentAt { get; set; }

    /// <summary>
    /// When this record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Email template ID used (if applicable)
    /// </summary>
    public int? TemplateId { get; set; }

    /// <summary>
    /// A/B test campaign ID (if applicable)
    /// </summary>
    public int? ABTestCampaignId { get; set; }

    /// <summary>
    /// Communication workflow ID (if applicable)
    /// </summary>
    public int? WorkflowId { get; set; }

    /// <summary>
    /// Member segment ID for targeted communications (null = all members)
    /// </summary>
    public int? SegmentId { get; set; }

    /// <summary>
    /// When the communication is scheduled to be sent (null = send immediately)
    /// </summary>
    public DateTime? ScheduledFor { get; set; }

    /// <summary>
    /// Navigation property for the club
    /// </summary>
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Navigation property for the user who sent this
    /// </summary>
    public virtual User SentByUser { get; set; } = null!;

    /// <summary>
    /// Navigation property for the email template
    /// </summary>
    public virtual EmailTemplate? Template { get; set; }

    /// <summary>
    /// Navigation property for the A/B test campaign
    /// </summary>
    public virtual ABTestCampaign? ABTestCampaign { get; set; }

    /// <summary>
    /// Navigation property for the communication workflow
    /// </summary>
    public virtual CommunicationWorkflow? Workflow { get; set; }

    /// <summary>
    /// Navigation property for the member segment
    /// </summary>
    public virtual MemberSegment? Segment { get; set; }
}
