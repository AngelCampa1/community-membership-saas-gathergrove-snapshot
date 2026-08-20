namespace GatherGrove.Application.DTOs;

/// <summary>
/// Download information for user data export
/// </summary>
public class UserDataExportDownload
{
    /// <summary>
    /// The file content as a byte array
    /// </summary>
    public byte[] FileContent { get; set; } = Array.Empty<byte>();

    /// <summary>
    /// The MIME content type
    /// </summary>
    public string ContentType { get; set; } = "application/json";

    /// <summary>
    /// The suggested file name
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Size of the file in bytes
    /// </summary>
    public long FileSize { get; set; }
}