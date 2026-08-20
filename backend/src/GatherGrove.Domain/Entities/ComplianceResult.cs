using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents compliance validation results for export operations
/// </summary>
public class ComplianceResult
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Export request ID this compliance result belongs to
    /// </summary>
    public int ExportRequestId { get; set; }

    /// <summary>
    /// Whether the export is compliant with regulations
    /// </summary>
    public bool IsCompliant { get; set; }

    /// <summary>
    /// Compliance level achieved
    /// </summary>
    public ComplianceLevel ComplianceLevel { get; set; }

    /// <summary>
    /// List of compliance violations found
    /// </summary>
    public List<string> ComplianceViolations { get; set; } = new();

    /// <summary>
    /// Whether data minimization principles were applied
    /// </summary>
    public bool DataMinimizationApplied { get; set; }

    /// <summary>
    /// Fields that require explicit user consent
    /// </summary>
    public List<string> ConsentRequiredFields { get; set; } = new();

    /// <summary>
    /// Additional compliance metadata
    /// </summary>
    public Dictionary<string, string> ComplianceMetadata { get; set; } = new();

    /// <summary>
    /// When this compliance check was performed
    /// </summary>
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who requested the compliance check
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Club context for the compliance check
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Navigation property to the export request
    /// </summary>
    public virtual ExportRequest? ExportRequest { get; set; }
}