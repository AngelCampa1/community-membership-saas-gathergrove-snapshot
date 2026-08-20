namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Result for file download operations
/// </summary>
public class FileDownloadResult
{
    /// <summary>
    /// File content as byte array
    /// </summary>
    public byte[] Content { get; set; } = Array.Empty<byte>();

    /// <summary>
    /// MIME content type
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// File name for download
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSize => Content.Length;
}