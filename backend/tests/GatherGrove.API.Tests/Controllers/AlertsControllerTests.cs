using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services.Alerts;
using GatherGrove.Application.DTOs.Alerts;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class AlertsControllerTests
{
    private AlertsController _controller;
    private Mock<IAlertConfigService> _mockAlertConfigService;
    private Mock<ILogger<AlertsController>> _mockLogger;
    private const int TestUserId = 1;
    private const int TestClubId = 1;

    [SetUp]
    public void Setup()
    {
        _mockAlertConfigService = new Mock<IAlertConfigService>();
        _mockLogger = new Mock<ILogger<AlertsController>>();
        _controller = new AlertsController(_mockAlertConfigService.Object, _mockLogger.Object);

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

    #region GetAlertConfig Tests

    [Test]
    public async Task GetAlertConfig_WithValidClubId_ReturnsOk()
    {
        // Arrange
        var expectedResponse = new AlertConfigResponse
        {
            ClubId = TestClubId,
            EngagementAlerts = true,
            ChurnRiskAlerts = true,
            EventReminderAlerts = true,
            ChurnRiskThreshold = 30,
            EngagementScoreThreshold = 50,
            AlertEmailRecipients = new List<string> { "admin@club.com" },
            SlackWebhookUrl = null,
            IsEnabled = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockAlertConfigService
            .Setup(s => s.GetAlertConfigAsync(TestClubId, TestUserId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetAlertConfig(TestClubId);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result.Result);
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task GetAlertConfig_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        _mockAlertConfigService
            .Setup(s => s.GetAlertConfigAsync(TestClubId, TestUserId))
            .ThrowsAsync(new KeyNotFoundException("Alert configuration not found"));

        // Act
        var result = await _controller.GetAlertConfig(TestClubId);

        // Assert
        Assert.IsInstanceOf<NotFoundObjectResult>(result.Result);
    }

    [Test]
    public async Task GetAlertConfig_WhenUnauthorized_ReturnsForbid()
    {
        // Arrange
        _mockAlertConfigService
            .Setup(s => s.GetAlertConfigAsync(TestClubId, TestUserId))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.GetAlertConfig(TestClubId);

        // Assert
        Assert.IsInstanceOf<ForbidResult>(result.Result);
    }

    [Test]
    public async Task GetAlertConfig_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        _mockAlertConfigService
            .Setup(s => s.GetAlertConfigAsync(TestClubId, TestUserId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetAlertConfig(TestClubId);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result.Result);
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region UpdateAlertConfig Tests

    [Test]
    public async Task UpdateAlertConfig_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new UpdateAlertConfigRequest
        {
            EngagementAlerts = true,
            ChurnRiskAlerts = true,
            EventReminderAlerts = false,
            ChurnRiskThreshold = 25,
            EngagementScoreThreshold = 60,
            AlertEmailRecipients = new List<string> { "admin@club.com", "manager@club.com" },
            IsEnabled = true
        };

        var expectedResponse = new AlertConfigResponse
        {
            ClubId = TestClubId,
            EngagementAlerts = request.EngagementAlerts,
            ChurnRiskAlerts = request.ChurnRiskAlerts,
            EventReminderAlerts = request.EventReminderAlerts,
            ChurnRiskThreshold = request.ChurnRiskThreshold,
            EngagementScoreThreshold = request.EngagementScoreThreshold,
            AlertEmailRecipients = request.AlertEmailRecipients,
            IsEnabled = request.IsEnabled,
            UpdatedAt = DateTime.UtcNow
        };

        _mockAlertConfigService
            .Setup(s => s.UpdateAlertConfigAsync(TestClubId, TestUserId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateAlertConfig(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result.Result);
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task UpdateAlertConfig_WithNullRequest_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.UpdateAlertConfig(TestClubId, null);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UpdateAlertConfig_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new UpdateAlertConfigRequest { IsEnabled = true };

        _mockAlertConfigService
            .Setup(s => s.UpdateAlertConfigAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new KeyNotFoundException("Alert configuration not found"));

        // Act
        var result = await _controller.UpdateAlertConfig(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<NotFoundObjectResult>(result.Result);
    }

    [Test]
    public async Task UpdateAlertConfig_WhenUnauthorized_ReturnsForbid()
    {
        // Arrange
        var request = new UpdateAlertConfigRequest { IsEnabled = true };

        _mockAlertConfigService
            .Setup(s => s.UpdateAlertConfigAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized to update alert config"));

        // Act
        var result = await _controller.UpdateAlertConfig(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<ForbidResult>(result.Result);
    }

    [Test]
    public async Task UpdateAlertConfig_WithInvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        var request = new UpdateAlertConfigRequest
        {
            ChurnRiskThreshold = -10 // Invalid threshold
        };

        _mockAlertConfigService
            .Setup(s => s.UpdateAlertConfigAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new InvalidOperationException("Threshold must be between 0 and 100"));

        // Act
        var result = await _controller.UpdateAlertConfig(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task UpdateAlertConfig_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new UpdateAlertConfigRequest { IsEnabled = true };

        _mockAlertConfigService
            .Setup(s => s.UpdateAlertConfigAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.UpdateAlertConfig(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result.Result);
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region CreateAlertConfig Tests

    [Test]
    public async Task CreateAlertConfig_WithValidRequest_ReturnsCreated()
    {
        // Arrange
        var request = new CreateAlertConfigRequest
        {
            EngagementAlerts = true,
            ChurnRiskAlerts = true,
            EventReminderAlerts = true,
            ChurnRiskThreshold = 30,
            EngagementScoreThreshold = 50,
            AlertEmailRecipients = new List<string> { "admin@club.com" },
            IsEnabled = true
        };

        var expectedResponse = new AlertConfigResponse
        {
            ClubId = TestClubId,
            EngagementAlerts = request.EngagementAlerts,
            ChurnRiskAlerts = request.ChurnRiskAlerts,
            EventReminderAlerts = request.EventReminderAlerts,
            ChurnRiskThreshold = request.ChurnRiskThreshold,
            EngagementScoreThreshold = request.EngagementScoreThreshold,
            AlertEmailRecipients = request.AlertEmailRecipients,
            IsEnabled = request.IsEnabled,
            CreatedAt = DateTime.UtcNow
        };

        _mockAlertConfigService
            .Setup(s => s.CreateAlertConfigAsync(TestClubId, TestUserId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CreateAlertConfig(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<CreatedAtActionResult>(result.Result);
        var createdResult = result.Result as CreatedAtActionResult;
        Assert.That(createdResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task CreateAlertConfig_WithNullRequest_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.CreateAlertConfig(TestClubId, null);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
    }

    [Test]
    public async Task CreateAlertConfig_WhenAlreadyExists_ReturnsConflict()
    {
        // Arrange
        var request = new CreateAlertConfigRequest { IsEnabled = true };

        _mockAlertConfigService
            .Setup(s => s.CreateAlertConfigAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new InvalidOperationException("Alert configuration already exists for this club"));

        // Act
        var result = await _controller.CreateAlertConfig(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<ConflictObjectResult>(result.Result);
    }

    [Test]
    public async Task CreateAlertConfig_WhenUnauthorized_ReturnsForbid()
    {
        // Arrange
        var request = new CreateAlertConfigRequest { IsEnabled = true };

        _mockAlertConfigService
            .Setup(s => s.CreateAlertConfigAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized to create alert config"));

        // Act
        var result = await _controller.CreateAlertConfig(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<ForbidResult>(result.Result);
    }

    [Test]
    public async Task CreateAlertConfig_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new CreateAlertConfigRequest { IsEnabled = true };

        _mockAlertConfigService
            .Setup(s => s.CreateAlertConfigAsync(TestClubId, TestUserId, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.CreateAlertConfig(TestClubId, request);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result.Result);
        var objectResult = result.Result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion
}
