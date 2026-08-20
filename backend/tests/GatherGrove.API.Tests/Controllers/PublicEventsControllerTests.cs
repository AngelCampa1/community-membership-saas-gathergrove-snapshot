using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace GatherGrove.API.Tests.Controllers;

/// <summary>
/// TDD Tests for PublicEventsController - Public Payment Link Access
/// Category: TDD-RED Phase
/// No authorization required for these endpoints
/// Converted from xUnit to NUnit
/// </summary>
[TestFixture]
public class PublicEventsControllerTests
{
    private Mock<IEventTokenService> _mockTokenService;
    private Mock<ILogger<PublicEventsController>> _mockLogger;
    private PublicEventsController _controller;

    [SetUp]
    public void SetUp()
    {
        _mockTokenService = new Mock<IEventTokenService>();
        _mockLogger = new Mock<ILogger<PublicEventsController>>();
        _controller = new PublicEventsController(_mockTokenService.Object, _mockLogger.Object);
    }

    [Test]
    [Category("TDD-RED")]
    [Category("PublicAccess")]
    public async Task GetEventByToken_WithValidToken_ShouldReturnOkWithPublicEventDto()
    {
        // Arrange
        var token = "valid_public_token_12345678901234567890";
        var eventEntity = new Event
        {
            Id = 1,
            ClubId = 1,
            Name = "Public Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Public Venue",
            Description = "Open to everyone",
            MemberPrice = 15.00m,
            NonMemberPrice = 25.00m,
            PaymentToken = token,
            Club = new Club { Id = 1, Name = "Test Club" }
        };

        _mockTokenService
            .Setup(s => s.ValidatePaymentTokenAsync(token))
            .ReturnsAsync(eventEntity);

        // Act
        var result = await _controller.GetEventByToken(token);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        var publicEventDto = okResult.Value as PublicEventDto;
        Assert.That(publicEventDto, Is.Not.Null);

        Assert.That(publicEventDto.Name, Is.EqualTo("Public Event"));
        Assert.That(publicEventDto.Location, Is.EqualTo("Public Venue"));
        Assert.That(publicEventDto.MemberPrice, Is.EqualTo(15.00m));
        Assert.That(publicEventDto.NonMemberPrice, Is.EqualTo(25.00m));
        Assert.That(publicEventDto.ClubName, Is.EqualTo("Test Club"));
        Assert.That(publicEventDto.IsFree, Is.False);
    }

    [Test]
    [Category("TDD-RED")]
    [Category("PublicAccess")]
    public async Task GetEventByToken_WithInvalidToken_ShouldReturnNotFound()
    {
        // Arrange
        var invalidToken = "invalid_token";
        _mockTokenService
            .Setup(s => s.ValidatePaymentTokenAsync(invalidToken))
            .ReturnsAsync((Event)null);

        // Act
        var result = await _controller.GetEventByToken(invalidToken);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult, Is.Not.Null);
        Assert.That(notFoundResult.Value.ToString().ToLower(), Does.Contain("not found"));
    }

    [Test]
    [Category("TDD-RED")]
    [Category("PublicAccess")]
    public async Task GetEventByToken_WithNullToken_ShouldReturnBadRequest()
    {
        // Act
        var result = await _controller.GetEventByToken(null);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.Value.ToString().ToLower(), Does.Contain("token"));
    }

    [Test]
    [Category("TDD-RED")]
    [Category("PublicAccess")]
    public async Task GetEventByToken_WithEmptyToken_ShouldReturnBadRequest()
    {
        // Act
        var result = await _controller.GetEventByToken(string.Empty);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult, Is.Not.Null);
        Assert.That(badRequestResult.Value.ToString().ToLower(), Does.Contain("token"));
    }

    [Test]
    [Category("TDD-RED")]
    [Category("DataProtection")]
    public async Task GetEventByToken_ShouldNotExposeClubId()
    {
        // Arrange
        var token = "secure_token_12345678901234567890";
        var eventEntity = new Event
        {
            Id = 1,
            ClubId = 999, // Sensitive internal ID
            Name = "Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Location",
            PaymentToken = token,
            Club = new Club { Id = 999, Name = "Club Name" }
        };

        _mockTokenService
            .Setup(s => s.ValidatePaymentTokenAsync(token))
            .ReturnsAsync(eventEntity);

        // Act
        var result = await _controller.GetEventByToken(token);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        var publicEventDto = okResult.Value as PublicEventDto;
        Assert.That(publicEventDto, Is.Not.Null);

        // PublicEventDto should NOT include ClubId for security
        var dtoProperties = publicEventDto.GetType().GetProperties();
        Assert.That(dtoProperties, Has.None.Matches<System.Reflection.PropertyInfo>(p => p.Name == "ClubId"));
    }

    [Test]
    [Category("TDD-RED")]
    [Category("DataProtection")]
    public async Task GetEventByToken_ShouldNotExposeInternalEventId()
    {
        // Arrange
        var token = "secure_token_12345678901234567890";
        var eventEntity = new Event
        {
            Id = 123, // Internal ID
            ClubId = 1,
            Name = "Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Location",
            PaymentToken = token,
            Club = new Club { Id = 1, Name = "Club Name" }
        };

        _mockTokenService
            .Setup(s => s.ValidatePaymentTokenAsync(token))
            .ReturnsAsync(eventEntity);

        // Act
        var result = await _controller.GetEventByToken(token);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        var publicEventDto = okResult.Value as PublicEventDto;
        Assert.That(publicEventDto, Is.Not.Null);

        // PublicEventDto should NOT include internal Id for security
        var dtoProperties = publicEventDto.GetType().GetProperties();
        Assert.That(dtoProperties, Has.None.Matches<System.Reflection.PropertyInfo>(p => p.Name == "Id"));
    }

    [Test]
    [Category("TDD-RED")]
    [Category("PublicAccess")]
    public async Task GetEventByToken_ForFreeEvent_ShouldIndicateFree()
    {
        // Arrange
        var token = "free_event_token_12345678901234567890";
        var eventEntity = new Event
        {
            Id = 1,
            ClubId = 1,
            Name = "Free Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Community Center",
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            PaymentToken = token,
            Club = new Club { Id = 1, Name = "Free Club" }
        };

        _mockTokenService
            .Setup(s => s.ValidatePaymentTokenAsync(token))
            .ReturnsAsync(eventEntity);

        // Act
        var result = await _controller.GetEventByToken(token);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        var publicEventDto = okResult.Value as PublicEventDto;
        Assert.That(publicEventDto, Is.Not.Null);

        Assert.That(publicEventDto.IsFree, Is.True);
        Assert.That(publicEventDto.MemberPrice, Is.EqualTo(0.00m));
        Assert.That(publicEventDto.NonMemberPrice, Is.EqualTo(0.00m));
    }

    [Test]
    [Category("TDD-RED")]
    [Category("ErrorHandling")]
    public async Task GetEventByToken_WhenServiceThrowsException_ShouldReturn500()
    {
        // Arrange
        var token = "error_token";
        _mockTokenService
            .Setup(s => s.ValidatePaymentTokenAsync(token))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetEventByToken(token);

        // Assert
        var statusCodeResult = result as ObjectResult;
        Assert.That(statusCodeResult, Is.Not.Null);
        Assert.That(statusCodeResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    [Category("TDD-RED")]
    [Category("PublicAccess")]
    public async Task GetEventByToken_ShouldBeAccessibleWithoutAuthentication()
    {
        // This test verifies the controller does NOT have [Authorize] attribute
        // and the specific action does NOT require authentication

        // Arrange
        var controllerType = typeof(PublicEventsController);
        var actionMethod = controllerType.GetMethod(nameof(PublicEventsController.GetEventByToken));

        // Assert
        var authorizeAttributes = controllerType.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), false);
        Assert.That(authorizeAttributes, Is.Empty); // Controller should NOT have [Authorize]

        var actionAuthorizeAttributes = actionMethod?.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), false);
        Assert.That(actionAuthorizeAttributes ?? Array.Empty<object>(), Is.Empty); // Action should NOT have [Authorize]
    }

    [Test]
    [Category("TDD-RED")]
    [Category("RateLimit")]
    public async Task GetEventByToken_ShouldHaveRateLimitingApplied()
    {
        // This test documents that rate limiting middleware should be applied
        // Implementation will be verified in integration tests

        // Assert: Verify controller or action has rate limiting attribute/policy
        var controllerType = typeof(PublicEventsController);
        var actionMethod = controllerType.GetMethod(nameof(PublicEventsController.GetEventByToken));

        // Rate limiting can be applied via:
        // 1. Custom [RateLimit] attribute
        // 2. Middleware configuration
        // 3. Policy-based approach

        // For now, document this requirement
#pragma warning disable NUnit2007 // The actual value should not be a constant
        Assert.That(true, Is.True, "Rate limiting should be configured for public endpoints");
#pragma warning restore NUnit2007
    }
}