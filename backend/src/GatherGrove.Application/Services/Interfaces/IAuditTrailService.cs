using GatherGrove.Domain.Entities;

using GatherGrove.Application.DTOs.Export;

namespace GatherGrove.Application.Services.Interfaces;

public interface IAuditTrailService
{
    Task LogExportActivityAsync(int userId, int clubId, string exportType, string details);
    Task<string> LogExportActivityAsync(DTOs.Export.ExportAuditInfo auditInfo);
    Task LogDataAccessAsync(int userId, string resourceType, int resourceId);
    Task<List<AuditLog>> GetAuditTrailAsync(int clubId, DateTime? startDate = null, DateTime? endDate = null);

    // Additional methods expected by tests
    Task LogSecurityEventAsync(Domain.Entities.SecurityEvent securityEvent);
}