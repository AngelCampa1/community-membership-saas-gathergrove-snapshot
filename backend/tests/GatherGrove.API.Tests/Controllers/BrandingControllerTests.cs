using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services.Branding;
using GatherGrove.Application.DTOs.Branding;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class BrandingControllerTests
{
    private BrandingController _controller;
    private Mock<IBrandingService> _mockBrandingService;
    private Mock<ILogger<BrandingController>> _mockLogger;
    private const int TestUserId = 1;
    private const int TestClubId = 1;

    [SetUp]
    public void Setup()
    {
        _mockBrandingService = new Mock<IBrandingService>();
        _mockLogger = new Mock<ILogger<BrandingController>>();
        _controller = new BrandingController(_mockBrandingService.Object, _mockLogger.Object);

        // Setup a mock user context with admin claims
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, TestUserId.ToString()),
            new Claim("ClubId", TestClubId.ToString()),
            new Claim("IsAdmin", "true")
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };
    }

    #region GetBranding Tests

    [Test]
    public async Task GetBranding_WithValidClubId_ReturnsOk()
    {
        // Arrange
        var expectedResponse = new BrandingResponse
        {
            ClubId = TestClubId,
            LogoUrl = "https://example.com/logo.png",
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            FontFamily = "Arial",
            CustomCSS = ".test { color: red; }",
            WhiteLabelDomain = "myclub.com",
            FacebookUrl = "https://facebook.com/myclub",
            TwitterUrl = "https://twitter.com/myclub",
            InstagramUrl = "https://instagram.com/myclub"
        };

        _mockBrandingService
            .Setup(s => s.GetBrandingAsync(TestClubId, TestUserId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetBranding(TestClubId);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result.Result);
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task GetBranding_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        _mockBrandingService
            .Setup(s => s.GetBrandingAsync(TestClubId, TestUserId))
            .ThrowsAsync(new KeyNotFoundException("Branding settings not found"));

        // Act
        var result = await _controller.GetBranding(TestClubId);

        // Assert
        Assert.IsInstanceOf<NotFoundObjectResult>(result.Result);
    }

    [Test]
    public async Task GetBranding_WhenUnauthorized_ReturnsForbid()
    {
        // Arrange
        _mockBrandingService
            .Setup(s => s.GetBrandingAsync(TestClubId, TestUserId))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.GetBranding(TestClubId);

        // Assert
        Assert.IsInstanceOf<ForbidResult>(result.Result);
    }

    [Test]
    public async Task GetBranding_WithInvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        _mockBrandingService
            .Setup(s => s.GetBrandingAsync(TestClubId, TestUserId))
            .ThrowsAsync(new InvalidOperationException("Invalid branding configuration"));

        // Act
        var result = await _controller.GetBranding(TestClubId);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task GetBranding_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        _mockBrandingService
            .Setup(s => s.GetBrandingAsync(TestClubId, TestUserId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetBranding(TestClubId);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result.Result);
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region CreateBranding Tests

    [Test]
    public async Task CreateBranding_WithValidRequest_ReturnsCreated()
    {
        // Arrange
        var request = new CreateBrandingRequest
        {
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            FontFamily = "Arial",
            CustomCSS = ".test { color: red; }",
            WhiteLabelDomain = "myclub.com",
            FacebookUrl = "https://facebook.com/myclub",
            TwitterUrl = "https://twitter.com/myclub",
            InstagramUrl = "https://instagram.com/myclub"
        };

        var expectedResponse = new BrandingResponse
        {
            ClubId = TestClubId,
            PrimaryColor = request.PrimaryColor,
            SecondaryColor = request.SecondaryColor,
            FontFamily = request.FontFamily,
            CustomCSS = request.CustomCSS,
            WhiteLabelDomain = request.WhiteLabelDomain,
            FacebookUrl = request.FacebookUrl,
            TwitterUrl = request.TwitterUrl,
            InstagramUrl = request.InstagramUrl,
            CreatedAt = DateTime.UtcNow
        };

        _mockBrandingService
            .Setup(s => s.CreateBrandingAsync(TestClubId, TestUserId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CreateBranding(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<CreatedAtActionResult>(result.Result);
        var createdResult = result.Result as CreatedAtActionResult;
        Assert.That(createdResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task CreateBranding_WithNullRequest_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.CreateBranding(TestClubId, null);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task CreateBranding_WhenAlreadyExists_ReturnsConflict()
    {
        // Arrange
        var request = new CreateBrandingRequest { PrimaryColor = "#FF0000" };

        _mockBrandingService
            .Setup(s => s.CreateBrandingAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new InvalidOperationException("Branding settings already exist"));

        // Act
        var result = await _controller.CreateBranding(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<ConflictObjectResult>(result.Result);
    }

    [Test]
    public async Task CreateBranding_WhenUnauthorized_ReturnsForbid()
    {
        // Arrange
        var request = new CreateBrandingRequest { PrimaryColor = "#FF0000" };

        _mockBrandingService
            .Setup(s => s.CreateBrandingAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized to create branding"));

        // Act
        var result = await _controller.CreateBranding(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<ForbidResult>(result.Result);
    }

    [Test]
    public async Task CreateBranding_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new CreateBrandingRequest { PrimaryColor = "#FF0000" };

        _mockBrandingService
            .Setup(s => s.CreateBrandingAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.CreateBranding(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result.Result);
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region UpdateBranding Tests

    [Test]
    public async Task UpdateBranding_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new UpdateBrandingRequest
        {
            PrimaryColor = "#FF0000",
            SecondaryColor = "#00FF00",
            FontFamily = "Arial"
        };

        var expectedResponse = new BrandingResponse
        {
            ClubId = TestClubId,
            PrimaryColor = request.PrimaryColor,
            SecondaryColor = request.SecondaryColor,
            FontFamily = request.FontFamily,
            UpdatedAt = DateTime.UtcNow
        };

        _mockBrandingService
            .Setup(s => s.UpdateBrandingAsync(TestClubId, TestUserId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateBranding(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result.Result);
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task UpdateBranding_WithNullRequest_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.UpdateBranding(TestClubId, null);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UpdateBranding_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new UpdateBrandingRequest { PrimaryColor = "#FF0000" };

        _mockBrandingService
            .Setup(s => s.UpdateBrandingAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new KeyNotFoundException("Branding settings not found"));

        // Act
        var result = await _controller.UpdateBranding(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<NotFoundObjectResult>(result.Result);
    }

    [Test]
    public async Task UpdateBranding_WhenUnauthorized_ReturnsForbid()
    {
        // Arrange
        var request = new UpdateBrandingRequest { PrimaryColor = "#FF0000" };

        _mockBrandingService
            .Setup(s => s.UpdateBrandingAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized to update branding"));

        // Act
        var result = await _controller.UpdateBranding(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<ForbidResult>(result.Result);
    }

    [Test]
    public async Task UpdateBranding_WithInvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        var request = new UpdateBrandingRequest { PrimaryColor = "#FF0000" };

        _mockBrandingService
            .Setup(s => s.UpdateBrandingAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new InvalidOperationException("Cannot update branding for inactive club"));

        // Act
        var result = await _controller.UpdateBranding(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UpdateBranding_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new UpdateBrandingRequest { PrimaryColor = "#FF0000" };

        _mockBrandingService
            .Setup(s => s.UpdateBrandingAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.UpdateBranding(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result.Result);
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region DeleteBranding Tests

    [Test]
    public async Task DeleteBranding_WithValidClubId_ReturnsNoContent()
    {
        // Arrange
        _mockBrandingService
            .Setup(s => s.DeleteBrandingAsync(TestClubId, TestUserId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeleteBranding(TestClubId);

        // Assert
        Assert.IsInstanceOf<NoContentResult>(result);
    }

    [Test]
    public async Task DeleteBranding_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        _mockBrandingService
            .Setup(s => s.DeleteBrandingAsync(TestClubId, TestUserId))
            .ThrowsAsync(new KeyNotFoundException("Branding settings not found"));

        // Act
        var result = await _controller.DeleteBranding(TestClubId);

        // Assert
        Assert.IsInstanceOf<NotFoundObjectResult>(result);
    }

    [Test]
    public async Task DeleteBranding_WhenUnauthorized_ReturnsForbid()
    {
        // Arrange
        _mockBrandingService
            .Setup(s => s.DeleteBrandingAsync(TestClubId, TestUserId))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized to delete branding"));

        // Act
        var result = await _controller.DeleteBranding(TestClubId);

        // Assert
        Assert.IsInstanceOf<ForbidResult>(result);
    }

    [Test]
    public async Task DeleteBranding_WithInvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        _mockBrandingService
            .Setup(s => s.DeleteBrandingAsync(TestClubId, TestUserId))
            .ThrowsAsync(new InvalidOperationException("Cannot delete branding while in use"));

        // Act
        var result = await _controller.DeleteBranding(TestClubId);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
    }

    [Test]
    public async Task DeleteBranding_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        _mockBrandingService
            .Setup(s => s.DeleteBrandingAsync(TestClubId, TestUserId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.DeleteBranding(TestClubId);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result);
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region UploadLogo Tests

    [Test]
    public async Task UploadLogo_WithValidFile_ReturnsOk()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(1024);
        mockFile.Setup(f => f.ContentType).Returns("image/png");
        mockFile.Setup(f => f.FileName).Returns("logo.png");

        var expectedResponse = new LogoUploadResponse
        {
            LogoUrl = "https://storage.example.com/logos/club-1-logo.png",
            UploadedAt = DateTime.UtcNow
        };

        _mockBrandingService
            .Setup(s => s.UploadLogoAsync(TestClubId, TestUserId, mockFile.Object))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UploadLogo(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result.Result);
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task UploadLogo_WithNullFile_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.UploadLogo(TestClubId, null);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UploadLogo_WithEmptyFile_ReturnsBadRequest()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(0);

        // Act
        var result = await _controller.UploadLogo(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UploadLogo_WithInvalidFileType_ReturnsBadRequest()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(1024);
        mockFile.Setup(f => f.ContentType).Returns("text/plain");

        _mockBrandingService
            .Setup(s => s.UploadLogoAsync(TestClubId, TestUserId, mockFile.Object))
            .ThrowsAsync(new ArgumentException("Invalid file type"));

        // Act
        var result = await _controller.UploadLogo(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UploadLogo_WithOversizedFile_ReturnsBadRequest()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(10 * 1024 * 1024); // 10MB
        mockFile.Setup(f => f.ContentType).Returns("image/png");

        _mockBrandingService
            .Setup(s => s.UploadLogoAsync(TestClubId, TestUserId, mockFile.Object))
            .ThrowsAsync(new ArgumentException("File size exceeds limit"));

        // Act
        var result = await _controller.UploadLogo(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UploadLogo_WhenUnauthorized_ReturnsForbid()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(1024);
        mockFile.Setup(f => f.ContentType).Returns("image/png");

        _mockBrandingService
            .Setup(s => s.UploadLogoAsync(TestClubId, TestUserId, mockFile.Object))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized to upload logo"));

        // Act
        var result = await _controller.UploadLogo(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<ForbidResult>(result.Result);
    }

    [Test]
    public async Task UploadLogo_WithInvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(1024);
        mockFile.Setup(f => f.ContentType).Returns("image/png");

        _mockBrandingService
            .Setup(s => s.UploadLogoAsync(TestClubId, TestUserId, mockFile.Object))
            .ThrowsAsync(new InvalidOperationException("Storage quota exceeded"));

        // Act
        var result = await _controller.UploadLogo(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UploadLogo_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(1024);
        mockFile.Setup(f => f.ContentType).Returns("image/png");

        _mockBrandingService
            .Setup(s => s.UploadLogoAsync(TestClubId, TestUserId, mockFile.Object))
            .ThrowsAsync(new Exception("Storage service unavailable"));

        // Act
        var result = await _controller.UploadLogo(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result.Result);
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region UploadFavicon Tests

    [Test]
    public async Task UploadFavicon_WithValidFile_ReturnsOk()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(512);
        mockFile.Setup(f => f.ContentType).Returns("image/x-icon");
        mockFile.Setup(f => f.FileName).Returns("favicon.ico");

        var expectedResponse = new FaviconUploadResponse
        {
            FaviconUrl = "https://storage.example.com/favicons/club-1-favicon.ico",
            UploadedAt = DateTime.UtcNow
        };

        _mockBrandingService
            .Setup(s => s.UploadFaviconAsync(TestClubId, TestUserId, mockFile.Object))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UploadFavicon(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result.Result);
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task UploadFavicon_WithNullFile_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.UploadFavicon(TestClubId, null);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UploadFavicon_WithEmptyFile_ReturnsBadRequest()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(0);

        // Act
        var result = await _controller.UploadFavicon(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UploadFavicon_WithInvalidFileType_ReturnsBadRequest()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(512);
        mockFile.Setup(f => f.ContentType).Returns("text/plain");

        _mockBrandingService
            .Setup(s => s.UploadFaviconAsync(TestClubId, TestUserId, mockFile.Object))
            .ThrowsAsync(new ArgumentException("Invalid file type"));

        // Act
        var result = await _controller.UploadFavicon(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UploadFavicon_WithOversizedFile_ReturnsBadRequest()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(3 * 1024 * 1024); // 3MB
        mockFile.Setup(f => f.ContentType).Returns("image/x-icon");

        _mockBrandingService
            .Setup(s => s.UploadFaviconAsync(TestClubId, TestUserId, mockFile.Object))
            .ThrowsAsync(new ArgumentException("File size exceeds limit"));

        // Act
        var result = await _controller.UploadFavicon(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UploadFavicon_WhenUnauthorized_ReturnsForbid()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(512);
        mockFile.Setup(f => f.ContentType).Returns("image/x-icon");

        _mockBrandingService
            .Setup(s => s.UploadFaviconAsync(TestClubId, TestUserId, mockFile.Object))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized to upload favicon"));

        // Act
        var result = await _controller.UploadFavicon(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<ForbidResult>(result.Result);
    }

    [Test]
    public async Task UploadFavicon_WithInvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(512);
        mockFile.Setup(f => f.ContentType).Returns("image/x-icon");

        _mockBrandingService
            .Setup(s => s.UploadFaviconAsync(TestClubId, TestUserId, mockFile.Object))
            .ThrowsAsync(new InvalidOperationException("Storage quota exceeded"));

        // Act
        var result = await _controller.UploadFavicon(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UploadFavicon_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(512);
        mockFile.Setup(f => f.ContentType).Returns("image/x-icon");

        _mockBrandingService
            .Setup(s => s.UploadFaviconAsync(TestClubId, TestUserId, mockFile.Object))
            .ThrowsAsync(new Exception("Storage service unavailable"));

        // Act
        var result = await _controller.UploadFavicon(TestClubId, mockFile.Object);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result.Result);
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion
}