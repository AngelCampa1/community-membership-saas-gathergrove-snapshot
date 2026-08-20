namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents an event in a club
/// </summary>
public class Event
{
    /// <summary>
    /// Unique identifier for the event
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The club this event belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// The location this event belongs to (nullable for backward compatibility)
    /// </summary>
    public int? LocationId { get; set; }

    /// <summary>
    /// The name of the event
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The date and time when the event takes place
    /// </summary>
    public DateTime EventDateTime { get; set; }

    /// <summary>
    /// The location where the event takes place
    /// </summary>
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// The description of the event (can contain HTML)
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Maximum number of attendees (null for unlimited)
    /// </summary>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// The title of the event (alias for Name)
    /// </summary>
    public string Title
    {
        get => Name;
        set => Name = value;
    }

    /// <summary>
    /// Base price for the event (null for free events) - LEGACY: Use MemberPrice/NonMemberPrice instead
    /// </summary>
    public decimal? Price { get; set; }

    /// <summary>
    /// Price for club members (null for no specific member pricing, 0.00 for free)
    /// </summary>
    public decimal? MemberPrice { get; set; }

    /// <summary>
    /// Price for non-members (null for no specific non-member pricing, 0.00 for free)
    /// </summary>
    public decimal? NonMemberPrice { get; set; }

    /// <summary>
    /// Currency for pricing (default USD)
    /// </summary>
    public string Currency { get; set; } = "USD";

    /// <summary>
    /// Whether this is a paid event - computed property
    /// </summary>
    public bool IsPaid => (MemberPrice ?? 0) > 0 || (NonMemberPrice ?? 0) > 0;

    /// <summary>
    /// Whether this event is free for everyone
    /// </summary>
    public bool IsFree => (MemberPrice ?? 0) == 0 && (NonMemberPrice ?? 0) == 0;

    /// <summary>
    /// Early bird discount price
    /// </summary>
    public decimal? EarlyBirdPrice { get; set; }

    /// <summary>
    /// Early bird deadline
    /// </summary>
    public DateTime? EarlyBirdDeadline { get; set; }

    /// <summary>
    /// Whether early bird pricing is currently active
    /// </summary>
    public bool IsEarlyBirdActive
    {
        get
        {
            if (!EarlyBirdDeadline.HasValue || !EarlyBirdPrice.HasValue)
                return false;

            return DateTime.UtcNow <= EarlyBirdDeadline.Value;
        }
    }

    /// <summary>
    /// Minimum number of registrations for group discount
    /// </summary>
    public int? GroupDiscountThreshold { get; set; }

    /// <summary>
    /// Group discount percentage (0-100)
    /// </summary>
    public decimal? GroupDiscountPercentage { get; set; }

    /// <summary>
    /// The date of the event (alias for EventDateTime)
    /// </summary>
    public DateTime Date
    {
        get => EventDateTime;
        set => EventDateTime = value;
    }

    /// <summary>
    /// The capacity of the event (alias for MaxCapacity with default value handling)
    /// </summary>
    public int Capacity
    {
        get => MaxCapacity ?? 0;
        set => MaxCapacity = value == 0 ? null : value;
    }

    /// <summary>
    /// Whether this event is featured/highlighted
    /// </summary>
    public bool IsFeatured { get; set; }

    /// <summary>
    /// When this event record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this event record was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Unique payment token for shareable payment links (nullable for backwards compatibility)
    /// Generated automatically when event is created with pricing
    /// </summary>
    public string? PaymentToken { get; set; }

    /// <summary>
    /// Foreign key to the event series this event belongs to (if generated from a series)
    /// </summary>
    public int? EventSeriesId { get; set; }

    /// <summary>
    /// Navigation property for the club this event belongs to
    /// </summary>
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Navigation property for the club location this event belongs to
    /// </summary>
    public virtual ClubLocation? ClubLocation { get; set; }

    /// <summary>
    /// Navigation property for the event series this event belongs to
    /// </summary>
    public virtual EventSeries? EventSeries { get; set; }

    /// <summary>
    /// Navigation property for event RSVPs
    /// </summary>
    public virtual ICollection<EventRsvp> EventRsvps { get; set; } = new List<EventRsvp>();

    /// <summary>
    /// Navigation property for event attendances
    /// </summary>
    public virtual ICollection<EventAttendance> EventAttendances { get; set; } = new List<EventAttendance>();
}