using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents audit information for export operations
/// </summary>
public class ExportAuditInfo
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Export request ID this audit info belongs to
    /// </summary>
    public int ExportRequestId { get; set; }

    /// <summary>
    /// User who performed the export
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Club context for the export
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Export format used
    /// </summary>
    public ExportFormat ExportFormat { get; set; }

    /// <summary>
    /// File size in bytes of the exported data
    /// </summary>
    public long FileSizeBytes { get; set; }

    /// <summary>
    /// IP address from which the export was requested
    /// </summary>
    public string IPAddress { get; set; } = string.Empty;

    /// <summary>
    /// User agent string from the request
    /// </summary>
    public string UserAgent { get; set; } = string.Empty;

    /// <summary>
    /// Export type category
    /// </summary>
    public ExportType ExportType { get; set; }

    /// <summary>
    /// Additional audit metadata
    /// </summary>
    public Dictionary<string, string> AuditMetadata { get; set; } = new();

    /// <summary>
    /// When the export was initiated
    /// </summary>
    public DateTime ExportedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Duration of the export operation
    /// </summary>
    public TimeSpan ExportDuration { get; set; }

    /// <summary>
    /// Whether the export was successful
    /// </summary>
    public bool IsSuccessful { get; set; }

    /// <summary>
    /// Error message if the export failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Navigation property to the export request
    /// </summary>
    public virtual ExportRequest? ExportRequest { get; set; }
}