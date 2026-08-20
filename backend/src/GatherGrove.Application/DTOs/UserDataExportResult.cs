namespace GatherGrove.Application.DTOs;

/// <summary>
/// Result of user data export operation
/// </summary>
public class UserDataExportResult
{
    /// <summary>
    /// Unique identifier for this export
    /// </summary>
    public Guid ExportId { get; set; }

    /// <summary>
    /// Status of the export operation
    /// </summary>
    public string Status { get; set; } = "Completed";

    /// <summary>
    /// Path where the export file is stored
    /// </summary>
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// Size of the export file in bytes
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// Format of the export
    /// </summary>
    public string Format { get; set; } = "json";

    /// <summary>
    /// When the export was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the export expires
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// List of data categories included in export
    /// </summary>
    public List<string> IncludedCategories { get; set; } = new();

    /// <summary>
    /// Whether media files were included
    /// </summary>
    public bool IncludesMedia { get; set; } = false;

    /// <summary>
    /// Any warnings or messages about the export
    /// </summary>
    public List<string> Messages { get; set; } = new();
}