namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response DTO for an event RSVP
/// </summary>
public class EventRsvpResponse
{
    /// <summary>
    /// Unique identifier for the RSVP record
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The event this RSVP is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// The member who made this RSVP
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// The full name of the member who made this RSVP
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// The email of the member who made this RSVP
    /// </summary>
    public string MemberEmail { get; set; } = string.Empty;

    /// <summary>
    /// The RSVP status (e.g., "Attending", "NotAttending", "Invited")
    /// </summary>
    public string RsvpStatus { get; set; } = string.Empty;

    /// <summary>
    /// When this RSVP was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this RSVP was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}