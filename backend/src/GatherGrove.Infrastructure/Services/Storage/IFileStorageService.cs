using Microsoft.AspNetCore.Http;

namespace GatherGrove.Infrastructure.Services.Storage;

/// <summary>
/// Service interface for file storage operations
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Uploads a file to storage
    /// </summary>
    /// <param name="file">The file to upload</param>
    /// <param name="folder">The folder to upload to</param>
    /// <param name="fileName">The custom file name (without extension)</param>
    /// <returns>The URL of the uploaded file</returns>
    Task<string> UploadFileAsync(IFormFile file, string folder, string fileName);

    /// <summary>
    /// Deletes a file from storage
    /// </summary>
    /// <param name="fileUrl">The URL of the file to delete</param>
    /// <returns>Task</returns>
    Task DeleteFileAsync(string fileUrl);

    /// <summary>
    /// Validates if a file is an allowed image type
    /// </summary>
    /// <param name="file">The file to validate</param>
    /// <returns>True if valid image file</returns>
    bool IsValidImageFile(IFormFile file);

    /// <summary>
    /// Validates if a file size is within allowed limits
    /// </summary>
    /// <param name="file">The file to validate</param>
    /// <param name="maxSizeBytes">Maximum allowed size in bytes</param>
    /// <returns>True if file size is valid</returns>
    bool IsValidFileSize(IFormFile file, long maxSizeBytes);
}