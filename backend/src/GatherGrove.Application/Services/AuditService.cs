using GatherGrove.Application.DTOs.Audit;
using GatherGrove.Application.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Implementation of basic audit service for existing integrations
/// </summary>
public class AuditService : IAuditService
{
    private readonly ILogger<AuditService> _logger;
    private readonly IAuditLogService _auditLogService;

    public AuditService(ILogger<AuditService> logger, IAuditLogService auditLogService)
    {
        _logger = logger;
        _auditLogService = auditLogService;
    }

    public async Task LogFinancialExportAsync(int userId, int clubId, string format, DateTime timestamp)
    {
        var auditEntry = new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Action = "EXPORT_FINANCIALS",
            UserId = new Guid(userId.ToString().PadLeft(32, '0')), // Convert int to Guid
            ClubId = new Guid(clubId.ToString().PadLeft(32, '0')), // Convert int to Guid
            Timestamp = timestamp,
            Details = $"Financial data exported in {format} format"
        };

        await _auditLogService.LogExportActionAsync(auditEntry);

        _logger.LogInformation("Financial export logged: User {UserId}, Club {ClubId}, Format {Format}",
            userId, clubId, format);
    }

    public async Task LogDataAccessAsync(int userId, int clubId, string dataType, string action, int recordCount)
    {
        var auditEntry = new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Action = $"DATA_ACCESS_{action.ToUpper()}",
            UserId = new Guid(userId.ToString().PadLeft(32, '0')),
            ClubId = new Guid(clubId.ToString().PadLeft(32, '0')),
            Timestamp = DateTime.UtcNow,
            Details = $"Data access: {dataType}, Action: {action}, Records: {recordCount}",
            DataScope = dataType
        };

        await _auditLogService.LogExportActionAsync(auditEntry);

        _logger.LogInformation("Data access logged: User {UserId}, Club {ClubId}, Type {DataType}, Action {Action}, Count {RecordCount}",
            userId, clubId, dataType, action, recordCount);
    }

    public async Task LogMemberExportAsync(int userId, int clubId, string format, DateTime timestamp)
    {
        var auditEntry = new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Action = "EXPORT_MEMBERS",
            UserId = new Guid(userId.ToString().PadLeft(32, '0')),
            ClubId = new Guid(clubId.ToString().PadLeft(32, '0')),
            Timestamp = timestamp,
            Details = $"Member data exported in {format} format"
        };

        await _auditLogService.LogExportActionAsync(auditEntry);

        _logger.LogInformation("Member export logged: User {UserId}, Club {ClubId}, Format {Format}",
            userId, clubId, format);
    }

    public async Task LogExportActionAsync(string action, int userId, int clubId, string details, string? ipAddress = null)
    {
        var auditEntry = new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Action = action,
            UserId = new Guid(userId.ToString().PadLeft(32, '0')),
            ClubId = new Guid(clubId.ToString().PadLeft(32, '0')),
            Timestamp = DateTime.UtcNow,
            Details = details,
            IPAddress = ipAddress
        };

        await _auditLogService.LogExportActionAsync(auditEntry);

        _logger.LogInformation("Export action logged: {Action} by User {UserId} for Club {ClubId}",
            action, userId, clubId);
    }

    public async Task LogSecurityEventAsync(string eventType, int userId, int clubId, string details, string severity = "Medium")
    {
        var auditEntry = new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Action = $"SECURITY_EVENT_{eventType.ToUpper()}",
            UserId = new Guid(userId.ToString().PadLeft(32, '0')),
            ClubId = new Guid(clubId.ToString().PadLeft(32, '0')),
            Timestamp = DateTime.UtcNow,
            Details = $"Security Event: {eventType}, Severity: {severity}, Details: {details}"
        };

        await _auditLogService.LogExportActionAsync(auditEntry);

        _logger.LogWarning("Security event logged: {EventType} by User {UserId} for Club {ClubId} with severity {Severity}",
            eventType, userId, clubId, severity);
    }
}
