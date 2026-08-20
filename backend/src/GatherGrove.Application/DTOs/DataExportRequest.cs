namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for data export
/// </summary>
public class DataExportRequest
{
    /// <summary>
    /// Format for the export
    /// </summary>
    public string Format { get; set; } = "json";

    /// <summary>
    /// Whether to include media files
    /// </summary>
    public bool IncludeMedia { get; set; } = false;

    /// <summary>
    /// Data categories to include
    /// </summary>
    public List<string> DataCategories { get; set; } = new();
}