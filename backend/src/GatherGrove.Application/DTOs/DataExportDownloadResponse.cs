namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing data export file for download
/// </summary>
public class DataExportDownloadResponse
{
    /// <summary>
    /// The file content as a byte array
    /// </summary>
    public byte[] FileContent { get; set; } = Array.Empty<byte>();

    /// <summary>
    /// The MIME content type of the file
    /// </summary>
    public string ContentType { get; set; } = "application/json";

    /// <summary>
    /// The suggested file name for download
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Size of the file in bytes
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// When the export was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the export expires
    /// </summary>
    public DateTime ExpiresAt { get; set; }
}