using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to update an RSVP status for a member and event
/// </summary>
public class UpdateRsvpRequest
{
    /// <summary>
    /// The RSVP status (e.g., "Attending", "NotAttending", "Invited")
    /// </summary>
    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string RsvpStatus { get; set; } = string.Empty;

    /// <summary>
    /// The RSVP status as an enum value
    /// </summary>
    public RsvpStatus Status { get; set; }
}