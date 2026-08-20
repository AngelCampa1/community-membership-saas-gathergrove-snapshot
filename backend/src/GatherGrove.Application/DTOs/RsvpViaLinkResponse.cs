namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for RSVP via email link submission
/// </summary>
public class RsvpViaLinkResponse
{
    /// <summary>
    /// Whether the RSVP was processed successfully
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Success or error message to display to the user
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// The member's name who made the RSVP
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// The event name the RSVP was for
    /// </summary>
    public string EventName { get; set; } = string.Empty;

    /// <summary>
    /// The RSVP status that was recorded (e.g., "Attending", "NotAttending")
    /// </summary>
    public string RsvpStatus { get; set; } = string.Empty;
}