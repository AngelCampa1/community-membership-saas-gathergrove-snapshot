using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a series of related events with recurring patterns
/// </summary>
public class EventSeries
{
    /// <summary>
    /// Unique identifier for the event series
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The club this event series belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// The name of the event series
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The description of the event series
    /// </summary>
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Recurrence pattern (Daily, Weekly, Monthly, Custom)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string RecurrencePattern { get; set; } = string.Empty;

    /// <summary>
    /// Interval for recurrence (e.g., every 2 weeks)
    /// </summary>
    public int RecurrenceInterval { get; set; } = 1;

    /// <summary>
    /// Days of the week for recurring events (for weekly patterns)
    /// </summary>
    public DayOfWeek[]? DaysOfWeek { get; set; }

    /// <summary>
    /// Start date for the series
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// End date for the series
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Maximum number of events to generate (alternative to end date)
    /// </summary>
    public int? MaxEvents { get; set; }

    /// <summary>
    /// Template for individual events in the series
    /// </summary>
    public EventTemplate EventTemplate { get; set; } = new();

    /// <summary>
    /// Whether this series is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether this series has been deleted
    /// </summary>
    public bool IsDeleted { get; set; } = false;

    /// <summary>
    /// When this event series was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this event series was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the club this series belongs to
    /// </summary>
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Navigation property for events generated from this series
    /// </summary>
    public virtual ICollection<Event> GeneratedEvents { get; set; } = new List<Event>();
}

/// <summary>
/// Template for events within a series
/// </summary>
public class EventTemplate
{
    /// <summary>
    /// Template name pattern (can include {SeriesNumber}, {Date} placeholders)
    /// </summary>
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Template location
    /// </summary>
    [MaxLength(500)]
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// Template description
    /// </summary>
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Duration of each event
    /// </summary>
    public TimeSpan Duration { get; set; }

    /// <summary>
    /// Maximum capacity for each event
    /// </summary>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// Time of day for events
    /// </summary>
    public TimeOnly EventTime { get; set; }
}