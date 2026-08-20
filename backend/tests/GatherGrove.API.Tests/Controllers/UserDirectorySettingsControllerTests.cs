using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class UserDirectorySettingsControllerTests
{
    private Mock<IMemberDirectorySettingsService> _mockService;
    private Mock<ILogger<UserDirectorySettingsController>> _mockLogger;
    private UserDirectorySettingsController _controller;

    [SetUp]
    public void Setup()
    {
        _mockService = new Mock<IMemberDirectorySettingsService>();
        _mockLogger = new Mock<ILogger<UserDirectorySettingsController>>();
        _controller = new UserDirectorySettingsController(_mockService.Object, _mockLogger.Object);

        // Setup a default user context
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Email, "test@example.com"),
            new("ClubId", "1"),
            new(ClaimTypes.Role, "Member")
        };
        var identity = new ClaimsIdentity(claims, "Test");
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
    public async Task GetDirectorySettings_ValidRequest_ReturnsOk()
    {
        // Arrange
        var expectedSettings = new MemberDirectorySettingsResponse
        {
            ClubDirectoryEnabled = true,
            AdminAllowedSharableFields = new[] { "email", "phoneNumber" },
            IsListed = true,
            VisibleFields = new[] { "email" }
        };

        _mockService.Setup(x => x.GetMemberDirectorySettingsAsync(1))
                   .ReturnsAsync(expectedSettings);

        // Act
        var result = await _controller.GetDirectorySettings();

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var response = okResult.Value as MemberDirectorySettingsResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response.ClubDirectoryEnabled, Is.True);
        Assert.That(response.AdminAllowedSharableFields, Is.EqualTo(new[] { "email", "phoneNumber" }));
        Assert.That(response.IsListed, Is.True);
        Assert.That(response.VisibleFields, Is.EqualTo(new[] { "email" }));
    }

    [Test]
    public async Task GetDirectorySettings_InvalidUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "invalid"),
            new(ClaimTypes.Email, "test@example.com")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = principal;

        // Act
        var result = await _controller.GetDirectorySettings();

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);
        Assert.That(unauthorizedResult.StatusCode, Is.EqualTo(401));
    }

    [Test]
    public async Task GetDirectorySettings_UserNotFound_ReturnsNotFound()
    {
        // Arrange
        _mockService.Setup(x => x.GetMemberDirectorySettingsAsync(1))
                   .ThrowsAsync(new ArgumentException("User not found"));

        // Act
        var result = await _controller.GetDirectorySettings();

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult, Is.Not.Null);
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));
    }

    [Test]
    public async Task GetDirectorySettings_MemberNotFound_ReturnsNotFound()
    {
        // Arrange
        _mockService.Setup(x => x.GetMemberDirectorySettingsAsync(1))
                   .ThrowsAsync(new InvalidOperationException("Member record not found"));

        // Act
        var result = await _controller.GetDirectorySettings();

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult, Is.Not.Null);
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));
    }

    [Test]
    public async Task GetDirectorySettings_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        _mockService.Setup(x => x.GetMemberDirectorySettingsAsync(1))
                   .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetDirectorySettings();

        // Assert
        var serverErrorResult = result as ObjectResult;
        Assert.That(serverErrorResult, Is.Not.Null);
        Assert.That(serverErrorResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task UpdateDirectorySettings_ValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new UpdateMemberDirectorySettingsRequest
        {
            IsListed = true,
            VisibleFields = new[] { "email", "phoneNumber" }
        };

        var expectedResponse = new MemberDirectorySettingsResponse
        {
            ClubDirectoryEnabled = true,
            AdminAllowedSharableFields = new[] { "email", "phoneNumber" },
            IsListed = true,
            VisibleFields = new[] { "email", "phoneNumber" }
        };

        _mockService.Setup(x => x.UpdateMemberDirectorySettingsAsync(1, request))
                   .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateDirectorySettings(request);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        var response = okResult.Value as MemberDirectorySettingsResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response.IsListed, Is.True);
        Assert.That(response.VisibleFields, Is.EqualTo(new[] { "email", "phoneNumber" }));
    }

    [Test]
    public async Task UpdateDirectorySettings_InvalidUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "invalid"),
            new(ClaimTypes.Email, "test@example.com")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = principal;

        var request = new UpdateMemberDirectorySettingsRequest
        {
            IsListed = true,
            VisibleFields = new[] { "email" }
        };

        // Act
        var result = await _controller.UpdateDirectorySettings(request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        Assert.That(unauthorizedResult, Is.Not.Null);
        Assert.That(unauthorizedResult.StatusCode, Is.EqualTo(401));
    }

    [Test]
    public async Task UpdateDirectorySettings_DirectoryDisabled_ReturnsBadRequest()
    {
        // Arrange
        var request = new UpdateMemberDirectorySettingsRequest
        {
            IsListed = true,
            VisibleFields = new[] { "email" }
        };

        _mockService.Setup(x => x.UpdateMemberDirectorySettingsAsync(1, request))
                   .ThrowsAsync(new InvalidOperationException("The member directory is currently disabled"));

        // Act
        var result = await _controller.UpdateDirectorySettings(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));
    }

    [Test]
    public async Task UpdateDirectorySettings_InvalidFields_ReturnsBadRequest()
    {
        // Arrange
        var request = new UpdateMemberDirectorySettingsRequest
        {
            IsListed = true,
            VisibleFields = new[] { "email", "phoneNumber" }
        };

        _mockService.Setup(x => x.UpdateMemberDirectorySettingsAsync(1, request))
                   .ThrowsAsync(new ArgumentException("The following fields are not allowed by your club admin: phoneNumber"));

        // Act
        var result = await _controller.UpdateDirectorySettings(request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));
    }

    [Test]
    public async Task UpdateDirectorySettings_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new UpdateMemberDirectorySettingsRequest
        {
            IsListed = true,
            VisibleFields = new[] { "email" }
        };

        _mockService.Setup(x => x.UpdateMemberDirectorySettingsAsync(1, request))
                   .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UpdateDirectorySettings(request);

        // Assert
        var serverErrorResult = result as ObjectResult;
        Assert.That(serverErrorResult, Is.Not.Null);
        Assert.That(serverErrorResult.StatusCode, Is.EqualTo(500));
    }
}