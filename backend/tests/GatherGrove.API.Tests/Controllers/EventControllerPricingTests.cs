using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace GatherGrove.API.Tests.Controllers;

/// <summary>
/// TDD Tests for Event API Controller pricing functionality
/// RED PHASE: These tests should FAIL initially until implementation is complete
/// </summary>
[TestFixture]
public class EventControllerPricingTests
{
    private Mock<IEventService> _mockEventService;
    private Mock<ILogger<EventsController>> _mockLogger;
    private Mock<IEventTokenService> _mockTokenService;
    private Mock<IConfiguration> _mockConfiguration;
    private GatherGroveDbContext _context;
    private EventsController _controller;

    [SetUp]
    public void SetUp()
    {
        _mockEventService = new Mock<IEventService>();
        _mockLogger = new Mock<ILogger<EventsController>>();
        _mockTokenService = new Mock<IEventTokenService>();
        _mockConfiguration = new Mock<IConfiguration>();

        // Create in-memory database context for unit tests
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"EventControllerPricingTest_{Guid.NewGuid()}")
            .Options;
        _context = new GatherGroveDbContext(options);

        _controller = new EventsController(_mockEventService.Object, _mockLogger.Object, _context, _mockTokenService.Object, _mockConfiguration.Object);

        // Setup user claims for authorization
        var claims = new List<System.Security.Claims.Claim>
        {
            new System.Security.Claims.Claim("ClubId", "1"),
            new System.Security.Claims.Claim("UserId", "1")
        };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new System.Security.Claims.ClaimsPrincipal(identity);

        _controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext()
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext() { User = claimsPrincipal }
        };
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    [Test]
    [Category("TDD-RED")]
    [Category("API")]
    public async Task CreateEvent_WithMemberAndNonMemberPrices_ShouldReturnCreatedEvent()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Paid Workshop",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Community Center",
            Description = "Premium workshop for members and non-members",
            MemberPrice = 20.00m,
            NonMemberPrice = 35.00m,
            IsFree = false
        };

        var expectedEvent = new EventResponse
        {
            Id = 1,
            ClubId = 1,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            MemberPrice = request.MemberPrice,
            NonMemberPrice = request.NonMemberPrice,
            IsFree = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            AttendeeCount = 0,
            TotalRsvpCount = 0
        };

        _mockEventService
            .Setup(s => s.CreateEventAsync(It.IsAny<int>(), It.IsAny<CreateEventRequest>()))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.CreateEvent(1, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;
        var returnedEvent = createdResult.Value as EventResponse;

        Assert.That(returnedEvent.MemberPrice, Is.EqualTo(20.00m));
        Assert.That(returnedEvent.NonMemberPrice, Is.EqualTo(35.00m));
        Assert.That(returnedEvent.IsFree, Is.False);
    }

    [Test]
    [Category("TDD-RED")]
    [Category("API")]
    public async Task CreateEvent_WithZeroPrices_ShouldCreateFreeEvent()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Free Meetup",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Park",
            Description = "Free community event",
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            IsFree = true
        };

        var expectedEvent = new EventResponse
        {
            Id = 1,
            ClubId = 1,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            IsFree = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            AttendeeCount = 0,
            TotalRsvpCount = 0
        };

        _mockEventService
            .Setup(s => s.CreateEventAsync(It.IsAny<int>(), It.IsAny<CreateEventRequest>()))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.CreateEvent(1, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;
        var returnedEvent = createdResult.Value as EventResponse;

        Assert.That(returnedEvent.MemberPrice, Is.EqualTo(0.00m));
        Assert.That(returnedEvent.NonMemberPrice, Is.EqualTo(0.00m));
        Assert.That(returnedEvent.IsFree, Is.True);
    }

    [Test]
    [Category("TDD-RED")]
    [Category("API")]
    public async Task CreateEvent_WithNullPrices_ShouldCreateFreeEvent()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Community Gathering",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Library",
            Description = "Open to all, no charge",
            MemberPrice = null,
            NonMemberPrice = null,
            IsFree = true
        };

        var expectedEvent = new EventResponse
        {
            Id = 1,
            ClubId = 1,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            MemberPrice = null,
            NonMemberPrice = null,
            IsFree = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            AttendeeCount = 0,
            TotalRsvpCount = 0
        };

        _mockEventService
            .Setup(s => s.CreateEventAsync(It.IsAny<int>(), It.IsAny<CreateEventRequest>()))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.CreateEvent(1, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;
        var returnedEvent = createdResult.Value as EventResponse;

        Assert.That(returnedEvent.MemberPrice, Is.Null);
        Assert.That(returnedEvent.NonMemberPrice, Is.Null);
        Assert.That(returnedEvent.IsFree, Is.True);
    }

    [Test]
    [Category("TDD-RED")]
    [Category("API")]
    [Category("Validation")]
    public async Task CreateEvent_WithNegativeMemberPrice_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Invalid Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = -10.00m,
            NonMemberPrice = 20.00m,
            IsFree = false
        };

        _mockEventService
            .Setup(s => s.CreateEventAsync(It.IsAny<int>(), It.IsAny<CreateEventRequest>()))
            .ThrowsAsync(new ArgumentException("Member price cannot be negative"));

        // Act
        var result = await _controller.CreateEvent(1, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    [Category("TDD-RED")]
    [Category("API")]
    [Category("Validation")]
    public async Task CreateEvent_WithNegativeNonMemberPrice_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Invalid Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = 20.00m,
            NonMemberPrice = -10.00m,
            IsFree = false
        };

        _mockEventService
            .Setup(s => s.CreateEventAsync(It.IsAny<int>(), It.IsAny<CreateEventRequest>()))
            .ThrowsAsync(new ArgumentException("Non-member price cannot be negative"));

        // Act
        var result = await _controller.CreateEvent(1, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    [Category("TDD-RED")]
    [Category("API")]
    [Category("Validation")]
    public async Task CreateEvent_WithMemberPriceHigherThanNonMember_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Name = "Invalid Pricing Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = 50.00m,
            NonMemberPrice = 30.00m,
            IsFree = false
        };

        _mockEventService
            .Setup(s => s.CreateEventAsync(It.IsAny<int>(), It.IsAny<CreateEventRequest>()))
            .ThrowsAsync(new ArgumentException("Member price cannot be greater than non-member price"));

        // Act
        var result = await _controller.CreateEvent(1, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    [Category("TDD-RED")]
    [Category("API")]
    public async Task UpdateEvent_WithUpdatedPricing_ShouldReturnUpdatedEvent()
    {
        // Arrange
        var request = new UpdateEventRequest
        {
            Name = "Updated Workshop",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "New Venue",
            Description = "Updated description",
            MemberPrice = 25.00m,
            NonMemberPrice = 40.00m,
            IsFree = false
        };

        var expectedEvent = new EventResponse
        {
            Id = 1,
            ClubId = 1,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            MemberPrice = request.MemberPrice,
            NonMemberPrice = request.NonMemberPrice,
            IsFree = false,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow,
            AttendeeCount = 5,
            TotalRsvpCount = 10
        };

        _mockEventService
            .Setup(s => s.UpdateEventAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateEventRequest>()))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.UpdateEvent(1, 1, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var returnedEvent = okResult.Value as EventResponse;

        Assert.That(returnedEvent.MemberPrice, Is.EqualTo(25.00m));
        Assert.That(returnedEvent.NonMemberPrice, Is.EqualTo(40.00m));
        Assert.That(returnedEvent.IsFree, Is.False);
    }

    [Test]
    [Category("TDD-RED")]
    [Category("API")]
    public async Task UpdateEvent_ChangingFromPaidToFree_ShouldUpdateSuccessfully()
    {
        // Arrange
        var request = new UpdateEventRequest
        {
            Name = "Now Free Workshop",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Community Center",
            Description = "Now free for everyone!",
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            IsFree = true
        };

        var expectedEvent = new EventResponse
        {
            Id = 1,
            ClubId = 1,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            IsFree = true,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow,
            AttendeeCount = 0,
            TotalRsvpCount = 0
        };

        _mockEventService
            .Setup(s => s.UpdateEventAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateEventRequest>()))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.UpdateEvent(1, 1, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var returnedEvent = okResult.Value as EventResponse;

        Assert.That(returnedEvent.MemberPrice, Is.EqualTo(0.00m));
        Assert.That(returnedEvent.NonMemberPrice, Is.EqualTo(0.00m));
        Assert.That(returnedEvent.IsFree, Is.True);
    }

    [Test]
    [Category("TDD-RED")]
    [Category("API")]
    public async Task GetEvent_ShouldReturnEventWithPricingInformation()
    {
        // Arrange
        var expectedEvent = new EventResponse
        {
            Id = 1,
            ClubId = 1,
            Name = "Existing Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Venue",
            Description = "Event with pricing",
            MemberPrice = 15.00m,
            NonMemberPrice = 25.00m,
            IsFree = false,
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddDays(-1),
            AttendeeCount = 20,
            TotalRsvpCount = 30
        };

        _mockEventService
            .Setup(s => s.GetEventByIdAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.GetEvent(1, 1);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var returnedEvent = okResult.Value as EventResponse;

        Assert.That(returnedEvent.MemberPrice, Is.EqualTo(15.00m));
        Assert.That(returnedEvent.NonMemberPrice, Is.EqualTo(25.00m));
        Assert.That(returnedEvent.IsFree, Is.False);
    }

    [Test]
    [Category("TDD-RED")]
    [Category("API")]
    public async Task GetUpcomingEvents_ShouldReturnEventsWithPricingInformation()
    {
        // Arrange
        var expectedEvents = new List<EventResponse>
        {
            new EventResponse
            {
                Id = 1,
                ClubId = 1,
                Name = "Free Event",
                EventDateTime = DateTime.UtcNow.AddDays(5),
                Location = "Park",
                Description = "Free community event",
                MemberPrice = 0.00m,
                NonMemberPrice = 0.00m,
                IsFree = true,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                UpdatedAt = DateTime.UtcNow.AddDays(-3),
                AttendeeCount = 50,
                TotalRsvpCount = 60
            },
            new EventResponse
            {
                Id = 2,
                ClubId = 1,
                Name = "Paid Workshop",
                EventDateTime = DateTime.UtcNow.AddDays(10),
                Location = "Community Center",
                Description = "Premium workshop",
                MemberPrice = 20.00m,
                NonMemberPrice = 35.00m,
                IsFree = false,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-2),
                AttendeeCount = 15,
                TotalRsvpCount = 20
            }
        };

        _mockEventService
            .Setup(s => s.GetEventsByClubAsync(It.IsAny<int>(), "upcoming"))
            .ReturnsAsync(expectedEvents);

        // Act
        var result = await _controller.GetEvents(1, "upcoming");

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var returnedEvents = okResult.Value as List<EventResponse>;

        Assert.That(returnedEvents, Has.Count.EqualTo(2));
        Assert.That(returnedEvents[0].IsFree, Is.True);
        Assert.That(returnedEvents[1].IsFree, Is.False);
        Assert.That(returnedEvents[1].MemberPrice, Is.EqualTo(20.00m));
        Assert.That(returnedEvents[1].NonMemberPrice, Is.EqualTo(35.00m));
    }
}
