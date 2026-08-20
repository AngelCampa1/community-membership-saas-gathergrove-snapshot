using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.API.Controllers;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class NotificationsControllerTests
{
    private Mock<IPushNotificationService> _mockPushNotificationService = null!;
    private Mock<ILogger<NotificationsController>> _mockLogger = null!;
    private NotificationsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _mockPushNotificationService = new Mock<IPushNotificationService>();
        _mockLogger = new Mock<ILogger<NotificationsController>>();

        _controller = new NotificationsController(_mockPushNotificationService.Object, _mockLogger.Object);

        // Setup HttpContext for the controller
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    private void SetupUserClaims(int userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, "Member")
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = principal;
    }

    #region RegisterDevice Tests

    [Test]
    public async Task RegisterDevice_WithValidRequest_ReturnsOkWithResponse()
    {
        // Arrange
        var userId = 123;
        var clubId = 456;
        SetupUserClaims(userId);

        var request = new MobileDeviceRegistrationRequest
        {
            Token = "ExponentPushToken[test_token_12345]",
            Platform = "android",
            UserId = userId,
            ClubId = clubId
        };

        var expectedResponse = new RegisterDeviceTokenResponse
        {
            Success = true,
            Message = "Device token registered successfully",
            DeviceToken = request.Token,
            DeviceType = "android",
            RegisteredAt = DateTime.UtcNow
        };

        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.RegisterDevice(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        var response = (MobileDeviceRegistrationResponse)okResult.Value!;

        Assert.That(response.Success, Is.True);
        Assert.That(response.DeviceToken, Is.EqualTo(request.Token));
        Assert.That(response.Platform, Is.EqualTo(request.Platform));
        Assert.That(response.UserId, Is.EqualTo(userId));
        Assert.That(response.ClubId, Is.EqualTo(clubId));

        _mockPushNotificationService.Verify(
            x => x.RegisterDeviceTokenAsync(userId, It.Is<RegisterDeviceTokenRequest>(r =>
                r.DeviceToken == request.Token && r.DeviceType == "android")),
            Times.Once);
    }

    [Test]
    public async Task RegisterDevice_WithIOSDevice_ReturnsOkWithCorrectPlatform()
    {
        // Arrange
        var userId = 123;
        SetupUserClaims(userId);

        var request = new MobileDeviceRegistrationRequest
        {
            Token = "ExponentPushToken[ios_token_abcdef]",
            Platform = "ios",
            UserId = userId,
            ClubId = 456
        };

        var expectedResponse = new RegisterDeviceTokenResponse
        {
            Success = true,
            Message = "Device token registered successfully",
            DeviceToken = request.Token,
            DeviceType = "ios",
            RegisteredAt = DateTime.UtcNow
        };

        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.RegisterDevice(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        var response = (MobileDeviceRegistrationResponse)okResult.Value!;

        Assert.That(response.Platform, Is.EqualTo("ios"));

        _mockPushNotificationService.Verify(
            x => x.RegisterDeviceTokenAsync(userId, It.Is<RegisterDeviceTokenRequest>(r =>
                r.DeviceType == "ios")),
            Times.Once);
    }

    [Test]
    public async Task RegisterDevice_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange - Don't set up user claims (no authentication)
        var request = new MobileDeviceRegistrationRequest
        {
            Token = "ExponentPushToken[test_token]",
            Platform = "android",
            UserId = 123,
            ClubId = 456
        };

        // Act
        var result = await _controller.RegisterDevice(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = (UnauthorizedObjectResult)result;
        var problemDetails = (ProblemDetails)unauthorizedResult.Value!;

        Assert.That(problemDetails.Title, Is.EqualTo("Authentication Error"));
        Assert.That(problemDetails.Status, Is.EqualTo(401));

        _mockPushNotificationService.Verify(
            x => x.RegisterDeviceTokenAsync(It.IsAny<int>(), It.IsAny<RegisterDeviceTokenRequest>()),
            Times.Never);
    }

    [Test]
    public async Task RegisterDevice_WithUserIdMismatch_ReturnsBadRequest()
    {
        // Arrange
        var authenticatedUserId = 123;
        var requestedUserId = 456; // Different user ID
        SetupUserClaims(authenticatedUserId);

        var request = new MobileDeviceRegistrationRequest
        {
            Token = "ExponentPushToken[test_token]",
            Platform = "android",
            UserId = requestedUserId,
            ClubId = 789
        };

        // Act
        var result = await _controller.RegisterDevice(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        var problemDetails = (ProblemDetails)badRequestResult.Value!;

        Assert.That(problemDetails.Title, Is.EqualTo("User ID Mismatch"));
        Assert.That(problemDetails.Status, Is.EqualTo(400));

        _mockPushNotificationService.Verify(
            x => x.RegisterDeviceTokenAsync(It.IsAny<int>(), It.IsAny<RegisterDeviceTokenRequest>()),
            Times.Never);
    }

    [Test]
    public async Task RegisterDevice_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var userId = 123;
        SetupUserClaims(userId);

        var request = new MobileDeviceRegistrationRequest
        {
            Token = "", // Invalid - empty token
            Platform = "android",
            UserId = userId,
            ClubId = 456
        };

        _controller.ModelState.AddModelError("Token", "Device token is required");

        // Act
        var result = await _controller.RegisterDevice(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());

        _mockPushNotificationService.Verify(
            x => x.RegisterDeviceTokenAsync(It.IsAny<int>(), It.IsAny<RegisterDeviceTokenRequest>()),
            Times.Never);
    }

    [Test]
    public async Task RegisterDevice_WithServiceFailure_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 123;
        SetupUserClaims(userId);

        var request = new MobileDeviceRegistrationRequest
        {
            Token = "ExponentPushToken[test_token]",
            Platform = "android",
            UserId = userId,
            ClubId = 456
        };

        var failureResponse = new RegisterDeviceTokenResponse
        {
            Success = false,
            Message = "Failed to register device token"
        };

        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ReturnsAsync(failureResponse);

        // Act
        var result = await _controller.RegisterDevice(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));

        var problemDetails = (ProblemDetails)objectResult.Value!;
        Assert.That(problemDetails.Title, Is.EqualTo("Device Registration Failed"));
    }

    #endregion

    #region UnregisterDevice Tests

    [Test]
    public async Task UnregisterDevice_WithValidRequest_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = 123;
        SetupUserClaims(userId);

        var request = new MobileDeviceUnregistrationRequest
        {
            Token = "ExponentPushToken[test_token_to_remove]"
        };

        _mockPushNotificationService
            .Setup(x => x.RemoveDeviceTokenAsync(userId, request.Token))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.UnregisterDevice(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());

        _mockPushNotificationService.Verify(
            x => x.RemoveDeviceTokenAsync(userId, request.Token),
            Times.Once);
    }

    [Test]
    public async Task UnregisterDevice_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange - Don't set up user claims (no authentication)
        var request = new MobileDeviceUnregistrationRequest
        {
            Token = "ExponentPushToken[test_token]"
        };

        // Act
        var result = await _controller.UnregisterDevice(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = (UnauthorizedObjectResult)result;
        var problemDetails = (ProblemDetails)unauthorizedResult.Value!;

        Assert.That(problemDetails.Title, Is.EqualTo("Authentication Error"));
        Assert.That(problemDetails.Status, Is.EqualTo(401));

        _mockPushNotificationService.Verify(
            x => x.RemoveDeviceTokenAsync(It.IsAny<int>(), It.IsAny<string>()),
            Times.Never);
    }

    [Test]
    public async Task UnregisterDevice_WithServiceFailure_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 123;
        SetupUserClaims(userId);

        var request = new MobileDeviceUnregistrationRequest
        {
            Token = "ExponentPushToken[test_token]"
        };

        _mockPushNotificationService
            .Setup(x => x.RemoveDeviceTokenAsync(userId, request.Token))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.UnregisterDevice(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));

        var problemDetails = (ProblemDetails)objectResult.Value!;
        Assert.That(problemDetails.Title, Is.EqualTo("Device Unregistration Failed"));
    }

    [Test]
    public async Task UnregisterDevice_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 123;
        SetupUserClaims(userId);

        var request = new MobileDeviceUnregistrationRequest
        {
            Token = "ExponentPushToken[test_token]"
        };

        _mockPushNotificationService
            .Setup(x => x.RemoveDeviceTokenAsync(userId, request.Token))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UnregisterDevice(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));

        var problemDetails = (ProblemDetails)objectResult.Value!;
        Assert.That(problemDetails.Title, Is.EqualTo("Device Unregistration Error"));
    }

    #endregion

    #region RegisterDevice - Exception Tests

    [Test]
    public async Task RegisterDevice_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 123;
        SetupUserClaims(userId);

        var request = new MobileDeviceRegistrationRequest
        {
            Token = "ExponentPushToken[test_token]",
            Platform = "android",
            UserId = userId,
            ClubId = 456
        };

        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ThrowsAsync(new Exception("Azure Notification Hub connection failed"));

        // Act
        var result = await _controller.RegisterDevice(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));

        var problemDetails = (ProblemDetails)objectResult.Value!;
        Assert.That(problemDetails.Title, Is.EqualTo("Device Registration Error"));
    }

    #endregion

    #region SendBulkPushNotification Tests

    [Test]
    public async Task SendBulkPushNotification_WithValidRequest_ReturnsOkWithResponse()
    {
        // Arrange
        var userId = 123;
        var clubId = 456;
        SetupUserClaims(userId);

        var request = new SendBulkPushNotificationRequest
        {
            Title = "Important Update",
            Body = "New club event announced!",
            Data = new Dictionary<string, string> { { "eventId", "789" } }
        };

        var expectedResponse = new SendBulkPushNotificationResponse
        {
            Success = true,
            Message = "Push notification sent successfully",
            DeviceCount = 42,
            UserCount = 35
        };

        _mockPushNotificationService
            .Setup(x => x.SendBulkPushNotificationAsync(clubId, userId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.SendBulkPushNotification(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        var response = (SendBulkPushNotificationResponse)okResult.Value!;

        Assert.That(response.Success, Is.True);
        Assert.That(response.DeviceCount, Is.EqualTo(42));
        Assert.That(response.UserCount, Is.EqualTo(35));

        _mockPushNotificationService.Verify(
            x => x.SendBulkPushNotificationAsync(clubId, userId, request),
            Times.Once);
    }

    [Test]
    public async Task SendBulkPushNotification_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange - Don't set up user claims (no authentication)
        var clubId = 456;
        var request = new SendBulkPushNotificationRequest
        {
            Title = "Test",
            Body = "Test notification"
        };

        // Act
        var result = await _controller.SendBulkPushNotification(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockPushNotificationService.Verify(
            x => x.SendBulkPushNotificationAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<SendBulkPushNotificationRequest>()),
            Times.Never);
    }

    [Test]
    public async Task SendBulkPushNotification_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var userId = 123;
        var clubId = 456;
        SetupUserClaims(userId);

        var request = new SendBulkPushNotificationRequest
        {
            Title = "", // Invalid - empty title
            Body = "Test notification"
        };

        _controller.ModelState.AddModelError("Title", "Title is required");

        // Act
        var result = await _controller.SendBulkPushNotification(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());

        _mockPushNotificationService.Verify(
            x => x.SendBulkPushNotificationAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<SendBulkPushNotificationRequest>()),
            Times.Never);
    }

    [Test]
    public async Task SendBulkPushNotification_WithServiceFailure_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 123;
        var clubId = 456;
        SetupUserClaims(userId);

        var request = new SendBulkPushNotificationRequest
        {
            Title = "Test",
            Body = "Test notification"
        };

        var failureResponse = new SendBulkPushNotificationResponse
        {
            Success = false,
            Message = "No devices found for this club"
        };

        _mockPushNotificationService
            .Setup(x => x.SendBulkPushNotificationAsync(clubId, userId, request))
            .ReturnsAsync(failureResponse);

        // Act
        var result = await _controller.SendBulkPushNotification(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));

        var problemDetails = (ProblemDetails)objectResult.Value!;
        Assert.That(problemDetails.Title, Is.EqualTo("Push Notification Failed"));
        Assert.That(problemDetails.Detail, Is.EqualTo("No devices found for this club"));
    }

    [Test]
    public async Task SendBulkPushNotification_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 123;
        var clubId = 456;
        SetupUserClaims(userId);

        var request = new SendBulkPushNotificationRequest
        {
            Title = "Test",
            Body = "Test notification"
        };

        _mockPushNotificationService
            .Setup(x => x.SendBulkPushNotificationAsync(clubId, userId, request))
            .ThrowsAsync(new Exception("Azure Notification Hub error"));

        // Act
        var result = await _controller.SendBulkPushNotification(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));

        var problemDetails = (ProblemDetails)objectResult.Value!;
        Assert.That(problemDetails.Title, Is.EqualTo("Push Notification Error"));
    }

    #endregion

    #region GetPushNotificationUsageStats Tests

    [Test]
    public async Task GetPushNotificationUsageStats_WithValidClubId_ReturnsOkWithStats()
    {
        // Arrange
        var clubId = 456;
        var expectedStats = new PushNotificationUsageStatsResponse
        {
            ClubTier = "Grow",
            TotalActiveMembers = 100,
            MembersWithDeviceTokens = 75,
            TotalDeviceTokens = 95,
            IsGrowTier = true,
            IsAzureConfigured = true,
            CurrentMonth = "December 2025"
        };

        _mockPushNotificationService
            .Setup(x => x.GetPushNotificationUsageStatsAsync(clubId))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetPushNotificationUsageStats(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        var stats = (PushNotificationUsageStatsResponse)okResult.Value!;

        Assert.That(stats.TotalActiveMembers, Is.EqualTo(100));
        Assert.That(stats.MembersWithDeviceTokens, Is.EqualTo(75));
        Assert.That(stats.TotalDeviceTokens, Is.EqualTo(95));
        Assert.That(stats.IsGrowTier, Is.True);
        Assert.That(stats.IsAzureConfigured, Is.True);

        _mockPushNotificationService.Verify(
            x => x.GetPushNotificationUsageStatsAsync(clubId),
            Times.Once);
    }

    [Test]
    public async Task GetPushNotificationUsageStats_WithNoDevicesRegistered_ReturnsStatsWithZeros()
    {
        // Arrange
        var clubId = 456;
        var expectedStats = new PushNotificationUsageStatsResponse
        {
            ClubTier = "Sprout",
            TotalActiveMembers = 50,
            MembersWithDeviceTokens = 0,
            TotalDeviceTokens = 0,
            IsGrowTier = false,
            IsAzureConfigured = false,
            CurrentMonth = "December 2025"
        };

        _mockPushNotificationService
            .Setup(x => x.GetPushNotificationUsageStatsAsync(clubId))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetPushNotificationUsageStats(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        var stats = (PushNotificationUsageStatsResponse)okResult.Value!;

        Assert.That(stats.MembersWithDeviceTokens, Is.EqualTo(0));
        Assert.That(stats.TotalDeviceTokens, Is.EqualTo(0));
        Assert.That(stats.IsGrowTier, Is.False);
    }

    [Test]
    public async Task GetPushNotificationUsageStats_WithException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 456;

        _mockPushNotificationService
            .Setup(x => x.GetPushNotificationUsageStatsAsync(clubId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetPushNotificationUsageStats(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));

        var problemDetails = (ProblemDetails)objectResult.Value!;
        Assert.That(problemDetails.Title, Is.EqualTo("Usage Stats Error"));
    }

    #endregion
}