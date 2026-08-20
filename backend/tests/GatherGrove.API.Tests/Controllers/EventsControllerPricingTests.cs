using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.API.Tests.Controllers;

/// <summary>
/// Unit tests for event pricing functionality in EventsController
/// </summary>
[TestFixture]
public class EventsControllerPricingTests
{
    private EventsController _controller = null!;
    private Mock<IEventService> _mockEventService = null!;
    private Mock<ILogger<EventsController>> _mockLogger = null!;
    private Mock<IEventTokenService> _mockTokenService = null!;
    private Mock<IConfiguration> _mockConfiguration = null!;
    private GatherGroveDbContext _context = null!;
    private const int TestClubId = 1;

    [SetUp]
    public void Setup()
    {
        _mockEventService = new Mock<IEventService>();
        _mockLogger = new Mock<ILogger<EventsController>>();
        _mockTokenService = new Mock<IEventTokenService>();
        _mockConfiguration = new Mock<IConfiguration>();

        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"EventsControllerPricingTest_{Guid.NewGuid()}")
            .Options;
        _context = new GatherGroveDbContext(options);

        _controller = new EventsController(_mockEventService.Object, _mockLogger.Object, _context, _mockTokenService.Object, _mockConfiguration.Object);

        // Setup default user claims for authentication
        var claims = new List<Claim>
        {
            new Claim("ClubId", TestClubId.ToString()),
            new Claim("UserId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    #region Create Events with Pricing

    [Test]
    public async Task CreateEvent_WithValidPricing_ReturnsCreatedResult()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Paid Workshop",
            EventDateTime = DateTime.Now.AddDays(14),
            Location = "Conference Center",
            Description = "Premium workshop with tiered pricing",
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m,
            IsFree = false
        };

        var expectedResponse = new EventResponse
        {
            Id = 1,
            ClubId = TestClubId,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m,
            IsPaid = true,
            IsFree = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.CreateEventAsync(TestClubId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CreateEvent(TestClubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;
        Assert.That(createdResult!.StatusCode, Is.EqualTo(201));

        var eventResponse = createdResult.Value as EventResponse;
        Assert.That(eventResponse, Is.Not.Null);
        Assert.That(eventResponse!.MemberPrice, Is.EqualTo(25.00m));
        Assert.That(eventResponse.NonMemberPrice, Is.EqualTo(50.00m));
        Assert.That(eventResponse.IsPaid, Is.True);
        Assert.That(eventResponse.IsFree, Is.False);

        _mockEventService.Verify(s => s.CreateEventAsync(TestClubId, request), Times.Once);
    }

    [Test]
    public async Task CreateEvent_FreeEvent_ReturnsCreatedResult()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Free Community Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Community Hall",
            Description = "Free event for all",
            MemberPrice = null,
            NonMemberPrice = null,
            IsFree = true
        };

        var expectedResponse = new EventResponse
        {
            Id = 1,
            ClubId = TestClubId,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            IsPaid = false,
            IsFree = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.CreateEventAsync(TestClubId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CreateEvent(TestClubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;

        var eventResponse = createdResult!.Value as EventResponse;
        Assert.That(eventResponse!.IsFree, Is.True);
        Assert.That(eventResponse.IsPaid, Is.False);
        Assert.That(eventResponse.MemberPrice, Is.EqualTo(0.00m));
        Assert.That(eventResponse.NonMemberPrice, Is.EqualTo(0.00m));
    }

    [Test]
    public async Task CreateEvent_InvalidPricing_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Invalid Pricing Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "This should fail validation",
            MemberPrice = 100.00m,
            NonMemberPrice = 50.00m, // Less than member price - invalid
            IsFree = false
        };

        _mockEventService.Setup(s => s.CreateEventAsync(TestClubId, request))
            .ThrowsAsync(new ArgumentException("Member price cannot be greater than non-member price"));

        // Act
        var result = await _controller.CreateEvent(TestClubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult!.Value?.ToString(), Does.Contain("Member price cannot be greater than non-member price").IgnoreCase);
    }

    [Test]
    public async Task CreateEvent_UnauthorizedClub_ReturnsForbid()
    {
        // Arrange
        var differentClubId = 999;
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "This should fail authorization",
            MemberPrice = 10.00m,
            NonMemberPrice = 20.00m,
            IsFree = false
        };

        // Act
        var result = await _controller.CreateEvent(differentClubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    #endregion

    #region Update Event Pricing

    [Test]
    public async Task UpdateEvent_ChangePricing_ReturnsOkResult()
    {
        // Arrange
        var eventId = 1;
        var request = new UpdateEventRequest
        {
            Name = "Event To Update",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Convention Center",
            Description = "Event with pricing to be updated",
            MemberPrice = 30.00m,
            NonMemberPrice = 60.00m,
            IsFree = false
        };

        var expectedResponse = new EventResponse
        {
            Id = eventId,
            ClubId = TestClubId,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            MemberPrice = 30.00m,
            NonMemberPrice = 60.00m,
            IsPaid = true,
            IsFree = false,
            CreatedAt = DateTime.UtcNow.AddDays(-7),
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.UpdateEventAsync(TestClubId, eventId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateEvent(TestClubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;

        var eventResponse = okResult!.Value as EventResponse;
        Assert.That(eventResponse!.MemberPrice, Is.EqualTo(30.00m));
        Assert.That(eventResponse.NonMemberPrice, Is.EqualTo(60.00m));

        _mockEventService.Verify(s => s.UpdateEventAsync(TestClubId, eventId, request), Times.Once);
    }

    [Test]
    public async Task UpdateEvent_ChangeFromPaidToFree_ReturnsOkResult()
    {
        // Arrange
        var eventId = 1;
        var request = new UpdateEventRequest
        {
            Name = "Originally Paid Event",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Event Hall",
            Description = "Now free",
            MemberPrice = null,
            NonMemberPrice = null,
            IsFree = true
        };

        var expectedResponse = new EventResponse
        {
            Id = eventId,
            ClubId = TestClubId,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            IsPaid = false,
            IsFree = true,
            CreatedAt = DateTime.UtcNow.AddDays(-7),
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.UpdateEventAsync(TestClubId, eventId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateEvent(TestClubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;

        var eventResponse = okResult!.Value as EventResponse;
        Assert.That(eventResponse!.IsFree, Is.True);
        Assert.That(eventResponse.IsPaid, Is.False);
    }

    [Test]
    public async Task UpdateEvent_ChangeFromFreeToPaid_ReturnsOkResult()
    {
        // Arrange
        var eventId = 1;
        var request = new UpdateEventRequest
        {
            Name = "Originally Free Event",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Community Hall",
            Description = "Now paid",
            MemberPrice = 15.00m,
            NonMemberPrice = 30.00m,
            IsFree = false
        };

        var expectedResponse = new EventResponse
        {
            Id = eventId,
            ClubId = TestClubId,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            MemberPrice = 15.00m,
            NonMemberPrice = 30.00m,
            IsPaid = true,
            IsFree = false,
            CreatedAt = DateTime.UtcNow.AddDays(-7),
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.UpdateEventAsync(TestClubId, eventId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateEvent(TestClubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;

        var eventResponse = okResult!.Value as EventResponse;
        Assert.That(eventResponse!.IsPaid, Is.True);
        Assert.That(eventResponse.IsFree, Is.False);
        Assert.That(eventResponse.MemberPrice, Is.EqualTo(15.00m));
        Assert.That(eventResponse.NonMemberPrice, Is.EqualTo(30.00m));
    }

    #endregion
}
