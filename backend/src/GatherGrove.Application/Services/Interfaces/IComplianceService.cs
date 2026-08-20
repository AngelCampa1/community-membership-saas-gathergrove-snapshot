using GatherGrove.Domain.Enums;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Application.Security;

namespace GatherGrove.Application.Services.Interfaces;

public interface IComplianceService
{
    Task<bool> ValidateGdprComplianceAsync(object data);
    Task<bool> ValidateDataRetentionAsync(DateTime dataDate);
    Task<ComplianceReport> GenerateComplianceReportAsync(int clubId);
    DataSanitizationRules GetSanitizationRulesForCompliance(ComplianceLevel complianceLevel);

    // Missing methods for CS1061 fixes
    Task<bool> ValidateGDPRComplianceAsync(object data);
    Task<bool> ValidateCCPAComplianceAsync(object data);
}

public class ComplianceReport
{
    public bool IsCompliant { get; set; }
    public List<string> Violations { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}