namespace GatherGrove.Domain.Entities;

/// <summary>
/// Tracks monthly email usage per club for tier-based limitations
/// </summary>
public class ClubEmailUsage
{
    /// <summary>
    /// Unique identifier for the email usage record
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The club this usage record belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// The month and year this usage record tracks (first day of month)
    /// </summary>
    public DateTime UsageMonth { get; set; }

    /// <summary>
    /// Number of admin communication emails sent in this month (excludes system emails)
    /// </summary>
    public int AdminEmailsSentCount { get; set; }

    /// <summary>
    /// When this record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this record was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the club
    /// </summary>
    public virtual Club Club { get; set; } = null!;
}