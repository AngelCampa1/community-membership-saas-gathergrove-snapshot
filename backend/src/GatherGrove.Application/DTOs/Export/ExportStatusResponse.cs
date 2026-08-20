using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Response for export status queries
/// </summary>
public class ExportStatusResponse
{
    /// <summary>
    /// Export ID
    /// </summary>
    public string ExportId { get; set; } = string.Empty;

    /// <summary>
    /// Current status of the export
    /// </summary>
    public ExportStatus Status { get; set; }

    /// <summary>
    /// Progress percentage (0-100)
    /// </summary>
    public int ProgressPercentage { get; set; }

    /// <summary>
    /// Estimated completion time
    /// </summary>
    public DateTime? EstimatedCompletion { get; set; }

    /// <summary>
    /// Download URL if completed
    /// </summary>
    public string? DownloadUrl { get; set; }

    /// <summary>
    /// Error message if failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Progress as integer (0-100) - alternative name
    /// </summary>
    public int Progress { get; set; }

    /// <summary>
    /// Status message
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// When export was created
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// When export completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }
}