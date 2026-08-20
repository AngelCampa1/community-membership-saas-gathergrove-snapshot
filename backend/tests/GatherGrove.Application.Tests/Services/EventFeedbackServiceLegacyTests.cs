using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for EventFeedbackService using the legacy constructor with direct DbContext access.
/// These tests cover code paths that use GatherGroveDbContext directly instead of repositories.
/// </summary>
[TestFixture]
public class EventFeedbackServiceLegacyTests
{
    private GatherGroveDbContext _context = null!;
    private Mock<ICommunicationsService> _mockCommunicationsService = null!;
    private EventFeedbackService _service = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"EventFeedback_Test_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockCommunicationsService = new Mock<ICommunicationsService>();

        _service = new EventFeedbackService(
            _context,
            _mockCommunicationsService.Object,
            NullLogger<EventFeedbackService>.Instance
        );
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    #region CreateFeedbackSurveyAsync - Legacy Path Tests

    [Test]
    public async Task CreateFeedbackSurveyAsync_LegacyPath_CreatesSurveySuccessfully()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        _context.Clubs.Add(club);

        var eventEntity = new Event
        {
            Id = 1,
            Title = "Test Event",
            ClubId = 1,
            Club = club,
            Description = "Test description"
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        var request = new CreateFeedbackSurveyRequest
        {
            EventId = 1,
            Title = "Event Feedback Survey",
            Description = "Please share your feedback",
            IsAnonymous = false,
            Questions = new List<CreateFeedbackQuestionRequest>
            {
                new() { Text = "How was the event?", QuestionType = QuestionType.Rating, IsRequired = true },
                new() { Text = "Comments", QuestionType = QuestionType.Text, IsRequired = false, Options = "Option1,Option2" }
            }
        };

        // Act
        var result = await _service.CreateFeedbackSurveyAsync(1, request);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Event Feedback Survey");
        result.Description.Should().Be("Please share your feedback");
        result.EventId.Should().Be(1);
        result.IsAnonymous.Should().BeFalse();
        result.IsActive.Should().BeTrue();
        result.Questions.Should().HaveCount(2);
        result.Questions[0].Text.Should().Be("How was the event?");
        result.Questions[0].QuestionType.Should().Be(QuestionType.Rating);
        result.Questions[0].IsRequired.Should().BeTrue();
        result.Questions[1].Options.Should().Be("Option1,Option2");

        // Verify database persistence
        var savedSurvey = await _context.EventFeedbackSurveys
            .Include(s => s.Questions)
            .FirstOrDefaultAsync(s => s.Id == result.Id);
        savedSurvey.Should().NotBeNull();
        savedSurvey!.Title.Should().Be("Event Feedback Survey");
        savedSurvey.Questions.Should().HaveCount(2);
    }

    [Test]
    public async Task CreateFeedbackSurveyAsync_LegacyPath_EventNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateFeedbackSurveyRequest
        {
            EventId = 999,
            Title = "Test Survey",
            Questions = new List<CreateFeedbackQuestionRequest>
            {
                new() { Text = "Question 1", QuestionType = QuestionType.Text }
            }
        };

        // Act & Assert
        var act = () => _service.CreateFeedbackSurveyAsync(999, request);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Event with ID 999 not found*");
    }

    [Test]
    public async Task CreateFeedbackSurveyAsync_Overload_CallsMainMethod()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        _context.Clubs.Add(club);

        var eventEntity = new Event { Id = 1, Title = "Test Event", ClubId = 1, Club = club };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        var request = new CreateFeedbackSurveyRequest
        {
            EventId = 1,
            Title = "Overload Test Survey",
            Questions = new List<CreateFeedbackQuestionRequest>
            {
                new() { Text = "Test Question", QuestionType = QuestionType.Rating }
            }
        };

        // Act
        var result = await _service.CreateFeedbackSurveyAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Overload Test Survey");
        result.EventId.Should().Be(1);
    }

    [Test]
    public async Task CreateFeedbackSurveyAsync_WithAnonymousSurvey_SetsAnonymousFlag()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        _context.Clubs.Add(club);

        var eventEntity = new Event { Id = 1, Title = "Test Event", ClubId = 1, Club = club };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        var request = new CreateFeedbackSurveyRequest
        {
            EventId = 1,
            Title = "Anonymous Survey",
            IsAnonymous = true,
            Questions = new List<CreateFeedbackQuestionRequest>
            {
                new() { Text = "Rate us", QuestionType = QuestionType.Rating }
            }
        };

        // Act
        var result = await _service.CreateFeedbackSurveyAsync(1, request);

        // Assert
        result.IsAnonymous.Should().BeTrue();
    }

    [Test]
    public async Task CreateFeedbackSurveyAsync_QuestionsWithOptions_ParsesOptionsCorrectly()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        _context.Clubs.Add(club);

        var eventEntity = new Event { Id = 1, Title = "Test Event", ClubId = 1, Club = club };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        var request = new CreateFeedbackSurveyRequest
        {
            EventId = 1,
            Title = "Options Survey",
            Questions = new List<CreateFeedbackQuestionRequest>
            {
                new() { Text = "Multiple choice", QuestionType = QuestionType.MultipleChoice, Options = "A,B,C,D" }
            }
        };

        // Act
        var result = await _service.CreateFeedbackSurveyAsync(1, request);

        // Assert
        result.Questions[0].Options.Should().Be("A,B,C,D");

        // Verify options stored as list in database
        var savedSurvey = await _context.EventFeedbackSurveys
            .Include(s => s.Questions)
            .FirstAsync(s => s.Id == result.Id);
        savedSurvey.Questions.First().Options.Should().BeEquivalentTo(new[] { "A", "B", "C", "D" });
    }

    #endregion

    #region GetFeedbackSurveyAsync Tests

    [Test]
    public async Task GetFeedbackSurveyAsync_SurveyExists_ReturnsSurveyWithQuestions()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Test Survey",
            Description = "Survey description",
            IsAnonymous = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            Questions = new List<SurveyQuestion>
            {
                new() { Id = 1, Text = "Q1", Type = QuestionType.Rating, IsRequired = true, Options = new List<string> { "1", "2", "3" } },
                new() { Id = 2, Text = "Q2", Type = QuestionType.Text, IsRequired = false }
            }
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetFeedbackSurveyAsync(1);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(1);
        result.Title.Should().Be("Test Survey");
        result.Description.Should().Be("Survey description");
        result.IsAnonymous.Should().BeFalse();
        result.IsActive.Should().BeTrue();
        result.Questions.Should().HaveCount(2);
        result.Questions[0].Text.Should().Be("Q1");
        result.Questions[0].QuestionType.Should().Be(QuestionType.Rating);
        result.Questions[0].Options.Should().Be("1,2,3");
        result.Questions[1].Text.Should().Be("Q2");
    }

    [Test]
    public async Task GetFeedbackSurveyAsync_SurveyNotFound_ReturnsNull()
    {
        // Act
        var result = await _service.GetFeedbackSurveyAsync(999);

        // Assert
        result.Should().BeNull();
    }

    [Test]
    public async Task GetFeedbackSurveyAsync_QuestionWithNullOptions_ReturnsNullOptions()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Survey",
            Questions = new List<SurveyQuestion>
            {
                new() { Id = 1, Text = "Open question", Type = QuestionType.Text, Options = null }
            }
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetFeedbackSurveyAsync(1);

        // Assert
        result.Should().NotBeNull();
        result!.Questions[0].Options.Should().BeNull();
    }

    #endregion

    #region SubmitFeedbackAsync - Legacy Path Tests

    [Test]
    public async Task SubmitFeedbackAsync_LegacyPath_SubmitsFeedbackSuccessfully()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Test Survey",
            IsActive = true,
            Questions = new List<SurveyQuestion>
            {
                new() { Id = 1, Text = "Rate us", Type = QuestionType.Rating },
                new() { Id = 2, Text = "Comments", Type = QuestionType.Text }
            }
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        var request = new SubmitFeedbackRequest
        {
            SurveyId = 1,
            MemberId = 100,
            Responses = new List<Application.DTOs.SurveyResponse>
            {
                new() { QuestionId = 1, Answer = "5" },
                new() { QuestionId = 2, Answer = "Great event!" }
            }
        };

        // Act
        var result = await _service.SubmitFeedbackAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.ResponseId.Should().BeGreaterThan(0);
        result.SubmittedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        // Verify database persistence
        var savedFeedback = await _context.EventFeedbackResponses
            .Include(f => f.Responses)
            .FirstOrDefaultAsync(f => f.Id == result.ResponseId);
        savedFeedback.Should().NotBeNull();
        savedFeedback!.MemberId.Should().Be(100);
        savedFeedback.Responses.Should().HaveCount(2);
    }

    [Test]
    public async Task SubmitFeedbackAsync_LegacyPath_SurveyNotActive_ReturnsError()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Inactive Survey",
            IsActive = false,
            Questions = new List<SurveyQuestion>()
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        var request = new SubmitFeedbackRequest
        {
            SurveyId = 1,
            MemberId = 100,
            Responses = new List<Application.DTOs.SurveyResponse>()
        };

        // Act
        var result = await _service.SubmitFeedbackAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not found or is not active");
    }

    [Test]
    public async Task SubmitFeedbackAsync_LegacyPath_SurveyNotFound_ReturnsError()
    {
        // Arrange
        var request = new SubmitFeedbackRequest
        {
            SurveyId = 999,
            MemberId = 100,
            Responses = new List<Application.DTOs.SurveyResponse>()
        };

        // Act
        var result = await _service.SubmitFeedbackAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not found");
    }

    [Test]
    public async Task SubmitFeedbackAsync_LegacyPath_DuplicateSubmission_ReturnsError()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Test Survey",
            IsActive = true,
            Questions = new List<SurveyQuestion>()
        };
        _context.EventFeedbackSurveys.Add(survey);

        var existingFeedback = new EventFeedbackResponse
        {
            SurveyId = 1,
            MemberId = 100,
            SubmittedAt = DateTime.UtcNow.AddDays(-1)
        };
        _context.EventFeedbackResponses.Add(existingFeedback);
        await _context.SaveChangesAsync();

        var request = new SubmitFeedbackRequest
        {
            SurveyId = 1,
            MemberId = 100,
            Responses = new List<Application.DTOs.SurveyResponse>()
        };

        // Act
        var result = await _service.SubmitFeedbackAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Contain("already submitted");
    }

    [Test]
    public async Task SubmitFeedbackAsync_WithEventId_SubmitsFeedbackSuccessfully()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Test Survey",
            IsActive = true,
            Questions = new List<SurveyQuestion>
            {
                new() { Id = 1, Text = "Rate us", Type = QuestionType.Rating }
            }
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        var request = new SubmitFeedbackRequest
        {
            SurveyId = 1,
            MemberId = 100,
            Responses = new List<Application.DTOs.SurveyResponse>
            {
                new() { QuestionId = 1, Answer = "5" }
            }
        };

        // Act
        var result = await _service.SubmitFeedbackAsync(1, request);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.SurveyId.Should().Be(1);
        result.MemberId.Should().Be(100);
    }

    [Test]
    public async Task SubmitFeedbackAsync_WithEventId_SurveyNotActive_ThrowsArgumentException()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Inactive Survey",
            IsActive = false,
            Questions = new List<SurveyQuestion>()
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        var request = new SubmitFeedbackRequest
        {
            SurveyId = 1,
            MemberId = 100,
            Responses = new List<Application.DTOs.SurveyResponse>()
        };

        // Act & Assert
        var act = () => _service.SubmitFeedbackAsync(1, request);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Survey not found or is not active*");
    }

    [Test]
    public async Task SubmitFeedbackAsync_WithEventId_DuplicateSubmission_ThrowsArgumentException()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Test Survey",
            IsActive = true,
            Questions = new List<SurveyQuestion>()
        };
        _context.EventFeedbackSurveys.Add(survey);

        var existingFeedback = new EventFeedbackResponse
        {
            SurveyId = 1,
            MemberId = 100,
            SubmittedAt = DateTime.UtcNow.AddDays(-1)
        };
        _context.EventFeedbackResponses.Add(existingFeedback);
        await _context.SaveChangesAsync();

        var request = new SubmitFeedbackRequest
        {
            SurveyId = 1,
            MemberId = 100,
            Responses = new List<Application.DTOs.SurveyResponse>()
        };

        // Act & Assert
        var act = () => _service.SubmitFeedbackAsync(1, request);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*already submitted*");
    }

    #endregion

    #region GetFeedbackResponseAsync Tests

    [Test]
    public async Task GetFeedbackResponseAsync_ResponseExists_ReturnsFeedbackDetails()
    {
        // Arrange
        var feedbackResponse = new EventFeedbackResponse
        {
            Id = 1,
            SurveyId = 1,
            MemberId = 100,
            SubmittedAt = DateTime.UtcNow,
            Responses = new List<Domain.Entities.SurveyResponse>
            {
                new() { QuestionId = 1, Answer = "5" },
                new() { QuestionId = 2, Answer = "Excellent!" }
            }
        };
        _context.EventFeedbackResponses.Add(feedbackResponse);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetFeedbackResponseAsync(1);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(1);
        result.SurveyId.Should().Be(1);
        result.MemberId.Should().Be(100);
        result.Responses.Should().HaveCount(2);
        result.Responses[0].QuestionId.Should().Be(1);
        result.Responses[0].Answer.Should().Be("5");
    }

    [Test]
    public async Task GetFeedbackResponseAsync_ResponseNotFound_ReturnsNull()
    {
        // Act
        var result = await _service.GetFeedbackResponseAsync(999);

        // Assert
        result.Should().BeNull();
    }

    [Test]
    public async Task GetFeedbackResponseAsync_ResponseWithNullMemberId_ReturnsZeroMemberId()
    {
        // Arrange
        var feedbackResponse = new EventFeedbackResponse
        {
            Id = 1,
            SurveyId = 1,
            MemberId = null, // Anonymous response
            SubmittedAt = DateTime.UtcNow,
            Responses = new List<Domain.Entities.SurveyResponse>()
        };
        _context.EventFeedbackResponses.Add(feedbackResponse);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetFeedbackResponseAsync(1);

        // Assert
        result.Should().NotBeNull();
        result!.MemberId.Should().Be(0);
    }

    #endregion

    #region GetFeedbackAnalyticsAsync - Legacy Path Tests

    [Test]
    public async Task GetFeedbackAnalyticsAsync_LegacyPath_ReturnsAnalytics()
    {
        // Arrange
        var survey1 = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Survey 1",
            Responses = new List<EventFeedbackResponse>
            {
                new() { Id = 1, SurveyId = 1, MemberId = 1, SubmittedAt = DateTime.UtcNow },
                new() { Id = 2, SurveyId = 1, MemberId = 2, SubmittedAt = DateTime.UtcNow }
            }
        };
        var survey2 = new EventFeedbackSurvey
        {
            Id = 2,
            EventId = 1,
            Title = "Survey 2",
            Responses = new List<EventFeedbackResponse>
            {
                new() { Id = 3, SurveyId = 2, MemberId = 3, SubmittedAt = DateTime.UtcNow }
            }
        };
        _context.EventFeedbackSurveys.AddRange(survey1, survey2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetFeedbackAnalyticsAsync(1);

        // Assert
        result.Should().NotBeNull();
        result.EventId.Should().Be(1);
        result.TotalSurveys.Should().Be(2);
        result.TotalResponses.Should().Be(3);
        result.AverageRating.Should().Be(4.2); // Placeholder value from service
        result.CompletionRate.Should().Be(85.0); // Placeholder value from service
        result.CommonThemes.Should().Contain("Great event");
    }

    [Test]
    public async Task GetFeedbackAnalyticsAsync_NoSurveys_ReturnsZeroTotals()
    {
        // Act
        var result = await _service.GetFeedbackAnalyticsAsync(999);

        // Assert
        result.Should().NotBeNull();
        result.EventId.Should().Be(999);
        result.TotalSurveys.Should().Be(0);
        result.TotalResponses.Should().Be(0);
    }

    #endregion

    #region GetFeedbackAnalyticsResponseAsync Tests

    [Test]
    public async Task GetFeedbackAnalyticsResponseAsync_ReturnsAnalyticsResponse()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Survey",
            IsActive = false,
            UpdatedAt = DateTime.UtcNow.AddDays(-1),
            Responses = new List<EventFeedbackResponse>
            {
                new() { Id = 1, SurveyId = 1, MemberId = 1 }
            }
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetFeedbackAnalyticsResponseAsync(1);

        // Assert
        result.Should().NotBeNull();
        result.EventId.Should().Be(1);
        result.TotalSurveys.Should().Be(1);
        result.TotalResponses.Should().Be(1);
        result.CompletionDate.Should().NotBeNull();
        result.QuestionAnalytics.Should().NotBeNull();
        result.SentimentAnalysis.Should().NotBeNull();
    }

    [Test]
    public async Task GetFeedbackAnalyticsResponseAsync_AllActiveSurveys_ReturnsNullCompletionDate()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Survey",
            IsActive = true, // Active survey
            Responses = new List<EventFeedbackResponse>()
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetFeedbackAnalyticsResponseAsync(1);

        // Assert
        result.CompletionDate.Should().BeNull();
    }

    #endregion

    #region SendFeedbackRemindersAsync - Legacy Path Tests

    [Test]
    public async Task SendFeedbackRemindersAsync_LegacyPath_SendsRemindersToNonResponders()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        _context.Clubs.Add(club);

        var eventEntity = new Event
        {
            Id = 1,
            Title = "Test Event",
            ClubId = 1,
            Club = club,
            EventRsvps = new List<EventRsvp>
            {
                new() { Id = 1, EventId = 1, MemberId = 1, RsvpStatus = "Yes", Member = new Member { Id = 1, ClubId = 1, MembershipTypeId = 1 } },
                new() { Id = 2, EventId = 1, MemberId = 2, RsvpStatus = "Yes", Member = new Member { Id = 2, ClubId = 1, MembershipTypeId = 1 } },
                new() { Id = 3, EventId = 1, MemberId = 3, RsvpStatus = "No", Member = new Member { Id = 3, ClubId = 1, MembershipTypeId = 1 } }
            }
        };
        _context.Events.Add(eventEntity);

        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Feedback Survey",
            IsActive = true,
            Event = eventEntity
        };
        _context.EventFeedbackSurveys.Add(survey);

        // Member 1 has already responded
        var existingResponse = new EventFeedbackResponse
        {
            SurveyId = 1,
            MemberId = 1,
            SubmittedAt = DateTime.UtcNow.AddDays(-1)
        };
        _context.EventFeedbackResponses.Add(existingResponse);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.SendFeedbackRemindersAsync(1);

        // Assert
        result.Should().NotBeNull();
        result.SurveyId.Should().Be(1);
        result.RemindersSent.Should().Be(1); // Member 2 (who RSVP'd yes but didn't respond)
        result.NonResponders.Should().Contain(2);
        result.NonResponders.Should().NotContain(1); // Already responded
        result.NonResponders.Should().NotContain(3); // RSVP was "No"
    }

    [Test]
    public async Task SendFeedbackRemindersAsync_LegacyPath_SurveyNotFound_ThrowsArgumentException()
    {
        // Act & Assert
        var act = () => _service.SendFeedbackRemindersAsync(999);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Survey not found or is not active*");
    }

    [Test]
    public async Task SendFeedbackRemindersAsync_LegacyPath_InactiveSurvey_ThrowsArgumentException()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Inactive Survey",
            IsActive = false
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Act & Assert
        var act = () => _service.SendFeedbackRemindersAsync(1);
        await act.Should().ThrowAsync<ArgumentException>();
    }

    #endregion

    #region CloseFeedbackSurveyAsync - Legacy Path Tests

    [Test]
    public async Task CloseFeedbackSurveyAsync_LegacyPath_ClosesSurveySuccessfully()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Test Survey",
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-7)
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Act
        await _service.CloseFeedbackSurveyAsync(1);

        // Assert
        var closedSurvey = await _context.EventFeedbackSurveys.FindAsync(1);
        closedSurvey.Should().NotBeNull();
        closedSurvey!.IsActive.Should().BeFalse();
        closedSurvey.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Test]
    public async Task CloseFeedbackSurveyAsync_LegacyPath_SurveyNotFound_ThrowsArgumentException()
    {
        // Act & Assert
        var act = () => _service.CloseFeedbackSurveyAsync(999);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Survey not found*");
    }

    #endregion

    #region ExportFeedbackDataAsync - Legacy Path Tests

    [Test]
    public async Task ExportFeedbackDataAsync_LegacyPath_ExportsAsJson()
    {
        // Arrange - avoid circular references by not setting Survey navigation property on responses
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Survey"
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Add response separately to avoid circular reference in serialization
        var response = new EventFeedbackResponse
        {
            SurveyId = 1,
            MemberId = 1,
            SubmittedAt = DateTime.UtcNow,
            Responses = new List<Domain.Entities.SurveyResponse>
            {
                new() { QuestionId = 1, Answer = "Great!" }
            }
        };
        _context.EventFeedbackResponses.Add(response);
        await _context.SaveChangesAsync();

        var request = new ExportFeedbackDataRequest
        {
            EventId = 1,
            Format = ExportFormat.JSON,
            IncludeRawResponses = true,
            IncludeAnalytics = false
        };

        // Act
        var result = await _service.ExportFeedbackDataAsync(1, request);

        // Assert
        result.Should().NotBeNull();
        result.EventId.Should().Be(1);
        result.ExportFormat.Should().Be(ExportFormat.JSON);
        result.TotalRecords.Should().Be(1);
        result.Data.Should().NotBeNullOrEmpty();
        result.ExportedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Test]
    public async Task ExportFeedbackDataAsync_LegacyPath_ExportsAsCsv()
    {
        // Arrange - avoid circular references by adding survey and responses separately
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Survey"
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Add responses separately to avoid circular reference
        _context.EventFeedbackResponses.AddRange(
            new EventFeedbackResponse { Id = 1, SurveyId = 1, MemberId = 1, SubmittedAt = DateTime.UtcNow },
            new EventFeedbackResponse { Id = 2, SurveyId = 1, MemberId = 2, SubmittedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var request = new ExportFeedbackDataRequest
        {
            EventId = 1,
            Format = ExportFormat.CSV
        };

        // Act
        var result = await _service.ExportFeedbackDataAsync(1, request);

        // Assert
        result.Should().NotBeNull();
        result.ExportFormat.Should().Be(ExportFormat.CSV);
        result.TotalRecords.Should().Be(2);
        result.Data.Should().Contain("Id,SurveyId,MemberId,SubmittedAt");
    }

    [Test]
    public async Task ExportFeedbackDataAsync_NoFeedbacks_ReturnsEmptyData()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Survey",
            Responses = new List<EventFeedbackResponse>()
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        var request = new ExportFeedbackDataRequest
        {
            EventId = 1,
            Format = ExportFormat.CSV
        };

        // Act
        var result = await _service.ExportFeedbackDataAsync(1, request);

        // Assert
        result.TotalRecords.Should().Be(0);
    }

    [Test]
    public async Task ExportFeedbackDataAsync_UnknownFormat_DefaultsToJson()
    {
        // Arrange - avoid circular references by adding survey and response separately
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Survey"
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Add response separately to avoid circular reference in JSON serialization
        _context.EventFeedbackResponses.Add(
            new EventFeedbackResponse { Id = 1, SurveyId = 1, MemberId = 1, SubmittedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var request = new ExportFeedbackDataRequest
        {
            EventId = 1,
            Format = (ExportFormat)999 // Unknown format
        };

        // Act
        var result = await _service.ExportFeedbackDataAsync(1, request);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().StartWith("["); // JSON array
    }

    #endregion

    #region GetEventFeedbackSurveysAsync Tests

    [Test]
    public async Task GetEventFeedbackSurveysAsync_ReturnsSurveysForEvent()
    {
        // Arrange
        var surveys = new[]
        {
            new EventFeedbackSurvey
            {
                Id = 1,
                EventId = 1,
                Title = "Survey 1",
                Description = "First survey",
                IsAnonymous = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                Questions = new List<SurveyQuestion>
                {
                    new() { Id = 1, Text = "Q1", Type = QuestionType.Rating }
                }
            },
            new EventFeedbackSurvey
            {
                Id = 2,
                EventId = 1,
                Title = "Survey 2",
                IsActive = false,
                Questions = new List<SurveyQuestion>()
            },
            new EventFeedbackSurvey
            {
                Id = 3,
                EventId = 2, // Different event
                Title = "Survey 3",
                Questions = new List<SurveyQuestion>()
            }
        };
        _context.EventFeedbackSurveys.AddRange(surveys);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventFeedbackSurveysAsync(1);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(s => s.Title == "Survey 1");
        result.Should().Contain(s => s.Title == "Survey 2");
        result.Should().NotContain(s => s.Title == "Survey 3");
        result.First(s => s.Title == "Survey 1").Questions.Should().HaveCount(1);
    }

    [Test]
    public async Task GetEventFeedbackSurveysAsync_NoSurveys_ReturnsEmptyList()
    {
        // Act
        var result = await _service.GetEventFeedbackSurveysAsync(999);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region GetEventFeedbackResponsesAsync Tests

    [Test]
    public async Task GetEventFeedbackResponsesAsync_ReturnsResponsesForEvent()
    {
        // Arrange
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Survey"
        };
        _context.EventFeedbackSurveys.Add(survey);

        var responses = new[]
        {
            new EventFeedbackResponse
            {
                Id = 1,
                SurveyId = 1,
                Survey = survey,
                MemberId = 1,
                SubmittedAt = DateTime.UtcNow,
                Responses = new List<Domain.Entities.SurveyResponse>
                {
                    new() { QuestionId = 1, Answer = "5" }
                }
            },
            new EventFeedbackResponse
            {
                Id = 2,
                SurveyId = 1,
                Survey = survey,
                MemberId = 2,
                SubmittedAt = DateTime.UtcNow,
                Responses = new List<Domain.Entities.SurveyResponse>()
            }
        };
        _context.EventFeedbackResponses.AddRange(responses);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventFeedbackResponsesAsync(1);

        // Assert
        result.Should().HaveCount(2);
        result[0].SurveyId.Should().Be(1);
        result[0].MemberId.Should().Be(1);
        result[0].Responses.Should().HaveCount(1);
    }

    [Test]
    public async Task GetEventFeedbackResponsesAsync_WithSurveyIdFilter_FiltersCorrectly()
    {
        // Arrange
        var survey1 = new EventFeedbackSurvey { Id = 1, EventId = 1, Title = "Survey 1" };
        var survey2 = new EventFeedbackSurvey { Id = 2, EventId = 1, Title = "Survey 2" };
        _context.EventFeedbackSurveys.AddRange(survey1, survey2);

        var responses = new[]
        {
            new EventFeedbackResponse { Id = 1, SurveyId = 1, Survey = survey1, MemberId = 1, SubmittedAt = DateTime.UtcNow },
            new EventFeedbackResponse { Id = 2, SurveyId = 1, Survey = survey1, MemberId = 2, SubmittedAt = DateTime.UtcNow },
            new EventFeedbackResponse { Id = 3, SurveyId = 2, Survey = survey2, MemberId = 3, SubmittedAt = DateTime.UtcNow }
        };
        _context.EventFeedbackResponses.AddRange(responses);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventFeedbackResponsesAsync(1, surveyId: 1);

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(r => r.SurveyId == 1);
    }

    [Test]
    public async Task GetEventFeedbackResponsesAsync_NoResponses_ReturnsEmptyList()
    {
        // Arrange
        var survey = new EventFeedbackSurvey { Id = 1, EventId = 1, Title = "Survey" };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventFeedbackResponsesAsync(1);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region GetEventFeedbackSummaryAsync - Legacy Path Tests

    [Test]
    public async Task GetEventFeedbackSummaryAsync_LegacyPath_ReturnsSummary()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        _context.Clubs.Add(club);

        var eventEntity = new Event
        {
            Id = 1,
            Title = "Test Event",
            ClubId = 1,
            Club = club
        };
        _context.Events.Add(eventEntity);

        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Survey"
        };
        _context.EventFeedbackSurveys.Add(survey);

        var responses = new[]
        {
            new EventFeedbackResponse { Id = 1, SurveyId = 1, Survey = survey, MemberId = 1, SubmittedAt = DateTime.UtcNow },
            new EventFeedbackResponse { Id = 2, SurveyId = 1, Survey = survey, MemberId = 2, SubmittedAt = DateTime.UtcNow }
        };
        _context.EventFeedbackResponses.AddRange(responses);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventFeedbackSummaryAsync(1);

        // Assert
        result.Should().NotBeNull();
        result.EventId.Should().Be(1);
        result.EventTitle.Should().Be("Test Event");
        result.TotalResponses.Should().Be(2);
        result.AverageRating.Should().Be(4.2); // Placeholder value
        result.TopInsights.Should().NotBeEmpty();
        result.QuestionAverages.Should().ContainKey("Overall Satisfaction");
    }

    [Test]
    public async Task GetEventFeedbackSummaryAsync_LegacyPath_EventNotFound_ThrowsArgumentException()
    {
        // Act & Assert
        var act = () => _service.GetEventFeedbackSummaryAsync(999);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Event with ID 999 not found*");
    }

    [Test]
    public async Task GetEventFeedbackSummaryAsync_NoResponses_ReturnsZeroRating()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        _context.Clubs.Add(club);

        var eventEntity = new Event { Id = 1, Title = "Test Event", ClubId = 1, Club = club };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventFeedbackSummaryAsync(1);

        // Assert
        result.TotalResponses.Should().Be(0);
        result.AverageRating.Should().Be(0);
    }

    #endregion

    #region ResponseRate Calculation Tests

    [Test]
    public async Task ResponseRate_CalculatesCorrectly()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        _context.Clubs.Add(club);

        var eventEntity = new Event { Id = 1, Title = "Test Event", ClubId = 1, Club = club };
        _context.Events.Add(eventEntity);

        // 10 attendees (RSVP = Yes)
        for (int i = 1; i <= 10; i++)
        {
            _context.EventRsvps.Add(new EventRsvp { EventId = 1, MemberId = i, RsvpStatus = "Yes" });
        }

        // 5 responses
        var survey = new EventFeedbackSurvey { Id = 1, EventId = 1, Title = "Survey", Responses = new List<EventFeedbackResponse>() };
        for (int i = 1; i <= 5; i++)
        {
            survey.Responses.Add(new EventFeedbackResponse { SurveyId = 1, MemberId = i, SubmittedAt = DateTime.UtcNow });
        }
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Act
        var analytics = await _service.GetFeedbackAnalyticsAsync(1);

        // Assert
        analytics.ResponseRate.Should().Be(50.0); // 5/10 * 100 = 50%
    }

    [Test]
    public async Task ResponseRate_NoAttendees_ReturnsZero()
    {
        // Arrange - event with no RSVPs
        var survey = new EventFeedbackSurvey
        {
            Id = 1,
            EventId = 1,
            Title = "Survey",
            Responses = new List<EventFeedbackResponse>()
        };
        _context.EventFeedbackSurveys.Add(survey);
        await _context.SaveChangesAsync();

        // Act
        var analytics = await _service.GetFeedbackAnalyticsAsync(1);

        // Assert
        analytics.ResponseRate.Should().Be(0);
    }

    #endregion
}
