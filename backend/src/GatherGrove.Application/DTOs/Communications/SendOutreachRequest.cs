using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Communications;

/// <summary>
/// Request DTO for sending unified outreach (email or notification)
/// </summary>
public class SendOutreachRequest
{
    /// <summary>
    /// List of member IDs to send outreach to
    /// </summary>
    [Required(ErrorMessage = "Selected members list is required")]
    [MinLength(1, ErrorMessage = "At least one member must be selected")]
    public List<int> SelectedMemberIds { get; set; } = new();

    /// <summary>
    /// Subject of the outreach (for email type)
    /// </summary>
    [StringLength(200, ErrorMessage = "Subject cannot exceed 200 characters")]
    public string? Subject { get; set; }

    /// <summary>
    /// Message content
    /// </summary>
    [Required(ErrorMessage = "Message is required")]
    [StringLength(10000, ErrorMessage = "Message cannot exceed 10,000 characters")]
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Type of outreach: email or notification
    /// </summary>
    [Required(ErrorMessage = "Outreach type is required")]
    [RegularExpression("^(email|notification)$", ErrorMessage = "Type must be 'email' or 'notification'")]
    public string Type { get; set; } = "email";
}
