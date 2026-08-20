namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for event data
/// </summary>
public class EventResponse
{
    /// <summary>
    /// Unique identifier for the event
    /// </summary>
    /// <example>1</example>
    public int Id { get; set; }

    /// <summary>
    /// The club this event belongs to
    /// </summary>
    /// <example>1</example>
    public int ClubId { get; set; }

    /// <summary>
    /// The name of the event
    /// </summary>
    /// <example>Annual Plant Sale</example>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The date and time when the event takes place
    /// </summary>
    /// <example>2025-07-15T10:00:00</example>
    public DateTime EventDateTime { get; set; }

    /// <summary>
    /// The location where the event takes place
    /// </summary>
    /// <example>Town Hall Park</example>
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// The description of the event (can contain HTML)
    /// </summary>
    /// <example>&lt;p&gt;Our biggest sale of the year!&lt;/p&gt;</example>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// When this event record was created
    /// </summary>
    /// <example>2025-01-31T10:00:00Z</example>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this event record was last updated
    /// </summary>
    /// <example>2025-01-31T15:30:00Z</example>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// List of RSVPs for this event (only included when viewing event details)
    /// </summary>
    public List<EventRsvpResponse>? Rsvps { get; set; }

    /// <summary>
    /// Count of members who have RSVP'd as attending
    /// </summary>
    /// <example>12</example>
    public int AttendeeCount { get; set; }

    /// <summary>
    /// Total count of all RSVPs for this event
    /// </summary>
    /// <example>15</example>
    public int TotalRsvpCount { get; set; }

    /// <summary>
    /// Price for club members (null if no specific member pricing)
    /// </summary>
    /// <example>15.99</example>
    public decimal? MemberPrice { get; set; }

    /// <summary>
    /// Price for non-members (null if no specific non-member pricing)
    /// </summary>
    /// <example>25.99</example>
    public decimal? NonMemberPrice { get; set; }

    /// <summary>
    /// Indicates if the event is free of charge
    /// </summary>
    /// <example>false</example>
    public bool IsFree { get; set; }

    /// <summary>
    /// Indicates if the event is paid (requires payment)
    /// </summary>
    /// <example>true</example>
    public bool IsPaid { get; set; }

    /// <summary>
    /// The price of the event (generic price field) - nullable for free events
    /// </summary>
    /// <example>19.99</example>
    public decimal? Price { get; set; }
}