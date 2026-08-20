using GatherGrove.Domain.Enums;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Application.Security;

namespace GatherGrove.Application.Services.Interfaces;

public interface IExportSecurityService
{
    Task<bool> ValidateExportPermissionsAsync(int userId, int clubId, string exportType);
    Task<ExportPermissionResult> ValidateExportPermissions(int userId, int clubId, string exportType);
    Task<byte[]> SecureExportAsync(byte[] exportData);
    Task<SanitizationResult> SanitizeExportData<T>(T data, DataSanitizationRules rules) where T : class;
    Task LogSecurityEventAsync(int userId, string eventType, string details);
    Task<DTOs.Export.ComplianceResult> SanitizeForCompliance<T>(T data, ComplianceLevel complianceLevel) where T : class;
    Task<string> LogExportActivity(DTOs.Export.ExportAuditInfo auditInfo);

    // Additional methods expected by tests
    Task<SecureTokenValidationResult> ValidateSecureDownloadToken(string token);
    Task<SecureTokenValidationResult> ValidateSecureDownloadTokenAsync(string token);
    Task<bool> CheckExportRateLimit(int userId, RateLimitType rateLimitType);
    Task<bool> CheckExportRateLimit(int userId, string rateLimitType, int clubId);
    Task<SuspicionLevel> DetectSuspiciousActivity(int userId, string activityType);
    Task LogSecurityEvent(Domain.Entities.SecurityEvent securityEvent);
    Task<byte[]> EncryptExportData(byte[] data);
    Task<string> GenerateSecureDownloadLink(string exportId, int userId);
    Task<ExportQuota> GetUserExportQuotaAsync(int userId, int clubId);

    // Missing methods for CS1061 fixes
    Task<ComplianceValidationResult> ValidateComplianceRequirements(object data, ComplianceLevel complianceLevel);
}