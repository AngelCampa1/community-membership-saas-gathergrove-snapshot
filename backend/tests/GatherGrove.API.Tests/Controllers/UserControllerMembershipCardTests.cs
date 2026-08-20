using System.Net;
using System.Net.Http;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.API.Controllers;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class UserControllerMembershipCardTests
{
    private Mock<IAuthService> _mockAuthService;
    private Mock<IPushNotificationService> _mockPushNotificationService;
    private Mock<IMemberService> _mockMemberService;
    private Mock<ILogger<UserController>> _mockLogger;
    private UserController _controller;

    [SetUp]
    public void SetUp()
    {
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
        // Cleanup if needed
    }

    private void SetupUserClaims(int userId, string email)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, "Member")
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = principal;
    }

    [Test]
    public async Task GetMembershipCard_WithValidUser_ReturnsMembershipCard()
    {
        // Arrange
        const int userId = 1;
        const string userEmail = "test@example.com";
        SetupUserClaims(userId, userEmail);

        var expectedResponse = new MembershipCardResponse
        {
            FullName = "John Doe",
            MembershipTypeName = "Individual",
            MembershipExpiresAt = "2025-05-28T00:00:00Z",
            QrCodeData = "GATHERGROVE_123_456_20250528"
        };

        _mockAuthService.Setup(x => x.GetMembershipCardAsync(userEmail))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetMembershipCard();

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult!.Value, Is.EqualTo(expectedResponse));

        _mockAuthService.Verify(x => x.GetMembershipCardAsync(userEmail), Times.Once);
    }

    [Test]
    public async Task GetMembershipCard_WithoutUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, "test@example.com"),
            new(ClaimTypes.Role, "Member")
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext.HttpContext.User = principal;

        // Act
        var result = await _controller.GetMembershipCard();

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult!.Value, Is.TypeOf<ProblemDetails>());

        _mockAuthService.Verify(x => x.GetMembershipCardAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task GetMembershipCard_WithoutEmailClaim_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Role, "Member")
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext.HttpContext.User = principal;

        // Act
        var result = await _controller.GetMembershipCard();

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult!.Value, Is.TypeOf<ProblemDetails>());

        _mockAuthService.Verify(x => x.GetMembershipCardAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task GetMembershipCard_WithMemberNotFound_ReturnsNotFound()
    {
        // Arrange
        const int userId = 1;
        const string userEmail = "nonexistent@example.com";
        SetupUserClaims(userId, userEmail);

        _mockAuthService.Setup(x => x.GetMembershipCardAsync(userEmail))
            .ThrowsAsync(new ArgumentException("No membership found for email: nonexistent@example.com"));

        // Act
        var result = await _controller.GetMembershipCard();

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult!.Value, Is.TypeOf<ProblemDetails>());

        var problemDetails = notFoundResult.Value as ProblemDetails;
        Assert.That(problemDetails!.Title, Is.EqualTo("Membership Not Found"));
        Assert.That(problemDetails.Status, Is.EqualTo(404));
    }

    [Test]
    public async Task GetMembershipCard_WithUnexpectedError_ReturnsInternalServerError()
    {
        // Arrange
        const int userId = 1;
        const string userEmail = "test@example.com";
        SetupUserClaims(userId, userEmail);

        _mockAuthService.Setup(x => x.GetMembershipCardAsync(userEmail))
            .ThrowsAsync(new InvalidOperationException("Database connection failed"));

        // Act
        var result = await _controller.GetMembershipCard();

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
        Assert.That(objectResult.Value, Is.TypeOf<ProblemDetails>());

        var problemDetails = objectResult.Value as ProblemDetails;
        Assert.That(problemDetails!.Title, Is.EqualTo("Membership Card Error"));
        Assert.That(problemDetails.Status, Is.EqualTo(500));
    }

    [Test]
    public async Task GetMembershipCard_LogsCorrectInformation()
    {
        // Arrange
        const int userId = 1;
        const string userEmail = "test@example.com";
        SetupUserClaims(userId, userEmail);

        var expectedResponse = new MembershipCardResponse
        {
            FullName = "John Doe",
            MembershipTypeName = "Individual",
            MembershipExpiresAt = "2025-05-28T00:00:00Z",
            QrCodeData = "GATHERGROVE_123_456_20250528"
        };

        _mockAuthService.Setup(x => x.GetMembershipCardAsync(userEmail))
            .ReturnsAsync(expectedResponse);

        // Act
        await _controller.GetMembershipCard();

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"Getting membership card for user: {userId}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"Membership card retrieved successfully for user: {userId}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}