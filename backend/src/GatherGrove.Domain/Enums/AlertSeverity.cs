namespace GatherGrove.Domain.Enums;

/// <summary>
/// Severity levels for engagement alerts
/// </summary>
public enum AlertSeverity
{
    /// <summary>
    /// Low priority alert
    /// </summary>
    Low = 1,

    /// <summary>
    /// Medium priority alert
    /// </summary>
    Medium = 2,

    /// <summary>
    /// High priority alert
    /// </summary>
    High = 3,

    /// <summary>
    /// Critical priority alert requiring immediate attention
    /// </summary>
    Critical = 4
}