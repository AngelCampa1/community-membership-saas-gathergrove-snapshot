namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing activity counts for a member
/// </summary>
public class ActivityCountsResponse
{
    /// <summary>
    /// Number of events attended
    /// </summary>
    public int EventAttendances { get; set; }

    /// <summary>
    /// Number of event RSVPs
    /// </summary>
    public int EventRsvps { get; set; }

    /// <summary>
    /// Number of payments made
    /// </summary>
    public int PaymentsMade { get; set; }

    /// <summary>
    /// Number of chat messages sent
    /// </summary>
    public int ChatMessages { get; set; }
}