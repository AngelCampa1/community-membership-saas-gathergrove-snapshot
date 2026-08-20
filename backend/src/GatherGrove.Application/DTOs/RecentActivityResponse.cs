using System;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing recent activity information
/// </summary>
public class RecentActivityResponse
{
    /// <summary>
    /// Type of activity
    /// </summary>
    public string ActivityType { get; set; } = string.Empty;

    /// <summary>
    /// Date of the activity
    /// </summary>
    public DateTime ActivityDate { get; set; }

    /// <summary>
    /// Description of the activity
    /// </summary>
    public string Description { get; set; } = string.Empty;
}