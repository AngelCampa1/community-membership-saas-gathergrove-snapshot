using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Audit;

/// <summary>
/// Represents an audit log entry for tracking system activities
/// </summary>
public class AuditLogEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Action { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public Guid ClubId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Details { get; set; } = string.Empty;
    public string? IPAddress { get; set; }
    public string? DataScope { get; set; }
    public string? DigitalSignature { get; set; }
    public string? SignedBy { get; set; }
    public string? SignatureAlgorithm { get; set; }
    public bool IsSignatureValid { get; set; }
    public bool IsArchived { get; set; }
    public DateTime? ArchivedAt { get; set; }
}

/// <summary>
/// Represents sensitive data access logging
/// </summary>
public class SensitiveDataAccessLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string DataType { get; set; } = string.Empty;
    public string AccessReason { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public AuditSeverity Severity { get; set; }
    public bool RequiresReview { get; set; }
    public DateTime AccessedAt { get; set; } = DateTime.UtcNow;
    public string? IPAddress { get; set; }
    public string? UserAgent { get; set; }
}

/// <summary>
/// Represents export history record
/// </summary>
public class ExportHistoryRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClubId { get; set; }
    public ExportType ExportType { get; set; }
    public ExportFormat Format { get; set; }
    public Guid RequestedBy { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public ExportStatus Status { get; set; }
    public int RecordCount { get; set; }
    public long FileSizeBytes { get; set; }
    public long ProcessingTimeMs { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? CompletedAt { get; set; }
}

/// <summary>
/// Represents export failure record
/// </summary>
public class ExportFailureRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClubId { get; set; }
    public ExportType ExportType { get; set; }
    public ExportStatus Status { get; set; } = ExportStatus.Failed;
    public string ErrorMessage { get; set; } = string.Empty;
    public DateTime FailedAt { get; set; } = DateTime.UtcNow;
    public string? StackTrace { get; set; }
    public Guid? RequestedBy { get; set; }
}

/// <summary>
/// Audit integrity validation result
/// </summary>
public class AuditIntegrityResult
{
    public bool IsValid { get; set; }
    public IEnumerable<Guid> TamperedEntries { get; set; } = new List<Guid>();
    public bool ChecksumMatches { get; set; }
    public string? ValidationMessage { get; set; }
    public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Compliance report DTO
/// </summary>
public class ComplianceReportDto
{
    public int TotalExportActions { get; set; }
    public int SensitiveDataAccesses { get; set; }
    public int SecurityIncidents { get; set; }
    public bool DataRetentionCompliance { get; set; }
    public bool AuditTrailIntegrity { get; set; }
    public bool GDPRCompliance { get; set; }
    public bool SOX404Compliance { get; set; }
    public bool ISO27001Compliance { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public AuditDateRange ReportPeriod { get; set; } = new();
    public Guid ReportedBy { get; set; }
}

/// <summary>
/// Date range for audit reports and queries
/// </summary>
public class AuditDateRange
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

/// <summary>
/// Audit severity levels
/// </summary>
public enum AuditSeverity
{
    Low,
    Medium,
    High,
    Critical
}

/// <summary>
/// Audit export result DTO 
/// </summary>
public class AuditExportResultDto
{
    public string ExportId { get; set; } = string.Empty;
    public ExportFormat Format { get; set; }
    public byte[] Data { get; set; } = Array.Empty<byte>();
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public int RecordCount { get; set; }
    public long FileSizeBytes { get; set; }
}
