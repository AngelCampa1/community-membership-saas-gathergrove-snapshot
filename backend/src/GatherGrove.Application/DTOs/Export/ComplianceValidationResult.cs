using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Result of compliance validation for data exports
/// </summary>
public class ComplianceValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public string? ValidationToken { get; set; }
    public DateTime ValidatedAt { get; set; }
    public string ValidatedBy { get; set; } = string.Empty;
    public ComplianceLevel ComplianceLevel { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();

    // Additional properties expected by tests
    public bool IsCompliant { get; set; }
    public List<string> RequiredConsents { get; set; } = new();
    public TimeSpan DataRetentionPeriod { get; set; }
    public bool RequiresDataMinimization { get; set; }
    public List<string> ApplicableRegulations { get; set; } = new();
    public string ConsentStatus { get; set; } = string.Empty;
    public Dictionary<string, object> ComplianceMetadata { get; set; } = new();
    public bool RequiresLegalReview { get; set; }
    public string DataClassification { get; set; } = string.Empty;
    public List<string> ProcessingPurposes { get; set; } = new();
    public bool HasValidLegalBasis { get; set; }
    public DateTime ConsentObtainedAt { get; set; }
    public DateTime DataRetentionExpiry { get; set; }
    public List<string> RequiredDisclosures { get; set; } = new();
    public List<string> ConsumerRights { get; set; } = new();
}