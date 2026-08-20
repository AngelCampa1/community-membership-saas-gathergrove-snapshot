using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Services.TierValidation;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using ApplicationClubAuth = GatherGrove.Application.Services.IClubAuthorizationService;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class EventSeriesControllerTests
{
    private EventSeriesController _controller;
    private Mock<IEventSeriesService> _mockEventSeriesService;
    private Mock<ApplicationClubAuth> _mockClubAuthorizationService;
    private Mock<ITierGateService> _mockTierGateService;
    private Mock<IMemberService> _mockMemberService;
    private Mock<ILogger<EventSeriesController>> _mockLogger;

    [SetUp]
    public void Setup()
    {
        _mockEventSeriesService = new Mock<IEventSeriesService>();
        _mockClubAuthorizationService = new Mock<ApplicationClubAuth>();
        _mockTierGateService = new Mock<ITierGateService>();
        _mockMemberService = new Mock<IMemberService>();
        _mockLogger = new Mock<ILogger<EventSeriesController>>();

        _controller = new EventSeriesController(
            _mockEventSeriesService.Object,
            _mockClubAuthorizationService.Object,
            _mockTierGateService.Object,
            _mockMemberService.Object,
            _mockLogger.Object);

        // Setup default user claims for authentication
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Email, "test@example.com"),
            new Claim("ClubId", "1")
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
        // Controllers don't implement IDisposable in this version
    }

    #region CreateEventSeries Tests

    [Test]
    public async Task CreateEventSeries_ValidRequest_ReturnsCreatedResult()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateEventSeriesRequest
        {
            Name = "Weekly Book Club",
            Description = "Weekly book discussion series",
            RecurrencePattern = "weekly",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(30)
        };

        var expectedResponse = new EventSeriesResponse
        {
            Id = 1,
            ClubId = clubId,
            Name = request.Name,
            Description = request.Description,
            RecurrencePattern = request.RecurrencePattern,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            CreatedAt = DateTime.UtcNow
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "EventSeries"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        _mockEventSeriesService
            .Setup(x => x.CreateEventSeriesAsync(clubId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CreateEventSeries(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;
        Assert.That(createdResult.Value, Is.EqualTo(expectedResponse));
        Assert.That(createdResult.ActionName, Is.EqualTo(nameof(_controller.GetEventSeries)));
    }

    [Test]
    public async Task CreateEventSeries_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateEventSeriesRequest { Name = "Test Series" };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CreateEventSeries(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task CreateEventSeries_TierRestriction_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateEventSeriesRequest { Name = "Test Series" };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "EventSeries"))
            .ReturnsAsync(new TierValidationResult { HasAccess = false, Message = "Upgrade required" });

        // Act
        var result = await _controller.CreateEventSeries(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task CreateEventSeries_InvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateEventSeriesRequest { Name = "Test Series" };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "EventSeries"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        _mockEventSeriesService
            .Setup(x => x.CreateEventSeriesAsync(clubId, request))
            .ThrowsAsync(new ArgumentException("Invalid recurrence pattern"));

        // Act
        var result = await _controller.CreateEventSeries(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task CreateEventSeries_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateEventSeriesRequest { Name = "Test Series" };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "EventSeries"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        _mockEventSeriesService
            .Setup(x => x.CreateEventSeriesAsync(clubId, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.CreateEventSeries(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetEventSeriesByClub Tests

    [Test]
    public async Task GetEventSeriesByClub_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var expectedSeries = new List<EventSeriesResponse>
        {
            new EventSeriesResponse { Id = 1, ClubId = clubId, Name = "Series 1" },
            new EventSeriesResponse { Id = 2, ClubId = clubId, Name = "Series 2" }
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesByClubAsync(clubId))
            .ReturnsAsync(expectedSeries);

        // Act
        var result = await _controller.GetEventSeriesByClub(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedSeries));
    }

    [Test]
    public async Task GetEventSeriesByClub_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEventSeriesByClub(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GetEventSeriesByClub_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesByClubAsync(clubId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetEventSeriesByClub(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GetEventSeries Tests

    [Test]
    public async Task GetEventSeries_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var expectedSeries = new EventSeriesResponse
        {
            Id = seriesId,
            ClubId = clubId,
            Name = "Test Series"
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesAsync(seriesId))
            .ReturnsAsync(expectedSeries);

        // Act
        var result = await _controller.GetEventSeries(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedSeries));
    }

    [Test]
    public async Task GetEventSeries_SeriesNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 999;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesAsync(seriesId))
            .ReturnsAsync((EventSeriesResponse)null);

        // Act
        var result = await _controller.GetEventSeries(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetEventSeries_SeriesBelongsToDifferentClub_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var series = new EventSeriesResponse
        {
            Id = seriesId,
            ClubId = 2, // Different club
            Name = "Test Series"
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesAsync(seriesId))
            .ReturnsAsync(series);

        // Act
        var result = await _controller.GetEventSeries(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GetEventSeries_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesAsync(seriesId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetEventSeries(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region UpdateEventSeries Tests

    [Test]
    public async Task UpdateEventSeries_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var request = new UpdateEventSeriesRequest
        {
            Name = "Updated Series Name",
            Description = "Updated description"
        };

        var updatedSeries = new EventSeriesResponse
        {
            Id = seriesId,
            ClubId = clubId,
            Name = request.Name,
            Description = request.Description
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.UpdateEventSeriesAsync(seriesId, request))
            .ReturnsAsync(updatedSeries);

        // Act
        var result = await _controller.UpdateEventSeries(clubId, seriesId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(updatedSeries));
    }

    [Test]
    public async Task UpdateEventSeries_SeriesNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 999;
        var request = new UpdateEventSeriesRequest { Name = "Updated Name" };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.UpdateEventSeriesAsync(seriesId, request))
            .ReturnsAsync((EventSeriesResponse)null);

        // Act
        var result = await _controller.UpdateEventSeries(clubId, seriesId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task UpdateEventSeries_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var request = new UpdateEventSeriesRequest { Name = "Updated Name" };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.UpdateEventSeries(clubId, seriesId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task UpdateEventSeries_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var request = new UpdateEventSeriesRequest { Name = "Updated Name" };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.UpdateEventSeriesAsync(seriesId, request))
            .ThrowsAsync(new ArgumentException("Invalid series data"));

        // Act
        var result = await _controller.UpdateEventSeries(clubId, seriesId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task UpdateEventSeries_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var request = new UpdateEventSeriesRequest { Name = "Updated Name" };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.UpdateEventSeriesAsync(seriesId, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.UpdateEventSeries(clubId, seriesId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region DeleteEventSeries Tests

    [Test]
    public async Task DeleteEventSeries_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var existingSeries = new EventSeriesResponse
        {
            Id = seriesId,
            ClubId = clubId,
            Name = "Test Series"
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesAsync(seriesId))
            .ReturnsAsync(existingSeries);

        _mockEventSeriesService
            .Setup(x => x.DeleteEventSeriesAsync(seriesId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeleteEventSeries(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task DeleteEventSeries_SeriesNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 999;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesAsync(seriesId))
            .ReturnsAsync((EventSeriesResponse)null);

        // Act
        var result = await _controller.DeleteEventSeries(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task DeleteEventSeries_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteEventSeries(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task DeleteEventSeries_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var existingSeries = new EventSeriesResponse
        {
            Id = seriesId,
            ClubId = clubId,
            Name = "Test Series"
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesAsync(seriesId))
            .ReturnsAsync(existingSeries);

        _mockEventSeriesService
            .Setup(x => x.DeleteEventSeriesAsync(seriesId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.DeleteEventSeries(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region GenerateSeriesEvents Tests

    [Test]
    public async Task GenerateSeriesEvents_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var existingSeries = new EventSeriesResponse
        {
            Id = seriesId,
            ClubId = clubId,
            Name = "Test Series"
        };

        var generatedEvents = new List<Event>
        {
            new Event { Id = 1, ClubId = clubId, Name = "Event 1", EventDateTime = DateTime.UtcNow.AddDays(1) },
            new Event { Id = 2, ClubId = clubId, Name = "Event 2", EventDateTime = DateTime.UtcNow.AddDays(8) }
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesAsync(seriesId))
            .ReturnsAsync(existingSeries);

        _mockEventSeriesService
            .Setup(x => x.GenerateSeriesEventsAsync(seriesId))
            .ReturnsAsync(generatedEvents);

        // Act
        var result = await _controller.GenerateSeriesEvents(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var eventResponses = okResult.Value as List<EventResponse>;
        Assert.That(eventResponses.Count, Is.EqualTo(2));
        Assert.That(eventResponses[0].Name, Is.EqualTo("Event 1"));
        Assert.That(eventResponses[1].Name, Is.EqualTo("Event 2"));
    }

    [Test]
    public async Task GenerateSeriesEvents_SeriesNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 999;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesAsync(seriesId))
            .ReturnsAsync((EventSeriesResponse)null);

        // Act
        var result = await _controller.GenerateSeriesEvents(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task GenerateSeriesEvents_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GenerateSeriesEvents(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task GenerateSeriesEvents_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var existingSeries = new EventSeriesResponse
        {
            Id = seriesId,
            ClubId = clubId,
            Name = "Test Series"
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(1, clubId))
            .ReturnsAsync(true);

        _mockEventSeriesService
            .Setup(x => x.GetEventSeriesAsync(seriesId))
            .ReturnsAsync(existingSeries);

        _mockEventSeriesService
            .Setup(x => x.GenerateSeriesEventsAsync(seriesId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GenerateSeriesEvents(clubId, seriesId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region RegisterForSeries Tests

    [Test]
    public async Task RegisterForSeries_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var request = new BulkSeriesRsvpRequest
        {
            MemberId = 1,
            Status = RsvpStatus.Confirmed
        };

        var expectedResponse = new BulkSeriesRsvpResult
        {
            SuccessCount = 3,
            ErrorCount = 0,
            SkippedCount = 0
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockMemberService
            .Setup(x => x.GetMemberByEmailAsync(clubId, It.IsAny<string>()))
            .ReturnsAsync(new MemberResponse { Id = 1, Email = "test@example.com" });

        _mockEventSeriesService
            .Setup(x => x.RegisterMemberForSeriesAsync(clubId, seriesId, It.IsAny<BulkSeriesRsvpRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.RegisterForSeries(clubId, seriesId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task RegisterForSeries_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var request = new BulkSeriesRsvpRequest
        {
            MemberId = 1,
            Status = RsvpStatus.Confirmed
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.RegisterForSeries(clubId, seriesId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task RegisterForSeries_InvalidArgument_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var request = new BulkSeriesRsvpRequest
        {
            MemberId = 1,
            Status = RsvpStatus.Confirmed
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockMemberService
            .Setup(x => x.GetMemberByEmailAsync(clubId, It.IsAny<string>()))
            .ReturnsAsync(new MemberResponse { Id = 1, Email = "test@example.com" });

        _mockEventSeriesService
            .Setup(x => x.RegisterMemberForSeriesAsync(clubId, seriesId, It.IsAny<BulkSeriesRsvpRequest>()))
            .ThrowsAsync(new ArgumentException("Invalid member ID"));

        // Act
        var result = await _controller.RegisterForSeries(clubId, seriesId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task RegisterForSeries_ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var request = new BulkSeriesRsvpRequest
        {
            MemberId = 1,
            Status = RsvpStatus.Confirmed
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockMemberService
            .Setup(x => x.GetMemberByEmailAsync(clubId, It.IsAny<string>()))
            .ReturnsAsync(new MemberResponse { Id = 1, Email = "test@example.com" });

        _mockEventSeriesService
            .Setup(x => x.RegisterMemberForSeriesAsync(clubId, seriesId, It.IsAny<BulkSeriesRsvpRequest>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.RegisterForSeries(clubId, seriesId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task RegisterForSeries_MemberNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var request = new BulkSeriesRsvpRequest
        {
            MemberId = 999,
            Status = RsvpStatus.Confirmed
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockMemberService
            .Setup(x => x.GetMemberByEmailAsync(clubId, It.IsAny<string>()))
            .ReturnsAsync((MemberResponse)null);

        // Act
        var result = await _controller.RegisterForSeries(clubId, seriesId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task RegisterForSeries_PartialSuccess_ReturnsOkResultWithPartialCount()
    {
        // Arrange
        var clubId = 1;
        var seriesId = 1;
        var request = new BulkSeriesRsvpRequest
        {
            MemberId = 1,
            Status = RsvpStatus.Confirmed
        };

        var expectedResponse = new BulkSeriesRsvpResult
        {
            SuccessCount = 2,
            ErrorCount = 1,
            SkippedCount = 1
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockMemberService
            .Setup(x => x.GetMemberByEmailAsync(clubId, It.IsAny<string>()))
            .ReturnsAsync(new MemberResponse { Id = 1, Email = "test@example.com" });

        _mockEventSeriesService
            .Setup(x => x.RegisterMemberForSeriesAsync(clubId, seriesId, It.IsAny<BulkSeriesRsvpRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.RegisterForSeries(clubId, seriesId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var response = okResult.Value as BulkSeriesRsvpResult;
        Assert.That(response.SuccessCount, Is.EqualTo(2));
        Assert.That(response.ErrorCount, Is.EqualTo(1));
        Assert.That(response.SkippedCount, Is.EqualTo(1));
    }

    #endregion

    #region Authentication Tests

    [Test]
    public async Task CreateEventSeries_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateEventSeriesRequest { Name = "Test Series" };

        // Setup controller with missing user ID claim
        var claims = new List<Claim>();
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.CreateEventSeries(clubId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    #endregion
}