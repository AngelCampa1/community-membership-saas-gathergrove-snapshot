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
public class ChatSettingsControllerTests
{
    private ChatSettingsController _controller;
    private Mock<IChatSettingsService> _mockChatSettingsService;
    private Mock<ILogger<ChatSettingsController>> _mockLogger;

    [SetUp]
    public void Setup()
    {
        _mockChatSettingsService = new Mock<IChatSettingsService>();
        _mockLogger = new Mock<ILogger<ChatSettingsController>>();
        _controller = new ChatSettingsController(_mockChatSettingsService.Object, _mockLogger.Object);

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
    public async Task GetChatSettings_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var expectedSettings = new ChatSettingsResponse
        {
            IsChatEnabled = true
        };

        _mockChatSettingsService
            .Setup(s => s.GetChatSettingsAsync(clubId, 1))
            .ReturnsAsync(expectedSettings);

        // Act
        var result = await _controller.GetChatSettings(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedSettings));

        _mockChatSettingsService.Verify(
            s => s.GetChatSettingsAsync(clubId, 1),
            Times.Once);
    }

    [Test]
    public async Task GetChatSettings_WithUnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;

        _mockChatSettingsService
            .Setup(s => s.GetChatSettingsAsync(clubId, 1))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.GetChatSettings(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetChatSettings_WithNonExistentClub_ReturnsNotFound()
    {
        // Arrange
        var clubId = 999;

        _mockChatSettingsService
            .Setup(s => s.GetChatSettingsAsync(clubId, 1))
            .ThrowsAsync(new InvalidOperationException("Club not found"));

        // Act
        var result = await _controller.GetChatSettings(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result.Result as NotFoundObjectResult;
        Assert.That(notFoundResult.Value, Is.Not.Null);
    }

    [Test]
    public async Task GetChatSettings_WithGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockChatSettingsService
            .Setup(s => s.GetChatSettingsAsync(clubId, 1))
            .ThrowsAsync(new Exception("Generic error"));

        // Act
        var result = await _controller.GetChatSettings(clubId);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task UpdateChatSettings_EnableChat_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var request = new UpdateChatSettingsRequest
        {
            IsChatEnabled = true
        };
        var expectedResponse = new ChatSettingsResponse
        {
            IsChatEnabled = true
        };

        _mockChatSettingsService
            .Setup(s => s.UpdateChatSettingsAsync(clubId, 1, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateChatSettings(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockChatSettingsService.Verify(
            s => s.UpdateChatSettingsAsync(clubId, 1, request),
            Times.Once);
    }

    [Test]
    public async Task UpdateChatSettings_DisableChat_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var request = new UpdateChatSettingsRequest
        {
            IsChatEnabled = false
        };
        var expectedResponse = new ChatSettingsResponse
        {
            IsChatEnabled = false
        };

        _mockChatSettingsService
            .Setup(s => s.UpdateChatSettingsAsync(clubId, 1, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateChatSettings(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockChatSettingsService.Verify(
            s => s.UpdateChatSettingsAsync(clubId, 1, request),
            Times.Once);
    }

    [Test]
    public async Task UpdateChatSettings_WithUnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new UpdateChatSettingsRequest
        {
            IsChatEnabled = true
        };

        _mockChatSettingsService
            .Setup(s => s.UpdateChatSettingsAsync(clubId, 1, request))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.UpdateChatSettings(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task UpdateChatSettings_WithNonExistentClub_ReturnsNotFound()
    {
        // Arrange
        var clubId = 999;
        var request = new UpdateChatSettingsRequest
        {
            IsChatEnabled = true
        };

        _mockChatSettingsService
            .Setup(s => s.UpdateChatSettingsAsync(clubId, 1, request))
            .ThrowsAsync(new InvalidOperationException("Club not found"));

        // Act
        var result = await _controller.UpdateChatSettings(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result.Result as NotFoundObjectResult;
        Assert.That(notFoundResult.Value, Is.Not.Null);
    }

    [Test]
    public async Task UpdateChatSettings_WithGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var request = new UpdateChatSettingsRequest
        {
            IsChatEnabled = true
        };

        _mockChatSettingsService
            .Setup(s => s.UpdateChatSettingsAsync(clubId, 1, request))
            .ThrowsAsync(new Exception("Generic error"));

        // Act
        var result = await _controller.UpdateChatSettings(clubId, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ObjectResult>());
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }
}