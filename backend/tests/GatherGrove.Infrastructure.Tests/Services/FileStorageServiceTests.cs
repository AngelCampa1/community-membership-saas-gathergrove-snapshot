using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Infrastructure.Services.Storage;

namespace GatherGrove.Infrastructure.Tests.Services;

/// <summary>
/// Tests for FileStorageService - File upload/delete operations using mock storage
/// </summary>
[TestFixture]
public class FileStorageServiceTests
{
    private Mock<ILogger<FileStorageService>> _mockLogger = null!;
    private FileStorageService _fileStorageService = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<FileStorageService>>();
        _fileStorageService = new FileStorageService(_mockLogger.Object);
    }

    #region IsValidImageFile Tests (5 tests)

    [Test]
    public void IsValidImageFile_ValidJpegFile_ReturnsTrue()
    {
        var mockFile = CreateMockFile("test.jpg", "image/jpeg", 1024);
        Assert.That(_fileStorageService.IsValidImageFile(mockFile.Object), Is.True);
    }

    [Test]
    public void IsValidImageFile_ValidPngFile_ReturnsTrue()
    {
        var mockFile = CreateMockFile("test.png", "image/png", 1024);
        Assert.That(_fileStorageService.IsValidImageFile(mockFile.Object), Is.True);
    }

    [Test]
    public void IsValidImageFile_InvalidFileType_ReturnsFalse()
    {
        var mockFile = CreateMockFile("test.pdf", "application/pdf", 1024);
        Assert.That(_fileStorageService.IsValidImageFile(mockFile.Object), Is.False);
    }

    [Test]
    public void IsValidImageFile_NullFile_ReturnsFalse()
    {
        Assert.That(_fileStorageService.IsValidImageFile(null!), Is.False);
    }

    [Test]
    public void IsValidImageFile_CaseInsensitive_ReturnsTrue()
    {
        var mockFile = CreateMockFile("test.jpg", "IMAGE/JPEG", 1024);
        Assert.That(_fileStorageService.IsValidImageFile(mockFile.Object), Is.True);
    }

    #endregion

    #region IsValidFileSize Tests (6 tests)

    [Test]
    public void IsValidFileSize_ValidSizeWithinLimit_ReturnsTrue()
    {
        var mockFile = CreateMockFile("test.jpg", "image/jpeg", 1024);
        Assert.That(_fileStorageService.IsValidFileSize(mockFile.Object, 5 * 1024 * 1024), Is.True);
    }

    [Test]
    public void IsValidFileSize_SizeExceedsLimit_ReturnsFalse()
    {
        var mockFile = CreateMockFile("test.jpg", "image/jpeg", 6 * 1024 * 1024);
        Assert.That(_fileStorageService.IsValidFileSize(mockFile.Object, 5 * 1024 * 1024), Is.False);
    }

    [Test]
    public void IsValidFileSize_EmptyFile_ReturnsFalse()
    {
        var mockFile = CreateMockFile("test.jpg", "image/jpeg", 0);
        Assert.That(_fileStorageService.IsValidFileSize(mockFile.Object, 5 * 1024 * 1024), Is.False);
    }

    [Test]
    public void IsValidFileSize_NullFile_ReturnsFalse()
    {
        Assert.That(_fileStorageService.IsValidFileSize(null!, 5 * 1024 * 1024), Is.False);
    }

    [Test]
    public void IsValidFileSize_ExactlyAtLimit_ReturnsTrue()
    {
        var maxSize = 5 * 1024 * 1024;
        var mockFile = CreateMockFile("test.jpg", "image/jpeg", maxSize);
        Assert.That(_fileStorageService.IsValidFileSize(mockFile.Object, maxSize), Is.True);
    }

    [Test]
    public void IsValidFileSize_NegativeSize_ReturnsFalse()
    {
        var mockFile = CreateMockFile("test.jpg", "image/jpeg", -100);
        Assert.That(_fileStorageService.IsValidFileSize(mockFile.Object, 5 * 1024 * 1024), Is.False);
    }

    #endregion

    #region UploadFileAsync Tests (6 tests)

    [Test]
    public async Task UploadFileAsync_ValidFile_ReturnsValidMockUrl()
    {
        var mockFile = CreateMockFile("logo.png", "image/png", 1024);
        var result = await _fileStorageService.UploadFileAsync(mockFile.Object, "branding", "club-logo");

        Assert.That(result, Does.StartWith("https://storage.gathergrove.club/"));
        Assert.That(result, Does.Contain("branding"));
        Assert.That(result, Does.Contain("club-logo"));
        Assert.That(result, Does.Contain(".png"));
    }

    [Test]
    public void UploadFileAsync_InvalidFileType_ThrowsArgumentException()
    {
        var mockFile = CreateMockFile("document.pdf", "application/pdf", 1024);
        Assert.ThrowsAsync<ArgumentException>(async () =>
            await _fileStorageService.UploadFileAsync(mockFile.Object, "documents", "test"));
    }

    [Test]
    public void UploadFileAsync_FileTooLarge_ThrowsArgumentException()
    {
        var mockFile = CreateMockFile("huge.jpg", "image/jpeg", 10 * 1024 * 1024);
        Assert.ThrowsAsync<ArgumentException>(async () =>
            await _fileStorageService.UploadFileAsync(mockFile.Object, "images", "test"));
    }

    [Test]
    public async Task UploadFileAsync_FileNameIncludesGuid_EnsuresUniqueness()
    {
        var mockFile = CreateMockFile("logo.png", "image/png", 1024);
        var result1 = await _fileStorageService.UploadFileAsync(mockFile.Object, "branding", "club-logo");
        var result2 = await _fileStorageService.UploadFileAsync(mockFile.Object, "branding", "club-logo");
        Assert.That(result1, Is.Not.EqualTo(result2));
    }

    [Test]
    public async Task UploadFileAsync_LogsWarning()
    {
        var mockFile = CreateMockFile("logo.png", "image/png", 1024);
        await _fileStorageService.UploadFileAsync(mockFile.Object, "branding", "club-logo");

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("mock URL")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task UploadFileAsync_PreservesFileExtension()
    {
        var mockFile = CreateMockFile("image.webp", "image/webp", 1024);
        var result = await _fileStorageService.UploadFileAsync(mockFile.Object, "images", "profile");
        Assert.That(result, Does.EndWith(".webp"));
    }

    #endregion

    #region DeleteFileAsync Tests (3 tests)

    [Test]
    public async Task DeleteFileAsync_CompletesWithoutError()
    {
        Assert.DoesNotThrowAsync(async () =>
            await _fileStorageService.DeleteFileAsync("https://storage.gathergrove.club/branding/logo.png"));
    }

    [Test]
    public async Task DeleteFileAsync_LogsWarning()
    {
        await _fileStorageService.DeleteFileAsync("https://storage.gathergrove.club/branding/logo.png");

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("mock storage")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task DeleteFileAsync_NullUrl_CompletesWithoutError()
    {
        Assert.DoesNotThrowAsync(async () =>
            await _fileStorageService.DeleteFileAsync(null!));
    }

    #endregion

    #region Additional Validation Tests

    [Test]
    public void IsValidImageFile_GifFormat_ReturnsTrue()
    {
        var mockFile = CreateMockFile("animation.gif", "image/gif", 1024);
        Assert.That(_fileStorageService.IsValidImageFile(mockFile.Object), Is.True);
    }

    [Test]
    public void IsValidImageFile_WebPFormat_ReturnsTrue()
    {
        var mockFile = CreateMockFile("modern.webp", "image/webp", 1024);
        Assert.That(_fileStorageService.IsValidImageFile(mockFile.Object), Is.True);
    }

    [Test]
    public void IsValidImageFile_EmptyContentType_ReturnsFalse()
    {
        var mockFile = CreateMockFile("test.jpg", "", 1024);
        Assert.That(_fileStorageService.IsValidImageFile(mockFile.Object), Is.False);
    }

    [Test]
    public async Task UploadFileAsync_EmptyFolder_ReturnsValidUrl()
    {
        var mockFile = CreateMockFile("logo.png", "image/png", 1024);
        var result = await _fileStorageService.UploadFileAsync(mockFile.Object, "", "test");
        Assert.That(result, Does.StartWith("https://storage.gathergrove.club/"));
        Assert.That(result, Does.Contain("/test-"));
    }

    [Test]
    public async Task UploadFileAsync_FolderWithSpecialChars_HandlesCorrectly()
    {
        var mockFile = CreateMockFile("logo.png", "image/png", 1024);
        var folder = "club-123/branding";
        var result = await _fileStorageService.UploadFileAsync(mockFile.Object, folder, "logo");
        Assert.That(result, Does.Contain(folder));
    }

    [Test]
    public async Task UploadFileAsync_VeryLongFileName_HandlesCorrectly()
    {
        var mockFile = CreateMockFile("test.jpg", "image/jpeg", 1024);
        var longFileName = new string('a', 200);
        var result = await _fileStorageService.UploadFileAsync(mockFile.Object, "images", longFileName);
        Assert.That(result, Does.Contain(longFileName));
        Assert.That(result, Does.Contain(".jpg"));
    }

    [Test]
    public async Task DeleteFileAsync_EmptyUrl_CompletesWithoutError()
    {
        Assert.DoesNotThrowAsync(async () =>
            await _fileStorageService.DeleteFileAsync(""));
    }

    [Test]
    public async Task UploadFileAsync_FileWithoutExtension_HandlesCorrectly()
    {
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.FileName).Returns("noextension");
        mockFile.Setup(f => f.ContentType).Returns("image/jpeg");
        mockFile.Setup(f => f.Length).Returns(1024);
        mockFile.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(new byte[1024]));

        var result = await _fileStorageService.UploadFileAsync(mockFile.Object, "images", "test");
        Assert.That(result, Does.Contain("test-"));
    }

    [Test]
    public async Task UploadFileAsync_MultipleExtensions_PreservesLast()
    {
        var mockFile = CreateMockFile("archive.tar.gz", "image/jpeg", 1024);
        var result = await _fileStorageService.UploadFileAsync(mockFile.Object, "files", "backup");
        Assert.That(result, Does.EndWith(".gz"));
    }

    #endregion

    #region Helper Methods

    private Mock<IFormFile> CreateMockFile(string fileName, string contentType, long length)
    {
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.FileName).Returns(fileName);
        mockFile.Setup(f => f.ContentType).Returns(contentType);
        mockFile.Setup(f => f.Length).Returns(length);
        var streamLength = length > 0 ? length : 0;
        mockFile.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(new byte[streamLength]));
        return mockFile;
    }

    #endregion
}
