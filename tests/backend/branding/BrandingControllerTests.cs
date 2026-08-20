using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Moq;
using GatherGrove.Application.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using System.Security.Claims;

namespace GatherGrove.Application.Tests.Controllers;

[TestFixture]
public class BrandingControllerTests
{
    private BrandingController _controller;
    private Mock<IBrandingService> _mockBrandingService;
    private Mock<ILogger<BrandingController>> _mockLogger;
    private GatherGroveDbContext _context;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockBrandingService = new Mock<IBrandingService>();
        _mockLogger = new Mock<ILogger<BrandingController>>();
        _controller = new BrandingController(_mockBrandingService.Object, _mockLogger.Object);

        // Setup mock user context
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Email, "admin@test.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
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
                FaviconUrl = null
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
    public async Task GetBrandingSettings_WithValidAdmin_ReturnsSettings()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var brandingDto = new BrandingSettingsDto
        {
            PrimaryColor = "#3B82F6",
            SecondaryColor = "#8B5CF6",
            LogoUrl = null,
            FaviconUrl = null
        };

        _mockBrandingService
            .Setup(s => s.GetBrandingSettingsAsync(club.Id, user.Id))
            .ReturnsAsync(brandingDto);

        // Act
        var result = await _controller.GetBrandingSettings(club.Id);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        
        var returnedDto = okResult.Value as BrandingSettingsDto;
        Assert.That(returnedDto, Is.Not.Null);
        Assert.That(returnedDto.PrimaryColor, Is.EqualTo("#3B82F6"));
    }

    [Test]
    public async Task GetBrandingSettings_WithNonAdminUser_ReturnsUnauthorized()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        
        _mockBrandingService
            .Setup(s => s.GetBrandingSettingsAsync(club.Id, user.Id))
            .ThrowsAsync(new UnauthorizedAccessException("User is not authorized"));

        // Act
        var result = await _controller.GetBrandingSettings(club.Id);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);
        Assert.That(unauthorizedResult.StatusCode, Is.EqualTo(401));
    }

    [Test]
    public async Task GetBrandingSettings_WithInvalidClubId_ReturnsNotFound()
    {
        // Arrange
        var invalidClubId = 999;
        
        _mockBrandingService
            .Setup(s => s.GetBrandingSettingsAsync(invalidClubId, It.IsAny<int>()))
            .ThrowsAsync(new KeyNotFoundException("Club not found"));

        // Act
        var result = await _controller.GetBrandingSettings(invalidClubId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult, Is.Not.Null);
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));
    }

    [Test]
    public async Task UpdateBrandingSettings_WithValidData_ReturnsUpdatedSettings()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpdateBrandingSettingsRequest
        {
            PrimaryColor = "#FF5722",
            SecondaryColor = "#4CAF50",
            OrganizationName = "Updated Club Name"
        };

        var updatedDto = new BrandingSettingsDto
        {
            PrimaryColor = "#FF5722",
            SecondaryColor = "#4CAF50",
            OrganizationName = "Updated Club Name"
        };

        _mockBrandingService
            .Setup(s => s.UpdateBrandingSettingsAsync(club.Id, user.Id, request))
            .ReturnsAsync(updatedDto);

        // Act
        var result = await _controller.UpdateBrandingSettings(club.Id, request);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        
        var returnedDto = okResult.Value as BrandingSettingsDto;
        Assert.That(returnedDto.PrimaryColor, Is.EqualTo("#FF5722"));
        Assert.That(returnedDto.OrganizationName, Is.EqualTo("Updated Club Name"));
    }

    [Test]
    public async Task UpdateBrandingSettings_WithInvalidColors_ReturnsBadRequest()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpdateBrandingSettingsRequest
        {
            PrimaryColor = "invalid-color",
            SecondaryColor = "#ZZZZZZ"
        };

        _mockBrandingService
            .Setup(s => s.UpdateBrandingSettingsAsync(club.Id, user.Id, request))
            .ThrowsAsync(new ArgumentException("Invalid color format"));

        // Act
        var result = await _controller.UpdateBrandingSettings(club.Id, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));
    }

    [Test]
    public async Task UpdateBrandingSettings_WithNonUnlimitedTier_ReturnsForbidden()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        club.Tier = "Grow"; // Not unlimited
        await _context.SaveChangesAsync();
        
        var request = new UpdateBrandingSettingsRequest
        {
            PrimaryColor = "#FF5722"
        };

        _mockBrandingService
            .Setup(s => s.UpdateBrandingSettingsAsync(club.Id, user.Id, request))
            .ThrowsAsync(new InvalidOperationException("Branding features require Unlimited tier"));

        // Act
        var result = await _controller.UpdateBrandingSettings(club.Id, request);

        // Assert
        var forbiddenResult = result as ObjectResult;
        Assert.That(forbiddenResult, Is.Not.Null);
        Assert.That(forbiddenResult.StatusCode, Is.EqualTo(403));
    }

    [Test]
    public async Task UploadLogo_WithValidFile_ReturnsLogoUrl()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(51200); // 50KB
        mockFile.Setup(f => f.ContentType).Returns("image/png");
        mockFile.Setup(f => f.FileName).Returns("logo.png");
        
        var expectedUrl = "https://storage.example.com/logos/logo.png";
        
        _mockBrandingService
            .Setup(s => s.UploadLogoAsync(club.Id, user.Id, mockFile.Object))
            .ReturnsAsync(expectedUrl);

        // Act
        var result = await _controller.UploadLogo(club.Id, mockFile.Object);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        
        var response = okResult.Value as dynamic;
        Assert.That(response.logoUrl, Is.EqualTo(expectedUrl));
    }

    [Test]
    public async Task UploadLogo_WithOversizedFile_ReturnsBadRequest()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(3 * 1024 * 1024); // 3MB
        mockFile.Setup(f => f.ContentType).Returns("image/png");
        mockFile.Setup(f => f.FileName).Returns("large-logo.png");
        
        _mockBrandingService
            .Setup(s => s.UploadLogoAsync(club.Id, user.Id, mockFile.Object))
            .ThrowsAsync(new ArgumentException("File size exceeds 2MB limit"));

        // Act
        var result = await _controller.UploadLogo(club.Id, mockFile.Object);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));
    }

    [Test]
    public async Task UploadLogo_WithInvalidFileType_ReturnsBadRequest()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(51200);
        mockFile.Setup(f => f.ContentType).Returns("application/pdf");
        mockFile.Setup(f => f.FileName).Returns("document.pdf");
        
        _mockBrandingService
            .Setup(s => s.UploadLogoAsync(club.Id, user.Id, mockFile.Object))
            .ThrowsAsync(new ArgumentException("Invalid file type. Only images are allowed."));

        // Act
        var result = await _controller.UploadLogo(club.Id, mockFile.Object);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
    }

    [Test]
    public async Task UploadFavicon_WithValidFile_ReturnsFaviconUrl()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(16384); // 16KB
        mockFile.Setup(f => f.ContentType).Returns("image/x-icon");
        mockFile.Setup(f => f.FileName).Returns("favicon.ico");
        
        var expectedUrl = "https://storage.example.com/favicons/favicon.ico";
        
        _mockBrandingService
            .Setup(s => s.UploadFaviconAsync(club.Id, user.Id, mockFile.Object))
            .ReturnsAsync(expectedUrl);

        // Act
        var result = await _controller.UploadFavicon(club.Id, mockFile.Object);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        
        var response = okResult.Value as dynamic;
        Assert.That(response.faviconUrl, Is.EqualTo(expectedUrl));
    }

    [Test]
    public async Task DeleteLogo_WithValidRequest_ReturnsNoContent()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        
        _mockBrandingService
            .Setup(s => s.DeleteLogoAsync(club.Id, user.Id))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeleteLogo(club.Id);

        // Assert
        var noContentResult = result as NoContentResult;
        Assert.That(noContentResult, Is.Not.Null);
        Assert.That(noContentResult.StatusCode, Is.EqualTo(204));
    }

    [Test]
    public async Task DeleteFavicon_WithValidRequest_ReturnsNoContent()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        
        _mockBrandingService
            .Setup(s => s.DeleteFaviconAsync(club.Id, user.Id))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeleteFavicon(club.Id);

        // Assert
        var noContentResult = result as NoContentResult;
        Assert.That(noContentResult, Is.Not.Null);
        Assert.That(noContentResult.StatusCode, Is.EqualTo(204));
    }

    [Test]
    public async Task GetBrandAssets_WithValidAdmin_ReturnsAssetList()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var assets = new List<BrandAssetDto>
        {
            new BrandAssetDto
            {
                Id = "1",
                Name = "logo.png",
                Type = "image/png",
                Size = 51200,
                Url = "https://storage.example.com/assets/logo.png",
                Category = "logos",
                UploadedAt = DateTime.UtcNow
            }
        };
        
        _mockBrandingService
            .Setup(s => s.GetBrandAssetsAsync(club.Id, user.Id))
            .ReturnsAsync(assets);

        // Act
        var result = await _controller.GetBrandAssets(club.Id);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        
        var returnedAssets = okResult.Value as List<BrandAssetDto>;
        Assert.That(returnedAssets, Has.Count.EqualTo(1));
        Assert.That(returnedAssets[0].Name, Is.EqualTo("logo.png"));
    }

    [Test]
    public async Task UploadBrandAsset_WithValidFile_ReturnsAssetInfo()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(51200);
        mockFile.Setup(f => f.ContentType).Returns("image/png");
        mockFile.Setup(f => f.FileName).Returns("brand-asset.png");
        
        var assetDto = new BrandAssetDto
        {
            Id = "new-asset",
            Name = "brand-asset.png",
            Type = "image/png",
            Size = 51200,
            Url = "https://storage.example.com/assets/brand-asset.png",
            Category = "general",
            UploadedAt = DateTime.UtcNow
        };
        
        _mockBrandingService
            .Setup(s => s.UploadBrandAssetAsync(club.Id, user.Id, mockFile.Object, "general"))
            .ReturnsAsync(assetDto);

        // Act
        var result = await _controller.UploadBrandAsset(club.Id, mockFile.Object, "general");

        // Assert
        var createdResult = result as CreatedAtActionResult;
        Assert.That(createdResult, Is.Not.Null);
        Assert.That(createdResult.StatusCode, Is.EqualTo(201));
        
        var returnedAsset = createdResult.Value as BrandAssetDto;
        Assert.That(returnedAsset.Name, Is.EqualTo("brand-asset.png"));
    }

    [Test]
    public async Task DeleteBrandAsset_WithValidId_ReturnsNoContent()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var assetId = "asset-123";
        
        _mockBrandingService
            .Setup(s => s.DeleteBrandAssetAsync(club.Id, user.Id, assetId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeleteBrandAsset(club.Id, assetId);

        // Assert
        var noContentResult = result as NoContentResult;
        Assert.That(noContentResult, Is.Not.Null);
        Assert.That(noContentResult.StatusCode, Is.EqualTo(204));
    }

    [Test]
    public async Task DeleteBrandAsset_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var invalidAssetId = "invalid-asset";
        
        _mockBrandingService
            .Setup(s => s.DeleteBrandAssetAsync(club.Id, user.Id, invalidAssetId))
            .ThrowsAsync(new KeyNotFoundException("Asset not found"));

        // Act
        var result = await _controller.DeleteBrandAsset(club.Id, invalidAssetId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult, Is.Not.Null);
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));
    }

    [Test]
    public async Task GeneratePreviewLink_WithValidSettings_ReturnsPreviewUrl()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var previewToken = "preview-token-123";
        var previewUrl = $"https://app.example.com/preview/{previewToken}";
        
        _mockBrandingService
            .Setup(s => s.GeneratePreviewLinkAsync(club.Id, user.Id))
            .ReturnsAsync(previewUrl);

        // Act
        var result = await _controller.GeneratePreviewLink(club.Id);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        
        var response = okResult.Value as dynamic;
        Assert.That(response.previewUrl, Is.EqualTo(previewUrl));
    }

    [Test]
    public async Task ValidateColors_WithValidHexColors_ReturnsValidationResult()
    {
        // Arrange
        var request = new ColorValidationRequest
        {
            PrimaryColor = "#3B82F6",
            SecondaryColor = "#8B5CF6"
        };
        
        var validationResult = new ColorValidationResult
        {
            IsValid = true,
            ContrastRatio = 4.5,
            AccessibilityLevel = "WCAG AA",
            Suggestions = new List<string>()
        };
        
        _mockBrandingService
            .Setup(s => s.ValidateColorsAsync(request))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _controller.ValidateColors(request);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        
        var returnedResult = okResult.Value as ColorValidationResult;
        Assert.That(returnedResult.IsValid, Is.True);
        Assert.That(returnedResult.ContrastRatio, Is.EqualTo(4.5));
    }

    [Test]
    public async Task GetStorageUsage_WithValidAdmin_ReturnsUsageStats()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var storageStats = new StorageUsageDto
        {
            UsedBytes = 1048576, // 1MB
            LimitBytes = 104857600, // 100MB
            FileCount = 5,
            CategoryBreakdown = new Dictionary<string, long>
            {
                { "logos", 512000 },
                { "banners", 536576 }
            }
        };
        
        _mockBrandingService
            .Setup(s => s.GetStorageUsageAsync(club.Id, user.Id))
            .ReturnsAsync(storageStats);

        // Act
        var result = await _controller.GetStorageUsage(club.Id);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        
        var returnedStats = okResult.Value as StorageUsageDto;
        Assert.That(returnedStats.UsedBytes, Is.EqualTo(1048576));
        Assert.That(returnedStats.FileCount, Is.EqualTo(5));
    }
}
