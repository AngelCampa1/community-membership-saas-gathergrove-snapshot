namespace GatherGrove.Application.DTOs;

/// <summary>
/// Result of bulk member update operations
/// </summary>
public class BulkMemberUpdateResult
{
    /// <summary>
    /// Operation identifier
    /// </summary>
    public string OperationId { get; set; } = string.Empty;

    /// <summary>
    /// Club identifier
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Operation type performed
    /// </summary>
    public BulkOperationType OperationType { get; set; }

    /// <summary>
    /// Overall operation status
    /// </summary>
    public BulkOperationStatus Status { get; set; }

    /// <summary>
    /// Total number of members targeted for update
    /// </summary>
    public int TotalTargeted { get; set; }

    /// <summary>
    /// Number of members successfully updated
    /// </summary>
    public int SuccessfulUpdates { get; set; }

    /// <summary>
    /// Number of members that failed to update
    /// </summary>
    public int FailedUpdates { get; set; }

    /// <summary>
    /// Number of members skipped (due to validation or business rules)
    /// </summary>
    public int SkippedUpdates { get; set; }

    /// <summary>
    /// Success rate percentage
    /// </summary>
    public decimal SuccessRate { get; set; }

    /// <summary>
    /// Detailed results for each member update
    /// </summary>
    public List<MemberUpdateResult> MemberResults { get; set; } = new();

    /// <summary>
    /// Summary of changes made
    /// </summary>
    public UpdateSummary UpdateSummary { get; set; } = new();

    /// <summary>
    /// Validation errors encountered
    /// </summary>
    public List<BulkValidationError> ValidationErrors { get; set; } = new();

    /// <summary>
    /// Processing errors encountered
    /// </summary>
    public List<BulkProcessingError> ProcessingErrors { get; set; } = new();

    /// <summary>
    /// Warnings generated during processing
    /// </summary>
    public List<BulkOperationWarning> Warnings { get; set; } = new();

    /// <summary>
    /// Performance metrics for the operation
    /// </summary>
    public BulkOperationPerformance Performance { get; set; } = new();

    /// <summary>
    /// Rollback information (if applicable)
    /// </summary>
    public BulkRollbackInfo? RollbackInfo { get; set; }

    /// <summary>
    /// When the operation was started
    /// </summary>
    public DateTime StartedAt { get; set; }

    /// <summary>
    /// When the operation was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// User who initiated the operation
    /// </summary>
    public string InitiatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Operation notes or comments
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Whether the operation can be rolled back
    /// </summary>
    public bool CanRollback { get; set; }

    /// <summary>
    /// Estimated impact of the changes
    /// </summary>
    public OperationImpactAssessment ImpactAssessment { get; set; } = new();

    /// <summary>
    /// Number of successful operations (alias for SuccessfulUpdates)
    /// </summary>
    public int SuccessCount => SuccessfulUpdates;

    /// <summary>
    /// Number of failed operations (alias for FailedUpdates)
    /// </summary>
    public int ErrorCount => FailedUpdates;
}

/// <summary>
/// Result for individual member update
/// </summary>
public class MemberUpdateResult
{
    /// <summary>
    /// Member identifier
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member name for reference
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Member email for reference
    /// </summary>
    public string MemberEmail { get; set; } = string.Empty;

    /// <summary>
    /// Update status for this member
    /// </summary>
    public MemberUpdateStatus Status { get; set; }

    /// <summary>
    /// Changes made to this member
    /// </summary>
    public List<FieldChange> ChangesApplied { get; set; } = new();

    /// <summary>
    /// Errors encountered for this member
    /// </summary>
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Warnings for this member update
    /// </summary>
    public List<string> Warnings { get; set; } = new();

    /// <summary>
    /// Validation issues for this member
    /// </summary>
    public List<string> ValidationIssues { get; set; } = new();

    /// <summary>
    /// Previous values (for rollback purposes)
    /// </summary>
    public Dictionary<string, object> PreviousValues { get; set; } = new();

    /// <summary>
    /// New values applied
    /// </summary>
    public Dictionary<string, object> NewValues { get; set; } = new();

    /// <summary>
    /// Processing time for this member
    /// </summary>
    public TimeSpan ProcessingTime { get; set; }

    /// <summary>
    /// Whether changes affect segment membership
    /// </summary>
    public bool AffectsSegmentMembership { get; set; }

    /// <summary>
    /// Segments affected by the changes
    /// </summary>
    public List<int> AffectedSegments { get; set; } = new();
}

/// <summary>
/// Summary of updates made during bulk operation
/// </summary>
public class UpdateSummary
{
    /// <summary>
    /// Fields that were updated
    /// </summary>
    public List<string> UpdatedFields { get; set; } = new();

    /// <summary>
    /// Count of updates by field
    /// </summary>
    public Dictionary<string, int> UpdateCountsByField { get; set; } = new();

    /// <summary>
    /// Tags added or removed
    /// </summary>
    public TagUpdateSummary TagUpdates { get; set; } = new();

    /// <summary>
    /// Status changes made
    /// </summary>
    public Dictionary<string, int> StatusChanges { get; set; } = new();

    /// <summary>
    /// Membership type changes
    /// </summary>
    public Dictionary<string, int> MembershipTypeChanges { get; set; } = new();

    /// <summary>
    /// Custom field updates summary
    /// </summary>
    public Dictionary<string, int> CustomFieldUpdates { get; set; } = new();

    /// <summary>
    /// Communication preferences updated
    /// </summary>
    public int CommunicationPreferencesUpdated { get; set; }

    /// <summary>
    /// Segment memberships affected
    /// </summary>
    public int SegmentMembershipsAffected { get; set; }
}

/// <summary>
/// Validation error in bulk operation
/// </summary>
public class BulkValidationError
{
    /// <summary>
    /// Error type
    /// </summary>
    public ValidationErrorType ErrorType { get; set; }

    /// <summary>
    /// Field that failed validation
    /// </summary>
    public string FieldName { get; set; } = string.Empty;

    /// <summary>
    /// Invalid value
    /// </summary>
    public string InvalidValue { get; set; } = string.Empty;

    /// <summary>
    /// Validation error message
    /// </summary>
    public string ErrorMessage { get; set; } = string.Empty;

    /// <summary>
    /// Member IDs affected by this validation error
    /// </summary>
    public List<int> AffectedMemberIds { get; set; } = new();

    /// <summary>
    /// Validation rule that was violated
    /// </summary>
    public string ValidationRule { get; set; } = string.Empty;

    /// <summary>
    /// Suggested corrections
    /// </summary>
    public List<string> SuggestedCorrections { get; set; } = new();
}

/// <summary>
/// Processing error in bulk operation
/// </summary>
public class BulkProcessingError
{
    /// <summary>
    /// Error code
    /// </summary>
    public string ErrorCode { get; set; } = string.Empty;

    /// <summary>
    /// Error message
    /// </summary>
    public string ErrorMessage { get; set; } = string.Empty;

    /// <summary>
    /// Error severity
    /// </summary>
    public ErrorSeverity Severity { get; set; }

    /// <summary>
    /// Members affected by this error
    /// </summary>
    public List<int> AffectedMemberIds { get; set; } = new();

    /// <summary>
    /// Processing stage where error occurred
    /// </summary>
    public string ProcessingStage { get; set; } = string.Empty;

    /// <summary>
    /// Technical details for debugging
    /// </summary>
    public string? TechnicalDetails { get; set; }

    /// <summary>
    /// When the error occurred
    /// </summary>
    public DateTime ErrorTimestamp { get; set; }

    /// <summary>
    /// Whether this error is recoverable
    /// </summary>
    public bool IsRecoverable { get; set; }

    /// <summary>
    /// Recovery suggestions
    /// </summary>
    public List<string> RecoverySuggestions { get; set; } = new();
}

/// <summary>
/// Warning in bulk operation
/// </summary>
public class BulkOperationWarning
{
    /// <summary>
    /// Warning type
    /// </summary>
    public WarningType WarningType { get; set; }

    /// <summary>
    /// Warning message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Members affected by this warning
    /// </summary>
    public List<int> AffectedMemberIds { get; set; } = new();

    /// <summary>
    /// Recommended action
    /// </summary>
    public string? RecommendedAction { get; set; }

    /// <summary>
    /// Warning severity
    /// </summary>
    public WarningSeverity Severity { get; set; }
}

/// <summary>
/// Performance metrics for bulk operation
/// </summary>
public class BulkOperationPerformance
{
    /// <summary>
    /// Total processing time
    /// </summary>
    public TimeSpan TotalProcessingTime { get; set; }

    /// <summary>
    /// Average processing time per member
    /// </summary>
    public TimeSpan AverageTimePerMember { get; set; }

    /// <summary>
    /// Throughput (members processed per second)
    /// </summary>
    public decimal MembersPerSecond { get; set; }

    /// <summary>
    /// Peak memory usage during operation
    /// </summary>
    public decimal PeakMemoryUsageMB { get; set; }

    /// <summary>
    /// Database operations performed
    /// </summary>
    public int DatabaseOperations { get; set; }

    /// <summary>
    /// Cache hits during operation
    /// </summary>
    public int CacheHits { get; set; }

    /// <summary>
    /// Cache misses during operation
    /// </summary>
    public int CacheMisses { get; set; }

    /// <summary>
    /// Batch size used for processing
    /// </summary>
    public int BatchSize { get; set; }

    /// <summary>
    /// Number of batches processed
    /// </summary>
    public int BatchesProcessed { get; set; }
}

/// <summary>
/// Rollback information for bulk operation
/// </summary>
public class BulkRollbackInfo
{
    /// <summary>
    /// Whether rollback is available
    /// </summary>
    public bool IsRollbackAvailable { get; set; }

    /// <summary>
    /// Rollback expiration date
    /// </summary>
    public DateTime? RollbackExpiresAt { get; set; }

    /// <summary>
    /// Rollback token for verification
    /// </summary>
    public string? RollbackToken { get; set; }

    /// <summary>
    /// Changes that can be rolled back
    /// </summary>
    public List<string> RollbackableChanges { get; set; } = new();

    /// <summary>
    /// Changes that cannot be rolled back
    /// </summary>
    public List<string> NonRollbackableChanges { get; set; } = new();

    /// <summary>
    /// Rollback complexity level
    /// </summary>
    public RollbackComplexity Complexity { get; set; }

    /// <summary>
    /// Estimated rollback time
    /// </summary>
    public TimeSpan? EstimatedRollbackTime { get; set; }
}

/// <summary>
/// Operation impact assessment
/// </summary>
public class OperationImpactAssessment
{
    /// <summary>
    /// Overall impact level
    /// </summary>
    public ImpactLevel OverallImpact { get; set; }

    /// <summary>
    /// Segments affected by the changes
    /// </summary>
    public List<SegmentImpact> AffectedSegments { get; set; } = new();

    /// <summary>
    /// Communication preferences affected
    /// </summary>
    public int CommunicationImpact { get; set; }

    /// <summary>
    /// Analytics recalculation needed
    /// </summary>
    public bool RequiresAnalyticsRecalculation { get; set; }

    /// <summary>
    /// Downstream systems affected
    /// </summary>
    public List<string> DownstreamSystemsAffected { get; set; } = new();

    /// <summary>
    /// Estimated time to see impact
    /// </summary>
    public string EstimatedImpactTimeframe { get; set; } = string.Empty;
}

/// <summary>
/// Field change information
/// </summary>
public class FieldChange
{
    /// <summary>
    /// Field that was changed
    /// </summary>
    public string FieldName { get; set; } = string.Empty;

    /// <summary>
    /// Previous value
    /// </summary>
    public object? PreviousValue { get; set; }

    /// <summary>
    /// New value
    /// </summary>
    public object? NewValue { get; set; }

    /// <summary>
    /// Change type (Added, Updated, Removed)
    /// </summary>
    public ChangeType ChangeType { get; set; }

    /// <summary>
    /// When the change was applied
    /// </summary>
    public DateTime ChangeTimestamp { get; set; }
}

/// <summary>
/// Tag update summary
/// </summary>
public class TagUpdateSummary
{
    /// <summary>
    /// Tags added with counts
    /// </summary>
    public Dictionary<string, int> TagsAdded { get; set; } = new();

    /// <summary>
    /// Tags removed with counts
    /// </summary>
    public Dictionary<string, int> TagsRemoved { get; set; } = new();

    /// <summary>
    /// Total tag operations
    /// </summary>
    public int TotalTagOperations { get; set; }
}

/// <summary>
/// Segment impact information
/// </summary>
public class SegmentImpact
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
    /// Number of members affected in this segment
    /// </summary>
    public int MembersAffected { get; set; }

    /// <summary>
    /// Impact level on this segment
    /// </summary>
    public ImpactLevel ImpactLevel { get; set; }

    /// <summary>
    /// Changes required for this segment
    /// </summary>
    public List<string> RequiredChanges { get; set; } = new();
}

// Enumerations

public enum BulkOperationType
{
    UpdateMembers,
    AssignTags,
    RemoveTags,
    UpdateCustomFields,
    UpdateStatus,
    UpdateMembershipType,
    UpdateCommunicationPreferences,
    BulkImport,
    BulkExport
}

public enum BulkOperationStatus
{
    Queued,
    InProgress,
    Completed,
    CompletedWithErrors,
    Failed,
    Cancelled,
    PartiallyCompleted
}

public enum MemberUpdateStatus
{
    Success,
    Failed,
    Skipped,
    Warning,
    ValidationFailed
}

public enum ValidationErrorType
{
    Required,
    Format,
    Range,
    Duplicate,
    BusinessRule,
    Reference,
    Permission
}

public enum ChangeType
{
    Added,
    Updated,
    Removed,
    Replaced
}

public enum RollbackComplexity
{
    Simple,
    Moderate,
    Complex,
    VeryComplex
}

public enum WarningSeverity
{
    Low,
    Medium,
    High
}

/// <summary>
/// Error severity levels
/// </summary>
public enum ErrorSeverity
{
    /// <summary>
    /// Warning level - non-critical
    /// </summary>
    Warning,

    /// <summary>
    /// Error level - requires attention
    /// </summary>
    Error,

    /// <summary>
    /// Critical level - immediate action required
    /// </summary>
    Critical
}