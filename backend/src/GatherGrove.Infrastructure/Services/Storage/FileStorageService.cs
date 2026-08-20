using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Infrastructure.Services.Storage;

/// <summary>
/// File storage service — returns mock URLs (no external storage configured)
/// </summary>
public class FileStorageService : IFileStorageService
{
    private readonly ILogger<FileStorageService> _logger;

    private static readonly string[] AllowedImageTypes = { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
    private const long DefaultMaxFileSize = 5 * 1024 * 1024; // 5MB

    public FileStorageService(ILogger<FileStorageService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Returns a mock storage URL (file upload not yet configured)
    /// </summary>
    public Task<string> UploadFileAsync(IFormFile file, string folder, string fileName)
    {
        _logger.LogInformation("Uploading file {FileName} to {Folder}", fileName, folder);

        if (!IsValidImageFile(file))
            throw new ArgumentException("Invalid file type");

        if (!IsValidFileSize(file, DefaultMaxFileSize))
            throw new ArgumentException("File size exceeds limit");

        var fileExtension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{fileName}-{Guid.NewGuid()}{fileExtension}";
        var mockUrl = $"https://storage.gathergrove.club/{folder}/{uniqueFileName}";

        _logger.LogWarning("File upload returning mock URL for {FileName}", uniqueFileName);
        return Task.FromResult(mockUrl);
    }

    /// <summary>
    /// No-op delete (mock storage)
    /// </summary>
    public Task DeleteFileAsync(string fileUrl)
    {
        _logger.LogWarning("File delete skipped (mock storage): {FileUrl}", fileUrl);
        return Task.CompletedTask;
    }

    public bool IsValidImageFile(IFormFile file)
    {
        if (file == null || string.IsNullOrEmpty(file.ContentType))
            return false;

        return AllowedImageTypes.Contains(file.ContentType.ToLower());
    }

    public bool IsValidFileSize(IFormFile file, long maxSizeBytes)
    {
        return file != null && file.Length > 0 && file.Length <= maxSizeBytes;
    }
}
