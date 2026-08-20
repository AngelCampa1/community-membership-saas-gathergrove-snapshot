namespace GatherGrove.Application.DTOs.Branding;

/// <summary>
/// Response DTO for logo upload operations
/// </summary>
public class LogoUploadResponse
{
    /// <summary>
    /// URL to the uploaded logo file
    /// </summary>
    public string LogoUrl { get; set; } = string.Empty;

    /// <summary>
    /// When the logo was uploaded
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