namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Service interface for basic audit trail logging (simplified version for existing integrations)
/// </summary>
public interface IAuditService
{
    Task LogFinancialExportAsync(int userId, int clubId, string format, DateTime timestamp);
    Task LogDataAccessAsync(int userId, int clubId, string dataType, string action, int recordCount);
    Task LogMemberExportAsync(int userId, int clubId, string format, DateTime timestamp);
    Task LogExportActionAsync(string action, int userId, int clubId, string details, string? ipAddress = null);
    Task LogSecurityEventAsync(string eventType, int userId, int clubId, string details, string severity = "Medium");
}