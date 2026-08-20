using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Information captured for export audit trail
/// </summary>
public class ExportAuditInfo
{
    public int UserId { get; set; }
    public int ClubId { get; set; }
    public ExportType ExportType { get; set; }
    public ExportFormat ExportFormat { get; set; }
    public long FileSizeBytes { get; set; }
    public string IPAddress { get; set; } = string.Empty;
    public int RecordCount { get; set; }
    public string UserAgent { get; set; } = string.Empty;
    public DateTime ExportStartTime { get; set; }
    public DateTime ExportEndTime { get; set; }
    public ExportStatus ExportStatus { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime AttemptedAt { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public ComplianceLevel ComplianceLevel { get; set; }
}