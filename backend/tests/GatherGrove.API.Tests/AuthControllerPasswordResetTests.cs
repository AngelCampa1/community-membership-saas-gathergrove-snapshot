using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Moq;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using System.Reflection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace GatherGrove.API.Tests;

/// <summary>
/// Unit tests for password reset endpoints in AuthController
/// </summary>
[TestFixture]
public class AuthControllerPasswordResetTests
{
    private Mock<IAuthService> _mockAuthService;
    private Mock<IMemberActivationService> _mockMemberActivationService;
    private Mock<IExternalAuthService> _mockExternalAuthService;
    private Mock<ILogger<AuthController>> _mockLogger;
    private Mock<IWebHostEnvironment> _mockWebHostEnvironment;
    private Mock<IConfiguration> _mockConfiguration;
    private AuthController _controller;

    [SetUp]
    public void SetUp()
    {
        _mockAuthService = new Mock<IAuthService>();
        _mockMemberActivationService = new Mock<IMemberActivationService>();
        _mockExternalAuthService = new Mock<IExternalAuthService>();
        _mockLogger = new Mock<ILogger<AuthController>>();
        _mockWebHostEnvironment = new Mock<IWebHostEnvironment>();
        _mockConfiguration = new Mock<IConfiguration>();

        // Setup web host environment for development
        _mockWebHostEnvironment.Setup(x => x.EnvironmentName).Returns("Development");

        _controller = new AuthController(_mockAuthService.Object, _mockMemberActivationService.Object, _mockExternalAuthService.Object, _mockLogger.Object, _mockWebHostEnvironment.Object, _mockConfiguration.Object);

        // Setup HttpContext for the controller
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    #region ForgotPassword Tests

    [Test]
    public async Task ForgotPassword_WithValidRequest_ReturnsAccepted()
    {
        // Arrange
        var request = new ForgotPasswordRequest
        {
            Email = "john.doe@example.com"
        };

        _mockAuthService.Setup(x => x.ForgotPasswordAsync(It.IsAny<ForgotPasswordRequest>()))
                       .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ForgotPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<AcceptedResult>());
        var acceptedResult = result as AcceptedResult;
        Assert.That(acceptedResult?.Value, Is.Not.Null);

        // Check the message property using reflection
        var message = acceptedResult.Value?.GetType()
            .GetProperty("message")?.GetValue(acceptedResult.Value)?.ToString();
        Assert.That(message, Does.Contain("If an account with that email exists"));

        _mockAuthService.Verify(x => x.ForgotPasswordAsync(request), Times.Once);
    }

    [Test]
    public async Task ForgotPassword_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var request = new ForgotPasswordRequest
        {
            Email = "" // Invalid email
        };

        _controller.ModelState.AddModelError("Email", "Email is required");

        // Act
        var result = await _controller.ForgotPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult?.Value, Is.InstanceOf<SerializableError>());

        _mockAuthService.Verify(x => x.ForgotPasswordAsync(It.IsAny<ForgotPasswordRequest>()), Times.Never);
    }

    [Test]
    public async Task ForgotPassword_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new ForgotPasswordRequest
        {
            Email = "john.doe@example.com"
        };

        _mockAuthService.Setup(x => x.ForgotPasswordAsync(It.IsAny<ForgotPasswordRequest>()))
                       .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.ForgotPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
        Assert.That(objectResult?.Value, Is.InstanceOf<ProblemDetails>());

        var problemDetails = objectResult.Value as ProblemDetails;
        Assert.That(problemDetails?.Title, Is.EqualTo("Password Reset Error"));
        Assert.That(problemDetails?.Status, Is.EqualTo(500));
    }

    [Test]
    public async Task ForgotPassword_AlwaysReturnsAccepted_PreventingEmailEnumeration()
    {
        // Arrange - Test with non-existent email
        var request = new ForgotPasswordRequest
        {
            Email = "nonexistent@example.com"
        };

        _mockAuthService.Setup(x => x.ForgotPasswordAsync(It.IsAny<ForgotPasswordRequest>()))
                       .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ForgotPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<AcceptedResult>());
        var acceptedResult = result as AcceptedResult;

        // Check the message property using reflection
        var message = acceptedResult?.Value?.GetType()
            .GetProperty("message")?.GetValue(acceptedResult.Value)?.ToString();
        Assert.That(message, Does.Contain("If an account with that email exists"));

        // The same response should be returned regardless of whether the email exists
        _mockAuthService.Verify(x => x.ForgotPasswordAsync(request), Times.Once);
    }

    #endregion

    #region ResetPassword Tests

    [Test]
    public async Task ResetPassword_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "valid-token-123",
            NewPassword = "NewSecurePassword123!",
            ConfirmPassword = "NewSecurePassword123!"
        };

        _mockAuthService.Setup(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordRequest>()))
                       .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ResetPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult?.Value, Is.Not.Null);

        // Check the message property using reflection
        var message = okResult.Value?.GetType()
            .GetProperty("message")?.GetValue(okResult.Value)?.ToString();
        Assert.That(message, Does.Contain("Password reset successful"));

        _mockAuthService.Verify(x => x.ResetPasswordAsync(request), Times.Once);
    }

    [Test]
    public async Task ResetPassword_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "valid-token-123",
            NewPassword = "weak", // Invalid password
            ConfirmPassword = "weak"
        };

        _controller.ModelState.AddModelError("NewPassword", "Password must be at least 8 characters long");

        // Act
        var result = await _controller.ResetPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult?.Value, Is.InstanceOf<SerializableError>());

        _mockAuthService.Verify(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordRequest>()), Times.Never);
    }

    [Test]
    public async Task ResetPassword_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "invalid-token",
            NewPassword = "NewSecurePassword123!",
            ConfirmPassword = "NewSecurePassword123!"
        };

        _mockAuthService.Setup(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordRequest>()))
                       .ThrowsAsync(new UnauthorizedAccessException("Invalid or expired reset token"));

        // Act
        var result = await _controller.ResetPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult?.Value, Is.InstanceOf<ProblemDetails>());

        var problemDetails = unauthorizedResult.Value as ProblemDetails;
        Assert.That(problemDetails?.Title, Is.EqualTo("Invalid Reset Token"));
        Assert.That(problemDetails?.Status, Is.EqualTo(401));
        Assert.That(problemDetails?.Detail, Does.Contain("invalid, expired, or has already been used"));
    }

    [Test]
    public async Task ResetPassword_WithExpiredToken_ReturnsUnauthorized()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "expired-token",
            NewPassword = "NewSecurePassword123!",
            ConfirmPassword = "NewSecurePassword123!"
        };

        _mockAuthService.Setup(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordRequest>()))
                       .ThrowsAsync(new UnauthorizedAccessException("Invalid or expired reset token"));

        // Act
        var result = await _controller.ResetPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult?.Value, Is.InstanceOf<ProblemDetails>());

        var problemDetails = unauthorizedResult.Value as ProblemDetails;
        Assert.That(problemDetails?.Title, Is.EqualTo("Invalid Reset Token"));
        Assert.That(problemDetails?.Status, Is.EqualTo(401));
    }

    [Test]
    public async Task ResetPassword_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "valid-token-123",
            NewPassword = "NewSecurePassword123!",
            ConfirmPassword = "NewSecurePassword123!"
        };

        _mockAuthService.Setup(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordRequest>()))
                       .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.ResetPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
        Assert.That(objectResult?.Value, Is.InstanceOf<ProblemDetails>());

        var problemDetails = objectResult.Value as ProblemDetails;
        Assert.That(problemDetails?.Title, Is.EqualTo("Password Reset Error"));
        Assert.That(problemDetails?.Status, Is.EqualTo(500));
    }

    [Test]
    public async Task ResetPassword_WithMismatchedPasswords_ReturnsBadRequest()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "valid-token-123",
            NewPassword = "NewSecurePassword123!",
            ConfirmPassword = "DifferentPassword123!" // Mismatched confirmation
        };

        _controller.ModelState.AddModelError("ConfirmPassword", "Password and confirmation do not match");

        // Act
        var result = await _controller.ResetPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult?.Value, Is.InstanceOf<SerializableError>());

        _mockAuthService.Verify(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordRequest>()), Times.Never);
    }

    #endregion

    #region Input Validation Tests

    [Test]
    public async Task ForgotPassword_WithEmptyEmail_ReturnsBadRequest()
    {
        // Arrange
        var request = new ForgotPasswordRequest
        {
            Email = ""
        };

        _controller.ModelState.AddModelError("Email", "Email is required");

        // Act
        var result = await _controller.ForgotPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        _mockAuthService.Verify(x => x.ForgotPasswordAsync(It.IsAny<ForgotPasswordRequest>()), Times.Never);
    }

    [Test]
    public async Task ForgotPassword_WithInvalidEmailFormat_ReturnsBadRequest()
    {
        // Arrange
        var request = new ForgotPasswordRequest
        {
            Email = "invalid-email-format"
        };

        _controller.ModelState.AddModelError("Email", "Please enter a valid email address");

        // Act
        var result = await _controller.ForgotPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        _mockAuthService.Verify(x => x.ForgotPasswordAsync(It.IsAny<ForgotPasswordRequest>()), Times.Never);
    }

    [Test]
    public async Task ResetPassword_WithEmptyToken_ReturnsBadRequest()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "",
            NewPassword = "NewSecurePassword123!",
            ConfirmPassword = "NewSecurePassword123!"
        };

        _controller.ModelState.AddModelError("Token", "Token is required");

        // Act
        var result = await _controller.ResetPassword(request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        _mockAuthService.Verify(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordRequest>()), Times.Never);
    }

    #endregion
}