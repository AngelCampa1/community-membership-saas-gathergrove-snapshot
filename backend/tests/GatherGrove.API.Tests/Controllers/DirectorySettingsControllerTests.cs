using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class DirectorySettingsControllerTests
{
    private DirectorySettingsController _controller;
    private Mock<IDirectorySettingsService> _mockDirectorySettingsService;
    private Mock<ILogger<DirectorySettingsController>> _mockLogger;

    [SetUp]
    public void Setup()
    {
        _mockDirectorySettingsService = new Mock<IDirectorySettingsService>();
        _mockLogger = new Mock<ILogger<DirectorySettingsController>>();
        _controller = new DirectorySettingsController(_mockDirectorySettingsService.Object, _mockLogger.Object);

        // Setup a mock user context
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim("ClubId", "1")
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

    [Test]
    public async Task GetDirectorySettings_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var expectedSettings = new DirectorySettingsResponse
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email", "phoneNumber" }
        };

        _mockDirectorySettingsService
            .Setup(s => s.GetDirectorySettingsAsync(clubId, 1))
            .ReturnsAsync(expectedSettings);

        // Act
        var result = await _controller.GetDirectorySettings(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedSettings));

        _mockDirectorySettingsService.Verify(
            s => s.GetDirectorySettingsAsync(clubId, 1),
            Times.Once);
    }

    [Test]
    public async Task GetDirectorySettings_WithUnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;

        _mockDirectorySettingsService
            .Setup(s => s.GetDirectorySettingsAsync(clubId, 1))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.GetDirectorySettings(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetDirectorySettings_WithNonExistentClub_ReturnsNotFound()
    {
        // Arrange
        var clubId = 999;

        _mockDirectorySettingsService
            .Setup(s => s.GetDirectorySettingsAsync(clubId, 1))
            .ThrowsAsync(new InvalidOperationException("Club not found"));

        // Act
        var result = await _controller.GetDirectorySettings(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result.Result as NotFoundObjectResult;
        Assert.That(notFoundResult.Value, Is.Not.Null);
    }

    [Test]
    public async Task GetDirectorySettings_WithGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockDirectorySettingsService
            .Setup(s => s.GetDirectorySettingsAsync(clubId, 1))
            .ThrowsAsync(new Exception("Generic error"));

        // Act
        var result = await _controller.GetDirectorySettings(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task UpdateDirectorySettings_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email", "phoneNumber" }
        };
        var expectedResponse = new DirectorySettingsResponse
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email", "phoneNumber" }
        };

        _mockDirectorySettingsService
            .Setup(s => s.UpdateDirectorySettingsAsync(clubId, 1, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateDirectorySettings(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockDirectorySettingsService.Verify(
            s => s.UpdateDirectorySettingsAsync(clubId, 1, request),
            Times.Once);
    }

    [Test]
    public async Task UpdateDirectorySettings_WithInvalidFields_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email", "invalidField" }
        };

        _mockDirectorySettingsService
            .Setup(s => s.UpdateDirectorySettingsAsync(clubId, 1, request))
            .ThrowsAsync(new ArgumentException("Invalid fields specified: invalidField"));

        // Act
        var result = await _controller.UpdateDirectorySettings(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result.Result as BadRequestObjectResult;
        Assert.That(badRequestResult.Value, Is.Not.Null);
    }

    [Test]
    public async Task UpdateDirectorySettings_WithUnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email" }
        };

        _mockDirectorySettingsService
            .Setup(s => s.UpdateDirectorySettingsAsync(clubId, 1, request))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.UpdateDirectorySettings(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task UpdateDirectorySettings_WithNonExistentClub_ReturnsNotFound()
    {
        // Arrange
        var clubId = 999;
        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email" }
        };

        _mockDirectorySettingsService
            .Setup(s => s.UpdateDirectorySettingsAsync(clubId, 1, request))
            .ThrowsAsync(new InvalidOperationException("Club not found"));

        // Act
        var result = await _controller.UpdateDirectorySettings(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result.Result as NotFoundObjectResult;
        Assert.That(notFoundResult.Value, Is.Not.Null);
    }

    [Test]
    public async Task UpdateDirectorySettings_WithGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email" }
        };

        _mockDirectorySettingsService
            .Setup(s => s.UpdateDirectorySettingsAsync(clubId, 1, request))
            .ThrowsAsync(new Exception("Generic error"));

        // Act
        var result = await _controller.UpdateDirectorySettings(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task UpdateDirectorySettings_DisablingDirectory_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = false,
            AllowedSharableFields = Array.Empty<string>()
        };
        var expectedResponse = new DirectorySettingsResponse
        {
            IsEnabled = false,
            AllowedSharableFields = Array.Empty<string>()
        };

        _mockDirectorySettingsService
            .Setup(s => s.UpdateDirectorySettingsAsync(clubId, 1, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateDirectorySettings(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        var response = okResult.Value as DirectorySettingsResponse;
        Assert.That(response.IsEnabled, Is.False);
        Assert.That(response.AllowedSharableFields, Is.Empty);
    }
}