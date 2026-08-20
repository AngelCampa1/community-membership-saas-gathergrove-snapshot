using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents an export request for data
/// US-005 Data Export & Reporting Engine - Export request tracking
/// </summary>
public class ExportRequest
{
    /// <summary>
    /// Unique identifier for the export request
    /// </summary>
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// The club this export request belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// User who requested the export
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Type of export (Members, Financial, etc.)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string ExportType { get; set; } = string.Empty;

    /// <summary>
    /// Export format
    /// </summary>
    [Required]
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Current status of the export
    /// </summary>
    [Required]
    public ExportStatus Status { get; set; }

    /// <summary>
    /// Generated filename
    /// </summary>
    [StringLength(200)]
    public string? FileName { get; set; }

    /// <summary>
    /// File size in bytes (when completed)
    /// </summary>
    public long? FileSizeBytes { get; set; }

    /// <summary>
    /// File path or URL to the exported file
    /// </summary>
    [StringLength(500)]
    public string? FilePath { get; set; }

    /// <summary>
    /// Email for completion notification
    /// </summary>
    [StringLength(255)]
    public string? NotificationEmail { get; set; }

    /// <summary>
    /// When the export was requested
    /// </summary>
    [Required]
    public DateTime RequestedAt { get; set; }

    /// <summary>
    /// When the export was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Error message if export failed
    /// </summary>
    [StringLength(1000)]
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Export options (JSON serialized)
    /// </summary>
    public string? OptionsJson { get; set; }

    /// <summary>
    /// Navigation property for the club
    /// </summary>
    public virtual Club Club { get; set; } = null!;
}