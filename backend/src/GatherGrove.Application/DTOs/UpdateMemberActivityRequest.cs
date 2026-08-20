using System;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to update member activity for engagement tracking
/// </summary>
public class UpdateMemberActivityRequest
{
    /// <summary>
    /// Type of activity performed (e.g., "login", "event_participation", "message_sent")
    /// </summary>
    public string ActivityType { get; set; } = string.Empty;

    /// <summary>
    /// Date when the activity occurred
    /// </summary>
    public DateTime ActivityDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Additional metadata about the activity
    /// </summary>
    public object? Metadata { get; set; }
}