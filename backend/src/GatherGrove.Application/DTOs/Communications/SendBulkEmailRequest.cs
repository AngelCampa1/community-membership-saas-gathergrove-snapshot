using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Communications;

/// <summary>
/// Request DTO for sending bulk email to club members
/// </summary>
public class SendBulkEmailRequest
{
    /// <summary>
    /// Email subject line
    /// </summary>
    [Required(ErrorMessage = "Subject is required")]
    [StringLength(500, ErrorMessage = "Subject cannot exceed 500 characters")]
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// Email body content (can include HTML)
    /// </summary>
    [Required(ErrorMessage = "Body is required")]
    [StringLength(10000, ErrorMessage = "Body cannot exceed 10,000 characters")]
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// Optional list of membership type IDs to target. If null or empty, sends to all active members.
    /// </summary>
    public List<int>? MemberTypeIds { get; set; }
}