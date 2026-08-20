using GatherGrove.Application.DTOs.Audit;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Service interface for comprehensive audit logging and trail management
/// </summary>
public interface IAuditLogService
{
    /// <summary>
    /// Log export action with audit details
    /// </summary>
    Task LogExportActionAsync(AuditLogEntry entry);

    /// <summary>
    /// Log sensitive data access
    /// </summary>
    Task LogSensitiveDataAccessAsync(SensitiveDataAccessLog log);

    /// <summary>
    /// Log multiple export actions in batch
    /// </summary>
    Task LogBatchExportActionsAsync(IEnumerable<AuditLogEntry> entries);

    /// <summary>
    /// Attempt to update audit log (should throw InvalidOperationException for immutability)
    /// </summary>
    Task<bool> UpdateAuditLogAsync(AuditLogEntry entry);

    /// <summary>
    /// Validate audit log integrity with checksum validation
    /// </summary>
    Task<AuditIntegrityResult> ValidateAuditIntegrityAsync();

    /// <summary>
    /// Get audit data for specific data subject (GDPR support)
    /// </summary>
    Task<IEnumerable<AuditLogEntry>> GetDataSubjectAuditDataAsync(Guid userId);

    /// <summary>
    /// Export data subject audit data in machine-readable format
    /// </summary>
    Task<AuditExportResultDto> ExportDataSubjectAuditDataAsync(Guid userId, ExportFormat format);

    /// <summary>
    /// Generate compliance report for specified period
    /// </summary>
    Task<ComplianceReportDto> GenerateComplianceReportAsync(Guid clubId, AuditDateRange period);

    /// <summary>
    /// Get audit logs for a specific club
    /// </summary>
    Task<IEnumerable<AuditLogEntry>> GetAuditLogsAsync(Guid clubId);

    /// <summary>
    /// Get archived audit logs for a specific club
    /// </summary>
    Task<IEnumerable<AuditLogEntry>> GetArchivedAuditLogsAsync(Guid clubId);

    /// <summary>
    /// Trigger automatic archival process for old audit entries
    /// </summary>
    Task TriggerArchivalProcessAsync();
}
