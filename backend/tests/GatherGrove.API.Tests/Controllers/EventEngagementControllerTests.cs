using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class EventEngagementControllerTests
{
    private Mock<IEventEngagementService> _eventEngagementServiceMock = null!;
    private Mock<IClubAuthorizationService> _authorizationServiceMock = null!;
    private Mock<ILogger<EventEngagementController>> _loggerMock = null!;
    private EventEngagementController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _eventEngagementServiceMock = new Mock<IEventEngagementService>();
        _authorizationServiceMock = new Mock<IClubAuthorizationService>();
        _loggerMock = new Mock<ILogger<EventEngagementController>>();

        _controller = new EventEngagementController(
            _eventEngagementServiceMock.Object,
            _authorizationServiceMock.Object,
            _loggerMock.Object);

        // Setup default HTTP context with authenticated user
        SetupAuthenticatedUser(userId: 1);
    }

    private void SetupAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new("sub", userId.ToString()),
            new(ClaimTypes.Role, "ClubAdmin"),
            new("ClubId", "1")
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
        var claims = new List<Claim>
        {
            new(ClaimTypes.Role, "Member")
            // No sub or userId claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region GetEventEngagement Tests

    [Test]
    public async Task GetEventEngagement_ValidEvent_ReturnsOkWithMetrics()
    {
        // Arrange
        var eventId = 1;
        var metrics = new EventEngagementMetrics
        {
            EventId = eventId,
            EventName = "Annual Gala",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            TotalInvited = 100,
            TotalRsvps = 75,
            TotalAttended = 68,
            RsvpRate = 0.75m,
            AttendanceRate = 0.68m,
            EngagementScore = 82.5m,
            EngagementLevel = EngagementLevel.High,
            MemberTypeBreakdown = new Dictionary<string, decimal>
            {
                { "Regular", 50.5m },
                { "VIP", 30.5m },
                { "Student", 19.0m }
            },
            TopEngagementFactors = new List<string> { "Popular speaker", "Great venue", "Networking opportunities" }
        };

        _eventEngagementServiceMock
            .Setup(s => s.CalculateEventEngagementScoreAsync(eventId))
            .ReturnsAsync(metrics);

        // Act
        var result = await _controller.GetEventEngagement(eventId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as EventEngagementMetricsResponse;
        response.Should().NotBeNull();
        response!.EventId.Should().Be(eventId);
        response.EventName.Should().Be("Annual Gala");
        response.TotalInvited.Should().Be(100);
        response.TotalRsvps.Should().Be(75);
        response.TotalAttended.Should().Be(68);
        response.RsvpRate.Should().Be(0.75m);
        response.AttendanceRate.Should().Be(0.68m);
        response.EngagementScore.Should().Be(82.5m);
        response.EngagementLevel.Should().Be("Green"); // Green and High are aliases (both = 1), ToString() returns "Green"
        response.MemberTypeBreakdown.Should().ContainKey("Regular");
        response.TopEngagementFactors.Should().Contain("Popular speaker");
    }

    [Test]
    public async Task GetEventEngagement_ServiceThrowsException_Returns500()
    {
        // Arrange
        var eventId = 1;
        _eventEngagementServiceMock
            .Setup(s => s.CalculateEventEngagementScoreAsync(eventId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEventEngagement(eventId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while retrieving event engagement metrics");
    }

    #endregion

    #region GetClubEventsEngagement Tests

    [Test]
    public async Task GetClubEventsEngagement_ValidClub_ReturnsOkWithClubEngagement()
    {
        // Arrange
        var clubId = 1;
        var daysBack = 90;

        var clubOverview = new ClubEventEngagementOverview
        {
            ClubId = clubId,
            ClubName = "Tech Club",
            TotalEvents = 25,
            TotalMembers = 150,
            AverageEventAttendance = 45.5m,
            ClubEventEngagementScore = 78.3m,
            LowEngagementMembers = new List<MemberEventEngagement>
            {
                new()
                {
                    MemberId = 5,
                    MemberName = "John Doe",
                    Email = "john@example.com",
                    EventsInvited = 10,
                    EventsRsvped = 2,
                    EventsAttended = 1,
                    EventEngagementScore = 15.0m,
                    EngagementLevel = EngagementLevel.Low,
                    LastEventAttendance = DateTime.UtcNow.AddMonths(-3),
                    PreferredEventTypes = new List<string> { "Workshop" }
                }
            }
        };

        var trends = new EventEngagementTrendsDto
        {
            ClubId = clubId,
            AverageEngagementScore = 75.5m,
            TrendDirection = 5.2m,
            TotalEvents = 25,
            TotalAttendances = 1200,
            DailyTrends = new List<DailyEventEngagement>
            {
                new()
                {
                    Date = DateTime.UtcNow.AddDays(-1).Date,
                    EventsHeld = 2,
                    TotalAttendance = 95,
                    AverageEngagementScore = 80.0m
                }
            }
        };

        var topEvents = new List<EventEngagementMetrics>
        {
            new()
            {
                EventId = 10,
                EventName = "Tech Summit",
                EventDateTime = DateTime.UtcNow.AddDays(-10),
                TotalInvited = 100,
                TotalRsvps = 90,
                TotalAttended = 85,
                RsvpRate = 0.90m,
                AttendanceRate = 0.85m,
                EngagementScore = 95.0m,
                EngagementLevel = EngagementLevel.High,
                MemberTypeBreakdown = new Dictionary<string, decimal> { { "Regular", 85.0m } },
                TopEngagementFactors = new List<string> { "Industry expert speaker" }
            }
        };

        _eventEngagementServiceMock
            .Setup(s => s.GetClubEventOverviewAsync(clubId))
            .ReturnsAsync(clubOverview);

        _eventEngagementServiceMock
            .Setup(s => s.GetEventEngagementTrendsAsync(clubId, daysBack))
            .ReturnsAsync(trends);

        _eventEngagementServiceMock
            .Setup(s => s.GetTopPerformingEventsAsync(clubId, 10, daysBack))
            .ReturnsAsync(topEvents);

        // Act
        var result = await _controller.GetClubEventsEngagement(clubId, "all", daysBack);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as ClubEventEngagementResponse;
        response.Should().NotBeNull();
        response!.ClubId.Should().Be(clubId);
        response.ClubName.Should().Be("Tech Club");
        response.TotalEvents.Should().Be(25);
        response.TotalMembers.Should().Be(150);
        response.AverageEventAttendance.Should().Be(45.5m);
        response.ClubEventEngagementScore.Should().Be(78.3m);
        response.Trends.Should().NotBeNull();
        response.Trends.AverageEngagementScore.Should().Be(75.5m);
        response.TopEvents.Should().HaveCount(1);
        response.TopEvents[0].EventName.Should().Be("Tech Summit");
        response.LowEngagementMembers.Should().HaveCount(1);
        response.LowEngagementMembers[0].MemberName.Should().Be("John Doe");
    }

    [Test]
    public async Task GetClubEventsEngagement_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;
        _eventEngagementServiceMock
            .Setup(s => s.GetClubEventOverviewAsync(clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetClubEventsEngagement(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while retrieving club events engagement data");
    }

    #endregion

    #region RecordEventAttendance Tests

    [Test]
    public async Task RecordEventAttendance_ValidRequest_ReturnsOkWithAttendance()
    {
        // Arrange
        var eventId = 1;
        var request = new RecordAttendanceRequest
        {
            MemberId = 5,
            AttendedAt = DateTime.UtcNow,
            Notes = "Arrived on time, participated actively"
        };

        var attendance = new EventAttendance
        {
            Id = 100,
            EventId = eventId,
            MemberId = request.MemberId,
            AttendedAt = request.AttendedAt.Value,
            CreatedAt = DateTime.UtcNow,
            Notes = request.Notes
        };

        _eventEngagementServiceMock
            .Setup(s => s.RecordEventAttendanceAsync(eventId, request.MemberId, request.AttendedAt, request.Notes))
            .ReturnsAsync(attendance);

        // Act
        var result = await _controller.RecordEventAttendance(eventId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as EventAttendanceResponse;
        response.Should().NotBeNull();
        response!.Id.Should().Be(100);
        response.EventId.Should().Be(eventId);
        response.MemberId.Should().Be(request.MemberId);
        response.Notes.Should().Be(request.Notes);
    }

    [Test]
    public async Task RecordEventAttendance_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var eventId = 999; // Non-existent event
        var request = new RecordAttendanceRequest
        {
            MemberId = 5,
            AttendedAt = DateTime.UtcNow
        };

        _eventEngagementServiceMock
            .Setup(s => s.RecordEventAttendanceAsync(eventId, request.MemberId, request.AttendedAt, request.Notes))
            .ThrowsAsync(new ArgumentException("Event not found"));

        // Act
        var result = await _controller.RecordEventAttendance(eventId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
        badRequestResult.Value.Should().Be("Event not found");
    }

    [Test]
    public async Task RecordEventAttendance_ServiceThrowsException_Returns500()
    {
        // Arrange
        var eventId = 1;
        var request = new RecordAttendanceRequest
        {
            MemberId = 5
        };

        _eventEngagementServiceMock
            .Setup(s => s.RecordEventAttendanceAsync(eventId, request.MemberId, request.AttendedAt, request.Notes))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.RecordEventAttendance(eventId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while recording attendance");
    }

    [Test]
    public async Task RecordEventAttendance_InvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var eventId = 1;
        var request = new RecordAttendanceRequest
        {
            MemberId = -1, // Invalid member ID
            AttendedAt = DateTime.UtcNow
        };
        _controller.ModelState.AddModelError("MemberId", "MemberId must be positive");

        // Act
        var result = await _controller.RecordEventAttendance(eventId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    #endregion

    #region GetMemberEventEngagement Tests

    [Test]
    public async Task GetMemberEventEngagement_ValidMember_ReturnsOkWithHistory()
    {
        // Arrange
        var memberId = 5;
        var userId = 1;
        var daysBack = 180;

        SetupAuthenticatedUser(userId);

        _authorizationServiceMock
            .Setup(s => s.CanAccessMemberDataAsync(memberId, userId))
            .ReturnsAsync(true);

        var attendanceHistory = new List<EventAttendance>
        {
            new()
            {
                Id = 1,
                EventId = 10,
                MemberId = memberId,
                AttendedAt = DateTime.UtcNow.AddDays(-5),
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                Notes = "Great participation",
                Event = new Event
                {
                    Id = 10,
                    Name = "Workshop",
                    EventDateTime = DateTime.UtcNow.AddDays(-5)
                }
            }
        };

        var memberScore = 75.5m;

        _eventEngagementServiceMock
            .Setup(s => s.GetMemberAttendanceHistoryAsync(memberId, daysBack))
            .ReturnsAsync(attendanceHistory);

        _eventEngagementServiceMock
            .Setup(s => s.CalculateMemberEventScoreAsync(memberId, daysBack))
            .ReturnsAsync(memberScore);

        // Act
        var result = await _controller.GetMemberEventEngagement(memberId, daysBack);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as MemberEventEngagementHistoryResponse;
        response.Should().NotBeNull();
        response!.MemberId.Should().Be(memberId);
        response.DaysAnalyzed.Should().Be(daysBack);
        response.EventEngagementScore.Should().Be(75.5m);
        response.TotalEventsAttended.Should().Be(1);
        response.AttendanceHistory.Should().HaveCount(1);
        response.AttendanceHistory[0].EventName.Should().Be("Workshop");
    }

    [Test]
    public async Task GetMemberEventEngagement_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var memberId = 5;

        // Act
        var result = await _controller.GetMemberEventEngagement(memberId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
        unauthorizedResult.Value.Should().Be("Unable to determine user identity");

        _authorizationServiceMock.Verify(
            s => s.CanAccessMemberDataAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetMemberEventEngagement_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var memberId = 5;
        var userId = 1;

        SetupAuthenticatedUser(userId);

        _authorizationServiceMock
            .Setup(s => s.CanAccessMemberDataAsync(memberId, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetMemberEventEngagement(memberId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetMemberEventEngagement_ServiceThrowsException_Returns500()
    {
        // Arrange
        var memberId = 5;
        var userId = 1;

        SetupAuthenticatedUser(userId);

        _authorizationServiceMock
            .Setup(s => s.CanAccessMemberDataAsync(memberId, userId))
            .ReturnsAsync(true);

        _eventEngagementServiceMock
            .Setup(s => s.GetMemberAttendanceHistoryAsync(memberId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMemberEventEngagement(memberId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while retrieving member event engagement data");
    }

    #endregion

    #region GetEventAnalytics Tests

    [Test]
    public async Task GetEventAnalytics_WithClubId_ReturnsOkWithAnalytics()
    {
        // Arrange
        var clubId = 1;
        var daysBack = 90;

        var clubOverview = new ClubEventEngagementOverview
        {
            ClubId = clubId,
            TotalEvents = 20,
            TotalMembers = 100,
            ClubEventEngagementScore = 80.0m
        };

        var topEvents = new List<EventEngagementMetrics>
        {
            new()
            {
                EventId = 1,
                EventName = "Top Event",
                EventDateTime = DateTime.UtcNow.AddDays(-5),
                TotalInvited = 50,
                TotalRsvps = 45,
                TotalAttended = 40,
                RsvpRate = 0.90m,
                AttendanceRate = 0.80m,
                EngagementScore = 85.0m,
                EngagementLevel = EngagementLevel.High,
                MemberTypeBreakdown = new Dictionary<string, decimal>(),
                TopEngagementFactors = new List<string>()
            }
        };

        var trends = new EventEngagementTrendsDto
        {
            ClubId = clubId,
            AverageEngagementScore = 78.0m,
            TrendDirection = 3.5m,
            TotalEvents = 20,
            TotalAttendances = 800,
            DailyTrends = new List<DailyEventEngagement>()
        };

        _eventEngagementServiceMock
            .Setup(s => s.GetClubEventOverviewAsync(clubId))
            .ReturnsAsync(clubOverview);

        _eventEngagementServiceMock
            .Setup(s => s.GetTopPerformingEventsAsync(clubId, 10, daysBack))
            .ReturnsAsync(topEvents);

        _eventEngagementServiceMock
            .Setup(s => s.GetEventEngagementTrendsAsync(clubId, daysBack))
            .ReturnsAsync(trends);

        // Act
        var result = await _controller.GetEventAnalytics(clubId, daysBack);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as EventAnalyticsResponse;
        response.Should().NotBeNull();
        response!.ClubId.Should().Be(clubId);
        response.DaysAnalyzed.Should().Be(daysBack);
        response.TotalEvents.Should().Be(20);
        response.TotalMembers.Should().Be(100);
        response.AverageEngagementScore.Should().Be(80.0m);
        response.TopPerformingEvents.Should().HaveCount(1);
    }

    [Test]
    public async Task GetEventAnalytics_WithoutClubId_ReturnsOkWithEmptyAnalytics()
    {
        // Arrange
        var daysBack = 90;

        // Act
        var result = await _controller.GetEventAnalytics(null, daysBack);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as EventAnalyticsResponse;
        response.Should().NotBeNull();
        response!.ClubId.Should().BeNull();
        response.DaysAnalyzed.Should().Be(daysBack);
        response.TotalEvents.Should().Be(0);
        response.TotalMembers.Should().Be(0);
    }

    [Test]
    public async Task GetEventAnalytics_ServiceThrowsException_Returns500()
    {
        // Arrange
        var clubId = 1;

        _eventEngagementServiceMock
            .Setup(s => s.GetClubEventOverviewAsync(clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEventAnalytics(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while retrieving event analytics data");
    }

    #endregion

    #region SubmitEventFeedback Tests

    [Test]
    public async Task SubmitEventFeedback_ValidRequest_ReturnsOkWithFeedback()
    {
        // Arrange
        var eventId = 1;
        var request = new EventFeedbackRequest
        {
            MemberId = 5,
            Rating = 5,
            Comments = "Excellent event!",
            Tags = new List<string> { "Informative", "Well-organized" }
        };

        // Act
        var result = await _controller.SubmitEventFeedback(eventId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as GatherGrove.API.Controllers.EventFeedbackResponse;
        response.Should().NotBeNull();
        response!.EventId.Should().Be(eventId);
        response.MemberId.Should().Be(request.MemberId);
        response.Rating.Should().Be(5);
        response.Comments.Should().Be("Excellent event!");
        response.Status.Should().Be("Submitted");
    }

    [Test]
    public async Task SubmitEventFeedback_InvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var eventId = 1;
        var request = new EventFeedbackRequest
        {
            MemberId = 5,
            Rating = 10, // Invalid - should be 1-5
            Comments = "Test"
        };
        _controller.ModelState.AddModelError("Rating", "Rating must be between 1 and 5");

        // Act
        var result = await _controller.SubmitEventFeedback(eventId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task SubmitEventFeedback_WithMinimalData_ReturnsOkWithFeedback()
    {
        // Arrange
        var eventId = 2;
        var request = new EventFeedbackRequest
        {
            MemberId = 10,
            Rating = 3,
            Comments = null, // Minimal - no comments
            Tags = null // Minimal - no tags
        };

        // Act
        var result = await _controller.SubmitEventFeedback(eventId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as GatherGrove.API.Controllers.EventFeedbackResponse;
        response.Should().NotBeNull();
        response!.EventId.Should().Be(eventId);
        response.MemberId.Should().Be(10);
        response.Rating.Should().Be(3);
        response.Status.Should().Be("Submitted");
    }

    [Test]
    public async Task SubmitEventFeedback_WithNegativeRating_ReturnsOkButStoresValue()
    {
        // Arrange - Controller doesn't validate rating range, just processes it
        var eventId = 1;
        var request = new EventFeedbackRequest
        {
            MemberId = 5,
            Rating = -1, // Edge case - negative rating
            Comments = "Test negative rating"
        };

        // Act
        var result = await _controller.SubmitEventFeedback(eventId, request);

        // Assert - Controller accepts it even though it's unusual
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as GatherGrove.API.Controllers.EventFeedbackResponse;
        response!.Rating.Should().Be(-1);
    }

    #endregion

    #region GetEventRecommendations Tests

    [Test]
    public async Task GetEventRecommendations_ValidMember_ReturnsOkWithRecommendations()
    {
        // Arrange
        var memberId = 5;
        var userId = 1;
        var limit = 10;

        SetupAuthenticatedUser(userId);

        _authorizationServiceMock
            .Setup(s => s.CanAccessMemberDataAsync(memberId, userId))
            .ReturnsAsync(true);

        var recommendations = new List<EventRecommendation>
        {
            new()
            {
                EventId = 10,
                EventName = "Tech Workshop",
                EventDateTime = DateTime.UtcNow.AddDays(7),
                Location = "Main Hall",
                RecommendationScore = 0.95m,
                RecommendationReasons = new List<string> { "Attended similar events", "High engagement history" },
                AttendanceProbability = 0.85m
            },
            new()
            {
                EventId = 11,
                EventName = "Networking Event",
                EventDateTime = DateTime.UtcNow.AddDays(14),
                Location = "Conference Room",
                RecommendationScore = 0.80m,
                RecommendationReasons = new List<string> { "Matches interests" },
                AttendanceProbability = 0.70m
            }
        };

        _eventEngagementServiceMock
            .Setup(s => s.GetEventRecommendationsAsync(memberId, limit))
            .ReturnsAsync(recommendations);

        // Act
        var result = await _controller.GetEventRecommendations(memberId, limit);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var response = okResult.Value as List<EventRecommendationResponse>;
        response.Should().NotBeNull();
        response.Should().HaveCount(2);
        response![0].EventName.Should().Be("Tech Workshop");
        response[0].RecommendationScore.Should().Be(0.95m);
        response[0].RecommendationReasons.Should().Contain("High engagement history");
        response[1].EventName.Should().Be("Networking Event");
    }

    [Test]
    public async Task GetEventRecommendations_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var memberId = 5;

        // Act
        var result = await _controller.GetEventRecommendations(memberId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
        unauthorizedResult.Value.Should().Be("Unable to determine user identity");
    }

    [Test]
    public async Task GetEventRecommendations_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var memberId = 5;
        var userId = 1;

        SetupAuthenticatedUser(userId);

        _authorizationServiceMock
            .Setup(s => s.CanAccessMemberDataAsync(memberId, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEventRecommendations(memberId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetEventRecommendations_ServiceThrowsException_Returns500()
    {
        // Arrange
        var memberId = 5;
        var userId = 1;

        SetupAuthenticatedUser(userId);

        _authorizationServiceMock
            .Setup(s => s.CanAccessMemberDataAsync(memberId, userId))
            .ReturnsAsync(true);

        _eventEngagementServiceMock
            .Setup(s => s.GetEventRecommendationsAsync(memberId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEventRecommendations(memberId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
        statusCodeResult.Value.Should().Be("An error occurred while retrieving event recommendations");
    }

    #endregion
}
