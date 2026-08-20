using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Result of bulk export operations
/// </summary>
public class BulkExportResult
{
    /// <summary>
    /// Export operation identifier
    /// </summary>
    public string ExportId { get; set; } = string.Empty;

    /// <summary>
    /// Club identifier
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Export operation status
    /// </summary>
    public ExportStatus Status { get; set; }

    /// <summary>
    /// Export type performed
    /// </summary>
    public BulkExportType ExportType { get; set; }

    /// <summary>
    /// Total number of records exported
    /// </summary>
    public int TotalRecordsExported { get; set; }

    /// <summary>
    /// Total number of records requested
    /// </summary>
    public int TotalRecordsRequested { get; set; }

    /// <summary>
    /// Export success rate percentage
    /// </summary>
    public decimal SuccessRate { get; set; }

    /// <summary>
    /// Generated file information
    /// </summary>
    public ExportFileInfo FileInfo { get; set; } = new();

    /// <summary>
    /// Export filters applied
    /// </summary>
    public ExportFilters AppliedFilters { get; set; } = new();

    /// <summary>
    /// Export summary by data type
    /// </summary>
    public Dictionary<string, ExportDataSummary> DataSummaries { get; set; } = new();

    /// <summary>
    /// Export errors encountered
    /// </summary>
    public List<ExportError> Errors { get; set; } = new();

    /// <summary>
    /// Export warnings
    /// </summary>
    public List<ExportWarning> Warnings { get; set; } = new();

    /// <summary>
    /// Performance metrics for the export
    /// </summary>
    public ExportPerformanceMetrics Performance { get; set; } = new();

    /// <summary>
    /// Data quality metrics
    /// </summary>
    public ExportDataQuality DataQuality { get; set; } = new();

    /// <summary>
    /// When the export was requested
    /// </summary>
    public DateTime RequestedAt { get; set; }

    /// <summary>
    /// When the export was started
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// When the export was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Export expiration date (when download link expires)
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// User who requested the export
    /// </summary>
    public string RequestedBy { get; set; } = string.Empty;

    /// <summary>
    /// Export configuration used
    /// </summary>
    public ExportConfiguration Configuration { get; set; } = new();

    /// <summary>
    /// Download statistics
    /// </summary>
    public ExportDownloadStats DownloadStats { get; set; } = new();

    /// <summary>
    /// Total number of records exported (alias for TotalRecordsExported)
    /// </summary>
    public int RecordCount => TotalRecordsExported;
}

/// <summary>
/// Result of bulk import operations
/// </summary>
public class BulkImportResult
{
    /// <summary>
    /// Import operation identifier
    /// </summary>
    public string ImportId { get; set; } = string.Empty;

    /// <summary>
    /// Club identifier
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Import operation status
    /// </summary>
    public BulkOperationStatus Status { get; set; }

    /// <summary>
    /// Import type performed
    /// </summary>
    public BulkImportType ImportType { get; set; }

    /// <summary>
    /// Source file information
    /// </summary>
    public ImportFileInfo SourceFile { get; set; } = new();

    /// <summary>
    /// Total number of records in source file
    /// </summary>
    public int TotalRecordsInFile { get; set; }

    /// <summary>
    /// Number of records successfully imported
    /// </summary>
    public int SuccessfulImports { get; set; }

    /// <summary>
    /// Number of records that failed to import
    /// </summary>
    public int FailedImports { get; set; }

    /// <summary>
    /// Number of records skipped
    /// </summary>
    public int SkippedRecords { get; set; }

    /// <summary>
    /// Number of duplicate records found
    /// </summary>
    public int DuplicatesFound { get; set; }

    /// <summary>
    /// Import success rate percentage
    /// </summary>
    public decimal SuccessRate { get; set; }

    /// <summary>
    /// Detailed import results by record
    /// </summary>
    public List<RecordImportResult> RecordResults { get; set; } = new();

    /// <summary>
    /// Import validation errors
    /// </summary>
    public List<ImportValidationError> ValidationErrors { get; set; } = new();

    /// <summary>
    /// Import processing errors
    /// </summary>
    public List<ImportProcessingError> ProcessingErrors { get; set; } = new();

    /// <summary>
    /// Import warnings
    /// </summary>
    public List<ImportWarning> Warnings { get; set; } = new();

    /// <summary>
    /// Import mapping used for fields
    /// </summary>
    public ImportFieldMapping FieldMapping { get; set; } = new();

    /// <summary>
    /// Data transformation rules applied
    /// </summary>
    public List<DataTransformation> TransformationsApplied { get; set; } = new();

    /// <summary>
    /// Performance metrics for the import
    /// </summary>
    public ImportPerformanceMetrics Performance { get; set; } = new();

    /// <summary>
    /// Data quality assessment
    /// </summary>
    public ImportDataQuality DataQuality { get; set; } = new();

    /// <summary>
    /// When the import was requested
    /// </summary>
    public DateTime RequestedAt { get; set; }

    /// <summary>
    /// When the import was started
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// When the import was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// User who requested the import
    /// </summary>
    public string RequestedBy { get; set; } = string.Empty;

    /// <summary>
    /// Import rollback information
    /// </summary>
    public ImportRollbackInfo? RollbackInfo { get; set; }

    /// <summary>
    /// Post-import actions required
    /// </summary>
    public List<PostImportAction> PostImportActions { get; set; } = new();

    /// <summary>
    /// Number of successful imports (alias for SuccessfulImports)
    /// </summary>
    public int SuccessCount => SuccessfulImports;

    /// <summary>
    /// Number of failed imports (alias for FailedImports)
    /// </summary>
    public int ErrorCount => FailedImports;
}

// Export-related classes

/// <summary>
/// Export file information
/// </summary>
public class ExportFileInfo
{
    /// <summary>
    /// Generated file name
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSizeBytes { get; set; }

    /// <summary>
    /// File format/type
    /// </summary>
    public string FileFormat { get; set; } = string.Empty;

    /// <summary>
    /// Download URL
    /// </summary>
    public string? DownloadUrl { get; set; }

    /// <summary>
    /// File checksum for integrity verification
    /// </summary>
    public string? Checksum { get; set; }

    /// <summary>
    /// Compression used (if any)
    /// </summary>
    public string? CompressionType { get; set; }

    /// <summary>
    /// Character encoding used
    /// </summary>
    public string CharacterEncoding { get; set; } = "UTF-8";
}

/// <summary>
/// Export filters applied to data
/// </summary>
public class ExportFilters
{
    /// <summary>
    /// Date range filter
    /// </summary>
    public DateRange? DateRange { get; set; }

    /// <summary>
    /// Member status filters
    /// </summary>
    public List<string>? StatusFilters { get; set; }

    /// <summary>
    /// Segment filters
    /// </summary>
    public List<int>? SegmentFilters { get; set; }

    /// <summary>
    /// Tag filters
    /// </summary>
    public List<int>? TagFilters { get; set; }

    /// <summary>
    /// Custom field filters
    /// </summary>
    public Dictionary<string, object>? CustomFieldFilters { get; set; }

    /// <summary>
    /// Additional query filters
    /// </summary>
    public Dictionary<string, object> AdditionalFilters { get; set; } = new();
}

/// <summary>
/// Export data summary by type
/// </summary>
public class ExportDataSummary
{
    /// <summary>
    /// Data type name
    /// </summary>
    public string DataType { get; set; } = string.Empty;

    /// <summary>
    /// Number of records exported
    /// </summary>
    public int RecordCount { get; set; }

    /// <summary>
    /// Number of fields per record
    /// </summary>
    public int FieldCount { get; set; }

    /// <summary>
    /// Data completeness percentage
    /// </summary>
    public decimal CompletenessPercentage { get; set; }

    /// <summary>
    /// Export timestamp for this data type
    /// </summary>
    public DateTime ExportTimestamp { get; set; }
}

/// <summary>
/// Export performance metrics
/// </summary>
public class ExportPerformanceMetrics
{
    /// <summary>
    /// Total processing time
    /// </summary>
    public TimeSpan TotalProcessingTime { get; set; }

    /// <summary>
    /// Records processed per second
    /// </summary>
    public decimal RecordsPerSecond { get; set; }

    /// <summary>
    /// Peak memory usage in MB
    /// </summary>
    public decimal PeakMemoryUsageMB { get; set; }

    /// <summary>
    /// Database query count
    /// </summary>
    public int DatabaseQueryCount { get; set; }

    /// <summary>
    /// File generation time
    /// </summary>
    public TimeSpan FileGenerationTime { get; set; }

    /// <summary>
    /// Average response time per query
    /// </summary>
    public TimeSpan AverageQueryResponseTime { get; set; }
}

/// <summary>
/// Export data quality metrics
/// </summary>
public class ExportDataQuality
{
    /// <summary>
    /// Overall data quality score (0-100)
    /// </summary>
    public decimal QualityScore { get; set; }

    /// <summary>
    /// Data completeness rate
    /// </summary>
    public decimal CompletenessRate { get; set; }

    /// <summary>
    /// Data accuracy rate
    /// </summary>
    public decimal AccuracyRate { get; set; }

    /// <summary>
    /// Data consistency issues found
    /// </summary>
    public List<string> ConsistencyIssues { get; set; } = new();

    /// <summary>
    /// Missing data fields count
    /// </summary>
    public int MissingDataCount { get; set; }

    /// <summary>
    /// Data validation warnings
    /// </summary>
    public List<string> ValidationWarnings { get; set; } = new();
}

// Import-related classes

/// <summary>
/// Import file information
/// </summary>
public class ImportFileInfo
{
    /// <summary>
    /// Original file name
    /// </summary>
    public string OriginalFileName { get; set; } = string.Empty;

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSizeBytes { get; set; }

    /// <summary>
    /// File format detected
    /// </summary>
    public string FileFormat { get; set; } = string.Empty;

    /// <summary>
    /// Character encoding detected
    /// </summary>
    public string CharacterEncoding { get; set; } = string.Empty;

    /// <summary>
    /// Number of rows/records in file
    /// </summary>
    public int TotalRows { get; set; }

    /// <summary>
    /// Number of columns detected
    /// </summary>
    public int TotalColumns { get; set; }

    /// <summary>
    /// File upload timestamp
    /// </summary>
    public DateTime UploadedAt { get; set; }

    /// <summary>
    /// File checksum
    /// </summary>
    public string? Checksum { get; set; }
}

/// <summary>
/// Individual record import result
/// </summary>
public class RecordImportResult
{
    /// <summary>
    /// Row number in source file
    /// </summary>
    public int RowNumber { get; set; }

    /// <summary>
    /// Import status for this record
    /// </summary>
    public RecordImportStatus Status { get; set; }

    /// <summary>
    /// Generated member ID (if successful)
    /// </summary>
    public int? GeneratedMemberId { get; set; }

    /// <summary>
    /// Record identifier (email or other unique field)
    /// </summary>
    public string RecordIdentifier { get; set; } = string.Empty;

    /// <summary>
    /// Errors for this record
    /// </summary>
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Warnings for this record
    /// </summary>
    public List<string> Warnings { get; set; } = new();

    /// <summary>
    /// Data transformations applied to this record
    /// </summary>
    public List<string> TransformationsApplied { get; set; } = new();

    /// <summary>
    /// Fields that were imported
    /// </summary>
    public Dictionary<string, object> ImportedFields { get; set; } = new();

    /// <summary>
    /// Processing time for this record
    /// </summary>
    public TimeSpan ProcessingTime { get; set; }
}

/// <summary>
/// Import field mapping configuration
/// </summary>
public class ImportFieldMapping
{
    /// <summary>
    /// Source to target field mappings
    /// </summary>
    public Dictionary<string, string> FieldMappings { get; set; } = new();

    /// <summary>
    /// Default values for unmapped fields
    /// </summary>
    public Dictionary<string, object> DefaultValues { get; set; } = new();

    /// <summary>
    /// Required fields validation
    /// </summary>
    public List<string> RequiredFields { get; set; } = new();

    /// <summary>
    /// Field data type mappings
    /// </summary>
    public Dictionary<string, string> DataTypeMappings { get; set; } = new();

    /// <summary>
    /// Custom transformation functions applied
    /// </summary>
    public Dictionary<string, string> TransformationFunctions { get; set; } = new();
}

/// <summary>
/// Data transformation rule
/// </summary>
public class DataTransformation
{
    /// <summary>
    /// Field name being transformed
    /// </summary>
    public string FieldName { get; set; } = string.Empty;

    /// <summary>
    /// Transformation type
    /// </summary>
    public TransformationType TransformationType { get; set; }

    /// <summary>
    /// Transformation rule or function
    /// </summary>
    public string TransformationRule { get; set; } = string.Empty;

    /// <summary>
    /// Number of records affected
    /// </summary>
    public int RecordsAffected { get; set; }

    /// <summary>
    /// Success rate of transformation
    /// </summary>
    public decimal SuccessRate { get; set; }
}

/// <summary>
/// Import performance metrics
/// </summary>
public class ImportPerformanceMetrics
{
    /// <summary>
    /// Total processing time
    /// </summary>
    public TimeSpan TotalProcessingTime { get; set; }

    /// <summary>
    /// File parsing time
    /// </summary>
    public TimeSpan FileParsingTime { get; set; }

    /// <summary>
    /// Data validation time
    /// </summary>
    public TimeSpan ValidationTime { get; set; }

    /// <summary>
    /// Database insertion time
    /// </summary>
    public TimeSpan DatabaseInsertionTime { get; set; }

    /// <summary>
    /// Records processed per second
    /// </summary>
    public decimal RecordsPerSecond { get; set; }

    /// <summary>
    /// Peak memory usage in MB
    /// </summary>
    public decimal PeakMemoryUsageMB { get; set; }

    /// <summary>
    /// Database operations count
    /// </summary>
    public int DatabaseOperationsCount { get; set; }
}

/// <summary>
/// Import data quality assessment
/// </summary>
public class ImportDataQuality
{
    /// <summary>
    /// Overall data quality score (0-100)
    /// </summary>
    public decimal QualityScore { get; set; }

    /// <summary>
    /// Data completeness percentage
    /// </summary>
    public decimal DataCompleteness { get; set; }

    /// <summary>
    /// Data accuracy percentage
    /// </summary>
    public decimal DataAccuracy { get; set; }

    /// <summary>
    /// Duplicate detection results
    /// </summary>
    public DuplicateDetectionResult DuplicateDetection { get; set; } = new();

    /// <summary>
    /// Data format compliance rate
    /// </summary>
    public decimal FormatComplianceRate { get; set; }

    /// <summary>
    /// Business rule violations
    /// </summary>
    public List<string> BusinessRuleViolations { get; set; } = new();
}

/// <summary>
/// Post-import action required
/// </summary>
public class PostImportAction
{
    /// <summary>
    /// Action type
    /// </summary>
    public PostImportActionType ActionType { get; set; }

    /// <summary>
    /// Action description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Priority of the action
    /// </summary>
    public ActionPriority Priority { get; set; }

    /// <summary>
    /// Affected records count
    /// </summary>
    public int AffectedRecords { get; set; }

    /// <summary>
    /// Whether action is automated or manual
    /// </summary>
    public bool IsAutomated { get; set; }

    /// <summary>
    /// Estimated completion time
    /// </summary>
    public TimeSpan? EstimatedCompletionTime { get; set; }
}

// Common supporting classes

/// <summary>
/// Export error information
/// </summary>
public class ExportError : BulkProcessingError { }

/// <summary>
/// Export warning information
/// </summary>
public class ExportWarning : BulkOperationWarning { }

/// <summary>
/// Import validation error
/// </summary>
public class ImportValidationError : BulkValidationError { }

/// <summary>
/// Import processing error
/// </summary>
public class ImportProcessingError : BulkProcessingError { }

/// <summary>
/// Import warning
/// </summary>
public class ImportWarning : BulkOperationWarning { }

/// <summary>
/// Export configuration settings
/// </summary>
public class ExportConfiguration
{
    /// <summary>
    /// Include headers in export
    /// </summary>
    public bool IncludeHeaders { get; set; } = true;

    /// <summary>
    /// Date format to use
    /// </summary>
    public string DateFormat { get; set; } = "yyyy-MM-dd";

    /// <summary>
    /// Delimiter for CSV files
    /// </summary>
    public string CsvDelimiter { get; set; } = ",";

    /// <summary>
    /// Text qualifier for CSV fields
    /// </summary>
    public string TextQualifier { get; set; } = "\"";

    /// <summary>
    /// Maximum file size in MB
    /// </summary>
    public int MaxFileSizeMB { get; set; } = 100;

    /// <summary>
    /// Compression enabled
    /// </summary>
    public bool EnableCompression { get; set; } = false;
}

/// <summary>
/// Export download statistics
/// </summary>
public class ExportDownloadStats
{
    /// <summary>
    /// Number of times file was downloaded
    /// </summary>
    public int DownloadCount { get; set; }

    /// <summary>
    /// First download timestamp
    /// </summary>
    public DateTime? FirstDownloadAt { get; set; }

    /// <summary>
    /// Last download timestamp
    /// </summary>
    public DateTime? LastDownloadAt { get; set; }

    /// <summary>
    /// Users who downloaded the file
    /// </summary>
    public List<string> DownloadedBy { get; set; } = new();
}

/// <summary>
/// Import rollback information
/// </summary>
public class ImportRollbackInfo : BulkRollbackInfo
{
    /// <summary>
    /// Records that can be rolled back
    /// </summary>
    public List<int> RollbackableRecords { get; set; } = new();

    /// <summary>
    /// Dependencies that prevent rollback
    /// </summary>
    public List<string> RollbackDependencies { get; set; } = new();
}

/// <summary>
/// Duplicate detection result
/// </summary>
public class DuplicateDetectionResult
{
    /// <summary>
    /// Number of duplicates found
    /// </summary>
    public int DuplicatesFound { get; set; }

    /// <summary>
    /// Duplicate detection method used
    /// </summary>
    public string DetectionMethod { get; set; } = string.Empty;

    /// <summary>
    /// Fields used for duplicate detection
    /// </summary>
    public List<string> DetectionFields { get; set; } = new();

    /// <summary>
    /// Duplicate resolution strategy applied
    /// </summary>
    public string ResolutionStrategy { get; set; } = string.Empty;

    /// <summary>
    /// Duplicate pairs found
    /// </summary>
    public List<DuplicatePair> DuplicatePairs { get; set; } = new();
}

/// <summary>
/// Duplicate pair information
/// </summary>
public class DuplicatePair
{
    /// <summary>
    /// First record identifier
    /// </summary>
    public string Record1 { get; set; } = string.Empty;

    /// <summary>
    /// Second record identifier
    /// </summary>
    public string Record2 { get; set; } = string.Empty;

    /// <summary>
    /// Similarity score (0-1)
    /// </summary>
    public decimal SimilarityScore { get; set; }

    /// <summary>
    /// Fields that matched
    /// </summary>
    public List<string> MatchingFields { get; set; } = new();

    /// <summary>
    /// Resolution action taken
    /// </summary>
    public string ResolutionAction { get; set; } = string.Empty;
}

// Enumerations

public enum BulkExportType
{
    Members,
    Events,
    Analytics,
    Communications,
    Payments,
    FullExport,
    CustomExport
}

public enum BulkImportType
{
    Members,
    Events,
    Tags,
    CustomFields,
    Communications,
    BulkUpdate
}

public enum RecordImportStatus
{
    Success,
    Failed,
    Skipped,
    Warning,
    Duplicate
}

public enum TransformationType
{
    DataTypeConversion,
    FormatNormalization,
    ValueMapping,
    DefaultValue,
    Validation,
    BusinessRule
}

public enum PostImportActionType
{
    SegmentRecalculation,
    AnalyticsUpdate,
    NotificationSend,
    ValidationCheck,
    DataCleanup,
    CacheRefresh
}

/// <summary>
/// Import operation status
/// </summary>
public enum ImportStatus
{
    /// <summary>
    /// Import request received and queued
    /// </summary>
    Queued,

    /// <summary>
    /// Import is currently processing
    /// </summary>
    Processing,

    /// <summary>
    /// Import completed successfully
    /// </summary>
    Completed,

    /// <summary>
    /// Import completed with warnings
    /// </summary>
    CompletedWithWarnings,

    /// <summary>
    /// Import failed due to error
    /// </summary>
    Failed,

    /// <summary>
    /// Import was cancelled
    /// </summary>
    Cancelled,

    /// <summary>
    /// Import is being validated
    /// </summary>
    Validating,

    /// <summary>
    /// Import validation failed
    /// </summary>
    ValidationFailed
}