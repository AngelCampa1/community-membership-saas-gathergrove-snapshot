using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to send invitations for an event
/// </summary>
public class SendEventInvitationsRequest
{
    /// <summary>
    /// The invitation methods to use (email, push, etc.)
    /// </summary>
    [Required]
    public List<string> Methods { get; set; } = new();

    /// <summary>
    /// Optional list of specific member IDs to invite.
    /// If not provided, invitations will be sent to all club members.
    /// </summary>
    public List<int>? MemberIds { get; set; }
}