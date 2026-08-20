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
using Microsoft.Extensions.Hosting;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.API.Controllers;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.API.Tests.Shared;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class UserControllerTests
{
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;
    private string _databaseName = null!;
    private Mock<IAuthService> _mockAuthService = null!;
    private Mock<IPushNotificationService> _mockPushNotificationService = null!;
    private Mock<IMemberService> _mockMemberService = null!;
    private Mock<ILogger<UserController>> _mockLogger = null!;
    private UserController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _databaseName = $"TestDb_{Guid.NewGuid()}";

        _factory = new TestWebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Replace real services with mocks
                    var authServiceDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IAuthService));
                    if (authServiceDescriptor != null) services.Remove(authServiceDescriptor);

                    var pushServiceDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IPushNotificationService));
                    if (pushServiceDescriptor != null) services.Remove(pushServiceDescriptor);

                    services.AddSingleton<IAuthService>(_ => Mock.Of<IAuthService>());
                    services.AddSingleton<IPushNotificationService>(_ => Mock.Of<IPushNotificationService>());
                });
            });

        _client = _factory.CreateClient();

        _mockAuthService = new Mock<IAuthService>();
        _mockPushNotificationService = new Mock<IPushNotificationService>();
        _mockMemberService = new Mock<IMemberService>();
        _mockLogger = new Mock<ILogger<UserController>>();

        _controller = new UserController(_mockAuthService.Object, _mockPushNotificationService.Object, _mockLogger.Object, _mockMemberService.Object);

        // Setup HttpContext for the controller
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [TearDown]
    public void TearDown()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }

    private void SetupUserClaims(int userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, "Admin")
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = principal;
    }

    [Test]
    public async Task RegisterDeviceToken_WithValidRequest_ReturnsOkWithResponse()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "test_device_token_12345",
            DeviceType = "android"
        };

        var expectedResponse = new RegisterDeviceTokenResponse
        {
            Success = true,
            Message = "Device token registered successfully",
            DeviceToken = request.DeviceToken,
            DeviceType = request.DeviceType,
            RegisteredAt = DateTime.UtcNow
        };

        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.RegisterDeviceToken(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        var response = (RegisterDeviceTokenResponse)okResult.Value!;

        Assert.That(response.Success, Is.True);
        Assert.That(response.DeviceToken, Is.EqualTo(request.DeviceToken));
        Assert.That(response.DeviceType, Is.EqualTo(request.DeviceType));

        _mockPushNotificationService.Verify(
            x => x.RegisterDeviceTokenAsync(userId, It.Is<RegisterDeviceTokenRequest>(r =>
                r.DeviceToken == request.DeviceToken && r.DeviceType == request.DeviceType)),
            Times.Once);
    }

    [Test]
    public async Task RegisterDeviceToken_WithIOSDevice_ReturnsOkWithResponse()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "ios_device_token_abcdef",
            DeviceType = "ios"
        };

        var expectedResponse = new RegisterDeviceTokenResponse
        {
            Success = true,
            Message = "Device token registered successfully",
            DeviceToken = request.DeviceToken,
            DeviceType = request.DeviceType,
            RegisteredAt = DateTime.UtcNow
        };

        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.RegisterDeviceToken(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        var response = (RegisterDeviceTokenResponse)okResult.Value!;

        Assert.That(response.Success, Is.True);
        Assert.That(response.DeviceType, Is.EqualTo("ios"));
    }

    [Test]
    public async Task RegisterDeviceToken_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange - Don't set up user claims (no authentication)
        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "test_device_token",
            DeviceType = "android"
        };

        // Act
        var result = await _controller.RegisterDeviceToken(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = (UnauthorizedObjectResult)result;
        var problemDetails = (ProblemDetails)unauthorizedResult.Value!;

        Assert.That(problemDetails.Title, Is.EqualTo("Authentication Error"));
        Assert.That(problemDetails.Detail, Is.EqualTo("Invalid authentication token."));
        Assert.That(problemDetails.Status, Is.EqualTo(401));
    }

    [Test]
    public async Task RegisterDeviceToken_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "", // Invalid - empty token
            DeviceType = "android"
        };

        // Manually add model state error to simulate validation failure
        _controller.ModelState.AddModelError("DeviceToken", "Device token is required");

        // Act
        var result = await _controller.RegisterDeviceToken(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result;
        Assert.That(badRequestResult.Value, Is.InstanceOf<SerializableError>());
    }

    [Test]
    public async Task RegisterDeviceToken_WithInvalidDeviceType_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "test_device_token",
            DeviceType = "invalid_type" // Invalid device type
        };

        // Manually add model state error to simulate validation failure
        _controller.ModelState.AddModelError("DeviceType", "Device type must be either 'android' or 'ios'");

        // Act
        var result = await _controller.RegisterDeviceToken(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task RegisterDeviceToken_WithServiceFailure_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "test_device_token",
            DeviceType = "android"
        };

        var failedResponse = new RegisterDeviceTokenResponse
        {
            Success = false,
            Message = "Failed to register device token"
        };

        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.RegisterDeviceToken(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));

        var problemDetails = (ProblemDetails)objectResult.Value!;
        Assert.That(problemDetails.Title, Is.EqualTo("Device Token Registration Error"));
        Assert.That(problemDetails.Detail, Is.EqualTo("Failed to register device token"));
        Assert.That(problemDetails.Status, Is.EqualTo(500));
    }

    [Test]
    public async Task RegisterDeviceToken_WithUnexpectedException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "test_device_token",
            DeviceType = "android"
        };

        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.RegisterDeviceToken(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));

        var problemDetails = (ProblemDetails)objectResult.Value!;
        Assert.That(problemDetails.Title, Is.EqualTo("Device Token Registration Error"));
        Assert.That(problemDetails.Detail, Is.EqualTo("An unexpected error occurred while registering your device token. Please try again."));
        Assert.That(problemDetails.Status, Is.EqualTo(500));
    }

    [Test]
    public async Task RegisterDeviceToken_LogsInformationOnSuccess()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "test_device_token",
            DeviceType = "android"
        };

        var successResponse = new RegisterDeviceTokenResponse
        {
            Success = true,
            Message = "Device token registered successfully",
            DeviceToken = request.DeviceToken,
            DeviceType = request.DeviceType,
            RegisteredAt = DateTime.UtcNow
        };

        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.RegisterDeviceToken(request);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Registering device token for user")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Device token registered successfully")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task RegisterDeviceToken_LogsWarningOnServiceFailure()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "test_device_token",
            DeviceType = "android"
        };

        var failedResponse = new RegisterDeviceTokenResponse
        {
            Success = false,
            Message = "Registration failed"
        };

        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.RegisterDeviceToken(request);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Device token registration failed")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task RegisterDeviceToken_LogsErrorOnException()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "test_device_token",
            DeviceType = "android"
        };

        var exception = new Exception("Service unavailable");
        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ThrowsAsync(exception);

        // Act
        var result = await _controller.RegisterDeviceToken(request);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Unexpected error during device token registration")),
                exception,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task RegisterDeviceToken_WithExistingTokenUpdate_ReturnsOkWithUpdateMessage()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "existing_device_token",
            DeviceType = "ios" // Updated from android to ios
        };

        var updateResponse = new RegisterDeviceTokenResponse
        {
            Success = true,
            Message = "Device token updated successfully",
            DeviceToken = request.DeviceToken,
            DeviceType = request.DeviceType,
            RegisteredAt = DateTime.UtcNow
        };

        _mockPushNotificationService
            .Setup(x => x.RegisterDeviceTokenAsync(userId, It.IsAny<RegisterDeviceTokenRequest>()))
            .ReturnsAsync(updateResponse);

        // Act
        var result = await _controller.RegisterDeviceToken(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        var response = (RegisterDeviceTokenResponse)okResult.Value!;

        Assert.That(response.Success, Is.True);
        Assert.That(response.Message, Is.EqualTo("Device token updated successfully"));
        Assert.That(response.DeviceType, Is.EqualTo("ios"));
    }

    #region RemoveDeviceToken Tests

    [Test]
    public async Task RemoveDeviceToken_WithValidToken_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var deviceToken = "test_device_token_12345";

        _mockPushNotificationService
            .Setup(x => x.RemoveDeviceTokenAsync(userId, deviceToken))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.RemoveDeviceToken(deviceToken);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        var response = okResult.Value;

        Assert.That(response, Is.Not.Null);
        Assert.That(response.ToString(), Contains.Substring("Device token removed successfully"));

        _mockPushNotificationService.Verify(
            x => x.RemoveDeviceTokenAsync(userId, deviceToken),
            Times.Once);
    }

    [Test]
    public async Task RemoveDeviceToken_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange - Don't set up user claims (no authentication)
        var deviceToken = "test_device_token";

        // Act
        var result = await _controller.RemoveDeviceToken(deviceToken);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = (UnauthorizedObjectResult)result;
        var problemDetails = (ProblemDetails)unauthorizedResult.Value!;

        Assert.That(problemDetails.Title, Is.EqualTo("Authentication Error"));
        Assert.That(problemDetails.Detail, Is.EqualTo("Invalid authentication token."));
        Assert.That(problemDetails.Status, Is.EqualTo(401));
    }

    [Test]
    public async Task RemoveDeviceToken_WithNonExistentToken_ReturnsNotFound()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var deviceToken = "non_existent_token";

        _mockPushNotificationService
            .Setup(x => x.RemoveDeviceTokenAsync(userId, deviceToken))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.RemoveDeviceToken(deviceToken);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = (NotFoundObjectResult)result;
        var problemDetails = (ProblemDetails)notFoundResult.Value!;

        Assert.That(problemDetails.Title, Is.EqualTo("Device Token Not Found"));
        Assert.That(problemDetails.Detail, Is.EqualTo("The specified device token was not found for this user."));
        Assert.That(problemDetails.Status, Is.EqualTo(404));
    }

    [Test]
    public async Task RemoveDeviceToken_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var deviceToken = "test_device_token";

        var exception = new Exception("Database unavailable");
        _mockPushNotificationService
            .Setup(x => x.RemoveDeviceTokenAsync(userId, deviceToken))
            .ThrowsAsync(exception);

        // Act
        var result = await _controller.RemoveDeviceToken(deviceToken);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = (ObjectResult)result;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));

        var problemDetails = (ProblemDetails)objectResult.Value!;
        Assert.That(problemDetails.Title, Is.EqualTo("Device Token Removal Error"));
        Assert.That(problemDetails.Detail, Is.EqualTo("An unexpected error occurred while removing your device token. Please try again."));
        Assert.That(problemDetails.Status, Is.EqualTo(500));
    }

    [Test]
    public async Task RemoveDeviceToken_LogsInformationOnSuccess()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var deviceToken = "test_device_token";

        _mockPushNotificationService
            .Setup(x => x.RemoveDeviceTokenAsync(userId, deviceToken))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.RemoveDeviceToken(deviceToken);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Removing device token for user")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Device token removed successfully")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task RemoveDeviceToken_LogsWarningOnNotFound()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var deviceToken = "non_existent_token";

        _mockPushNotificationService
            .Setup(x => x.RemoveDeviceTokenAsync(userId, deviceToken))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.RemoveDeviceToken(deviceToken);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Device token not found")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task RemoveDeviceToken_LogsErrorOnException()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var deviceToken = "test_device_token";

        var exception = new Exception("Service unavailable");
        _mockPushNotificationService
            .Setup(x => x.RemoveDeviceTokenAsync(userId, deviceToken))
            .ThrowsAsync(exception);

        // Act
        var result = await _controller.RemoveDeviceToken(deviceToken);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Unexpected error during device token removal")),
                exception,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task RemoveDeviceToken_WithSpecialCharactersInToken_HandlesCorrectly()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var deviceToken = "token_with+special/characters=123";

        _mockPushNotificationService
            .Setup(x => x.RemoveDeviceTokenAsync(userId, deviceToken))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.RemoveDeviceToken(deviceToken);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());

        _mockPushNotificationService.Verify(
            x => x.RemoveDeviceTokenAsync(userId, deviceToken),
            Times.Once);
    }

    #endregion

    #region UpdateProfile Tests

    [Test]
    public async Task UpdateProfile_WithValidRequest_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new UpdateProfileRequest { FullName = "Updated Name" };

        _mockAuthService
            .Setup(x => x.UpdateProfileAsync(userId, request))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.UpdateProfile(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var value = okResult!.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        Assert.That(messageProperty!.GetValue(value), Is.EqualTo("Profile updated successfully!"));

        _mockAuthService.Verify(x => x.UpdateProfileAsync(userId, request), Times.Once);
    }

    [Test]
    public async Task UpdateProfile_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var request = new UpdateProfileRequest { FullName = "Updated Name" };

        // Act
        var result = await _controller.UpdateProfile(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult!.Value, Is.InstanceOf<ProblemDetails>());

        _mockAuthService.Verify(x => x.UpdateProfileAsync(It.IsAny<int>(), It.IsAny<UpdateProfileRequest>()), Times.Never);
    }

    [Test]
    public async Task UpdateProfile_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new UpdateProfileRequest { FullName = "Updated Name" };
        _controller.ModelState.AddModelError("FullName", "Full name is required");

        // Act
        var result = await _controller.UpdateProfile(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());

        _mockAuthService.Verify(x => x.UpdateProfileAsync(It.IsAny<int>(), It.IsAny<UpdateProfileRequest>()), Times.Never);
    }

    [Test]
    public async Task UpdateProfile_WithUserNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new UpdateProfileRequest { FullName = "Updated Name" };

        _mockAuthService
            .Setup(x => x.UpdateProfileAsync(userId, request))
            .ThrowsAsync(new ArgumentException("User not found"));

        // Act
        var result = await _controller.UpdateProfile(request);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult!.Value, Is.InstanceOf<ProblemDetails>());
    }

    [Test]
    public async Task UpdateProfile_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new UpdateProfileRequest { FullName = "Updated Name" };

        _mockAuthService
            .Setup(x => x.UpdateProfileAsync(userId, request))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.UpdateProfile(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region ChangePassword Tests

    [Test]
    public async Task ChangePassword_WithValidRequest_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPass123!",
            NewPassword = "NewPass456!"
        };

        _mockAuthService
            .Setup(x => x.ChangePasswordAsync(userId, request))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ChangePassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var value = okResult!.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        Assert.That(messageProperty!.GetValue(value), Is.EqualTo("Password changed successfully!"));

        _mockAuthService.Verify(x => x.ChangePasswordAsync(userId, request), Times.Once);
    }

    [Test]
    public async Task ChangePassword_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPass123!",
            NewPassword = "NewPass456!"
        };

        // Act
        var result = await _controller.ChangePassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockAuthService.Verify(x => x.ChangePasswordAsync(It.IsAny<int>(), It.IsAny<ChangePasswordRequest>()), Times.Never);
    }

    [Test]
    public async Task ChangePassword_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPass123!",
            NewPassword = "weak"
        };
        _controller.ModelState.AddModelError("NewPassword", "Password too weak");

        // Act
        var result = await _controller.ChangePassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());

        _mockAuthService.Verify(x => x.ChangePasswordAsync(It.IsAny<int>(), It.IsAny<ChangePasswordRequest>()), Times.Never);
    }

    [Test]
    public async Task ChangePassword_WithIncorrectCurrentPassword_ReturnsUnauthorized()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "WrongPass123!",
            NewPassword = "NewPass456!"
        };

        _mockAuthService
            .Setup(x => x.ChangePasswordAsync(userId, request))
            .ThrowsAsync(new UnauthorizedAccessException("Current password is incorrect"));

        // Act
        var result = await _controller.ChangePassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult!.Value, Is.InstanceOf<ProblemDetails>());
    }

    [Test]
    public async Task ChangePassword_WithUserNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPass123!",
            NewPassword = "NewPass456!"
        };

        _mockAuthService
            .Setup(x => x.ChangePasswordAsync(userId, request))
            .ThrowsAsync(new ArgumentException("User not found"));

        // Act
        var result = await _controller.ChangePassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task ChangePassword_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPass123!",
            NewPassword = "NewPass456!"
        };

        _mockAuthService
            .Setup(x => x.ChangePasswordAsync(userId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.ChangePassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetMembershipCard Tests

    [Test]
    public async Task GetMembershipCard_WithValidUser_ReturnsOkWithCard()
    {
        // Arrange
        var userId = 1;
        var email = "member@example.com";
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, "Member")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext.HttpContext.User = principal;

        var membershipCard = new MembershipCardResponse
        {
            FullName = "John Doe",
            MembershipTypeName = "Gold",
            MembershipExpiresAt = DateTime.UtcNow.AddYears(1).ToString("yyyy-MM-ddTHH:mm:ssZ"),
            QrCodeData = "MEMBER-123-ABC"
        };

        _mockAuthService
            .Setup(x => x.GetMembershipCardAsync(email))
            .ReturnsAsync(membershipCard);

        // Act
        var result = await _controller.GetMembershipCard();

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var card = okResult!.Value as MembershipCardResponse;
        Assert.That(card!.FullName, Is.EqualTo("John Doe"));
        Assert.That(card.MembershipTypeName, Is.EqualTo("Gold"));

        _mockAuthService.Verify(x => x.GetMembershipCardAsync(email), Times.Once);
    }

    [Test]
    public async Task GetMembershipCard_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Act
        var result = await _controller.GetMembershipCard();

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockAuthService.Verify(x => x.GetMembershipCardAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task GetMembershipCard_WithoutEmailClaim_ReturnsUnauthorized()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId); // This only sets NameIdentifier, not Email

        // Act
        var result = await _controller.GetMembershipCard();

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockAuthService.Verify(x => x.GetMembershipCardAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task GetMembershipCard_WithMembershipNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = 1;
        var email = "member@example.com";
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, "Member")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext.HttpContext.User = principal;

        _mockAuthService
            .Setup(x => x.GetMembershipCardAsync(email))
            .ThrowsAsync(new ArgumentException("Membership not found"));

        // Act
        var result = await _controller.GetMembershipCard();

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetMembershipCard_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        var email = "member@example.com";
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, "Member")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext.HttpContext.User = principal;

        _mockAuthService
            .Setup(x => x.GetMembershipCardAsync(email))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetMembershipCard();

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetUserProfileDetails Tests

    [Test]
    public async Task GetUserProfileDetails_WithValidUser_ReturnsOkWithProfile()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var memberProfile = new MemberProfileResponse
        {
            FullName = "Jane Smith",
            Email = "jane@example.com",
            PhoneNumber = "+1234567890",
            MembershipTypeName = "Premium",
            DuesPaidUntil = DateTime.UtcNow.AddMonths(12),
            CustomFieldValues = new List<MemberCustomFieldValueResponse>
            {
                new() { FieldLabel = "Emergency Contact", FieldValue = "John Smith" },
                new() { FieldLabel = "Diet Preferences", FieldValue = "" }, // Should be filtered out
                new() { FieldLabel = "Company", FieldValue = "Acme Corp" }
            }
        };

        _mockMemberService
            .Setup(x => x.GetMemberProfileAsync(userId))
            .ReturnsAsync(memberProfile);

        // Act
        var result = await _controller.GetUserProfileDetails();

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var profile = okResult!.Value as UserProfileDetailsResponse;
        Assert.That(profile!.FullName, Is.EqualTo("Jane Smith"));
        Assert.That(profile.Email, Is.EqualTo("jane@example.com"));
        Assert.That(profile.CustomFields.Count, Is.EqualTo(2)); // Only fields with values

        _mockMemberService.Verify(x => x.GetMemberProfileAsync(userId), Times.Once);
    }

    [Test]
    public async Task GetUserProfileDetails_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Act
        var result = await _controller.GetUserProfileDetails();

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockMemberService.Verify(x => x.GetMemberProfileAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetUserProfileDetails_WithProfileNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        _mockMemberService
            .Setup(x => x.GetMemberProfileAsync(userId))
            .ThrowsAsync(new ArgumentException("Profile not found"));

        // Act
        var result = await _controller.GetUserProfileDetails();

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetUserProfileDetails_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        _mockMemberService
            .Setup(x => x.GetMemberProfileAsync(userId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetUserProfileDetails();

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetPaymentConfiguration Tests

    [Test]
    public async Task GetPaymentConfiguration_WithValidUser_ReturnsOkWithConfig()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        var paymentConfig = new StripeConfigResponse
        {
            IsConfigured = true,
            IsDevelopmentMode = false
        };

        _mockMemberService
            .Setup(x => x.GetPaymentConfigurationAsync(userId))
            .ReturnsAsync(paymentConfig);

        // Act
        var result = await _controller.GetPaymentConfiguration();

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var config = okResult!.Value as StripeConfigResponse;
        Assert.That(config!.IsConfigured, Is.True);
        Assert.That(config.IsDevelopmentMode, Is.False);

        _mockMemberService.Verify(x => x.GetPaymentConfigurationAsync(userId), Times.Once);
    }

    [Test]
    public async Task GetPaymentConfiguration_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Act
        var result = await _controller.GetPaymentConfiguration();

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockMemberService.Verify(x => x.GetPaymentConfigurationAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetPaymentConfiguration_WithMembershipNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        _mockMemberService
            .Setup(x => x.GetPaymentConfigurationAsync(userId))
            .ThrowsAsync(new ArgumentException("Membership not found"));

        // Act
        var result = await _controller.GetPaymentConfiguration();

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetPaymentConfiguration_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);

        _mockMemberService
            .Setup(x => x.GetPaymentConfigurationAsync(userId))
            .ThrowsAsync(new Exception("Configuration error"));

        // Act
        var result = await _controller.GetPaymentConfiguration();

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region PayMyDues Tests

    [Test]
    public async Task PayMyDues_WithValidRequest_ReturnsOkWithPayment()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new PayMyDuesRequest
        {
            PaymentMethodId = "pm_test_123",
            MembershipTypeId = 5
        };

        var payment = new PaymentResponse
        {
            PaymentId = 123,
            Amount = 50.00m,
            IsSuccess = true,
            PaymentMethod = "Stripe",
            TransactionId = "pay_123"
        };

        _mockMemberService
            .Setup(x => x.PayMemberDuesAsync(userId, request))
            .ReturnsAsync(payment);

        // Act
        var result = await _controller.PayMyDues(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var paymentResult = okResult!.Value as PaymentResponse;
        Assert.That(paymentResult!.PaymentId, Is.EqualTo(123));
        Assert.That(paymentResult.Amount, Is.EqualTo(50.00m));
        Assert.That(paymentResult.IsSuccess, Is.True);

        _mockMemberService.Verify(x => x.PayMemberDuesAsync(userId, request), Times.Once);
    }

    [Test]
    public async Task PayMyDues_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var request = new PayMyDuesRequest
        {
            PaymentMethodId = "pm_test_123",
            MembershipTypeId = 5
        };

        // Act
        var result = await _controller.PayMyDues(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

        _mockMemberService.Verify(x => x.PayMemberDuesAsync(It.IsAny<int>(), It.IsAny<PayMyDuesRequest>()), Times.Never);
    }

    [Test]
    public async Task PayMyDues_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new PayMyDuesRequest
        {
            PaymentMethodId = "pm_test_123",
            MembershipTypeId = 5
        };
        _controller.ModelState.AddModelError("PaymentMethodId", "Invalid payment method");

        // Act
        var result = await _controller.PayMyDues(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());

        _mockMemberService.Verify(x => x.PayMemberDuesAsync(It.IsAny<int>(), It.IsAny<PayMyDuesRequest>()), Times.Never);
    }

    [Test]
    public async Task PayMyDues_WithArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new PayMyDuesRequest
        {
            PaymentMethodId = "pm_test_123",
            MembershipTypeId = 5
        };

        _mockMemberService
            .Setup(x => x.PayMemberDuesAsync(userId, request))
            .ThrowsAsync(new ArgumentException("Invalid membership type"));

        // Act
        var result = await _controller.PayMyDues(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult!.Value, Is.InstanceOf<ProblemDetails>());
    }

    [Test]
    public async Task PayMyDues_WithInvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new PayMyDuesRequest
        {
            PaymentMethodId = "pm_test_123",
            MembershipTypeId = 5
        };

        _mockMemberService
            .Setup(x => x.PayMemberDuesAsync(userId, request))
            .ThrowsAsync(new InvalidOperationException("Payment already processed"));

        // Act
        var result = await _controller.PayMyDues(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task PayMyDues_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = 1;
        SetupUserClaims(userId);
        var request = new PayMyDuesRequest
        {
            PaymentMethodId = "pm_test_123",
            MembershipTypeId = 5
        };

        _mockMemberService
            .Setup(x => x.PayMemberDuesAsync(userId, request))
            .ThrowsAsync(new Exception("Payment gateway error"));

        // Act
        var result = await _controller.PayMyDues(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
    }

    #endregion
}