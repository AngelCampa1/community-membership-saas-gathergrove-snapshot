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
public class EventFeedbackControllerTests
{
    private EventFeedbackController _controller;
    private Mock<IEventFeedbackService> _mockFeedbackService;
    private Mock<ApplicationClubAuth> _mockClubAuthorizationService;
    private Mock<ITierGateService> _mockTierGateService;
    private Mock<ILogger<EventFeedbackController>> _mockLogger;

    [SetUp]
    public void Setup()
    {
        _mockFeedbackService = new Mock<IEventFeedbackService>();
        _mockClubAuthorizationService = new Mock<ApplicationClubAuth>();
        _mockTierGateService = new Mock<ITierGateService>();
        _mockLogger = new Mock<ILogger<EventFeedbackController>>();

        _controller = new EventFeedbackController(
            _mockFeedbackService.Object,
            _mockClubAuthorizationService.Object,
            _mockTierGateService.Object,
            _mockLogger.Object);

        // Setup default user claims for authentication
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
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

    #region CreateFeedbackSurvey Tests

    [Test]
    public async Task CreateFeedbackSurvey_ValidRequest_ReturnsCreatedResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CreateFeedbackSurveyRequest
        {
            Title = "Event Feedback Survey",
            Description = "Please rate your experience",
            Questions = new List<CreateFeedbackQuestionRequest>
            {
                new CreateFeedbackQuestionRequest { Text = "How was the event?", QuestionType = QuestionType.Rating, IsRequired = true },
                new CreateFeedbackQuestionRequest { Text = "Any comments?", QuestionType = QuestionType.Text, IsRequired = false }
            },
            IsActive = true,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        var expectedSurvey = new FeedbackSurveyResponse
        {
            Id = 1,
            EventId = eventId,
            Title = request.Title,
            Description = request.Description,
            Questions = request.Questions.Select(q => new FeedbackQuestionResponse
            {
                Text = q.Text,
                QuestionType = q.QuestionType,
                IsRequired = q.IsRequired,
                Options = q.Options
            }).ToList(),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = request.ExpiresAt
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "EventFeedback"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        _mockFeedbackService
            .Setup(x => x.CreateFeedbackSurveyAsync(eventId, request))
            .ReturnsAsync(expectedSurvey);

        // Act
        var result = await _controller.CreateFeedbackSurvey(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;
        Assert.That(createdResult.Value, Is.EqualTo(expectedSurvey));
        Assert.That(createdResult.ActionName, Is.EqualTo(nameof(_controller.GetFeedbackSurvey)));
    }

    [Test]
    public async Task CreateFeedbackSurvey_UnauthorizedUser_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CreateFeedbackSurveyRequest { Title = "Test Survey" };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CreateFeedbackSurvey(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task CreateFeedbackSurvey_TierRestriction_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CreateFeedbackSurveyRequest { Title = "Test Survey" };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "EventFeedback"))
            .ReturnsAsync(new TierValidationResult { HasAccess = false, Message = "Upgrade required" });

        // Act
        var result = await _controller.CreateFeedbackSurvey(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task CreateFeedbackSurvey_InvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CreateFeedbackSurveyRequest { Title = "Test Survey" };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateFeatureAccessAsync(clubId, "EventFeedback"))
            .ReturnsAsync(new TierValidationResult { HasAccess = true });

        _mockFeedbackService
            .Setup(x => x.CreateFeedbackSurveyAsync(eventId, request))
            .ThrowsAsync(new ArgumentException("Survey must have at least one question"));

        // Act
        var result = await _controller.CreateFeedbackSurvey(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region GetFeedbackSurvey Tests

    [Test]
    public async Task GetFeedbackSurvey_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var surveyId = 1;
        var expectedSurvey = new FeedbackSurveyResponse
        {
            Id = surveyId,
            EventId = eventId,
            Title = "Test Survey",
            Questions = new List<FeedbackQuestionResponse>
            {
                new FeedbackQuestionResponse { Id = 1, Text = "Rate the event", QuestionType = QuestionType.Rating }
            }
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.GetFeedbackSurveyAsync(surveyId))
            .ReturnsAsync(expectedSurvey);

        // Act
        var result = await _controller.GetFeedbackSurvey(clubId, eventId, surveyId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedSurvey));
    }

    [Test]
    public async Task GetFeedbackSurvey_SurveyNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var surveyId = 999;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.GetFeedbackSurveyAsync(surveyId))
            .ReturnsAsync((FeedbackSurveyResponse)null);

        // Act
        var result = await _controller.GetFeedbackSurvey(clubId, eventId, surveyId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    #endregion

    #region SubmitFeedback Tests

    [Test]
    public async Task SubmitFeedback_ValidRequest_ReturnsCreatedResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new SubmitFeedbackRequest
        {
            MemberId = 123,
            SurveyId = 1,
            Responses = new List<GatherGrove.Application.DTOs.SurveyResponse>
            {
                new GatherGrove.Application.DTOs.SurveyResponse { QuestionId = 1, Answer = "5" },
                new GatherGrove.Application.DTOs.SurveyResponse { QuestionId = 2, Answer = "Great event!" }
            }
        };

        var expectedResponse = new FeedbackResponseDetails
        {
            Id = 1,
            EventId = eventId,
            MemberId = request.MemberId,
            SurveyId = request.SurveyId,
            Responses = request.Responses.Select(r => new FeedbackAnswerResponse { QuestionId = r.QuestionId, Answer = r.Answer }).ToList(),
            SubmittedAt = DateTime.UtcNow
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(eventId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.SubmitFeedback(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var createdResult = result as CreatedAtActionResult;
        Assert.That(createdResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task SubmitFeedback_InvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new SubmitFeedbackRequest { MemberId = 123, SurveyId = 1 };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.SubmitFeedbackAsync(eventId, request))
            .ThrowsAsync(new ArgumentException("Required question not answered"));

        // Act
        var result = await _controller.SubmitFeedback(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region GetFeedbackResponse Tests

    [Test]
    public async Task GetFeedbackResponse_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var responseId = 1;
        var expectedResponse = new FeedbackResponseDetails
        {
            Id = responseId,
            EventId = eventId,
            MemberId = 123,
            SurveyId = 1,
            SubmittedAt = DateTime.UtcNow
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.GetFeedbackResponseAsync(responseId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetFeedbackResponse(clubId, eventId, responseId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponse));
    }

    [Test]
    public async Task GetFeedbackResponse_ResponseNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var responseId = 999;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.GetFeedbackResponseAsync(responseId))
            .ReturnsAsync((FeedbackResponseDetails)null);

        // Act
        var result = await _controller.GetFeedbackResponse(clubId, eventId, responseId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }

    #endregion

    #region GetFeedbackAnalytics Tests

    [Test]
    public async Task GetFeedbackAnalytics_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var expectedAnalytics = new EventFeedbackAnalytics
        {
            EventId = eventId,
            TotalResponses = 25,
            AverageRating = 4.2,
            ResponseRate = 0.83
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.GetFeedbackAnalyticsAsync(eventId))
            .ReturnsAsync(expectedAnalytics);

        // Act
        var result = await _controller.GetFeedbackAnalytics(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedAnalytics));
    }

    #endregion

    #region SendFeedbackReminders Tests

    [Test]
    public async Task SendFeedbackReminders_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var surveyId = 1;
        var expectedResult = new FeedbackReminderResult
        {
            SurveyId = surveyId,
            RemindersSent = 15,
            TotalEligible = 30,
            FailedSends = 0,
            Message = "Reminders sent successfully"
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.SendFeedbackRemindersAsync(surveyId))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.SendFeedbackReminders(clubId, eventId, surveyId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResult));
    }

    #endregion

    #region CloseFeedbackSurvey Tests

    [Test]
    public async Task CloseFeedbackSurvey_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var surveyId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.CloseFeedbackSurveyAsync(surveyId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.CloseFeedbackSurvey(clubId, eventId, surveyId);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task CloseFeedbackSurvey_InvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var surveyId = 1;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.CloseFeedbackSurveyAsync(surveyId))
            .ThrowsAsync(new ArgumentException("Survey is already closed"));

        // Act
        var result = await _controller.CloseFeedbackSurvey(clubId, eventId, surveyId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region ExportFeedbackData Tests

    [Test]
    public async Task ExportFeedbackData_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new ExportFeedbackDataRequest
        {
            Format = ExportFormat.CSV,
            IncludeAnalytics = true,
            DateRange = new GatherGrove.Application.DTOs.DateRange
            {
                StartDate = DateTime.UtcNow.AddDays(-30),
                EndDate = DateTime.UtcNow
            }
        };

        var expectedExport = new ExportedFeedbackData
        {
            EventId = eventId,
            Format = request.Format,
            TotalRecords = 25,
            ExportedAt = DateTime.UtcNow,
            DownloadUrl = "https://example.com/exports/feedback_12345.csv",
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.ExportFeedbackDataAsync(eventId, request))
            .ReturnsAsync(expectedExport);

        // Act
        var result = await _controller.ExportFeedbackData(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedExport));
    }

    [Test]
    public async Task ExportFeedbackData_InvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new ExportFeedbackDataRequest { Format = ExportFormat.CSV };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.ExportFeedbackDataAsync(eventId, request))
            .ThrowsAsync(new ArgumentException("Invalid date range"));

        // Act
        var result = await _controller.ExportFeedbackData(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    #endregion

    #region GetEventFeedbackSurveys Tests

    [Test]
    public async Task GetEventFeedbackSurveys_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var expectedSurveys = new List<FeedbackSurveyResponse>
        {
            new FeedbackSurveyResponse { Id = 1, EventId = eventId, Title = "Post-Event Survey" },
            new FeedbackSurveyResponse { Id = 2, EventId = eventId, Title = "Speaker Feedback" }
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.GetEventFeedbackSurveysAsync(eventId))
            .ReturnsAsync(expectedSurveys);

        // Act
        var result = await _controller.GetEventFeedbackSurveys(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedSurveys));
    }

    #endregion

    #region GetEventFeedbackResponses Tests

    [Test]
    public async Task GetEventFeedbackResponses_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var surveyId = 1;
        var expectedResponses = new List<FeedbackResponseDetails>
        {
            new FeedbackResponseDetails { Id = 1, EventId = eventId, SurveyId = surveyId, MemberId = 123 },
            new FeedbackResponseDetails { Id = 2, EventId = eventId, SurveyId = surveyId, MemberId = 124 }
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.GetEventFeedbackResponsesAsync(eventId, surveyId))
            .ReturnsAsync(expectedResponses);

        // Act
        var result = await _controller.GetEventFeedbackResponses(clubId, eventId, surveyId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponses));
    }

    [Test]
    public async Task GetEventFeedbackResponses_NoSurveyFilter_ReturnsAllResponses()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var expectedResponses = new List<FeedbackResponseDetails>
        {
            new FeedbackResponseDetails { Id = 1, EventId = eventId, SurveyId = 1, MemberId = 123 },
            new FeedbackResponseDetails { Id = 2, EventId = eventId, SurveyId = 2, MemberId = 124 }
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockFeedbackService
            .Setup(x => x.GetEventFeedbackResponsesAsync(eventId, null))
            .ReturnsAsync(expectedResponses);

        // Act
        var result = await _controller.GetEventFeedbackResponses(clubId, eventId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(expectedResponses));
    }

    #endregion

    #region Authentication Tests

    [Test]
    public async Task CreateFeedbackSurvey_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var request = new CreateFeedbackSurveyRequest { Title = "Test Survey" };

        // Setup controller with missing user ID claim
        var claims = new List<Claim>();
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = claimsPrincipal }
        };

        // Act
        var result = await _controller.CreateFeedbackSurvey(clubId, eventId, request);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
    }

    #endregion
}