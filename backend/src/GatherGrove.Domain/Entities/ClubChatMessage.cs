using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a chat message in a club's group chat
/// </summary>
public class ClubChatMessage
{
    /// <summary>
    /// Primary key for the chat message
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ChatMessageId { get; set; }

    /// <summary>
    /// Foreign key reference to the club this message belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Foreign key reference to the user who sent this message
    /// </summary>
    [Required]
    public int SenderUserId { get; set; }

    /// <summary>
    /// The text content of the chat message
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public string MessageContent { get; set; } = string.Empty;

    /// <summary>
    /// When the message was sent (UTC)
    /// </summary>
    [Required]
    public DateTime SentAt { get; set; }

    // Navigation properties
    /// <summary>
    /// Navigation property to the club this message belongs to
    /// </summary>
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Navigation property to the user who sent this message
    /// </summary>
    public virtual User SenderUser { get; set; } = null!;
}