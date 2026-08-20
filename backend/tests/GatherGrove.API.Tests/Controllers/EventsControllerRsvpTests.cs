using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class EventsControllerRsvpTests
{
    private EventsController _controller;
    private Mock<IEventService> _mockEventService;
    private Mock<ILogger<EventsController>> _mockLogger;
    private Mock<IEventTokenService> _mockTokenService;
    private Mock<IConfiguration> _mockConfiguration;
    private GatherGroveDbContext _context;

    [SetUp]
    public void Setup()
    {
        _mockEventService = new Mock<IEventService>();
        _mockLogger = new Mock<ILogger<EventsController>>();
        _mockTokenService = new Mock<IEventTokenService>();
        _mockConfiguration = new Mock<IConfiguration>();

        // Create in-memory database context for unit tests
        // Use a unique database name to avoid conflicts between test runs
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"EventsControllerRsvpTest_{Guid.NewGuid()}")
            .Options;
        _context = new GatherGroveDbContext(options);

        _controller = new EventsController(_mockEventService.Object, _mockLogger.Object, _context, _mockTokenService.Object, _mockConfiguration.Object);
    }

    private void SetupUserClaims(int clubId, string email = "admin@example.com", bool isAdmin = true)
    {
        // Setup authentication claims
        var claims = new List<Claim>
        {
            new Claim("UserId", "1"),
            new Claim("ClubId", clubId.ToString()),
            new Claim("Email", email),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.NameIdentifier, "1")
        };

        if (isAdmin)
        {
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        }

        var identity = new ClaimsIdentity(claims, "test");
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

    private async Task<(Club club, Event testEvent, Member member)> SetupTestData()
    {
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Sprout"
        };

        var testEvent = new Event
        {
            Club = club,
            Name = "Test Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member = new Member
        {
            Club = club,
            FullName = "John Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "123-456-7890",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        _context.Events.Add(testEvent);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        return (club, testEvent, member);
    }

    [Test]
    public async Task UpdateRsvp_AdminUpdatingMemberRsvp_ReturnsOkWithRsvp()
    {
        // Arrange
        var (club, testEvent, member) = await SetupTestData();
        SetupUserClaims(club.Id);
        var request = new UpdateRsvpRequest { RsvpStatus = "Attending" };

        var expectedRsvp = new EventRsvpResponse
        {
            Id = 1,
            EventId = testEvent.Id,
            MemberId = member.Id,
            MemberName = member.FullName,
            MemberEmail = member.Email,
            RsvpStatus = "Attending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.UpsertRsvpAsync(club.Id, testEvent.Id, member.Id, request))
            .ReturnsAsync(expectedRsvp);

        // Act
        var result = await _controller.UpdateRsvp(club.Id, testEvent.Id, member.Id, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult?.Value, Is.EqualTo(expectedRsvp));

        _mockEventService.Verify(s => s.UpsertRsvpAsync(club.Id, testEvent.Id, member.Id, request), Times.Once);
    }

    [Test]
    public async Task UpdateRsvp_MemberUpdatingOwnRsvp_ReturnsOkWithRsvp()
    {
        // Arrange
        var (club, testEvent, member) = await SetupTestData();
        SetupUserClaims(club.Id, member.Email, false); // Non-admin member
        var request = new UpdateRsvpRequest { RsvpStatus = "NotAttending" };

        var expectedRsvp = new EventRsvpResponse
        {
            Id = 1,
            EventId = testEvent.Id,
            MemberId = member.Id,
            MemberName = member.FullName,
            MemberEmail = member.Email,
            RsvpStatus = "NotAttending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.UpsertRsvpAsync(club.Id, testEvent.Id, member.Id, request))
            .ReturnsAsync(expectedRsvp);

        // Act
        var result = await _controller.UpdateRsvp(club.Id, testEvent.Id, member.Id, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult?.Value, Is.EqualTo(expectedRsvp));
    }

    [Test]
    public async Task UpdateRsvp_EventNotFound_ReturnsNotFound()
    {
        // Arrange
        var (club, _, member) = await SetupTestData();
        SetupUserClaims(club.Id);
        var request = new UpdateRsvpRequest { RsvpStatus = "Attending" };
        var nonExistentEventId = 9999;

        _mockEventService.Setup(s => s.UpsertRsvpAsync(club.Id, nonExistentEventId, member.Id, request))
            .ThrowsAsync(new ArgumentException($"Event with ID {nonExistentEventId} not found in club {club.Id}", nameof(nonExistentEventId)));

        // Act
        var result = await _controller.UpdateRsvp(club.Id, nonExistentEventId, member.Id, request);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult?.Value?.ToString(), Does.Contain("not found"));
    }

    [Test]
    public async Task UpdateRsvp_MemberNotFound_ReturnsNotFound()
    {
        // Arrange
        var (club, testEvent, _) = await SetupTestData();
        SetupUserClaims(club.Id);
        var request = new UpdateRsvpRequest { RsvpStatus = "Attending" };
        var nonExistentMemberId = 9999;

        _mockEventService.Setup(s => s.UpsertRsvpAsync(club.Id, testEvent.Id, nonExistentMemberId, request))
            .ThrowsAsync(new ArgumentException($"Member with ID {nonExistentMemberId} not found in club {club.Id}", nameof(nonExistentMemberId)));

        // Act
        var result = await _controller.UpdateRsvp(club.Id, testEvent.Id, nonExistentMemberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult?.Value?.ToString(), Does.Contain("not found"));
    }

    [Test]
    public async Task UpdateRsvp_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var (club, testEvent, member) = await SetupTestData();
        SetupUserClaims(club.Id);
        var request = new UpdateRsvpRequest { RsvpStatus = "Attending" };

        _mockEventService.Setup(s => s.UpsertRsvpAsync(club.Id, testEvent.Id, member.Id, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UpdateRsvp(club.Id, testEvent.Id, member.Id, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task GetEventRsvps_ValidEvent_ReturnsOkWithRsvps()
    {
        // Arrange
        var (club, testEvent, _) = await SetupTestData();
        SetupUserClaims(club.Id);

        var expectedRsvps = new List<EventRsvpResponse>
        {
            new EventRsvpResponse
            {
                Id = 1,
                EventId = testEvent.Id,
                MemberId = 1,
                MemberName = "John Doe",
                MemberEmail = "john.doe@example.com",
                RsvpStatus = "Attending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventRsvpResponse
            {
                Id = 2,
                EventId = testEvent.Id,
                MemberId = 2,
                MemberName = "Jane Smith",
                MemberEmail = "jane.smith@example.com",
                RsvpStatus = "NotAttending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockEventService.Setup(s => s.GetEventRsvpsAsync(club.Id, testEvent.Id))
            .ReturnsAsync(expectedRsvps);

        // Act
        var result = await _controller.GetEventRsvps(club.Id, testEvent.Id);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult?.Value, Is.EqualTo(expectedRsvps));

        _mockEventService.Verify(s => s.GetEventRsvpsAsync(club.Id, testEvent.Id), Times.Once);
    }

    [Test]
    public async Task GetEventRsvps_EventNotFound_ReturnsNotFound()
    {
        // Arrange
        var (club, _, _) = await SetupTestData();
        SetupUserClaims(club.Id);
        var nonExistentEventId = 9999;

        _mockEventService.Setup(s => s.GetEventRsvpsAsync(club.Id, nonExistentEventId))
            .ThrowsAsync(new ArgumentException($"Event with ID {nonExistentEventId} not found in club {club.Id}", nameof(nonExistentEventId)));

        // Act
        var result = await _controller.GetEventRsvps(club.Id, nonExistentEventId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetEventRsvps_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var (club, testEvent, _) = await SetupTestData();
        SetupUserClaims(club.Id);

        _mockEventService.Setup(s => s.GetEventRsvpsAsync(club.Id, testEvent.Id))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEventRsvps(club.Id, testEvent.Id);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task GetMemberRsvp_ExistingRsvp_ReturnsOkWithRsvp()
    {
        // Arrange
        var (club, testEvent, member) = await SetupTestData();
        SetupUserClaims(club.Id);

        var expectedRsvp = new EventRsvpResponse
        {
            Id = 1,
            EventId = testEvent.Id,
            MemberId = member.Id,
            MemberName = member.FullName,
            MemberEmail = member.Email,
            RsvpStatus = "Attending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.GetMemberRsvpAsync(club.Id, testEvent.Id, member.Id))
            .ReturnsAsync(expectedRsvp);

        // Act
        var result = await _controller.GetMemberRsvp(club.Id, testEvent.Id, member.Id);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult?.Value, Is.EqualTo(expectedRsvp));

        _mockEventService.Verify(s => s.GetMemberRsvpAsync(club.Id, testEvent.Id, member.Id), Times.Once);
    }

    [Test]
    public async Task GetMemberRsvp_NoRsvpFound_ReturnsNotFound()
    {
        // Arrange
        var (club, testEvent, member) = await SetupTestData();
        SetupUserClaims(club.Id);

        _mockEventService.Setup(s => s.GetMemberRsvpAsync(club.Id, testEvent.Id, member.Id))
            .ReturnsAsync((EventRsvpResponse?)null);

        // Act
        var result = await _controller.GetMemberRsvp(club.Id, testEvent.Id, member.Id);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task GetMemberRsvp_EventNotFound_ReturnsNotFound()
    {
        // Arrange
        var (club, _, member) = await SetupTestData();
        SetupUserClaims(club.Id);
        var nonExistentEventId = 9999;

        _mockEventService.Setup(s => s.GetMemberRsvpAsync(club.Id, nonExistentEventId, member.Id))
            .ThrowsAsync(new ArgumentException($"Event with ID {nonExistentEventId} not found in club {club.Id}", nameof(nonExistentEventId)));

        // Act
        var result = await _controller.GetMemberRsvp(club.Id, nonExistentEventId, member.Id);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetMemberRsvp_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var (club, testEvent, member) = await SetupTestData();
        SetupUserClaims(club.Id);

        _mockEventService.Setup(s => s.GetMemberRsvpAsync(club.Id, testEvent.Id, member.Id))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMemberRsvp(club.Id, testEvent.Id, member.Id);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
    }
}