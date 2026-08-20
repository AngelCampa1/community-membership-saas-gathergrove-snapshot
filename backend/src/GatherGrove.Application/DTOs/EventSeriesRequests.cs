using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to create a new event series
/// </summary>
public class CreateEventSeriesRequest
{
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
    [Required]
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
    [Required]
    public EventTemplate EventTemplate { get; set; } = new();
}

/// <summary>
/// Request to update an existing event series
/// </summary>
public class UpdateEventSeriesRequest
{
    /// <summary>
    /// The name of the event series
    /// </summary>
    [MaxLength(200)]
    public string? Name { get; set; }

    /// <summary>
    /// The description of the event series
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Whether this series is currently active
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// End date for the series
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Maximum number of events to generate
    /// </summary>
    public int? MaxEvents { get; set; }
}

/// <summary>
/// Response containing event series information
/// </summary>
public class EventSeriesResponse
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
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The description of the event series
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Recurrence pattern
    /// </summary>
    public string RecurrencePattern { get; set; } = string.Empty;

    /// <summary>
    /// Interval for recurrence
    /// </summary>
    public int RecurrenceInterval { get; set; }

    /// <summary>
    /// Days of the week for recurring events
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
    /// Maximum number of events to generate
    /// </summary>
    public int? MaxEvents { get; set; }

    /// <summary>
    /// Template for individual events in the series
    /// </summary>
    public EventTemplate EventTemplate { get; set; } = new();

    /// <summary>
    /// Whether this series is currently active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Number of events generated from this series
    /// </summary>
    public int GeneratedEventsCount { get; set; }

    /// <summary>
    /// When this event series was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this event series was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}