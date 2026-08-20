namespace GatherGrove.Application.DTOs;

/// <summary>
/// Result of segment recalculation operation
/// </summary>
public class SegmentRecalculationResult
{
    /// <summary>
    /// Recalculation operation identifier
    /// </summary>
    public string OperationId { get; set; } = string.Empty;

    /// <summary>
    /// Club identifier
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Segment identifier (null if recalculating all segments)
    /// </summary>
    public int? SegmentId { get; set; }

    /// <summary>
    /// Segment name (if specific segment)
    /// </summary>
    public string? SegmentName { get; set; }

    /// <summary>
    /// Recalculation status
    /// </summary>
    public RecalculationStatus Status { get; set; }

    /// <summary>
    /// Overall success indicator
    /// </summary>
    public bool IsSuccessful { get; set; }

    /// <summary>
    /// Progress percentage (0-100)
    /// </summary>
    public int ProgressPercentage { get; set; }

    /// <summary>
    /// Current processing stage
    /// </summary>
    public string CurrentStage { get; set; } = string.Empty;

    /// <summary>
    /// Total number of segments being recalculated
    /// </summary>
    public int TotalSegments { get; set; }

    /// <summary>
    /// Number of segments completed
    /// </summary>
    public int CompletedSegments { get; set; }

    /// <summary>
    /// Number of segments that failed
    /// </summary>
    public int FailedSegments { get; set; }

    /// <summary>
    /// Total members processed
    /// </summary>
    public int MembersProcessed { get; set; }

    /// <summary>
    /// Members moved between segments
    /// </summary>
    public int MembersMoved { get; set; }

    /// <summary>
    /// New members added to segments
    /// </summary>
    public int MembersAdded { get; set; }

    /// <summary>
    /// Members removed from segments
    /// </summary>
    public int MembersRemoved { get; set; }

    /// <summary>
    /// Detailed results for each segment
    /// </summary>
    public List<SegmentRecalculationDetail> SegmentDetails { get; set; } = new();

    /// <summary>
    /// Any errors encountered during recalculation
    /// </summary>
    public List<RecalculationError> Errors { get; set; } = new();

    /// <summary>
    /// Warnings generated during recalculation
    /// </summary>
    public List<RecalculationWarning> Warnings { get; set; } = new();

    /// <summary>
    /// Performance metrics for the recalculation
    /// </summary>
    public RecalculationPerformanceMetrics PerformanceMetrics { get; set; } = new();

    /// <summary>
    /// When the recalculation started
    /// </summary>
    public DateTime StartedAt { get; set; }

    /// <summary>
    /// When the recalculation completed (if finished)
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// User who initiated the recalculation
    /// </summary>
    public string InitiatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Reason for recalculation
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Summary of changes made
    /// </summary>
    public RecalculationSummary Summary { get; set; } = new();

    /// <summary>
    /// Next recommended recalculation date
    /// </summary>
    public DateTime? NextRecommendedRecalculation { get; set; }

    /// <summary>
    /// Total member count processed (alias for MembersProcessed)
    /// </summary>
    public int MemberCount => MembersProcessed;
}

/// <summary>
/// Detailed result for a single segment recalculation
/// </summary>
public class SegmentRecalculationDetail
{
    /// <summary>
    /// Segment identifier
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Recalculation status for this segment
    /// </summary>
    public RecalculationStatus Status { get; set; }

    /// <summary>
    /// Member count before recalculation
    /// </summary>
    public int MemberCountBefore { get; set; }

    /// <summary>
    /// Member count after recalculation
    /// </summary>
    public int MemberCountAfter { get; set; }

    /// <summary>
    /// Net change in member count
    /// </summary>
    public int MemberCountChange { get; set; }

    /// <summary>
    /// Members added to this segment
    /// </summary>
    public List<MemberSegmentChange> MembersAdded { get; set; } = new();

    /// <summary>
    /// Members removed from this segment
    /// </summary>
    public List<MemberSegmentChange> MembersRemoved { get; set; } = new();

    /// <summary>
    /// Processing time for this segment
    /// </summary>
    public TimeSpan ProcessingTime { get; set; }

    /// <summary>
    /// Any errors specific to this segment
    /// </summary>
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Analytics metrics recalculated
    /// </summary>
    public List<string> MetricsRecalculated { get; set; } = new();
}

/// <summary>
/// Member segment change information
/// </summary>
public class MemberSegmentChange
{
    /// <summary>
    /// Member identifier
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Member email
    /// </summary>
    public string MemberEmail { get; set; } = string.Empty;

    /// <summary>
    /// Previous segment ID (if moved from another segment)
    /// </summary>
    public int? PreviousSegmentId { get; set; }

    /// <summary>
    /// Previous segment name
    /// </summary>
    public string? PreviousSegmentName { get; set; }

    /// <summary>
    /// Reason for the change
    /// </summary>
    public string ChangeReason { get; set; } = string.Empty;

    /// <summary>
    /// When the change occurred
    /// </summary>
    public DateTime ChangeTimestamp { get; set; }
}

/// <summary>
/// Recalculation error information
/// </summary>
public class RecalculationError
{
    /// <summary>
    /// Error severity level
    /// </summary>
    public ErrorSeverity Severity { get; set; }

    /// <summary>
    /// Error code
    /// </summary>
    public string ErrorCode { get; set; } = string.Empty;

    /// <summary>
    /// Error message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Affected segment ID (if applicable)
    /// </summary>
    public int? AffectedSegmentId { get; set; }

    /// <summary>
    /// Affected member ID (if applicable)
    /// </summary>
    public int? AffectedMemberId { get; set; }

    /// <summary>
    /// Processing stage where error occurred
    /// </summary>
    public string ProcessingStage { get; set; } = string.Empty;

    /// <summary>
    /// When the error occurred
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Technical details for debugging
    /// </summary>
    public string? TechnicalDetails { get; set; }
}

/// <summary>
/// Recalculation warning information
/// </summary>
public class RecalculationWarning
{
    /// <summary>
    /// Warning type
    /// </summary>
    public WarningType Type { get; set; }

    /// <summary>
    /// Warning message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Affected segment ID (if applicable)
    /// </summary>
    public int? AffectedSegmentId { get; set; }

    /// <summary>
    /// Recommended action
    /// </summary>
    public string? RecommendedAction { get; set; }

    /// <summary>
    /// When the warning was generated
    /// </summary>
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Performance metrics for recalculation operation
/// </summary>
public class RecalculationPerformanceMetrics
{
    /// <summary>
    /// Total processing time
    /// </summary>
    public TimeSpan TotalProcessingTime { get; set; }

    /// <summary>
    /// Average time per segment
    /// </summary>
    public TimeSpan AverageTimePerSegment { get; set; }

    /// <summary>
    /// Average time per member
    /// </summary>
    public TimeSpan AverageTimePerMember { get; set; }

    /// <summary>
    /// Peak memory usage (MB)
    /// </summary>
    public decimal PeakMemoryUsageMB { get; set; }

    /// <summary>
    /// Database queries executed
    /// </summary>
    public int DatabaseQueriesExecuted { get; set; }

    /// <summary>
    /// Cache hit rate percentage
    /// </summary>
    public decimal CacheHitRate { get; set; }

    /// <summary>
    /// Throughput (members processed per second)
    /// </summary>
    public decimal ThroughputMembersPerSecond { get; set; }
}

/// <summary>
/// Summary of recalculation changes
/// </summary>
public class RecalculationSummary
{
    /// <summary>
    /// Key changes made during recalculation
    /// </summary>
    public List<string> KeyChanges { get; set; } = new();

    /// <summary>
    /// Segments with significant changes
    /// </summary>
    public List<string> SignificantChanges { get; set; } = new();

    /// <summary>
    /// Impact assessment
    /// </summary>
    public string ImpactAssessment { get; set; } = string.Empty;

    /// <summary>
    /// Data quality improvements
    /// </summary>
    public List<string> DataQualityImprovements { get; set; } = new();

    /// <summary>
    /// Recommendations for future recalculations
    /// </summary>
    public List<string> Recommendations { get; set; } = new();
}

/// <summary>
/// Recalculation status enumeration
/// </summary>
public enum RecalculationStatus
{
    /// <summary>
    /// Recalculation is queued
    /// </summary>
    Queued,

    /// <summary>
    /// Recalculation is in progress
    /// </summary>
    InProgress,

    /// <summary>
    /// Recalculation completed successfully
    /// </summary>
    Completed,

    /// <summary>
    /// Recalculation completed with warnings
    /// </summary>
    CompletedWithWarnings,

    /// <summary>
    /// Recalculation failed
    /// </summary>
    Failed,

    /// <summary>
    /// Recalculation was cancelled
    /// </summary>
    Cancelled,

    /// <summary>
    /// Recalculation partially completed
    /// </summary>
    PartiallyCompleted
}

// ErrorSeverity enum already exists elsewhere - using existing definition

/// <summary>
/// Warning types
/// </summary>
public enum WarningType
{
    /// <summary>
    /// Data quality warning
    /// </summary>
    DataQuality,

    /// <summary>
    /// Performance warning
    /// </summary>
    Performance,

    /// <summary>
    /// Configuration warning
    /// </summary>
    Configuration,

    /// <summary>
    /// Capacity warning
    /// </summary>
    Capacity,

    /// <summary>
    /// Business rule warning
    /// </summary>
    BusinessRule
}