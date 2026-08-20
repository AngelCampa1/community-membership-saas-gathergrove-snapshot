using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a security event in the system
/// </summary>
public class SecurityEvent
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Type of security event
    /// </summary>
    public SecurityEventType EventType { get; set; }

    /// <summary>
    /// Severity level of the security event
    /// </summary>
    public SecurityEventSeverity Severity { get; set; }

    /// <summary>
    /// User ID associated with the security event (if applicable)
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// Club ID associated with the security event (if applicable)
    /// </summary>
    public int? ClubId { get; set; }

    /// <summary>
    /// IP address where the event originated
    /// </summary>
    public string IPAddress { get; set; } = string.Empty;

    /// <summary>
    /// Description of the security event
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Additional data related to the security event
    /// </summary>
    public Dictionary<string, string> AdditionalData { get; set; } = new();

    /// <summary>
    /// When the security event occurred
    /// </summary>
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Whether this event has been investigated
    /// </summary>
    public bool IsInvestigated { get; set; }

    /// <summary>
    /// Resolution notes for the security event
    /// </summary>
    public string? ResolutionNotes { get; set; }

    /// <summary>
    /// When the event was resolved (if applicable)
    /// </summary>
    public DateTime? ResolvedAt { get; set; }
}

