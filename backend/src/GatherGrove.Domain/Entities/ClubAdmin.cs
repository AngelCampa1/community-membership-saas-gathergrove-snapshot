namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents the relationship between a user and a club they administer
/// </summary>
public class ClubAdmin
{
    /// <summary>
    /// Unique identifier for the club admin relationship
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the User
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Foreign key to the Club
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// When this admin relationship was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Navigation property to the User
    /// </summary>
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Navigation property to the Club
    /// </summary>
    public virtual Club Club { get; set; } = null!;
}