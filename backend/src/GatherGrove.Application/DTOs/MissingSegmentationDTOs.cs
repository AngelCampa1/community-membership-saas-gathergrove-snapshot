using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for segment analytics
/// </summary>
public class SegmentAnalyticsResponse
{
    /// <summary>
    /// Segment ID
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Analytics data
    /// </summary>
    public Dictionary<string, object> Data { get; set; } = new();

    /// <summary>
    /// When the analytics were calculated
    /// </summary>
    public DateTime CalculatedAt { get; set; }
}

/// <summary>
/// Request for previewing a segment
/// </summary>
public class PreviewSegmentRequest
{
    /// <summary>
    /// Club ID
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Filter criteria to preview
    /// </summary>
    [Required]
    public SegmentFilterCriteria FilterCriteria { get; set; } = new();

    /// <summary>
    /// Maximum number of members to return in preview
    /// </summary>
    [Range(1, 100)]
    public int MaxResults { get; set; } = 10;
}

/// <summary>
/// Result of segment preview
/// </summary>
public class SegmentPreviewResult
{
    /// <summary>
    /// Estimated total member count
    /// </summary>
    public int EstimatedCount { get; set; }

    /// <summary>
    /// Sample members that would be in the segment
    /// </summary>
    public List<SegmentMemberDetail> SampleMembers { get; set; } = new();

    /// <summary>
    /// Execution time for the preview
    /// </summary>
    public int ExecutionTimeMs { get; set; }

    /// <summary>
    /// Filter criteria that was previewed
    /// </summary>
    public SegmentFilterCriteria PreviewedCriteria { get; set; } = new();
}

/// <summary>
/// Result of segment performance analysis
/// </summary>
public class SegmentPerformanceResult
{
    /// <summary>
    /// Segment ID
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Performance metrics
    /// </summary>
    public SegmentPerformanceMetrics Performance { get; set; } = new();

    /// <summary>
    /// Benchmarks against other segments
    /// </summary>
    public Dictionary<string, decimal> Benchmarks { get; set; } = new();

    /// <summary>
    /// When the performance was calculated
    /// </summary>
    public DateTime CalculatedAt { get; set; }
}

/// <summary>
/// Response for member segment history
/// </summary>
public class MemberSegmentHistoryResponse
{
    /// <summary>
    /// Member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// History of segment memberships
    /// </summary>
    public List<SegmentMembershipHistory> SegmentHistory { get; set; } = new();

    /// <summary>
    /// Current active segments
    /// </summary>
    public List<MemberSegmentResponse> CurrentSegments { get; set; } = new();
}

/// <summary>
/// Segment membership history entry
/// </summary>
public class SegmentMembershipHistory
{
    /// <summary>
    /// Segment ID
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// When the member joined the segment
    /// </summary>
    public DateTime JoinedAt { get; set; }

    /// <summary>
    /// When the member left the segment (null if still active)
    /// </summary>
    public DateTime? LeftAt { get; set; }

    /// <summary>
    /// Reason for joining/leaving
    /// </summary>
    public string? Reason { get; set; }
}

/// <summary>
/// Response for bulk operation statistics
/// </summary>
public class BulkOperationStatsResponse
{
    /// <summary>
    /// Operation type
    /// </summary>
    public BulkOperationType OperationType { get; set; }

    /// <summary>
    /// Total operations run
    /// </summary>
    public int TotalOperations { get; set; }

    /// <summary>
    /// Average execution time
    /// </summary>
    public TimeSpan AverageExecutionTime { get; set; }

    /// <summary>
    /// Success rate percentage
    /// </summary>
    public decimal SuccessRate { get; set; }

    /// <summary>
    /// Most common error types
    /// </summary>
    public Dictionary<string, int> CommonErrors { get; set; } = new();

    /// <summary>
    /// Peak processing times
    /// </summary>
    public List<PeakProcessingTime> PeakTimes { get; set; } = new();
}

/// <summary>
/// Peak processing time information
/// </summary>
public class PeakProcessingTime
{
    /// <summary>
    /// Date of peak
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Operations processed
    /// </summary>
    public int OperationsProcessed { get; set; }

    /// <summary>
    /// Peak processing rate
    /// </summary>
    public decimal ProcessingRate { get; set; }
}