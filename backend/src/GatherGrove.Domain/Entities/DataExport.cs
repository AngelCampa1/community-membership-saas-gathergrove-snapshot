using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a user data export for GDPR/CCPA compliance
/// </summary>
public class DataExport
{
    /// <summary>
    /// Unique identifier for the data export
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// User ID whose data was exported
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Type of export (AccountDeletion, UserRequest, Legal)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string ExportType { get; set; } = "AccountDeletion";

    /// <summary>
    /// Current status of the export
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Requested";

    /// <summary>
    /// File path where export is stored
    /// </summary>
    [StringLength(500)]
    public string? FilePath { get; set; }

    /// <summary>
    /// Original file name for download
    /// </summary>
    [StringLength(255)]
    public string? FileName { get; set; }

    /// <summary>
    /// File size in bytes
    /// </summary>
    [Required]
    public long FileSizeBytes { get; set; } = 0;

    /// <summary>
    /// Comma-separated list of data categories included
    /// </summary>
    [Required]
    [StringLength(1000)]
    public string Categories { get; set; } = string.Empty;

    /// <summary>
    /// JSON object containing count of items per category
    /// </summary>
    public string? ItemCounts { get; set; }

    /// <summary>
    /// Export format (JSON, CSV, PDF, XML)
    /// </summary>
    [Required]
    [StringLength(20)]
    public string ExportFormat { get; set; } = "JSON";

    /// <summary>
    /// Compression level used (0-9)
    /// </summary>
    [Required]
    public int CompressionLevel { get; set; } = 6;

    /// <summary>
    /// When the export was requested
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the export was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// When the export expires and will be deleted
    /// </summary>
    [Required]
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Number of times this export has been downloaded
    /// </summary>
    [Required]
    public int DownloadCount { get; set; } = 0;

    /// <summary>
    /// When the export was last downloaded
    /// </summary>
    public DateTime? LastDownloadedAt { get; set; }

    /// <summary>
    /// Error messages if export failed
    /// </summary>
    public string? ErrorMessages { get; set; }

    /// <summary>
    /// Navigation property for the user whose data was exported
    /// </summary>
    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;
}