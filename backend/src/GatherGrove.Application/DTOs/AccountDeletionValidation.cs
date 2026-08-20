namespace GatherGrove.Application.DTOs;

/// <summary>
/// Result of account deletion validation
/// </summary>
public class AccountDeletionValidation
{
    /// <summary>
    /// Whether the account can be deleted
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// List of validation errors preventing deletion
    /// </summary>
    public List<string> ValidationErrors { get; set; } = new();

    /// <summary>
    /// List of requirements that must be met before deletion
    /// </summary>
    public List<string> Requirements { get; set; } = new();

    /// <summary>
    /// Whether the deletion requires manual admin review
    /// </summary>
    public bool RequiresManualReview { get; set; }

    /// <summary>
    /// Estimated time for deletion process completion
    /// </summary>
    public TimeSpan EstimatedDeletionTime { get; set; }
}