namespace GatherGrove.Application.DTOs;

/// <summary>
/// Public DTO for event information accessible via payment links
/// Excludes sensitive internal IDs and club-specific details
/// Designed for anonymous/public access scenarios
/// </summary>
public class PublicEventDto
{
    /// <summary>
    /// The name of the event
    /// </summary>
    /// <example>Annual Charity Gala</example>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The date and time when the event takes place
    /// </summary>
    /// <example>2025-12-15T19:00:00Z</example>
    public DateTime EventDateTime { get; set; }

    /// <summary>
    /// The location where the event takes place
    /// </summary>
    /// <example>Grand Ballroom, Downtown Convention Center</example>
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// The description of the event (can contain HTML)
    /// </summary>
    /// <example>&lt;p&gt;Join us for an evening of celebration!&lt;/p&gt;</example>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Price for club members (null if not applicable)
    /// </summary>
    /// <example>50.00</example>
    public decimal? MemberPrice { get; set; }

    /// <summary>
    /// Price for non-members (null if not applicable)
    /// </summary>
    /// <example>75.00</example>
    public decimal? NonMemberPrice { get; set; }

    /// <summary>
    /// Currency for pricing
    /// </summary>
    /// <example>USD</example>
    public string Currency { get; set; } = "USD";

    /// <summary>
    /// Whether this event is free of charge
    /// </summary>
    /// <example>false</example>
    public bool IsFree { get; set; }

    /// <summary>
    /// The name of the club hosting this event
    /// </summary>
    /// <example>Community Garden Club</example>
    public string ClubName { get; set; } = string.Empty;

    /// <summary>
    /// Maximum capacity for the event (null if unlimited)
    /// </summary>
    /// <example>150</example>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// Early bird discount price (if applicable)
    /// </summary>
    /// <example>40.00</example>
    public decimal? EarlyBirdPrice { get; set; }

    /// <summary>
    /// Early bird deadline (if applicable)
    /// </summary>
    /// <example>2025-11-30T23:59:59Z</example>
    public DateTime? EarlyBirdDeadline { get; set; }

    /// <summary>
    /// Whether early bird pricing is currently active
    /// </summary>
    /// <example>true</example>
    public bool IsEarlyBirdActive { get; set; }
}