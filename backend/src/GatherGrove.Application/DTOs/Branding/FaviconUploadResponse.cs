namespace GatherGrove.Application.DTOs.Branding;

/// <summary>
/// Response DTO for favicon upload operations
/// </summary>
public class FaviconUploadResponse
{
    /// <summary>
    /// URL to the uploaded favicon file
    /// </summary>
    public string FaviconUrl { get; set; } = string.Empty;

    /// <summary>
    /// When the favicon was uploaded
    /// </summary>
    public DateTime UploadedAt { get; set; }

    /// <summary>
    /// Size of the uploaded file in bytes
    /// </summary>
    public long FileSizeBytes { get; set; }

    /// <summary>
    /// Content type of the uploaded file
    /// </summary>
    public string ContentType { get; set; } = string.Empty;
}