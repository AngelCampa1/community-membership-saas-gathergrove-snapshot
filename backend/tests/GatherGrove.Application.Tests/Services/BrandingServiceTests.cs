using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services.Branding;
using GatherGrove.Application.DTOs.Branding;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Services.Storage;
using Microsoft.AspNetCore.Http;
using GatherGrove.Application.Services.Security;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class BrandingServiceTests
{
    private BrandingService _service;
    private Mock<IBrandingRepository> _mockBrandingRepository;
    private Mock<IClubRepository> _mockClubRepository;
    private Mock<IFileStorageService> _mockFileStorageService;
    private Mock<ILogger<BrandingService>> _mockLogger;
    private const int TestUserId = 1;
    private const int TestClubId = 1;

    [SetUp]
    public void Setup()
    {
        _mockBrandingRepository = new Mock<IBrandingRepository>();
        _mockClubRepository = new Mock<IClubRepository>();
        _mockFileStorageService = new Mock<IFileStorageService>();
        _mockLogger = new Mock<ILogger<BrandingService>>();
        var mockSanitizationService = new Mock<IContentSanitizationService>();

        _service = new BrandingService(
            _mockBrandingRepository.Object,
            _mockClubRepository.Object,
            _mockFileStorageService.Object,
            mockSanitizationService.Object,
            _mockLogger.Object);
    }

    #region GetBrandingAsync Tests

    [Test]
    public async Task GetBrandingAsync_WithValidClubId_ReturnsBranding()
    {
        // Arrange
        var clubBranding = new ClubBranding
        {
            ClubId = TestClubId,
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            FontFamily = "Arial",
            LogoUrl = "https://example.com/logo.png",
            CustomCSS = ".test { color: red; }",
            WhiteLabelDomain = "myclub.com",
            FacebookUrl = "https://facebook.com/myclub",
            TwitterUrl = "https://twitter.com/myclub",
            InstagramUrl = "https://instagram.com/myclub",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club { Id = TestClubId, Tier = "Unlimited" };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync(clubBranding);

        // Act
        var result = await _service.GetBrandingAsync(TestClubId, TestUserId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubId, Is.EqualTo(TestClubId));
        Assert.That(result.PrimaryColor, Is.EqualTo("#FF0000"));
        Assert.That(result.SecondaryColor, Is.EqualTo("#00FF00"));
        Assert.That(result.FontFamily, Is.EqualTo("Arial"));
    }

    [Test]
    public void GetBrandingAsync_WhenUserNotAdmin_ThrowsUnauthorizedException()
    {
        // Arrange
        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ThrowsAsync(new UnauthorizedAccessException("User is not an admin"));

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.GetBrandingAsync(TestClubId, TestUserId));
    }

    [Test]
    public void GetBrandingAsync_WhenClubNotUnlimited_ThrowsInvalidOperationException()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Grow" };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        // Act & Assert
        Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.GetBrandingAsync(TestClubId, TestUserId));
    }

    [Test]
    public void GetBrandingAsync_WhenBrandingNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync((ClubBranding)null);

        // Act & Assert
        Assert.ThrowsAsync<KeyNotFoundException>(
            () => _service.GetBrandingAsync(TestClubId, TestUserId));
    }

    #endregion

    #region CreateBrandingAsync Tests

    [Test]
    public async Task CreateBrandingAsync_WithValidRequest_CreatesAndReturnsResponse()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var request = new CreateBrandingRequest
        {
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            FontFamily = "Arial",
            CustomCSS = ".test { color: red; }",
            WhiteLabelDomain = "myclub.com"
        };

        var createdBranding = new ClubBranding
        {
            ClubId = TestClubId,
            PrimaryColor = request.PrimaryColor,
            SecondaryColor = request.SecondaryColor,
            FontFamily = request.FontFamily,
            CustomCSS = request.CustomCSS,
            WhiteLabelDomain = request.WhiteLabelDomain,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync((ClubBranding)null);

        _mockBrandingRepository
            .Setup(r => r.AddAsync(It.IsAny<ClubBranding>()))
            .ReturnsAsync(createdBranding);

        // Act
        var result = await _service.CreateBrandingAsync(TestClubId, TestUserId, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubId, Is.EqualTo(TestClubId));
        Assert.That(result.PrimaryColor, Is.EqualTo("#FF0000"));
        _mockBrandingRepository.Verify(r => r.AddAsync(It.IsAny<ClubBranding>()), Times.Once);
    }

    [Test]
    public void CreateBrandingAsync_WhenBrandingAlreadyExists_ThrowsInvalidOperationException()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var request = new CreateBrandingRequest { PrimaryColor = "#FF0000" };
        var existingBranding = new ClubBranding { ClubId = TestClubId };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync(existingBranding);

        // Act & Assert
        Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreateBrandingAsync(TestClubId, TestUserId, request));
    }

    #endregion

    #region UpdateBrandingAsync Tests

    [Test]
    public async Task UpdateBrandingAsync_WithValidRequest_UpdatesAndReturnsResponse()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var request = new UpdateBrandingRequest
        {
            PrimaryColor = "#FF0000",
            FontFamily = "Helvetica"
        };

        var existingBranding = new ClubBranding
        {
            ClubId = TestClubId,
            PrimaryColor = "#000000",
            SecondaryColor = "#FFFFFF",
            FontFamily = "Arial",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        var updatedBranding = new ClubBranding
        {
            ClubId = TestClubId,
            PrimaryColor = "#FF0000",
            SecondaryColor = "#FFFFFF",
            FontFamily = "Helvetica",
            CreatedAt = existingBranding.CreatedAt,
            UpdatedAt = DateTime.UtcNow
        };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync(existingBranding);

        _mockBrandingRepository
            .Setup(r => r.UpdateAsync(It.IsAny<ClubBranding>()))
            .ReturnsAsync(updatedBranding);

        // Act
        var result = await _service.UpdateBrandingAsync(TestClubId, TestUserId, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.PrimaryColor, Is.EqualTo("#FF0000"));
        Assert.That(result.FontFamily, Is.EqualTo("Helvetica"));
        _mockBrandingRepository.Verify(r => r.UpdateAsync(It.IsAny<ClubBranding>()), Times.Once);
    }

    [Test]
    public void UpdateBrandingAsync_WhenBrandingNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var request = new UpdateBrandingRequest { PrimaryColor = "#FF0000" };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync((ClubBranding)null);

        // Act & Assert
        Assert.ThrowsAsync<KeyNotFoundException>(
            () => _service.UpdateBrandingAsync(TestClubId, TestUserId, request));
    }

    #endregion

    #region DeleteBrandingAsync Tests

    [Test]
    public async Task DeleteBrandingAsync_WithValidClubId_DeletesBranding()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var existingBranding = new ClubBranding
        {
            ClubId = TestClubId,
            LogoUrl = "https://example.com/logo.png"
        };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync(existingBranding);

        _mockBrandingRepository
            .Setup(r => r.DeleteAsync(existingBranding))
            .Returns(Task.CompletedTask);

        _mockFileStorageService
            .Setup(s => s.DeleteFileAsync("https://example.com/logo.png"))
            .Returns(Task.CompletedTask);

        // Act
        await _service.DeleteBrandingAsync(TestClubId, TestUserId);

        // Assert
        _mockBrandingRepository.Verify(r => r.DeleteAsync(existingBranding), Times.Once);
        _mockFileStorageService.Verify(s => s.DeleteFileAsync("https://example.com/logo.png"), Times.Once);
    }

    [Test]
    public void DeleteBrandingAsync_WhenBrandingNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync((ClubBranding)null);

        // Act & Assert
        Assert.ThrowsAsync<KeyNotFoundException>(
            () => _service.DeleteBrandingAsync(TestClubId, TestUserId));
    }

    #endregion

    #region UploadLogoAsync Tests

    [Test]
    public async Task UploadLogoAsync_WithValidFile_UploadsAndReturnsResponse()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(1024);
        mockFile.Setup(f => f.ContentType).Returns("image/png");
        mockFile.Setup(f => f.FileName).Returns("logo.png");

        var uploadedUrl = "https://storage.example.com/logos/club-1-logo.png";

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockFileStorageService
            .Setup(s => s.UploadFileAsync(mockFile.Object, "logos", $"club-{TestClubId}-logo"))
            .ReturnsAsync(uploadedUrl);

        // Act
        var result = await _service.UploadLogoAsync(TestClubId, TestUserId, mockFile.Object);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.LogoUrl, Is.EqualTo(uploadedUrl));
        _mockFileStorageService.Verify(
            s => s.UploadFileAsync(mockFile.Object, "logos", $"club-{TestClubId}-logo"),
            Times.Once);
    }

    [Test]
    public void UploadLogoAsync_WithInvalidFileType_ThrowsArgumentException()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.ContentType).Returns("text/plain");

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(
            () => _service.UploadLogoAsync(TestClubId, TestUserId, mockFile.Object));
    }

    [Test]
    public void UploadLogoAsync_WithOversizedFile_ThrowsArgumentException()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(6 * 1024 * 1024); // 6MB (over 5MB limit)
        mockFile.Setup(f => f.ContentType).Returns("image/png");

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(
            () => _service.UploadLogoAsync(TestClubId, TestUserId, mockFile.Object));
    }

    #endregion

    #region UploadFaviconAsync Tests

    [Test]
    public async Task UploadFaviconAsync_WithValidFile_UploadsAndReturnsResponse()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(512);
        mockFile.Setup(f => f.ContentType).Returns("image/png");
        mockFile.Setup(f => f.FileName).Returns("favicon.png");

        var uploadedUrl = "https://storage.example.com/favicons/club-1-favicon.png";

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockFileStorageService
            .Setup(s => s.UploadFileAsync(mockFile.Object, "favicons", $"club-{TestClubId}-favicon"))
            .ReturnsAsync(uploadedUrl);

        // Act
        var result = await _service.UploadFaviconAsync(TestClubId, TestUserId, mockFile.Object);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FaviconUrl, Is.EqualTo(uploadedUrl));
        Assert.That(result.FileSizeBytes, Is.EqualTo(512));
        Assert.That(result.ContentType, Is.EqualTo("image/png"));
        _mockFileStorageService.Verify(
            s => s.UploadFileAsync(mockFile.Object, "favicons", $"club-{TestClubId}-favicon"),
            Times.Once);
    }

    [Test]
    public async Task UploadFaviconAsync_WithExistingBrandingAndOldFavicon_UpdatesAndDeletesOld()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(512);
        mockFile.Setup(f => f.ContentType).Returns("image/png");

        var oldFaviconUrl = "https://storage.example.com/favicons/old-favicon.png";
        var newFaviconUrl = "https://storage.example.com/favicons/club-1-favicon.png";

        var existingBranding = new ClubBranding
        {
            ClubId = TestClubId,
            FaviconUrl = oldFaviconUrl
        };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync(existingBranding);

        _mockFileStorageService
            .Setup(s => s.UploadFileAsync(mockFile.Object, "favicons", $"club-{TestClubId}-favicon"))
            .ReturnsAsync(newFaviconUrl);

        _mockFileStorageService
            .Setup(s => s.DeleteFileAsync(oldFaviconUrl))
            .Returns(Task.CompletedTask);

        _mockBrandingRepository
            .Setup(r => r.UpdateAsync(It.IsAny<ClubBranding>()))
            .ReturnsAsync(existingBranding);

        // Act
        var result = await _service.UploadFaviconAsync(TestClubId, TestUserId, mockFile.Object);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FaviconUrl, Is.EqualTo(newFaviconUrl));
        _mockFileStorageService.Verify(s => s.DeleteFileAsync(oldFaviconUrl), Times.Once);
        _mockBrandingRepository.Verify(r => r.UpdateAsync(It.Is<ClubBranding>(
            b => b.FaviconUrl == newFaviconUrl)), Times.Once);
    }

    [Test]
    public async Task UploadFaviconAsync_WithNoBranding_CreatesNewBrandingWithFavicon()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(512);
        mockFile.Setup(f => f.ContentType).Returns("image/png");

        var faviconUrl = "https://storage.example.com/favicons/club-1-favicon.png";

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync((ClubBranding)null);

        _mockFileStorageService
            .Setup(s => s.UploadFileAsync(mockFile.Object, "favicons", $"club-{TestClubId}-favicon"))
            .ReturnsAsync(faviconUrl);

        _mockBrandingRepository
            .Setup(r => r.AddAsync(It.IsAny<ClubBranding>()))
            .ReturnsAsync((ClubBranding branding) => branding);

        // Act
        var result = await _service.UploadFaviconAsync(TestClubId, TestUserId, mockFile.Object);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FaviconUrl, Is.EqualTo(faviconUrl));
        _mockBrandingRepository.Verify(r => r.AddAsync(It.Is<ClubBranding>(
            b => b.ClubId == TestClubId && b.FaviconUrl == faviconUrl)), Times.Once);
    }

    [Test]
    public void UploadFaviconAsync_WithInvalidFileType_ThrowsArgumentException()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.ContentType).Returns("application/pdf");

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(
            () => _service.UploadFaviconAsync(TestClubId, TestUserId, mockFile.Object));
    }

    [Test]
    public void UploadFaviconAsync_WithOversizedFile_ThrowsArgumentException()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(6 * 1024 * 1024); // 6MB
        mockFile.Setup(f => f.ContentType).Returns("image/png");

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(
            () => _service.UploadFaviconAsync(TestClubId, TestUserId, mockFile.Object));
    }

    [Test]
    public void UploadFaviconAsync_WithNullFile_ThrowsArgumentException()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(
            () => _service.UploadFaviconAsync(TestClubId, TestUserId, null!));
    }

    #endregion

    #region UploadLogoAsync Additional Tests

    [Test]
    public async Task UploadLogoAsync_WithNoBranding_CreatesNewBrandingWithLogo()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(1024);
        mockFile.Setup(f => f.ContentType).Returns("image/jpeg");

        var logoUrl = "https://storage.example.com/logos/club-1-logo.jpg";

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync((ClubBranding)null);

        _mockFileStorageService
            .Setup(s => s.UploadFileAsync(mockFile.Object, "logos", $"club-{TestClubId}-logo"))
            .ReturnsAsync(logoUrl);

        _mockBrandingRepository
            .Setup(r => r.AddAsync(It.IsAny<ClubBranding>()))
            .ReturnsAsync((ClubBranding branding) => branding);

        // Act
        var result = await _service.UploadLogoAsync(TestClubId, TestUserId, mockFile.Object);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.LogoUrl, Is.EqualTo(logoUrl));
        _mockBrandingRepository.Verify(r => r.AddAsync(It.Is<ClubBranding>(
            b => b.ClubId == TestClubId && b.LogoUrl == logoUrl)), Times.Once);
    }

    [Test]
    public async Task UploadLogoAsync_WithExistingBrandingAndOldLogo_UpdatesAndDeletesOld()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(1024);
        mockFile.Setup(f => f.ContentType).Returns("image/png");

        var oldLogoUrl = "https://storage.example.com/logos/old-logo.png";
        var newLogoUrl = "https://storage.example.com/logos/club-1-logo.png";

        var existingBranding = new ClubBranding
        {
            ClubId = TestClubId,
            LogoUrl = oldLogoUrl
        };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        _mockBrandingRepository
            .Setup(r => r.GetByClubIdAsync(TestClubId))
            .ReturnsAsync(existingBranding);

        _mockFileStorageService
            .Setup(s => s.UploadFileAsync(mockFile.Object, "logos", $"club-{TestClubId}-logo"))
            .ReturnsAsync(newLogoUrl);

        _mockFileStorageService
            .Setup(s => s.DeleteFileAsync(oldLogoUrl))
            .Returns(Task.CompletedTask);

        _mockBrandingRepository
            .Setup(r => r.UpdateAsync(It.IsAny<ClubBranding>()))
            .ReturnsAsync(existingBranding);

        // Act
        var result = await _service.UploadLogoAsync(TestClubId, TestUserId, mockFile.Object);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.LogoUrl, Is.EqualTo(newLogoUrl));
        _mockFileStorageService.Verify(s => s.DeleteFileAsync(oldLogoUrl), Times.Once);
        _mockBrandingRepository.Verify(r => r.UpdateAsync(It.Is<ClubBranding>(
            b => b.LogoUrl == newLogoUrl)), Times.Once);
    }

    [Test]
    public void UploadLogoAsync_WithNullFile_ThrowsArgumentException()
    {
        // Arrange
        var club = new Club { Id = TestClubId, Tier = "Unlimited" };

        _mockClubRepository
            .Setup(r => r.GetClubWithAdminCheckAsync(TestClubId, TestUserId))
            .ReturnsAsync(club);

        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(
            () => _service.UploadLogoAsync(TestClubId, TestUserId, null!));
    }

    #endregion
}