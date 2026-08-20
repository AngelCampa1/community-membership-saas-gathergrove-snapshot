using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Result of compliance sanitization process
/// </summary>
public class ComplianceResult
{
    public bool IsCompliant { get; set; }
    public ComplianceLevel ComplianceLevel { get; set; }
    public List<string> Violations { get; set; } = new();
    public List<string> ComplianceViolations { get; set; } = new();
    public bool DataMinimizationApplied { get; set; }
    public List<string> ConsentRequiredFields { get; set; } = new();
    public object SanitizedData { get; set; } = null!;
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}