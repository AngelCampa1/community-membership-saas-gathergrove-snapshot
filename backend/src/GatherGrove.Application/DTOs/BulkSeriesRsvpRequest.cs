using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to register a member for all events in a series
/// </summary>
public class BulkSeriesRsvpRequest
{
    /// <summary>
    /// Member ID performing the registration
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Initial RSVP status (default: Confirmed)
    /// </summary>
    public RsvpStatus Status { get; set; } = RsvpStatus.Confirmed;

    /// <summary>
    /// Optional notes to apply to all RSVPs
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Whether to skip events that are already at capacity
    /// If false, the entire operation fails if any event is full
    /// If true, full events are skipped with no error
    /// </summary>
    public bool SkipFullEvents { get; set; } = true;

    /// <summary>
    /// Whether to allow updates to existing RSVPs
    /// If false, existing RSVPs are skipped
    /// If true, existing RSVPs are updated with new status/notes
    /// </summary>
    public bool UpdateExisting { get; set; } = false;
}
