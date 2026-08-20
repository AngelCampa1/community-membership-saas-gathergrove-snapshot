namespace GatherGrove.Application.DTOs;

/// <summary>
/// Information about a data category for export
/// </summary>
public class DataCategoryInfo
{
    /// <summary>
    /// Name of the data category
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the data category
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Whether this category is included by default
    /// </summary>
    public bool IncludedByDefault { get; set; } = true;

    /// <summary>
    /// Estimated size of this category in bytes
    /// </summary>
    public long EstimatedSize { get; set; }

    /// <summary>
    /// Number of records in this category
    /// </summary>
    public int RecordCount { get; set; }
}