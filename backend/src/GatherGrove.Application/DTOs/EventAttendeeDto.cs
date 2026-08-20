namespace GatherGrove.Application.DTOs;

/// <summary>
/// DTO representing an event attendee with check-in status
/// Used by mobile app to display attendee list and manage check-ins
/// </summary>
public class EventAttendeeDto
{
    /// <summary>
    /// Unique identifier for the RSVP/attendance record
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Member ID of the attendee
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Full name of the member
    /// </summary>
    public required string MemberName { get; set; }

    /// <summary>
    /// Email address of the member
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// Whether the attendee has checked in to the event
    /// </summary>
    public bool CheckedIn { get; set; }

    /// <summary>
    /// Timestamp when the attendee checked in (if checked in)
    /// </summary>
    public DateTime? CheckInTime { get; set; }

    /// <summary>
    /// When the attendee registered/RSVP'd for the event
    /// </summary>
    public DateTime? RegistrationDate { get; set; }

    /// <summary>
    /// Number of guests the attendee is bringing
    /// </summary>
    public int? GuestCount { get; set; }

    /// <summary>
    /// RSVP status (Attending, Maybe, NotAttending)
    /// </summary>
    public string? RsvpStatus { get; set; }
}

/// <summary>
/// Request DTO for checking in an attendee via mobile app
/// </summary>
public class CheckInAttendeeRequest
{
    /// <summary>
    /// ID of the member to check in
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Optional location where check-in occurred
    /// </summary>
    public string? Location { get; set; }
}
