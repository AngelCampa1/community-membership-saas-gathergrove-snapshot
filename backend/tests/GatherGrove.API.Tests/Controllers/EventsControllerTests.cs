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

[TestFixture]
public class EventsControllerTests
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
            .UseInMemoryDatabase(databaseName: $"EventsControllerTest_{Guid.NewGuid()}")
            .Options;
        _context = new GatherGroveDbContext(options);

        _controller = new EventsController(_mockEventService.Object, _mockLogger.Object, _context, _mockTokenService.Object, _mockConfiguration.Object);

        // Setup default user claims for authentication
        var claims = new List<Claim>
        {
            new Claim("ClubId", "1"),
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

    [Test]
    public async Task CreateEvent_ValidRequest_ReturnsCreatedResult()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateEventRequest
        {
            Name = "Annual Plant Sale",
            EventDateTime = new DateTime(2025, 7, 15, 10, 0, 0),
            Location = "Town Hall Park",
            Description = "<p>Our biggest sale of the year!</p>"
        };

        var expectedResponse = new EventResponse
        {
            Id = 1,
            ClubId = clubId,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.CreateEventAsync(clubId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CreateEvent(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;
        Assert.That(createdResult.StatusCode, Is.EqualTo(201));
        Assert.That(createdResult.Value, Is.EqualTo(expectedResponse));
        Assert.That(createdResult.ActionName, Is.EqualTo(nameof(_controller.GetEvent)));

        _mockEventService.Verify(s => s.CreateEventAsync(clubId, request), Times.Once);
    }

    [Test]
    public async Task CreateEvent_ClubMismatch_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from user's club (1)
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "Test Description"
        };

        // Act
        var result = await _controller.CreateEvent(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.CreateEventAsync(It.IsAny<int>(), It.IsAny<CreateEventRequest>()), Times.Never);
    }

    [Test]
    public async Task CreateEvent_ServiceThrowsArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "Test Description"
        };

        _mockEventService.Setup(s => s.CreateEventAsync(clubId, request))
            .ThrowsAsync(new ArgumentException("Club not found"));

        // Act
        var result = await _controller.CreateEvent(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));
    }

    [Test]
    public async Task CreateEvent_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "Test Description"
        };

        _mockEventService.Setup(s => s.CreateEventAsync(clubId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CreateEvent(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task UpdateEvent_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new UpdateEventRequest
        {
            Name = "Updated Event",
            EventDateTime = new DateTime(2025, 8, 15, 14, 0, 0),
            Location = "Updated Location",
            Description = "<p>Updated description!</p>"
        };

        var expectedResponse = new EventResponse
        {
            Id = eventId,
            ClubId = clubId,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.UpdateEventAsync(clubId, eventId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateEvent(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockEventService.Verify(s => s.UpdateEventAsync(clubId, eventId, request), Times.Once);
    }

    [Test]
    public async Task UpdateEvent_ClubMismatch_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from user's club (1)
        var eventId = 1;
        var request = new UpdateEventRequest
        {
            Name = "Updated Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Updated Location",
            Description = "Updated Description"
        };

        // Act
        var result = await _controller.UpdateEvent(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.UpdateEventAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateEventRequest>()), Times.Never);
    }

    [Test]
    public async Task UpdateEvent_ServiceThrowsArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 999;
        var request = new UpdateEventRequest
        {
            Name = "Updated Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Updated Location",
            Description = "Updated Description"
        };

        _mockEventService.Setup(s => s.UpdateEventAsync(clubId, eventId, request))
            .ThrowsAsync(new ArgumentException("Event not found"));

        // Act
        var result = await _controller.UpdateEvent(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult.StatusCode, Is.EqualTo(400));
    }

    [Test]
    public async Task GetEvent_ExistingEvent_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var expectedResponse = new EventResponse
        {
            Id = eventId,
            ClubId = clubId,
            Name = "Test Event",
            EventDateTime = new DateTime(2025, 6, 15, 10, 0, 0),
            Location = "Test Location",
            Description = "Test Description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.GetEventByIdAsync(clubId, eventId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetEvent(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockEventService.Verify(s => s.GetEventByIdAsync(clubId, eventId), Times.Once);
    }

    [Test]
    public async Task GetEvent_EventNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 999;

        _mockEventService.Setup(s => s.GetEventByIdAsync(clubId, eventId))
            .ReturnsAsync((EventResponse)null);

        // Act
        var result = await _controller.GetEvent(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));
    }

    [Test]
    public async Task GetEvent_ClubMismatch_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from user's club (1)
        var eventId = 1;

        // Act
        var result = await _controller.GetEvent(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.GetEventByIdAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetEvents_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var expectedEvents = new List<EventResponse>
        {
            new EventResponse
            {
                Id = 1,
                ClubId = clubId,
                Name = "Event 1",
                EventDateTime = DateTime.Now.AddDays(5),
                Location = "Location 1",
                Description = "Description 1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventResponse
            {
                Id = 2,
                ClubId = clubId,
                Name = "Event 2",
                EventDateTime = DateTime.Now.AddDays(10),
                Location = "Location 2",
                Description = "Description 2",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockEventService.Setup(s => s.GetEventsByClubAsync(clubId, null))
            .ReturnsAsync(expectedEvents);

        // Act
        var result = await _controller.GetEvents(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedEvents));

        _mockEventService.Verify(s => s.GetEventsByClubAsync(clubId, null), Times.Once);
    }

    [Test]
    public async Task GetEvents_ClubMismatch_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from user's club (1)

        // Act
        var result = await _controller.GetEvents(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.GetEventsByClubAsync(It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task GetEvents_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockEventService.Setup(s => s.GetEventsByClubAsync(clubId, null))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEvents(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task CreateEvent_MissingClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "Test Description"
        };

        // Setup controller with no ClubId claim
        var claims = new List<Claim>
        {
            new Claim("UserId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.CreateEvent(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.CreateEventAsync(It.IsAny<int>(), It.IsAny<CreateEventRequest>()), Times.Never);
    }

    [Test]
    public async Task UpdateEvent_MissingClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new UpdateEventRequest
        {
            Name = "Updated Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Updated Location",
            Description = "Updated Description"
        };

        // Setup controller with no ClubId claim
        var claims = new List<Claim>
        {
            new Claim("UserId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.UpdateEvent(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.UpdateEventAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateEventRequest>()), Times.Never);
    }

    [Test]
    public async Task GetEvents_WithUpcomingFilter_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var filter = "upcoming";
        var expectedEvents = new List<EventResponse>
        {
            new EventResponse
            {
                Id = 1,
                ClubId = clubId,
                Name = "Upcoming Event",
                EventDateTime = DateTime.Now.AddDays(5),
                Location = "Future Location",
                Description = "Future Description",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockEventService.Setup(s => s.GetEventsByClubAsync(clubId, filter))
            .ReturnsAsync(expectedEvents);

        // Act
        var result = await _controller.GetEvents(clubId, filter);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedEvents));

        _mockEventService.Verify(s => s.GetEventsByClubAsync(clubId, filter), Times.Once);
    }

    [Test]
    public async Task GetEvents_WithPastFilter_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var filter = "past";
        var expectedEvents = new List<EventResponse>
        {
            new EventResponse
            {
                Id = 2,
                ClubId = clubId,
                Name = "Past Event",
                EventDateTime = DateTime.Now.AddDays(-5),
                Location = "Past Location",
                Description = "Past Description",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockEventService.Setup(s => s.GetEventsByClubAsync(clubId, filter))
            .ReturnsAsync(expectedEvents);

        // Act
        var result = await _controller.GetEvents(clubId, filter);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.StatusCode, Is.EqualTo(200));
        Assert.That(okResult.Value, Is.EqualTo(expectedEvents));

        _mockEventService.Verify(s => s.GetEventsByClubAsync(clubId, filter), Times.Once);
    }

    [Test]
    public async Task DeleteEvent_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        _mockEventService.Setup(s => s.DeleteEventAsync(clubId, eventId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeleteEvent(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
        var noContentResult = result as NoContentResult;
        Assert.That(noContentResult.StatusCode, Is.EqualTo(204));

        _mockEventService.Verify(s => s.DeleteEventAsync(clubId, eventId), Times.Once);
    }

    [Test]
    public async Task DeleteEvent_ClubMismatch_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from user's club (1)
        var eventId = 1;

        // Act
        var result = await _controller.DeleteEvent(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.DeleteEventAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task DeleteEvent_EventNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 999;

        _mockEventService.Setup(s => s.DeleteEventAsync(clubId, eventId))
            .ThrowsAsync(new ArgumentException($"Event with ID {eventId} not found in club {clubId}", nameof(eventId)));

        // Act
        var result = await _controller.DeleteEvent(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult.StatusCode, Is.EqualTo(404));

        _mockEventService.Verify(s => s.DeleteEventAsync(clubId, eventId), Times.Once);
    }

    [Test]
    public async Task DeleteEvent_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        _mockEventService.Setup(s => s.DeleteEventAsync(clubId, eventId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.DeleteEvent(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));

        _mockEventService.Verify(s => s.DeleteEventAsync(clubId, eventId), Times.Once);
    }

    [Test]
    public async Task DeleteEvent_MissingClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        // Setup controller with no ClubId claim
        var claims = new List<Claim>
        {
            new Claim("UserId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.DeleteEvent(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.DeleteEventAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    #region GeneratePaymentLink Tests

    [Test]
    public async Task GeneratePaymentLink_ValidRequest_ReturnsOkWithPaymentLink()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var token = "test-payment-token-123";
        var frontendUrl = "https://test.gathergrove.club";

        // Add a paid event to the in-memory database
        var testEvent = new GatherGrove.Domain.Entities.Event
        {
            Id = eventId,
            ClubId = clubId,
            Name = "Paid Workshop",
            EventDateTime = DateTime.UtcNow.AddMonths(1),
            Location = "Test Location",
            MemberPrice = 50m,
            NonMemberPrice = 75m
        };
        _context.Events.Add(testEvent);
        await _context.SaveChangesAsync();

        _mockTokenService.Setup(s => s.GeneratePaymentTokenAsync(eventId))
            .ReturnsAsync(token);

        _mockConfiguration.Setup(c => c["AppSettings:FrontendUrl"])
            .Returns(frontendUrl);

        // Act
        var result = await _controller.GeneratePaymentLink(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var response = okResult.Value as PaymentLinkResponse;

        Assert.That(response, Is.Not.Null);
        Assert.That(response.PaymentToken, Is.EqualTo(token));
        Assert.That(response.PaymentLink, Is.EqualTo($"{frontendUrl}/events/pay/{token}"));
        Assert.That(response.ExpiresAt, Is.EqualTo(testEvent.EventDateTime));

        _mockTokenService.Verify(s => s.GeneratePaymentTokenAsync(eventId), Times.Once);
    }

    [Test]
    public async Task GeneratePaymentLink_MissingClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        // Setup controller with no ClubId claim
        var claims = new List<Claim>
        {
            new Claim("UserId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.GeneratePaymentLink(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockTokenService.Verify(s => s.GeneratePaymentTokenAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GeneratePaymentLink_ClubMismatch_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from claim
        var eventId = 1;

        // Act
        var result = await _controller.GeneratePaymentLink(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockTokenService.Verify(s => s.GeneratePaymentTokenAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GeneratePaymentLink_EventNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 999; // Non-existent event

        // Act
        var result = await _controller.GeneratePaymentLink(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        _mockTokenService.Verify(s => s.GeneratePaymentTokenAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GeneratePaymentLink_FreeEvent_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 2;

        // Add a free event to the in-memory database
        var freeEvent = new GatherGrove.Domain.Entities.Event
        {
            Id = eventId,
            ClubId = clubId,
            Name = "Free Meetup",
            EventDateTime = DateTime.UtcNow.AddMonths(1),
            Location = "Test Location"
        };
        _context.Events.Add(freeEvent);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.GeneratePaymentLink(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        _mockTokenService.Verify(s => s.GeneratePaymentTokenAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GeneratePaymentLink_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var eventId = 3;

        // Add a paid event
        var testEvent = new GatherGrove.Domain.Entities.Event
        {
            Id = eventId,
            ClubId = clubId,
            Name = "Paid Workshop",
            EventDateTime = DateTime.UtcNow.AddMonths(1),
            Location = "Test Location",
            MemberPrice = 50m
        };
        _context.Events.Add(testEvent);
        await _context.SaveChangesAsync();

        _mockTokenService.Setup(s => s.GeneratePaymentTokenAsync(eventId))
            .ThrowsAsync(new Exception("Token generation failed"));

        // Act
        var result = await _controller.GeneratePaymentLink(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region UpdateRsvp Tests

    [Test]
    public async Task UpdateRsvp_ValidRequestAsAdmin_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 5;

        // Setup admin user
        var claims = new List<Claim>
        {
            new Claim("ClubId", "1"),
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(ClaimTypes.Email, "admin@test.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

        var request = new UpdateRsvpRequest
        {
            RsvpStatus = "Yes"
        };

        var expectedResponse = new EventRsvpResponse
        {
            EventId = eventId,
            MemberId = memberId,
            RsvpStatus = "Yes",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.UpsertRsvpAsync(clubId, eventId, memberId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateRsvp(clubId, eventId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));

        _mockEventService.Verify(s => s.UpsertRsvpAsync(clubId, eventId, memberId, request), Times.Once);
    }

    [Test]
    public async Task UpdateRsvp_ValidRequestAsMember_ReturnsOk()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 5;

        // Setup member user (not admin)
        var claims = new List<Claim>
        {
            new Claim("ClubId", "1"),
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Email, "member@test.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

        // Add member to database
        var member = new GatherGrove.Domain.Entities.Member
        {
            Id = memberId,
            ClubId = clubId,
            Email = "member@test.com",
            FullName = "Test Member"
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateRsvpRequest
        {
            RsvpStatus = "Yes"
        };

        var expectedResponse = new EventRsvpResponse
        {
            EventId = eventId,
            MemberId = memberId,
            RsvpStatus = "Yes",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.UpsertRsvpAsync(clubId, eventId, memberId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.UpdateRsvp(clubId, eventId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        _mockEventService.Verify(s => s.UpsertRsvpAsync(clubId, eventId, memberId, request), Times.Once);
    }

    [Test]
    public async Task UpdateRsvp_MissingUserClaims_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 5;

        // Setup controller with missing claims
        var claims = new List<Claim>
        {
            new Claim("ClubId", "1") // Missing NameIdentifier
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

        var request = new UpdateRsvpRequest { RsvpStatus = "Yes" };

        // Act
        var result = await _controller.UpdateRsvp(clubId, eventId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.UpsertRsvpAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateRsvpRequest>()), Times.Never);
    }

    [Test]
    public async Task UpdateRsvp_ClubMismatch_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from claim
        var eventId = 1;
        var memberId = 5;

        var claims = new List<Claim>
        {
            new Claim("ClubId", "1"),
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Email, "test@test.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

        var request = new UpdateRsvpRequest { RsvpStatus = "Yes" };

        // Act
        var result = await _controller.UpdateRsvp(clubId, eventId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.UpsertRsvpAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateRsvpRequest>()), Times.Never);
    }

    [Test]
    public async Task UpdateRsvp_MemberUpdatingOtherMemberRsvp_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 5;

        // Setup member user (not admin)
        var claims = new List<Claim>
        {
            new Claim("ClubId", "1"),
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Email, "other@test.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

        // Add different member to database
        var member = new GatherGrove.Domain.Entities.Member
        {
            Id = memberId,
            ClubId = clubId,
            Email = "member@test.com", // Different email
            FullName = "Test Member"
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateRsvpRequest { RsvpStatus = "Yes" };

        // Act
        var result = await _controller.UpdateRsvp(clubId, eventId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.UpsertRsvpAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateRsvpRequest>()), Times.Never);
    }

    [Test]
    public async Task UpdateRsvp_EventNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 999;
        var memberId = 5;

        var claims = new List<Claim>
        {
            new Claim("ClubId", "1"),
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, "Admin")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

        var request = new UpdateRsvpRequest { RsvpStatus = "Yes" };

        _mockEventService.Setup(s => s.UpsertRsvpAsync(clubId, eventId, memberId, request))
            .ThrowsAsync(new ArgumentException("Event not found"));

        // Act
        var result = await _controller.UpdateRsvp(clubId, eventId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task UpdateRsvp_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 5;

        var claims = new List<Claim>
        {
            new Claim("ClubId", "1"),
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, "Admin")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

        var request = new UpdateRsvpRequest { RsvpStatus = "Yes" };

        _mockEventService.Setup(s => s.UpsertRsvpAsync(clubId, eventId, memberId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UpdateRsvp(clubId, eventId, memberId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetEventRsvps Tests

    [Test]
    public async Task GetEventRsvps_ValidRequest_ReturnsOkWithRsvps()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        var expectedRsvps = new List<EventRsvpResponse>
        {
            new EventRsvpResponse { EventId = eventId, MemberId = 1, RsvpStatus = "Yes" },
            new EventRsvpResponse { EventId = eventId, MemberId = 2, RsvpStatus = "No" },
            new EventRsvpResponse { EventId = eventId, MemberId = 3, RsvpStatus = "Maybe" }
        };

        _mockEventService.Setup(s => s.GetEventRsvpsAsync(clubId, eventId))
            .ReturnsAsync(expectedRsvps);

        // Act
        var result = await _controller.GetEventRsvps(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var rsvps = okResult.Value as List<EventRsvpResponse>;

        Assert.That(rsvps, Is.Not.Null);
        Assert.That(rsvps.Count, Is.EqualTo(3));

        _mockEventService.Verify(s => s.GetEventRsvpsAsync(clubId, eventId), Times.Once);
    }

    [Test]
    public async Task GetEventRsvps_MissingClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        var claims = new List<Claim>
        {
            new Claim("UserId", "1") // Missing ClubId
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

        // Act
        var result = await _controller.GetEventRsvps(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.GetEventRsvpsAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetEventRsvps_ClubMismatch_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from claim
        var eventId = 1;

        // Act
        var result = await _controller.GetEventRsvps(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.GetEventRsvpsAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetEventRsvps_EventNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 999;

        _mockEventService.Setup(s => s.GetEventRsvpsAsync(clubId, eventId))
            .ThrowsAsync(new ArgumentException("Event not found"));

        // Act
        var result = await _controller.GetEventRsvps(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetEventRsvps_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        _mockEventService.Setup(s => s.GetEventRsvpsAsync(clubId, eventId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEventRsvps(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetMemberRsvp Tests

    [Test]
    public async Task GetMemberRsvp_ValidRequest_ReturnsOkWithRsvp()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 5;

        var expectedRsvp = new EventRsvpResponse
        {
            EventId = eventId,
            MemberId = memberId,
            RsvpStatus = "Yes",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockEventService.Setup(s => s.GetMemberRsvpAsync(clubId, eventId, memberId))
            .ReturnsAsync(expectedRsvp);

        // Act
        var result = await _controller.GetMemberRsvp(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedRsvp));

        _mockEventService.Verify(s => s.GetMemberRsvpAsync(clubId, eventId, memberId), Times.Once);
    }

    [Test]
    public async Task GetMemberRsvp_MissingClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 5;

        var claims = new List<Claim>
        {
            new Claim("UserId", "1") // Missing ClubId
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

        // Act
        var result = await _controller.GetMemberRsvp(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.GetMemberRsvpAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetMemberRsvp_ClubMismatch_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from claim
        var eventId = 1;
        var memberId = 5;

        // Act
        var result = await _controller.GetMemberRsvp(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.GetMemberRsvpAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetMemberRsvp_RsvpNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 999;

        _mockEventService.Setup(s => s.GetMemberRsvpAsync(clubId, eventId, memberId))
            .ReturnsAsync((EventRsvpResponse)null);

        // Act
        var result = await _controller.GetMemberRsvp(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task GetMemberRsvp_ArgumentException_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 999;
        var memberId = 5;

        _mockEventService.Setup(s => s.GetMemberRsvpAsync(clubId, eventId, memberId))
            .ThrowsAsync(new ArgumentException("Event not found"));

        // Act
        var result = await _controller.GetMemberRsvp(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetMemberRsvp_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var memberId = 5;

        _mockEventService.Setup(s => s.GetMemberRsvpAsync(clubId, eventId, memberId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMemberRsvp(clubId, eventId, memberId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region SendEventInvitations Tests

    [Test]
    public async Task SendEventInvitations_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        var request = new SendEventInvitationsRequest
        {
            MemberIds = new List<int> { 1, 2, 3 },
            Methods = new List<string> { "Email" }
        };

        var expectedResult = new SendEventInvitationsResponse
        {
            Message = "Invitations sent successfully",
            SentCount = 3
        };

        _mockEventService.Setup(s => s.SendEventInvitationsAsync(clubId, eventId, request))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.SendEventInvitations(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        _mockEventService.Verify(s => s.SendEventInvitationsAsync(clubId, eventId, request), Times.Once);
    }

    [Test]
    public async Task SendEventInvitations_MissingClubIdClaim_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        var claims = new List<Claim>
        {
            new Claim("UserId", "1") // Missing ClubId
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

        var request = new SendEventInvitationsRequest
        {
            Methods = new List<string> { "Email" }
        };

        // Act
        var result = await _controller.SendEventInvitations(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.SendEventInvitationsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<SendEventInvitationsRequest>()), Times.Never);
    }

    [Test]
    public async Task SendEventInvitations_ClubMismatch_ReturnsForbid()
    {
        // Arrange
        var clubId = 2; // Different from claim
        var eventId = 1;

        var request = new SendEventInvitationsRequest
        {
            Methods = new List<string> { "Email" }
        };

        // Act
        var result = await _controller.SendEventInvitations(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
        _mockEventService.Verify(s => s.SendEventInvitationsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<SendEventInvitationsRequest>()), Times.Never);
    }

    [Test]
    public async Task SendEventInvitations_InvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        var request = new SendEventInvitationsRequest
        {
            Methods = new List<string>() // Empty methods
        };

        _mockEventService.Setup(s => s.SendEventInvitationsAsync(clubId, eventId, request))
            .ThrowsAsync(new ArgumentException("At least one method is required"));

        // Act
        var result = await _controller.SendEventInvitations(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task SendEventInvitations_TierRestriction_ReturnsPaymentRequired()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        var request = new SendEventInvitationsRequest
        {
            Methods = new List<string> { "Email" }
        };

        _mockEventService.Setup(s => s.SendEventInvitationsAsync(clubId, eventId, request))
            .ThrowsAsync(new UnauthorizedAccessException("Invitation feature requires Grow tier"));

        // Act
        var result = await _controller.SendEventInvitations(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(402));
    }

    [Test]
    public async Task SendEventInvitations_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        var request = new SendEventInvitationsRequest
        {
            Methods = new List<string> { "Email" }
        };

        _mockEventService.Setup(s => s.SendEventInvitationsAsync(clubId, eventId, request))
            .ThrowsAsync(new Exception("Email service unavailable"));

        // Act
        var result = await _controller.SendEventInvitations(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion
}