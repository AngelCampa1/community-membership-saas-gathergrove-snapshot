using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

// Event Engagement Analytics DTOs
public class EventEngagementAnalytics
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public int TotalRegistrations { get; set; }
    public int TotalAttendees { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal EngagementScore { get; set; }
    public decimal SatisfactionRating { get; set; }
    public string EngagementLevel { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
}

// CSV Validation DTOs
public class CsvValidationResult
{
    public bool IsValid { get; set; }
    public int RowCount { get; set; }
    public int ColumnCount { get; set; }
    public bool HasHeader { get; set; }
    public string Encoding { get; set; } = string.Empty;
    public string Delimiter { get; set; } = string.Empty;
    public List<string> ValidationErrors { get; set; } = new();
    public bool ContainsSpecialCharacters { get; set; }
    public double EncodingConfidence { get; set; }
}

// Excel Validation DTOs
public class ExcelValidationResult
{
    public bool IsValid { get; set; }
    public int WorksheetCount { get; set; }
    public bool HasData { get; set; }
    public string FileFormat { get; set; } = string.Empty;
    public int TotalCells { get; set; }
    public List<string> WorksheetNames { get; set; } = new();
    public bool ContainsFormulas { get; set; }
    public int FormulaCount { get; set; }
    public bool HasCircularReferences { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
}

// JSON Validation DTOs
public class JsonValidationResult
{
    public bool IsValid { get; set; }
    public bool IsWellFormed { get; set; }
    public int ObjectCount { get; set; }
    public int ArrayCount { get; set; }
    public int MaxDepth { get; set; }
    public string Encoding { get; set; } = string.Empty;
    public List<string> SyntaxErrors { get; set; } = new();
    public JsonErrorLocation ErrorLocation { get; set; } = new();
    public List<string> MissingFields { get; set; } = new();
    public List<string> ValidationErrors { get; set; } = new();
    public bool ContainsUnicodeCharacters { get; set; }
    public int FileSizeBytes { get; set; }
}

public class JsonErrorLocation
{
    public int LineNumber { get; set; }
    public int ColumnNumber { get; set; }
}

// PDF Validation DTOs
public class PdfValidationResult
{
    public bool IsValid { get; set; }
    public string PdfVersion { get; set; } = string.Empty;
    public int PageCount { get; set; }
    public bool HasText { get; set; }
    public bool IsEncrypted { get; set; }
    public bool RequiresPassword { get; set; }
    public string SecurityLevel { get; set; } = string.Empty;
    public bool HasImages { get; set; }
    public int ImageCount { get; set; }
    public int FileSizeBytes { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
}

// Data Integrity DTOs
public class DataIntegrityResult
{
    public bool IsConsistent { get; set; }
    public bool RecordCountMatch { get; set; }
    public bool FieldCountMatch { get; set; }
    public double DataTypeConsistency { get; set; }
    public int CsvRecordCount { get; set; }
    public int JsonRecordCount { get; set; }
    public List<string> IntegrityErrors { get; set; } = new();
}

// Performance Validation DTOs
public class ExportPerformanceCriteria
{
    public double MaxProcessingTimeSeconds { get; set; }
    public double MaxMemoryUsageMB { get; set; }
    public double MinThroughputRecordsPerSecond { get; set; }
}

public class ExportPerformanceResult
{
    public bool MeetsPerformanceRequirements { get; set; }
    public double ProcessingTimeSeconds { get; set; }
    public double MemoryUsageMB { get; set; }
    public double ThroughputRecordsPerSecond { get; set; }
}

// File Type Detection DTOs
public class FileTypeResult
{
    public string FileType { get; set; } = string.Empty;
    public bool IsValid { get; set; }
    public double Confidence { get; set; }
}

// Scheduled Reports DTOs
public class ScheduledReportProcessingResult
{
    public int ProcessedCount { get; set; }
    public int SuccessfulCount { get; set; }
    public int FailedCount { get; set; }
}

public class CreateScheduledReportRequest
{
    public string ReportName { get; set; } = string.Empty;
    public string? ReportType { get; set; }
    public ExportFormat? Format { get; set; }
    public ReportFrequency? Frequency { get; set; }
    public List<string>? Recipients { get; set; }
    public TimeSpan? DeliveryTime { get; set; }
    public bool? IsActive { get; set; }
}

public class ScheduledReportSummary
{
    public string ScheduleId { get; set; } = string.Empty;
    public string ReportName { get; set; } = string.Empty;
    public ReportFrequency Frequency { get; set; }
    public bool IsActive { get; set; }
    public DateTime NextRunDate { get; set; }
    public DateTime? LastRunDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ScheduledReportJob
{
    public string ScheduleId { get; set; } = string.Empty;
    public JobPriority Priority { get; set; }
    public DateTime QueuedAt { get; set; }
}

public enum JobPriority
{
    Low = 0,
    Normal = 1,
    High = 2,
    Critical = 3
}

public enum ScheduledReportExecutionStatus
{
    Pending = 0,
    Running = 1,
    Completed = 2,
    Failed = 3,
    Cancelled = 4
}

// Additional DTOs for member engagement insights
public class DailyEngagementTrend
{
    public DateTime Date { get; set; }
    public decimal EngagementScore { get; set; }
    public int EventCount { get; set; }
    public int AttendeeCount { get; set; }
    public decimal AttendanceRate { get; set; }
}

public class MemberEngagementInsights
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public int ClubId { get; set; }
    public int AnalysisPeriod { get; set; }
    public decimal EventAttendanceRate { get; set; }
    public decimal RsvpAccuracyRate { get; set; }
    public string EngagementTrend { get; set; } = string.Empty;
    public string EngagementLevel { get; set; } = string.Empty;
    public List<string> RecommendedActions { get; set; } = new();
    public decimal AverageEngagementScore { get; set; }
    public int TotalEventsAttended { get; set; }
    public int TotalEventsRegistered { get; set; }
    public DateTime LastEventAttended { get; set; }
    public Dictionary<string, decimal> EngagementMetrics { get; set; } = new();
    public List<DailyEngagementTrend> EngagementTrendData { get; set; } = new();
}

// Additional helper DTOs
public class EventRecommendation
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public decimal RecommendationScore { get; set; }
    public decimal AttendanceProbability { get; set; }
    public string RecommendationReason { get; set; } = string.Empty;
}

public class AttendanceAnalysis
{
    public int TotalRsvps { get; set; }
    public int TotalAttended { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal NoShowRate { get; set; }
}

public class PerformanceComparison
{
    public decimal AttendanceRateVsAverage { get; set; }
    public decimal EngagementScoreVsAverage { get; set; }
}

public class EventPerformanceAnalysis
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public decimal PerformanceScore { get; set; }
    public AttendanceAnalysis AttendanceAnalysis { get; set; } = new();
    public Dictionary<string, object> EngagementBreakdown { get; set; } = new();
    public PerformanceComparison ComparisonToAverage { get; set; } = new();
    public List<string> ImprovementSuggestions { get; set; } = new();
}

public class EngagementBenchmarks
{
    public int ClubId { get; set; }
    public decimal AverageAttendanceRate { get; set; }
    public decimal AverageRsvpRate { get; set; }
    public decimal AverageEngagementScore { get; set; }
    public Dictionary<string, decimal> IndustryComparisons { get; set; } = new();
    public Dictionary<string, string> PerformanceIndicators { get; set; } = new();
    public string BenchmarkPeriod { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
}

public class EventSuccessPrediction
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public decimal PredictedAttendanceRate { get; set; }
    public decimal SuccessProbability { get; set; }
    public string ConfidenceLevel { get; set; } = string.Empty;
    public List<string> RiskFactors { get; set; } = new();
    public List<string> SuccessFactors { get; set; } = new();
    public List<string> RecommendedActions { get; set; } = new();
}

public class DateRange
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class TrendAnalysis
{
    public string OverallDirection { get; set; } = string.Empty;
    public decimal MonthlyGrowthRate { get; set; }
    public Dictionary<string, decimal> SeasonalPatterns { get; set; } = new();
}

public class MemberInsightSummary
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public decimal EngagementScore { get; set; }
    public string EngagementLevel { get; set; } = string.Empty;
}

public class EventAnalysisSummary
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public decimal PerformanceScore { get; set; }
    public decimal AttendanceRate { get; set; }
}

public class EngagementReport
{
    public int ClubId { get; set; }
    public string ReportType { get; set; } = string.Empty;
    public DateRange ReportPeriod { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
    public string ExecutiveSummary { get; set; } = string.Empty;
    public Dictionary<string, object> KeyMetrics { get; set; } = new();
    public TrendAnalysis TrendAnalysis { get; set; } = new();
    public List<MemberInsightSummary> MemberInsights { get; set; } = new();
    public List<EventAnalysisSummary> EventAnalysis { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
}

public class EventROIMetrics
{
    public int ClubId { get; set; }
    public int AnalysisPeriodMonths { get; set; }
    public decimal TotalEventCosts { get; set; }
    public decimal TotalMemberValue { get; set; }
    public decimal ROIPercentage { get; set; }
    public Dictionary<string, decimal> CostBreakdown { get; set; } = new();
    public Dictionary<string, decimal> ValueDrivers { get; set; } = new();
    public decimal CostPerMember { get; set; }
    public decimal ValuePerMember { get; set; }
}