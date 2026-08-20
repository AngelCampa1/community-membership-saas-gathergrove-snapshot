using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Chat;

/// <summary>
/// Request DTO for sending a chat message
/// </summary>
public class SendMessageRequest
{
    /// <summary>
    /// The text content of the message to send
    /// </summary>
    [Required(ErrorMessage = "Message content is required")]
    [StringLength(1000, ErrorMessage = "Message content cannot exceed 1000 characters")]
    [MinLength(1, ErrorMessage = "Message content cannot be empty")]
    public string MessageContent { get; set; } = string.Empty;
}