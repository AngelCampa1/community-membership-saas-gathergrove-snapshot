using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for GDPR-compliant data export operations
/// </summary>
public interface IDataExportService
{
    /// <summary>
    /// Exports all user data in GDPR-compliant format
    /// </summary>
    /// <param name="userId">User ID to export data for</param>
    /// <returns>Export result with download information</returns>
    Task<DataExportResult> ExportUserDataAsync(int userId);

    /// <summary>
    /// Gets the status of a data export request
    /// </summary>
    /// <param name="exportId">Export request ID</param>
    /// <returns>Current status of the export</returns>
    Task<DataExportStatus> GetExportStatusAsync(Guid exportId);

    /// <summary>
    /// Downloads the exported data file
    /// </summary>
    /// <param name="exportId">Export request ID</param>
    /// <returns>File stream for download</returns>
    Task<Stream> DownloadExportAsync(Guid exportId);

    /// <summary>
    /// Cleans up expired export files
    /// </summary>
    /// <returns>Number of files cleaned up</returns>
    Task<int> CleanupExpiredExportsAsync();
}

/// <summary>
/// Result of a data export operation
/// </summary>
public class DataExportResult
{
    public Guid ExportId { get; set; }
    public string DownloadUrl { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string Format { get; set; } = "ZIP";
    public List<string> IncludedDataCategories { get; set; } = new();
}

/// <summary>
/// Status of a data export request
/// </summary>
public class DataExportStatus
{
    public Guid ExportId { get; set; }
    public DataExportState State { get; set; }
    public int ProgressPercentage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Data export state
/// </summary>
public enum DataExportState
{
    Pending,
    InProgress,
    Completed,
    Failed,
    Expired
}