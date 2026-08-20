using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class BrandingServiceTests
{
    private BrandingService _brandingService;
    private GatherGroveDbContext _context;
    private Mock<ILogger<BrandingService>> _mockLogger;
    private Mock<IFileStorageService> _mockFileStorage;
    private Mock<IImageProcessingService> _mockImageProcessing;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<BrandingService>>();
        _mockFileStorage = new Mock<IFileStorageService>();
        _mockImageProcessing = new Mock<IImageProcessingService>();
        
        _brandingService = new BrandingService(
            _context, 
            _mockLogger.Object,
            _mockFileStorage.Object,
            _mockImageProcessing.Object
        );
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(User user, Club club)> CreateTestUserAndClub()
    {
        var user = new User
        {
            Id = 1,
            FullName = "Test Admin",
            Email = "admin@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Id = 1,
            Name = "Test Club",
            Tier = "Unlimited",
            BrandingSettings = new BrandingSettings
            {
                PrimaryColor = "#3B82F6",
                SecondaryColor = "#8B5CF6",
                LogoUrl = null,
                FaviconUrl = null,
                OrganizationName = "Test Club",
                CustomCss = null
            }
        };

        var clubAdmin = new ClubAdmin
        {
            User = user,
            Club = club
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        return (user, club);
    }

    [Test]
    public async Task GetBrandingSettingsAsync_WithValidAdmin_ReturnsSettings()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        // Act
        var result = await _brandingService.GetBrandingSettingsAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.PrimaryColor, Is.EqualTo("#3B82F6"));
        Assert.That(result.SecondaryColor, Is.EqualTo("#8B5CF6"));
        Assert.That(result.OrganizationName, Is.EqualTo("Test Club"));
    }

    [Test]
    public async Task GetBrandingSettingsAsync_WithNonExistentClub_ThrowsKeyNotFoundException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var nonExistentClubId = 999;

        // Act & Assert
        var exception = Assert.ThrowsAsync<KeyNotFoundException>(
            () => _brandingService.GetBrandingSettingsAsync(nonExistentClubId, user.Id));

        Assert.That(exception.Message, Does.Contain("Club not found"));
    }

    [Test]
    public async Task GetBrandingSettingsAsync_WithNonAdminUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var nonAdminUser = new User
        {
            Id = 2,
            FullName = "Non Admin",
            Email = "nonadmin@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(nonAdminUser);
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _brandingService.GetBrandingSettingsAsync(club.Id, nonAdminUser.Id));

        Assert.That(exception.Message, Does.Contain("not authorized"));
    }

    [Test]
    public async Task UpdateBrandingSettingsAsync_WithValidData_UpdatesSettings()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpdateBrandingSettingsRequest
        {
            PrimaryColor = "#FF5722",
            SecondaryColor = "#4CAF50",
            OrganizationName = "Updated Club Name",
            Tagline = "New tagline"
        };

        // Act
        var result = await _brandingService.UpdateBrandingSettingsAsync(club.Id, user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.PrimaryColor, Is.EqualTo("#FF5722"));
        Assert.That(result.SecondaryColor, Is.EqualTo("#4CAF50"));
        Assert.That(result.OrganizationName, Is.EqualTo("Updated Club Name"));
        Assert.That(result.Tagline, Is.EqualTo("New tagline"));

        // Verify database was updated
        var updatedClub = await _context.Clubs.Include(c => c.BrandingSettings)
            .FirstOrDefaultAsync(c => c.Id == club.Id);
        Assert.That(updatedClub.BrandingSettings.PrimaryColor, Is.EqualTo("#FF5722"));
    }

    [Test]
    public async Task UpdateBrandingSettingsAsync_WithInvalidColor_ThrowsArgumentException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpdateBrandingSettingsRequest
        {
            PrimaryColor = "invalid-color"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _brandingService.UpdateBrandingSettingsAsync(club.Id, user.Id, request));

        Assert.That(exception.Message, Does.Contain("Invalid color format"));
    }

    [Test]
    public async Task UpdateBrandingSettingsAsync_WithNonUnlimitedTier_ThrowsInvalidOperationException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        club.Tier = "Grow";
        await _context.SaveChangesAsync();
        
        var request = new UpdateBrandingSettingsRequest
        {
            PrimaryColor = "#FF5722"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _brandingService.UpdateBrandingSettingsAsync(club.Id, user.Id, request));

        Assert.That(exception.Message, Does.Contain("Branding features require Unlimited tier"));
    }

    [Test]
    public async Task UploadLogoAsync_WithValidFile_ReturnsLogoUrl()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(51200); // 50KB
        mockFile.Setup(f => f.ContentType).Returns("image/png");
        mockFile.Setup(f => f.FileName).Returns("logo.png");
        mockFile.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(new byte[51200]));
        
        var expectedUrl = "https://storage.example.com/logos/logo.png";
        
        _mockImageProcessing
            .Setup(s => s.ValidateImageAsync(It.IsAny<Stream>(), "image/png"))
            .ReturnsAsync(true);
        
        _mockImageProcessing
            .Setup(s => s.GetImageDimensionsAsync(It.IsAny<Stream>()))
            .ReturnsAsync(new { Width = 300, Height = 200 });
        
        _mockFileStorage
            .Setup(s => s.UploadFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), "image/png"))
            .ReturnsAsync(expectedUrl);

        // Act
        var result = await _brandingService.UploadLogoAsync(club.Id, user.Id, mockFile.Object);

        // Assert
        Assert.That(result, Is.EqualTo(expectedUrl));
        
        // Verify database was updated
        var updatedClub = await _context.Clubs.Include(c => c.BrandingSettings)
            .FirstOrDefaultAsync(c => c.Id == club.Id);
        Assert.That(updatedClub.BrandingSettings.LogoUrl, Is.EqualTo(expectedUrl));
    }

    [Test]
    public async Task UploadLogoAsync_WithOversizedFile_ThrowsArgumentException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(3 * 1024 * 1024); // 3MB
        mockFile.Setup(f => f.ContentType).Returns("image/png");
        mockFile.Setup(f => f.FileName).Returns("large-logo.png");

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _brandingService.UploadLogoAsync(club.Id, user.Id, mockFile.Object));

        Assert.That(exception.Message, Does.Contain("File size exceeds 2MB limit"));
    }

    [Test]
    public async Task UploadLogoAsync_WithInvalidFileType_ThrowsArgumentException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(51200);
        mockFile.Setup(f => f.ContentType).Returns("application/pdf");
        mockFile.Setup(f => f.FileName).Returns("document.pdf");

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _brandingService.UploadLogoAsync(club.Id, user.Id, mockFile.Object));

        Assert.That(exception.Message, Does.Contain("Invalid file type"));
    }

    [Test]
    public async Task UploadLogoAsync_WithMaliciousFile_ThrowsSecurityException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(51200);
        mockFile.Setup(f => f.ContentType).Returns("image/png");
        mockFile.Setup(f => f.FileName).Returns("malicious.png");
        mockFile.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(new byte[51200]));
        
        _mockImageProcessing
            .Setup(s => s.ValidateImageAsync(It.IsAny<Stream>(), "image/png"))
            .ReturnsAsync(false); // Invalid/malicious

        // Act & Assert
        var exception = Assert.ThrowsAsync<SecurityException>(
            () => _brandingService.UploadLogoAsync(club.Id, user.Id, mockFile.Object));

        Assert.That(exception.Message, Does.Contain("File failed security validation"));
    }

    [Test]
    public async Task DeleteLogoAsync_WithExistingLogo_RemovesLogo()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        club.BrandingSettings.LogoUrl = "https://storage.example.com/logos/logo.png";
        await _context.SaveChangesAsync();
        
        _mockFileStorage
            .Setup(s => s.DeleteFileAsync("https://storage.example.com/logos/logo.png"))
            .Returns(Task.CompletedTask);

        // Act
        await _brandingService.DeleteLogoAsync(club.Id, user.Id);

        // Assert
        var updatedClub = await _context.Clubs.Include(c => c.BrandingSettings)
            .FirstOrDefaultAsync(c => c.Id == club.Id);
        Assert.That(updatedClub.BrandingSettings.LogoUrl, Is.Null);
    }

    [Test]
    public async Task UploadFaviconAsync_WithValidFile_ReturnsFaviconUrl()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(16384); // 16KB
        mockFile.Setup(f => f.ContentType).Returns("image/x-icon");
        mockFile.Setup(f => f.FileName).Returns("favicon.ico");
        mockFile.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(new byte[16384]));
        
        var expectedUrl = "https://storage.example.com/favicons/favicon.ico";
        
        _mockImageProcessing
            .Setup(s => s.ValidateImageAsync(It.IsAny<Stream>(), "image/x-icon"))
            .ReturnsAsync(true);
        
        _mockFileStorage
            .Setup(s => s.UploadFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), "image/x-icon"))
            .ReturnsAsync(expectedUrl);

        // Act
        var result = await _brandingService.UploadFaviconAsync(club.Id, user.Id, mockFile.Object);

        // Assert
        Assert.That(result, Is.EqualTo(expectedUrl));
        
        var updatedClub = await _context.Clubs.Include(c => c.BrandingSettings)
            .FirstOrDefaultAsync(c => c.Id == club.Id);
        Assert.That(updatedClub.BrandingSettings.FaviconUrl, Is.EqualTo(expectedUrl));
    }

    [Test]
    public async Task GetBrandAssetsAsync_WithValidAdmin_ReturnsAssetList()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var asset1 = new BrandAsset
        {
            Id = "asset-1",
            ClubId = club.Id,
            Name = "logo.png",
            Type = "image/png",
            Size = 51200,
            Url = "https://storage.example.com/assets/logo.png",
            Category = "logos",
            UploadedAt = DateTime.UtcNow.AddDays(-1)
        };
        
        var asset2 = new BrandAsset
        {
            Id = "asset-2",
            ClubId = club.Id,
            Name = "banner.jpg",
            Type = "image/jpeg",
            Size = 153600,
            Url = "https://storage.example.com/assets/banner.jpg",
            Category = "banners",
            UploadedAt = DateTime.UtcNow
        };
        
        _context.BrandAssets.AddRange(asset1, asset2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _brandingService.GetBrandAssetsAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result.First().Name, Is.EqualTo("banner.jpg")); // Most recent first
        Assert.That(result.Last().Name, Is.EqualTo("logo.png"));
    }

    [Test]
    public async Task UploadBrandAssetAsync_WithValidFile_ReturnsAssetDto()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(51200);
        mockFile.Setup(f => f.ContentType).Returns("image/png");
        mockFile.Setup(f => f.FileName).Returns("brand-asset.png");
        mockFile.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(new byte[51200]));
        
        var expectedUrl = "https://storage.example.com/assets/brand-asset.png";
        
        _mockImageProcessing
            .Setup(s => s.ValidateImageAsync(It.IsAny<Stream>(), "image/png"))
            .ReturnsAsync(true);
        
        _mockImageProcessing
            .Setup(s => s.GetImageDimensionsAsync(It.IsAny<Stream>()))
            .ReturnsAsync(new { Width = 800, Height = 600 });
        
        _mockFileStorage
            .Setup(s => s.UploadFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), "image/png"))
            .ReturnsAsync(expectedUrl);

        // Act
        var result = await _brandingService.UploadBrandAssetAsync(club.Id, user.Id, mockFile.Object, "general");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Name, Is.EqualTo("brand-asset.png"));
        Assert.That(result.Url, Is.EqualTo(expectedUrl));
        Assert.That(result.Category, Is.EqualTo("general"));
        Assert.That(result.Size, Is.EqualTo(51200));
        
        // Verify asset was saved to database
        var savedAsset = await _context.BrandAssets.FirstOrDefaultAsync(a => a.Name == "brand-asset.png");
        Assert.That(savedAsset, Is.Not.Null);
    }

    [Test]
    public async Task DeleteBrandAssetAsync_WithValidId_RemovesAsset()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var asset = new BrandAsset
        {
            Id = "asset-123",
            ClubId = club.Id,
            Name = "to-delete.png",
            Url = "https://storage.example.com/assets/to-delete.png"
        };
        
        _context.BrandAssets.Add(asset);
        await _context.SaveChangesAsync();
        
        _mockFileStorage
            .Setup(s => s.DeleteFileAsync(asset.Url))
            .Returns(Task.CompletedTask);

        // Act
        await _brandingService.DeleteBrandAssetAsync(club.Id, user.Id, "asset-123");

        // Assert
        var deletedAsset = await _context.BrandAssets.FindAsync("asset-123");
        Assert.That(deletedAsset, Is.Null);
        
        _mockFileStorage.Verify(s => s.DeleteFileAsync(asset.Url), Times.Once);
    }

    [Test]
    public async Task DeleteBrandAssetAsync_WithInvalidId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var invalidAssetId = "invalid-asset";

        // Act & Assert
        var exception = Assert.ThrowsAsync<KeyNotFoundException>(
            () => _brandingService.DeleteBrandAssetAsync(club.Id, user.Id, invalidAssetId));

        Assert.That(exception.Message, Does.Contain("Asset not found"));
    }

    [Test]
    public async Task GeneratePreviewLinkAsync_WithValidSettings_ReturnsPreviewUrl()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        // Act
        var result = await _brandingService.GeneratePreviewLinkAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Does.StartWith("https://"));
        Assert.That(result, Does.Contain("/preview/"));
        
        // Verify preview link was saved
        var savedLink = await _context.BrandingPreviewLinks
            .FirstOrDefaultAsync(l => l.ClubId == club.Id);
        Assert.That(savedLink, Is.Not.Null);
        Assert.That(savedLink.ExpiresAt, Is.GreaterThan(DateTime.UtcNow));
    }

    [Test]
    public async Task ValidateColorsAsync_WithValidColors_ReturnsValidationResult()
    {
        // Arrange
        var request = new ColorValidationRequest
        {
            PrimaryColor = "#3B82F6",
            SecondaryColor = "#8B5CF6"
        };

        // Act
        var result = await _brandingService.ValidateColorsAsync(request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.ContrastRatio, Is.GreaterThan(0));
        Assert.That(result.AccessibilityLevel, Is.Not.Null);
    }

    [Test]
    public async Task ValidateColorsAsync_WithLowContrast_ReturnsSuggestions()
    {
        // Arrange
        var request = new ColorValidationRequest
        {
            PrimaryColor = "#FFFF00", // Yellow
            SecondaryColor = "#FFFFFF" // White - low contrast
        };

        // Act
        var result = await _brandingService.ValidateColorsAsync(request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ContrastRatio, Is.LessThan(3.0));
        Assert.That(result.Suggestions, Has.Count.GreaterThan(0));
        Assert.That(result.Suggestions.First(), Does.Contain("contrast"));
    }

    [Test]
    public async Task GetStorageUsageAsync_WithValidAdmin_ReturnsUsageStats()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var assets = new[]
        {
            new BrandAsset { Id = "1", ClubId = club.Id, Size = 512000, Category = "logos" },
            new BrandAsset { Id = "2", ClubId = club.Id, Size = 1048576, Category = "banners" },
            new BrandAsset { Id = "3", ClubId = club.Id, Size = 256000, Category = "icons" }
        };
        
        _context.BrandAssets.AddRange(assets);
        await _context.SaveChangesAsync();

        // Act
        var result = await _brandingService.GetStorageUsageAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.UsedBytes, Is.EqualTo(1816576)); // Total size
        Assert.That(result.FileCount, Is.EqualTo(3));
        Assert.That(result.CategoryBreakdown.ContainsKey("logos"), Is.True);
        Assert.That(result.CategoryBreakdown["logos"], Is.EqualTo(512000));
    }

    [Test]
    public async Task UpdatesTimestamp_WhenBrandingSettingsChange()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var originalTimestamp = club.UpdatedAt;
        
        // Wait to ensure timestamp difference
        await Task.Delay(10);
        
        var request = new UpdateBrandingSettingsRequest
        {
            PrimaryColor = "#FF5722"
        };

        // Act
        await _brandingService.UpdateBrandingSettingsAsync(club.Id, user.Id, request);

        // Assert
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub.UpdatedAt, Is.GreaterThan(originalTimestamp));
    }
}
