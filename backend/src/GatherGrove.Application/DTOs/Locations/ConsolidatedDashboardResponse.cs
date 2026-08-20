namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Response containing consolidated dashboard data for all locations
/// </summary>
public class ConsolidatedDashboardResponse
{
    /// <summary>
    /// Club ID
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Club name
    /// </summary>
    public string ClubName { get; set; } = string.Empty;

    /// <summary>
    /// Dashboard data for each location
    /// </summary>
    public List<LocationDashboardSummary> Locations { get; set; } = new();

    /// <summary>
    /// Total members across all locations
    /// </summary>
    public int TotalMembers { get; set; }

    /// <summary>
    /// Total events across all locations
    /// </summary>
    public int TotalEvents { get; set; }

    /// <summary>
    /// Total active locations
    /// </summary>
    public int TotalActiveLocations { get; set; }
}

/// <summary>
/// Summary data for a single location
/// </summary>
public class LocationDashboardSummary
{
    /// <summary>
    /// Location ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Location name
    /// </summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>
    /// Location code
    /// </summary>
    public string LocationCode { get; set; } = string.Empty;

    /// <summary>
    /// Number of active members
    /// </summary>
    public int ActiveMembers { get; set; }

    /// <summary>
    /// Number of upcoming events
    /// </summary>
    public int UpcomingEvents { get; set; }

    /// <summary>
    /// Whether location is active
    /// </summary>
    public bool IsActive { get; set; }
}

