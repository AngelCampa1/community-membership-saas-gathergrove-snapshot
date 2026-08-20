namespace GatherGrove.Application.DTOs;

/// <summary>
/// Result of account deletion operation
/// </summary>
public class AccountDeletionResult
{
    /// <summary>
    /// Whether the deletion was successful
    /// </summary>
    public bool IsSuccess { get; set; }

    /// <summary>
    /// Status of the deletion process
    /// </summary>
    public AccountDeletionStatus Status { get; set; }

    /// <summary>
    /// Error message if deletion failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Data export information if available
    /// </summary>
    public DataExportInfo? DataExport { get; set; }

    /// <summary>
    /// Timestamp when deletion was completed
    /// </summary>
    public DateTime? DeletionCompletedAt { get; set; }

    /// <summary>
    /// Deletion request ID for tracking
    /// </summary>
    public int? DeletionRequestId { get; set; }
}

/// <summary>
/// Account deletion status
/// </summary>
public enum AccountDeletionStatus
{
    Pending,
    InProgress,
    Completed,
    Failed,
    RequiresManualReview
}

/// <summary>
/// Information about exported data
/// </summary>
public class DataExportInfo
{
    public string DownloadUrl { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string Format { get; set; } = string.Empty;
}