namespace GatherGrove.Domain.Entities;

/// <summary>
/// Tracks member import operations for audit purposes
/// </summary>
public class MemberImport
{
    public Guid ImportId { get; set; } = Guid.NewGuid();
    public int ClubId { get; set; }
    public int UserId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public int TotalRows { get; set; }
    public int SuccessfulRows { get; set; }
    public int FailedRows { get; set; }
    public string Status { get; set; } = string.Empty; // 'InProgress', 'Completed', 'Failed'
    public string? ErrorReport { get; set; } // JSON with detailed errors
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public Club Club { get; set; } = null!;
    public User User { get; set; } = null!;
}