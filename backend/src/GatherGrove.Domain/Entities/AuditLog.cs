namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents an audit trail entry for data access and export operations
/// </summary>
public class AuditLog
{
    /// <summary>
    /// Unique identifier for the audit log entry
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ID of the user who performed the action
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ID of the club associated with the action
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Type of action performed (e.g., "Export", "View", "Delete")
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Type of resource accessed (e.g., "MemberData", "FinancialData")
    /// </summary>
    public string ResourceType { get; set; } = string.Empty;

    /// <summary>
    /// ID of the specific resource accessed (if applicable)
    /// </summary>
    public int? ResourceId { get; set; }

    /// <summary>
    /// Additional details about the action
    /// </summary>
    public string? Details { get; set; }

    /// <summary>
    /// IP address from which the action was performed
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent string of the client
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// When the action was performed
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Navigation property to the user who performed the action
    /// </summary>
    public virtual Member User { get; set; } = null!;

    /// <summary>
    /// Navigation property to the club
    /// </summary>
    public virtual Club Club { get; set; } = null!;
}