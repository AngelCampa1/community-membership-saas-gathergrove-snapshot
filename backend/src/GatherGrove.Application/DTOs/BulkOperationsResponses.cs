namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for bulk operation operations
/// </summary>
public class BulkOperationResponse
{
    /// <summary>
    /// Unique identifier for the operation
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Club this operation belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Type of operation
    /// </summary>
    public BulkOperationType OperationType { get; set; }

    /// <summary>
    /// Current status of the operation
    /// </summary>
    public BulkOperationStatus Status { get; set; }

    /// <summary>
    /// Total number of items to process
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// Number of items processed
    /// </summary>
    public int ProcessedItems { get; set; }

    /// <summary>
    /// Number of successful operations
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// Number of failed operations
    /// </summary>
    public int ErrorCount { get; set; }

    /// <summary>
    /// Progress percentage (0-100)
    /// </summary>
    public decimal ProgressPercentage { get; set; }

    /// <summary>
    /// When the operation was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the operation was started
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// When the operation was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Duration of the operation
    /// </summary>
    public TimeSpan? Duration => CompletedAt.HasValue && StartedAt.HasValue ?
        CompletedAt.Value - StartedAt.Value : null;

    /// <summary>
    /// User who created the operation
    /// </summary>
    public string CreatedByUserName { get; set; } = string.Empty;

    /// <summary>
    /// Description of the operation
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Current operation message
    /// </summary>
    public string? StatusMessage { get; set; }

    /// <summary>
    /// Detailed results (if completed)
    /// </summary>
    public BulkOperationResult? Result { get; set; }
}

/// <summary>
/// Result of a completed bulk operation
/// </summary>
public class BulkOperationResult
{
    /// <summary>
    /// Whether the operation completed successfully
    /// </summary>
    public bool IsSuccess { get; set; }

    /// <summary>
    /// Total number of items processed
    /// </summary>
    public int TotalProcessed { get; set; }

    /// <summary>
    /// Number of successful operations
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// Number of failed operations
    /// </summary>
    public int ErrorCount { get; set; }

    /// <summary>
    /// Number of skipped operations
    /// </summary>
    public int SkippedCount { get; set; }

    /// <summary>
    /// List of errors that occurred
    /// </summary>
    public List<BulkOperationError> Errors { get; set; } = new();

    /// <summary>
    /// Summary statistics
    /// </summary>
    public BulkOperationStats Stats { get; set; } = new();

    /// <summary>
    /// Operation-specific result data
    /// </summary>
    public Dictionary<string, object> ResultData { get; set; } = new();

    /// <summary>
    /// Download URL for generated files (exports, reports)
    /// </summary>
    public string? DownloadUrl { get; set; }
}

/// <summary>
/// Progress information for a bulk operation
/// </summary>
public class BulkOperationProgress
{
    /// <summary>
    /// Operation ID
    /// </summary>
    public int OperationId { get; set; }

    /// <summary>
    /// Current status
    /// </summary>
    public BulkOperationStatus Status { get; set; }

    /// <summary>
    /// Progress percentage (0-100)
    /// </summary>
    public decimal ProgressPercentage { get; set; }

    /// <summary>
    /// Current operation message
    /// </summary>
    public string StatusMessage { get; set; } = string.Empty;

    /// <summary>
    /// Number of items processed
    /// </summary>
    public int ProcessedItems { get; set; }

    /// <summary>
    /// Total number of items
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// Estimated time remaining
    /// </summary>
    public TimeSpan? EstimatedTimeRemaining { get; set; }

    /// <summary>
    /// Current processing rate (items per second)
    /// </summary>
    public decimal ProcessingRate { get; set; }
}

/// <summary>
/// Error information for bulk operations
/// </summary>
public class BulkOperationError
{
    /// <summary>
    /// Row or item number where the error occurred
    /// </summary>
    public int ItemNumber { get; set; }

    /// <summary>
    /// Item identifier (member ID, etc.)
    /// </summary>
    public string? ItemId { get; set; }

    /// <summary>
    /// Error message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Error code for categorization
    /// </summary>
    public string? ErrorCode { get; set; }

    /// <summary>
    /// Additional error details
    /// </summary>
    public Dictionary<string, object> Details { get; set; } = new();

    /// <summary>
    /// Severity level
    /// </summary>
    public ErrorSeverity Severity { get; set; } = ErrorSeverity.Error;
}

/// <summary>
/// Statistics for bulk operations
/// </summary>
public class BulkOperationStats
{
    /// <summary>
    /// Total execution time
    /// </summary>
    public TimeSpan ExecutionTime { get; set; }

    /// <summary>
    /// Average processing time per item
    /// </summary>
    public TimeSpan AverageItemTime { get; set; }

    /// <summary>
    /// Peak processing rate (items per second)
    /// </summary>
    public decimal PeakProcessingRate { get; set; }

    /// <summary>
    /// Memory usage statistics
    /// </summary>
    public Dictionary<string, long> MemoryStats { get; set; } = new();

    /// <summary>
    /// Database query statistics
    /// </summary>
    public Dictionary<string, int> QueryStats { get; set; } = new();
}

// BulkOperationStatus and ErrorSeverity enums already exist elsewhere - using existing definitions