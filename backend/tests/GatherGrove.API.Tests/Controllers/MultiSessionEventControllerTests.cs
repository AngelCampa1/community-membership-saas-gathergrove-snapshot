using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Services.TierValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using ApplicationClubAuth = GatherGrove.Application.Services.IClubAuthorizationService;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class MultiSessionEventControllerTests
{
    private Mock<IMultiSessionEventService> _multiSessionEventServiceMock = null!;
    private Mock<ApplicationClubAuth> _clubAuthorizationServiceMock = null!;
    private Mock<ITierGateService> _tierGateServiceMock = null!;
    private Mock<ILogger<MultiSessionEventController>> _loggerMock = null!;
    private MultiSessionEventController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _multiSessionEventServiceMock = new Mock<IMultiSessionEventService>();
        _clubAuthorizationServiceMock = new Mock<ApplicationClubAuth>();
        _tierGateServiceMock = new Mock<ITierGateService>();
        _loggerMock = new Mock<ILogger<MultiSessionEventController>>();

        _controller = new MultiSessionEventController(
            _multiSessionEventServiceMock.Object,
            _clubAuthorizationServiceMock.Object,
            _tierGateServiceMock.Object,
            _loggerMock.Object);

        // Setup default authenticated user
        SetupAuthenticatedUser(userId: 1, clubId: 1);
    }

    private void SetupAuthenticatedUser(int userId, int clubId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new("ClubId", clubId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private void SetupUnauthenticatedUser()
    {
        var claims = new List<Claim>();
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private void SetupInvalidUserIdClaim()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "invalid-user-id")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region CreateMultiSessionEvent Tests

    [Test]
    public async Task CreateMultiSessionEvent_ValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMultiSessionEventRequest
        {
            Name = "Test Multi-Session Event",
            Description = "Test Description",
            Location = "Test Location",
            MaxCapacity = 50,
            RegistrationRequired = true,
            AllowIndividualSessionRegistration = false,
            Sessions = new List<EventSessionRequest>
            {
                new()
                {
                    Name = "Session 1",
                    Description = "First Session",
                    StartDateTime = DateTime.UtcNow.AddDays(7),
                    EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
                    SessionNumber = 1,
                    IsMandatory = true
                }
            }
        };

        var expectedResponse = new MultiSessionEventResponse
        {
            Id = 100,
            ClubId = clubId,
            Name = request.Name,
            Description = request.Description,
            Location = request.Location,
            MaxCapacity = request.MaxCapacity,
            RegistrationRequired = request.RegistrationRequired,
            AllowIndividualSessionRegistration = request.AllowIndividualSessionRegistration,
            IsActive = true,
            Sessions = new List<EventSessionResponse>
            {
                new()
                {
                    Id = 1,
                    MultiSessionEventId = 100,
                    Name = "Session 1",
                    SessionNumber = 1
                }
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _tierGateServiceMock
            .Setup(s => s.ValidateFeatureAccessAsync(clubId, "MultiSessionEvents"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        _multiSessionEventServiceMock
            .Setup(s => s.CreateMultiSessionEventAsync(clubId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CreateMultiSessionEvent(clubId, request);

        // Assert
        var createdAtActionResult = result as CreatedAtActionResult;
        createdAtActionResult.Should().NotBeNull();
        createdAtActionResult!.StatusCode.Should().Be(201);
        createdAtActionResult.ActionName.Should().Be(nameof(MultiSessionEventController.GetMultiSessionEvent));

        var response = createdAtActionResult.Value as MultiSessionEventResponse;
        response.Should().NotBeNull();
        response!.Id.Should().Be(100);
        response.Name.Should().Be(request.Name);
        response.Sessions.Should().HaveCount(1);
    }

    [Test]
    public async Task CreateMultiSessionEvent_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var request = new CreateMultiSessionEventRequest
        {
            Name = "Test Event",
            Location = "Test Location",
            Sessions = new List<EventSessionRequest>()
        };

        // Act
        var result = await _controller.CreateMultiSessionEvent(clubId, request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
        unauthorizedResult.Value.Should().Be("User not authenticated");

        // Verify service was never called
        _clubAuthorizationServiceMock.Verify(
            s => s.ValidateClubAccessAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task CreateMultiSessionEvent_InvalidUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupInvalidUserIdClaim();
        var clubId = 1;
        var request = new CreateMultiSessionEventRequest
        {
            Name = "Test Event",
            Location = "Test Location",
            Sessions = new List<EventSessionRequest>()
        };

        // Act
        var result = await _controller.CreateMultiSessionEvent(clubId, request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
        unauthorizedResult.Value.Should().Be("User not authenticated");
    }

    [Test]
    public async Task CreateMultiSessionEvent_UserNotAuthorizedForClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMultiSessionEventRequest
        {
            Name = "Test Event",
            Location = "Test Location",
            Sessions = new List<EventSessionRequest>()
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CreateMultiSessionEvent(clubId, request);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task CreateMultiSessionEvent_TierFeatureNotAvailable_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMultiSessionEventRequest
        {
            Name = "Test Event",
            Location = "Test Location",
            Sessions = new List<EventSessionRequest>()
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _tierGateServiceMock
            .Setup(s => s.ValidateFeatureAccessAsync(clubId, "MultiSessionEvents"))
            .ReturnsAsync(new TierValidationResult { HasAccess = false });

        // Act
        var result = await _controller.CreateMultiSessionEvent(clubId, request);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task CreateMultiSessionEvent_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMultiSessionEventRequest
        {
            Name = "Test Event",
            Location = "Test Location",
            Sessions = new List<EventSessionRequest>()
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _tierGateServiceMock
            .Setup(s => s.ValidateFeatureAccessAsync(clubId, "MultiSessionEvents"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        _multiSessionEventServiceMock
            .Setup(s => s.CreateMultiSessionEventAsync(clubId, request))
            .ThrowsAsync(new ArgumentException("Invalid event data"));

        // Act
        var result = await _controller.CreateMultiSessionEvent(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
        badRequestResult.Value.Should().Be("Invalid event data");
    }

    [Test]
    public async Task CreateMultiSessionEvent_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateMultiSessionEventRequest
        {
            Name = "Test Event",
            Location = "Test Location",
            Sessions = new List<EventSessionRequest>()
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _tierGateServiceMock
            .Setup(s => s.ValidateFeatureAccessAsync(clubId, "MultiSessionEvents"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        _multiSessionEventServiceMock
            .Setup(s => s.CreateMultiSessionEventAsync(clubId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CreateMultiSessionEvent(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while creating the multi-session event");
    }

    #endregion

    #region GetMultiSessionEventsByClub Tests

    [Test]
    public async Task GetMultiSessionEventsByClub_ValidRequest_ReturnsOkWithEvents()
    {
        // Arrange
        var clubId = 1;
        var expectedEvents = new List<MultiSessionEventResponse>
        {
            new()
            {
                Id = 100,
                ClubId = clubId,
                Name = "Event 1",
                Location = "Location 1",
                IsActive = true,
                Sessions = new List<EventSessionResponse>()
            },
            new()
            {
                Id = 101,
                ClubId = clubId,
                Name = "Event 2",
                Location = "Location 2",
                IsActive = true,
                Sessions = new List<EventSessionResponse>()
            }
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMultiSessionEventsByClubAsync(clubId))
            .ReturnsAsync(expectedEvents);

        // Act
        var result = await _controller.GetMultiSessionEventsByClub(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var events = okResult.Value as List<MultiSessionEventResponse>;
        events.Should().NotBeNull();
        events!.Should().HaveCount(2);
        events[0].Name.Should().Be("Event 1");
        events[1].Name.Should().Be("Event 2");
    }

    [Test]
    public async Task GetMultiSessionEventsByClub_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;

        // Act
        var result = await _controller.GetMultiSessionEventsByClub(clubId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
        unauthorizedResult.Value.Should().Be("User not authenticated");
    }

    [Test]
    public async Task GetMultiSessionEventsByClub_UserNotAuthorizedForClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetMultiSessionEventsByClub(clubId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetMultiSessionEventsByClub_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMultiSessionEventsByClubAsync(clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMultiSessionEventsByClub(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while retrieving multi-session events");
    }

    #endregion

    #region GetMultiSessionEvent Tests

    [Test]
    public async Task GetMultiSessionEvent_ValidRequest_ReturnsOkWithEvent()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var expectedEvent = new MultiSessionEventResponse
        {
            Id = eventId,
            ClubId = clubId,
            Name = "Test Event",
            Location = "Test Location",
            IsActive = true,
            Sessions = new List<EventSessionResponse>
            {
                new() { Id = 1, SessionNumber = 1, Name = "Session 1" }
            }
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMultiSessionEventAsync(eventId))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.GetMultiSessionEvent(clubId, eventId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var eventResponse = okResult.Value as MultiSessionEventResponse;
        eventResponse.Should().NotBeNull();
        eventResponse!.Id.Should().Be(eventId);
        eventResponse.Name.Should().Be("Test Event");
        eventResponse.Sessions.Should().HaveCount(1);
    }

    [Test]
    public async Task GetMultiSessionEvent_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var eventId = 100;

        // Act
        var result = await _controller.GetMultiSessionEvent(clubId, eventId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task GetMultiSessionEvent_UserNotAuthorizedForClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetMultiSessionEvent(clubId, eventId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetMultiSessionEvent_EventNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 999;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMultiSessionEventAsync(eventId))
            .ReturnsAsync((MultiSessionEventResponse?)null);

        // Act
        var result = await _controller.GetMultiSessionEvent(clubId, eventId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"Multi-session event with ID {eventId} not found");
    }

    [Test]
    public async Task GetMultiSessionEvent_EventBelongsToDifferentClub_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var expectedEvent = new MultiSessionEventResponse
        {
            Id = eventId,
            ClubId = 2, // Different club
            Name = "Test Event"
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMultiSessionEventAsync(eventId))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.GetMultiSessionEvent(clubId, eventId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"Multi-session event with ID {eventId} not found in club {clubId}");
    }

    [Test]
    public async Task GetMultiSessionEvent_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMultiSessionEventAsync(eventId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMultiSessionEvent(clubId, eventId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while retrieving the multi-session event");
    }

    #endregion

    #region RegisterForMultiSessionEvent Tests

    [Test]
    public async Task RegisterForMultiSessionEvent_ValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var request = new MultiSessionRegistrationRequest
        {
            MemberId = 5,
            RegisterForAllSessions = true,
            Notes = "Test registration"
        };

        var expectedRegistration = new MultiSessionRegistrationResponse
        {
            Id = 200,
            MultiSessionEventId = eventId,
            MemberId = request.MemberId,
            RegisteredForAllSessions = true,
            Notes = request.Notes,
            SessionRegistrations = new List<SessionRegistrationInfo>(),
            CreatedAt = DateTime.UtcNow
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.RegisterForMultiSessionEventAsync(eventId, request))
            .ReturnsAsync(expectedRegistration);

        // Act
        var result = await _controller.RegisterForMultiSessionEvent(clubId, eventId, request);

        // Assert
        var createdAtActionResult = result as CreatedAtActionResult;
        createdAtActionResult.Should().NotBeNull();
        createdAtActionResult!.StatusCode.Should().Be(201);
        createdAtActionResult.ActionName.Should().Be(nameof(MultiSessionEventController.GetMemberProgress));

        var registration = createdAtActionResult.Value as MultiSessionRegistrationResponse;
        registration.Should().NotBeNull();
        registration!.Id.Should().Be(200);
        registration.MemberId.Should().Be(5);
    }

    [Test]
    public async Task RegisterForMultiSessionEvent_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var eventId = 100;
        var request = new MultiSessionRegistrationRequest { MemberId = 5 };

        // Act
        var result = await _controller.RegisterForMultiSessionEvent(clubId, eventId, request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task RegisterForMultiSessionEvent_UserNotAuthorizedForClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var request = new MultiSessionRegistrationRequest { MemberId = 5 };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.RegisterForMultiSessionEvent(clubId, eventId, request);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task RegisterForMultiSessionEvent_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var request = new MultiSessionRegistrationRequest { MemberId = 5 };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.RegisterForMultiSessionEventAsync(eventId, request))
            .ThrowsAsync(new ArgumentException("Member not found"));

        // Act
        var result = await _controller.RegisterForMultiSessionEvent(clubId, eventId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
        badRequestResult.Value.Should().Be("Member not found");
    }

    [Test]
    public async Task RegisterForMultiSessionEvent_InvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var request = new MultiSessionRegistrationRequest { MemberId = 5 };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.RegisterForMultiSessionEventAsync(eventId, request))
            .ThrowsAsync(new InvalidOperationException("Member already registered"));

        // Act
        var result = await _controller.RegisterForMultiSessionEvent(clubId, eventId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
        badRequestResult.Value.Should().Be("Member already registered");
    }

    [Test]
    public async Task RegisterForMultiSessionEvent_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var request = new MultiSessionRegistrationRequest { MemberId = 5 };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.RegisterForMultiSessionEventAsync(eventId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.RegisterForMultiSessionEvent(clubId, eventId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while registering for the multi-session event");
    }

    #endregion

    #region AddSessionToEvent Tests

    [Test]
    public async Task AddSessionToEvent_ValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var request = new AddEventSessionRequest
        {
            Name = "New Session",
            Description = "New Session Description",
            StartDateTime = DateTime.UtcNow.AddDays(14),
            EndDateTime = DateTime.UtcNow.AddDays(14).AddHours(2),
            SessionNumber = 2,
            IsMandatory = true
        };

        var expectedSession = new EventSessionResponse
        {
            Id = 10,
            MultiSessionEventId = eventId,
            Name = request.Name,
            Description = request.Description,
            StartDateTime = request.StartDateTime,
            EndDateTime = request.EndDateTime,
            SessionNumber = request.SessionNumber,
            IsMandatory = request.IsMandatory,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.AddSessionToEventAsync(eventId, request))
            .ReturnsAsync(expectedSession);

        // Act
        var result = await _controller.AddSessionToEvent(clubId, eventId, request);

        // Assert
        var createdAtActionResult = result as CreatedAtActionResult;
        createdAtActionResult.Should().NotBeNull();
        createdAtActionResult!.StatusCode.Should().Be(201);
        createdAtActionResult.ActionName.Should().Be(nameof(MultiSessionEventController.GetEventSession));

        var session = createdAtActionResult.Value as EventSessionResponse;
        session.Should().NotBeNull();
        session!.Id.Should().Be(10);
        session.Name.Should().Be("New Session");
        session.SessionNumber.Should().Be(2);
    }

    [Test]
    public async Task AddSessionToEvent_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var eventId = 100;
        var request = new AddEventSessionRequest
        {
            Name = "New Session",
            StartDateTime = DateTime.UtcNow,
            EndDateTime = DateTime.UtcNow.AddHours(2),
            SessionNumber = 2
        };

        // Act
        var result = await _controller.AddSessionToEvent(clubId, eventId, request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task AddSessionToEvent_UserNotAuthorizedForClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var request = new AddEventSessionRequest
        {
            Name = "New Session",
            StartDateTime = DateTime.UtcNow,
            EndDateTime = DateTime.UtcNow.AddHours(2),
            SessionNumber = 2
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.AddSessionToEvent(clubId, eventId, request);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task AddSessionToEvent_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var request = new AddEventSessionRequest
        {
            Name = "New Session",
            StartDateTime = DateTime.UtcNow,
            EndDateTime = DateTime.UtcNow.AddHours(2),
            SessionNumber = 2
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.AddSessionToEventAsync(eventId, request))
            .ThrowsAsync(new ArgumentException("Event not found"));

        // Act
        var result = await _controller.AddSessionToEvent(clubId, eventId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
        badRequestResult.Value.Should().Be("Event not found");
    }

    [Test]
    public async Task AddSessionToEvent_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var request = new AddEventSessionRequest
        {
            Name = "New Session",
            StartDateTime = DateTime.UtcNow,
            EndDateTime = DateTime.UtcNow.AddHours(2),
            SessionNumber = 2
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.AddSessionToEventAsync(eventId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.AddSessionToEvent(clubId, eventId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while adding the session");
    }

    #endregion

    #region UpdateEventSession Tests

    [Test]
    public async Task UpdateEventSession_ValidRequest_ReturnsOkWithUpdatedSession()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;
        var request = new UpdateEventSessionRequest
        {
            Name = "Updated Session Name",
            Description = "Updated Description",
            IsMandatory = false
        };

        var expectedSession = new EventSessionResponse
        {
            Id = sessionId,
            MultiSessionEventId = eventId,
            Name = request.Name,
            Description = request.Description,
            SessionNumber = 1,
            IsMandatory = false,
            UpdatedAt = DateTime.UtcNow
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.UpdateEventSessionAsync(sessionId, request))
            .ReturnsAsync(expectedSession);

        // Act
        var result = await _controller.UpdateEventSession(clubId, eventId, sessionId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var session = okResult.Value as EventSessionResponse;
        session.Should().NotBeNull();
        session!.Id.Should().Be(sessionId);
        session.Name.Should().Be("Updated Session Name");
        session.IsMandatory.Should().BeFalse();
    }

    [Test]
    public async Task UpdateEventSession_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;
        var request = new UpdateEventSessionRequest { Name = "Updated" };

        // Act
        var result = await _controller.UpdateEventSession(clubId, eventId, sessionId, request);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task UpdateEventSession_UserNotAuthorizedForClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;
        var request = new UpdateEventSessionRequest { Name = "Updated" };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.UpdateEventSession(clubId, eventId, sessionId, request);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task UpdateEventSession_SessionNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 999;
        var request = new UpdateEventSessionRequest { Name = "Updated" };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.UpdateEventSessionAsync(sessionId, request))
            .ReturnsAsync((EventSessionResponse?)null);

        // Act
        var result = await _controller.UpdateEventSession(clubId, eventId, sessionId, request);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"Session with ID {sessionId} not found");
    }

    [Test]
    public async Task UpdateEventSession_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;
        var request = new UpdateEventSessionRequest { Name = "Updated" };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.UpdateEventSessionAsync(sessionId, request))
            .ThrowsAsync(new ArgumentException("Invalid session data"));

        // Act
        var result = await _controller.UpdateEventSession(clubId, eventId, sessionId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
        badRequestResult.Value.Should().Be("Invalid session data");
    }

    [Test]
    public async Task UpdateEventSession_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;
        var request = new UpdateEventSessionRequest { Name = "Updated" };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.UpdateEventSessionAsync(sessionId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.UpdateEventSession(clubId, eventId, sessionId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while updating the session");
    }

    #endregion

    #region GetEventSession Tests

    [Test]
    public async Task GetEventSession_ValidRequest_ReturnsOkWithSession()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;

        var expectedEvent = new MultiSessionEventResponse
        {
            Id = eventId,
            ClubId = clubId,
            Name = "Test Event",
            Sessions = new List<EventSessionResponse>
            {
                new()
                {
                    Id = sessionId,
                    MultiSessionEventId = eventId,
                    Name = "Session 1",
                    SessionNumber = 1,
                    IsMandatory = true
                },
                new()
                {
                    Id = 11,
                    MultiSessionEventId = eventId,
                    Name = "Session 2",
                    SessionNumber = 2,
                    IsMandatory = false
                }
            }
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMultiSessionEventAsync(eventId))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.GetEventSession(clubId, eventId, sessionId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var session = okResult.Value as EventSessionResponse;
        session.Should().NotBeNull();
        session!.Id.Should().Be(sessionId);
        session.Name.Should().Be("Session 1");
        session.SessionNumber.Should().Be(1);
    }

    [Test]
    public async Task GetEventSession_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;

        // Act
        var result = await _controller.GetEventSession(clubId, eventId, sessionId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task GetEventSession_UserNotAuthorizedForClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEventSession(clubId, eventId, sessionId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetEventSession_EventNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 999;
        var sessionId = 10;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMultiSessionEventAsync(eventId))
            .ReturnsAsync((MultiSessionEventResponse?)null);

        // Act
        var result = await _controller.GetEventSession(clubId, eventId, sessionId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"Multi-session event with ID {eventId} not found in club {clubId}");
    }

    [Test]
    public async Task GetEventSession_EventBelongsToDifferentClub_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;

        var expectedEvent = new MultiSessionEventResponse
        {
            Id = eventId,
            ClubId = 2, // Different club
            Name = "Test Event",
            Sessions = new List<EventSessionResponse>()
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMultiSessionEventAsync(eventId))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.GetEventSession(clubId, eventId, sessionId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"Multi-session event with ID {eventId} not found in club {clubId}");
    }

    [Test]
    public async Task GetEventSession_SessionNotFoundInEvent_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 999;

        var expectedEvent = new MultiSessionEventResponse
        {
            Id = eventId,
            ClubId = clubId,
            Name = "Test Event",
            Sessions = new List<EventSessionResponse>
            {
                new() { Id = 10, SessionNumber = 1 }
            }
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMultiSessionEventAsync(eventId))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.GetEventSession(clubId, eventId, sessionId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"Session with ID {sessionId} not found in event {eventId}");
    }

    [Test]
    public async Task GetEventSession_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMultiSessionEventAsync(eventId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEventSession(clubId, eventId, sessionId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while retrieving the session");
    }

    #endregion

    #region GetSessionAttendance Tests

    [Test]
    public async Task GetSessionAttendance_ValidRequest_ReturnsOkWithAttendance()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;

        var expectedAttendance = new List<EventSessionAttendance>
        {
            new() { SessionId = sessionId, MemberId = 1, AttendedAt = DateTime.UtcNow },
            new() { SessionId = sessionId, MemberId = 2, AttendedAt = DateTime.UtcNow },
            new() { SessionId = sessionId, MemberId = 3, AttendedAt = null }
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetSessionAttendanceAsync(sessionId))
            .ReturnsAsync(expectedAttendance);

        // Act
        var result = await _controller.GetSessionAttendance(clubId, eventId, sessionId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var attendance = okResult.Value as List<EventSessionAttendance>;
        attendance.Should().NotBeNull();
        attendance!.Should().HaveCount(3);
        attendance.Count(a => a.AttendedAt != null).Should().Be(2);
    }

    [Test]
    public async Task GetSessionAttendance_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;

        // Act
        var result = await _controller.GetSessionAttendance(clubId, eventId, sessionId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task GetSessionAttendance_UserNotAuthorizedForClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetSessionAttendance(clubId, eventId, sessionId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetSessionAttendance_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var sessionId = 10;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetSessionAttendanceAsync(sessionId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSessionAttendance(clubId, eventId, sessionId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while retrieving session attendance");
    }

    #endregion

    #region GetMemberProgress Tests

    [Test]
    public async Task GetMemberProgress_ValidRequest_ReturnsOkWithProgress()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var memberId = 5;

        var expectedProgress = new MultiSessionMemberProgress
        {
            MemberId = memberId,
            MultiSessionEventId = eventId,
            TotalSessions = 4,
            CompletedSessions = 3,
            OverallProgress = 75,
            CompletedMandatorySessions = true,
            SessionProgresses = new List<SessionProgress>
            {
                new() { SessionId = 1, SessionNumber = 1, Completed = true },
                new() { SessionId = 2, SessionNumber = 2, Completed = true },
                new() { SessionId = 3, SessionNumber = 3, Completed = true },
                new() { SessionId = 4, SessionNumber = 4, Completed = false }
            },
            LastUpdated = DateTime.UtcNow
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMemberProgressAsync(eventId, memberId))
            .ReturnsAsync(expectedProgress);

        // Act
        var result = await _controller.GetMemberProgress(clubId, eventId, memberId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var progress = okResult.Value as MultiSessionMemberProgress;
        progress.Should().NotBeNull();
        progress!.MemberId.Should().Be(memberId);
        progress.TotalSessions.Should().Be(4);
        progress.CompletedSessions.Should().Be(3);
        progress.OverallProgress.Should().Be(75);
        progress.SessionProgresses.Should().HaveCount(4);
    }

    [Test]
    public async Task GetMemberProgress_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var eventId = 100;
        var memberId = 5;

        // Act
        var result = await _controller.GetMemberProgress(clubId, eventId, memberId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task GetMemberProgress_UserNotAuthorizedForClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var memberId = 5;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetMemberProgress(clubId, eventId, memberId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetMemberProgress_ProgressNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var memberId = 999;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMemberProgressAsync(eventId, memberId))
            .ReturnsAsync((MultiSessionMemberProgress?)null);

        // Act
        var result = await _controller.GetMemberProgress(clubId, eventId, memberId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"No progress found for member {memberId} in event {eventId}");
    }

    [Test]
    public async Task GetMemberProgress_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 100;
        var memberId = 5;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _multiSessionEventServiceMock
            .Setup(s => s.GetMemberProgressAsync(eventId, memberId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMemberProgress(clubId, eventId, memberId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while retrieving member progress");
    }

    #endregion
}
