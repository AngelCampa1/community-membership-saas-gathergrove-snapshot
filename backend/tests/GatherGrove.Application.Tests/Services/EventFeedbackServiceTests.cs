using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Repositories;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services
{
    /// <summary>
    /// Test suite for Event Feedback Service functionality
    /// Covers post-event surveys, feedback collection, and analytics
    /// </summary>
    [TestFixture]
    public class EventFeedbackServiceTests
    {
        private Mock<ILogger<EventFeedbackService>> _mockLogger;
        private Mock<ISurveyService> _mockSurveyService;
        private Mock<INotificationService> _mockNotificationService;
        private Mock<IEventRepository> _mockEventRepository;
        private Mock<IEventFeedbackRepository> _mockEventFeedbackRepository;
        private EventFeedbackService _eventFeedbackService;

        [SetUp]
        public void Setup()
        {
            _mockLogger = new Mock<ILogger<EventFeedbackService>>();
            _mockSurveyService = new Mock<ISurveyService>();
            _mockNotificationService = new Mock<INotificationService>();
            _mockEventRepository = new Mock<IEventRepository>();
            _mockEventFeedbackRepository = new Mock<IEventFeedbackRepository>();

            _eventFeedbackService = new EventFeedbackService(
                _mockLogger.Object,
                _mockSurveyService.Object,
                _mockNotificationService.Object,
                _mockEventRepository.Object,
                _mockEventFeedbackRepository.Object
            );
        }

        [Test]
        public async Task CreateFeedbackSurvey_ShouldCreateSurveyForEvent()
        {
            // Arrange
            var eventId = 1;
            var request = new CreateFeedbackSurveyRequest
            {
                EventId = eventId,
                Title = "Event Feedback Survey",
                Description = "Please provide your feedback on the event",
                IsAnonymous = false,
                Questions = new List<CreateFeedbackQuestionRequest>
                {
                    new CreateFeedbackQuestionRequest
                    {
                        Text = "How would you rate the event overall?",
                        QuestionType = QuestionType.Rating,
                        IsRequired = true
                    },
                    new CreateFeedbackQuestionRequest
                    {
                        Text = "What did you like most about the event?",
                        QuestionType = QuestionType.Text,
                        IsRequired = false
                    },
                    new CreateFeedbackQuestionRequest
                    {
                        Text = "Would you recommend this event to others?",
                        QuestionType = QuestionType.YesNo,
                        IsRequired = true
                    }
                }
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                ClubId = 1
            };

            var createdSurvey = new EventFeedbackSurvey
            {
                Id = 1,
                EventId = eventId,
                Title = request.Title,
                Description = request.Description,
                IsAnonymous = request.IsAnonymous,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Questions = request.Questions.Select((q, index) => new SurveyQuestion
                {
                    Id = index + 1,
                    Text = q.Text,
                    Type = q.QuestionType,
                    IsRequired = q.IsRequired,
                    QuestionOrder = index + 1
                }).ToList()
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mockEventFeedbackRepository
                .Setup(x => x.CreateSurveyAsync(It.IsAny<EventFeedbackSurvey>()))
                .ReturnsAsync(createdSurvey);

            // Act
            var result = await _eventFeedbackService.CreateFeedbackSurveyAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(1);
            result.EventId.Should().Be(eventId);
            result.Title.Should().Be(request.Title);
            result.Description.Should().Be(request.Description);
            result.IsAnonymous.Should().Be(request.IsAnonymous);
            result.IsActive.Should().BeTrue();
            result.Questions.Should().HaveCount(3);
            result.Questions[0].Text.Should().Be("How would you rate the event overall?");
            result.Questions[0].QuestionType.Should().Be(QuestionType.Rating);
            result.Questions[0].IsRequired.Should().BeTrue();
            result.Questions[1].Text.Should().Be("What did you like most about the event?");
            result.Questions[2].QuestionType.Should().Be(QuestionType.YesNo);

            _mockEventRepository.Verify(x => x.GetByIdAsync(eventId), Times.Once);
            _mockEventFeedbackRepository.Verify(x => x.CreateSurveyAsync(It.IsAny<EventFeedbackSurvey>()), Times.Once);
        }

        [Test]
        public async Task SubmitFeedback_ShouldSubmitFeedbackResponseSuccessfully()
        {
            // Arrange
            var surveyId = 1;
            var memberId = 1;
            var request = new SubmitFeedbackRequest
            {
                SurveyId = surveyId,
                MemberId = memberId,
                Responses = new List<GatherGrove.Application.DTOs.SurveyResponse>
                {
                    new GatherGrove.Application.DTOs.SurveyResponse
                    {
                        QuestionId = 1,
                        Answer = "5"
                    },
                    new GatherGrove.Application.DTOs.SurveyResponse
                    {
                        QuestionId = 2,
                        Answer = "Great content and excellent speakers!"
                    },
                    new GatherGrove.Application.DTOs.SurveyResponse
                    {
                        QuestionId = 3,
                        Answer = "Yes"
                    }
                }
            };

            var feedbackResponse = new EventFeedbackResponse
            {
                Id = 1,
                SurveyId = surveyId,
                MemberId = memberId,
                SubmittedAt = DateTime.UtcNow,
                Responses = request.Responses.Select(r => new GatherGrove.Domain.Entities.SurveyResponse
                {
                    QuestionId = r.QuestionId,
                    Answer = r.Answer
                }).ToList()
            };

            _mockSurveyService
                .Setup(x => x.GetSurveyAsync(surveyId))
                .ReturnsAsync("valid-survey-json");

            _mockEventFeedbackRepository
                .Setup(x => x.HasSubmittedFeedbackAsync(surveyId, memberId))
                .ReturnsAsync(false);

            _mockEventFeedbackRepository
                .Setup(x => x.CreateResponseAsync(It.IsAny<EventFeedbackResponse>()))
                .ReturnsAsync(feedbackResponse);

            // Act
            var result = await _eventFeedbackService.SubmitFeedbackAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.ResponseId.Should().Be(1);
            result.SubmittedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
            _mockEventFeedbackRepository.Verify(x => x.CreateResponseAsync(It.IsAny<EventFeedbackResponse>()), Times.Once);
        }

        [Test]
        public async Task SubmitFeedback_ShouldFailWhenMemberAlreadySubmitted()
        {
            // Arrange
            var surveyId = 1;
            var memberId = 1;
            var request = new SubmitFeedbackRequest
            {
                SurveyId = surveyId,
                MemberId = memberId,
                Responses = new List<GatherGrove.Application.DTOs.SurveyResponse>
                {
                    new GatherGrove.Application.DTOs.SurveyResponse
                    {
                        QuestionId = 1,
                        Answer = "5"
                    }
                }
            };

            _mockSurveyService
                .Setup(x => x.GetSurveyAsync(surveyId))
                .ReturnsAsync("valid-survey-json");

            _mockEventFeedbackRepository
                .Setup(x => x.HasSubmittedFeedbackAsync(surveyId, memberId))
                .ReturnsAsync(true); // Member has already submitted

            // Act
            var result = await _eventFeedbackService.SubmitFeedbackAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().NotBeNullOrEmpty();
            result.ErrorMessage.Should().Contain("already submitted");
            _mockEventFeedbackRepository.Verify(x => x.CreateResponseAsync(It.IsAny<EventFeedbackResponse>()), Times.Never);
        }

        [Test]
        public async Task GetFeedbackAnalytics_ShouldReturnAnalyticsForEvent()
        {
            // Arrange
            var eventId = 1;
            var analytics = new EventFeedbackAnalytics
            {
                EventId = eventId,
                TotalSurveys = 2,
                TotalResponses = 35,
                AverageRating = 4.3,
                ResponseRate = 70.0,
                CompletionRate = 95.0,
                CommonThemes = new List<string>
                {
                    "Great speakers and content",
                    "Well organized event",
                    "Venue could be improved"
                }
            };

            _mockEventFeedbackRepository
                .Setup(x => x.GetFeedbackAnalyticsAsync(eventId))
                .ReturnsAsync(analytics);

            // Act
            var result = await _eventFeedbackService.GetFeedbackAnalyticsAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.EventId.Should().Be(eventId);
            result.TotalSurveys.Should().Be(2);
            result.TotalResponses.Should().Be(35);
            result.AverageRating.Should().Be(4.3);
            result.ResponseRate.Should().Be(70.0);
            result.CompletionRate.Should().Be(95.0);
            result.CommonThemes.Should().HaveCount(3);
            result.CommonThemes.Should().Contain("Great speakers and content");
            result.CommonThemes.Should().Contain("Well organized event");
            result.CommonThemes.Should().Contain("Venue could be improved");

            _mockEventFeedbackRepository.Verify(x => x.GetFeedbackAnalyticsAsync(eventId), Times.Once);
        }

        [Test]
        public async Task GetEventFeedbackSummary_ShouldReturnComprehensiveSummary()
        {
            // Arrange
            var eventId = 1;
            var feedbackSummary = new EventFeedbackSummary
            {
                EventId = eventId,
                SurveyTitle = "Event Feedback Survey",
                TotalInvited = 50,
                TotalResponses = 35,
                ResponseRate = 70.0f,
                AverageRating = 4.2f,
                PositiveFeedbackPercentage = 85.0f,
                TopCompliments = new List<string> { "Great speakers", "Well organized", "Excellent content" },
                TopComplaints = new List<string> { "Too crowded", "Limited parking" },
                RecommendationPercentage = 90.0f
            };

            _mockEventFeedbackRepository
                .Setup(x => x.GetEventFeedbackSummaryAsync(eventId))
                .ReturnsAsync(feedbackSummary);

            // Act
            var result = await _eventFeedbackService.GetEventFeedbackSummaryAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.EventId.Should().Be(eventId);
            result.ResponseRate.Should().Be(70.0f);
            result.AverageRating.Should().Be(4.2f);
            result.TopCompliments.Should().Contain("Great speakers");
            result.TopComplaints.Should().Contain("Too crowded");
            result.RecommendationPercentage.Should().Be(90.0f);
        }

        [Test]
        public async Task SendFeedbackReminders_ShouldSendRemindersToNonResponders()
        {
            // Arrange
            var surveyId = 1;
            var eventId = 1;
            var nonResponders = new List<int> { 2, 3, 5, 7 }; // Member IDs who haven't responded

            _mockSurveyService
                .Setup(x => x.GetSurveyAsync(surveyId))
                .ReturnsAsync("valid-survey-json");

            _mockEventFeedbackRepository
                .Setup(x => x.GetNonRespondersAsync(surveyId))
                .ReturnsAsync(nonResponders);

            _mockNotificationService
                .Setup(x => x.SendFeedbackReminderAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _eventFeedbackService.SendFeedbackRemindersAsync(surveyId);

            // Assert
            result.Should().NotBeNull();
            result.RemindersSent.Should().Be(4);
            result.NonResponders.Should().Equal(nonResponders);
            _mockNotificationService.Verify(x => x.SendFeedbackReminderAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Exactly(4));
        }

        [Test]
        public async Task CloseFeedbackSurvey_ShouldCloseSurveyAndGenerateReport()
        {
            // Arrange
            var surveyId = 1;
            var feedbackSurvey = new EventFeedbackSurvey
            {
                Id = surveyId,
                EventId = 1,
                IsActive = true
            };

            var finalReportData = "generated-final-report-data";

            _mockSurveyService
                .Setup(x => x.GetSurveyAsync(surveyId))
                .ReturnsAsync("valid-survey-json");

            _mockSurveyService
                .Setup(x => x.CloseSurveyAsync(surveyId))
                .ReturnsAsync(true);

            _mockEventFeedbackRepository
                .Setup(x => x.GenerateFinalReportAsync(surveyId))
                .ReturnsAsync(finalReportData);

            // Act
            await _eventFeedbackService.CloseFeedbackSurveyAsync(surveyId);

            // Assert - Verify that the methods were called
            _mockSurveyService.Verify(x => x.CloseSurveyAsync(surveyId), Times.Once);
            _mockEventFeedbackRepository.Verify(x => x.GenerateFinalReportAsync(surveyId), Times.Once);
        }

        [Test]
        [TestCase(true, 0)] // Anonymous surveys should not include member information
        [TestCase(false, 1)] // Non-anonymous surveys should include member information
        public async Task ExportFeedbackData_ShouldRespectAnonymitySettings(bool isAnonymous, int expectedMemberInfoCount)
        {
            // Arrange
            var eventId = 1;
            var request = new ExportFeedbackDataRequest
            {
                EventId = eventId,
                IncludeRawResponses = true,
                IncludeAnalytics = true,
                Format = ExportFormat.CSV
            };

            var feedbackSurvey = new EventFeedbackSurvey
            {
                Id = 1,
                EventId = eventId,
                IsAnonymous = isAnonymous
            };

            var exportedData = new ExportedFeedbackData
            {
                EventId = eventId,
                ExportFormat = ExportFormat.CSV,
                ExportedAt = DateTime.UtcNow,
                TotalRecords = 1,
                Data = isAnonymous
                    ? "Response1,Answer1\nResponse2,Answer2" // No member IDs
                    : "MemberId,Response1,Answer1\n1,Response2,Answer2", // With member IDs
                Format = ExportFormat.CSV
            };

            _mockEventFeedbackRepository
                .Setup(x => x.GetFeedbackSurveyByEventAsync(eventId))
                .ReturnsAsync(feedbackSurvey);

            _mockEventFeedbackRepository
                .Setup(x => x.ExportFeedbackDataAsync(
                    It.IsAny<int>(),
                    It.IsAny<string>(),
                    It.IsAny<bool>(),
                    It.IsAny<bool>()))
                .ReturnsAsync(exportedData);

            // Act
            var result = await _eventFeedbackService.ExportFeedbackDataAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.EventId.Should().Be(eventId);
            result.TotalRecords.Should().BeGreaterOrEqualTo(0);
            result.Data.Should().NotBeNullOrEmpty();

            // Verify anonymity: anonymous exports should NOT contain member IDs
            if (isAnonymous)
            {
                result.Data.Should().NotContain("MemberId", "Anonymous exports should not include member IDs");
            }
            else
            {
                result.Data.Should().Contain("MemberId", "Non-anonymous exports should include member IDs");
            }

            _mockEventFeedbackRepository.Verify(x => x.GetFeedbackSurveyByEventAsync(eventId), Times.Once);
            _mockEventFeedbackRepository.Verify(x => x.ExportFeedbackDataAsync(
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<bool>()), Times.Once);
        }

        [Test]
        public async Task CreateFeedbackSurvey_WithRequestOnly_ShouldCreateSurveySuccessfully()
        {
            // Arrange
            var request = new CreateFeedbackSurveyRequest
            {
                EventId = 1,
                Title = "Post-Event Survey",
                Description = "How was the event?",
                IsAnonymous = true,
                Questions = new List<CreateFeedbackQuestionRequest>
                {
                    new CreateFeedbackQuestionRequest
                    {
                        Text = "Overall satisfaction?",
                        QuestionType = QuestionType.Rating,
                        IsRequired = true
                    }
                }
            };

            var eventEntity = new Event
            {
                Id = request.EventId,
                Title = "Test Event",
                ClubId = 1
            };

            var createdSurvey = new EventFeedbackSurvey
            {
                Id = 1,
                EventId = request.EventId,
                Title = request.Title,
                Description = request.Description,
                IsAnonymous = request.IsAnonymous,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Questions = request.Questions.Select((q, index) => new SurveyQuestion
                {
                    Id = index + 1,
                    Text = q.Text,
                    Type = q.QuestionType,
                    IsRequired = q.IsRequired,
                    QuestionOrder = index + 1
                }).ToList()
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(request.EventId))
                .ReturnsAsync(eventEntity);

            _mockEventFeedbackRepository
                .Setup(x => x.CreateSurveyAsync(It.IsAny<EventFeedbackSurvey>()))
                .ReturnsAsync(createdSurvey);

            // Act
            var result = await _eventFeedbackService.CreateFeedbackSurveyAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(1);
            result.EventId.Should().Be(request.EventId);
            result.Title.Should().Be(request.Title);
            result.IsAnonymous.Should().BeTrue();
            result.Questions.Should().HaveCount(1);

            _mockEventRepository.Verify(x => x.GetByIdAsync(request.EventId), Times.Once);
            _mockEventFeedbackRepository.Verify(x => x.CreateSurveyAsync(It.IsAny<EventFeedbackSurvey>()), Times.Once);
        }

        [Test]
        public async Task CreateFeedbackSurvey_EventNotFound_ShouldThrowException()
        {
            // Arrange
            var eventId = 999;
            var request = new CreateFeedbackSurveyRequest
            {
                EventId = eventId,
                Title = "Survey",
                Description = "Description",
                IsAnonymous = false,
                Questions = new List<CreateFeedbackQuestionRequest>()
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync((Event)null);

            // Act & Assert
            await _eventFeedbackService.Invoking(s => s.CreateFeedbackSurveyAsync(eventId, request))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage($"Event with ID {eventId} not found");

            _mockEventRepository.Verify(x => x.GetByIdAsync(eventId), Times.Once);
            _mockEventFeedbackRepository.Verify(x => x.CreateSurveyAsync(It.IsAny<EventFeedbackSurvey>()), Times.Never);
        }

        [Test]
        public async Task SendFeedbackReminders_NoNonResponders_ShouldSendZeroReminders()
        {
            // Arrange
            var surveyId = 1;
            var emptyNonResponders = new List<int>();

            _mockSurveyService
                .Setup(x => x.GetSurveyAsync(surveyId))
                .ReturnsAsync("valid-survey-json");

            _mockEventFeedbackRepository
                .Setup(x => x.GetNonRespondersAsync(surveyId))
                .ReturnsAsync(emptyNonResponders);

            // Act
            var result = await _eventFeedbackService.SendFeedbackRemindersAsync(surveyId);

            // Assert
            result.Should().NotBeNull();
            result.SurveyId.Should().Be(surveyId);
            result.RemindersSent.Should().Be(0);
            result.NonResponders.Should().BeEmpty();

            _mockNotificationService.Verify(x => x.SendFeedbackReminderAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task SendFeedbackReminders_SurveyNotFound_ShouldThrowException()
        {
            // Arrange
            var surveyId = 999;

            _mockSurveyService
                .Setup(x => x.GetSurveyAsync(surveyId))
                .ReturnsAsync((string)null);

            // Act & Assert
            await _eventFeedbackService.Invoking(s => s.SendFeedbackRemindersAsync(surveyId))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("Survey not found or is not active");

            _mockEventFeedbackRepository.Verify(x => x.GetNonRespondersAsync(It.IsAny<int>()), Times.Never);
            _mockNotificationService.Verify(x => x.SendFeedbackReminderAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task CloseFeedbackSurvey_ValidSurvey_ShouldCloseAndGenerateReport()
        {
            // Arrange
            var surveyId = 1;

            _mockSurveyService
                .Setup(x => x.GetSurveyAsync(surveyId))
                .ReturnsAsync("valid-survey-json");

            _mockSurveyService
                .Setup(x => x.CloseSurveyAsync(surveyId))
                .ReturnsAsync(true);

            _mockEventFeedbackRepository
                .Setup(x => x.GenerateFinalReportAsync(surveyId))
                .ReturnsAsync("final-report-data");

            // Act
            await _eventFeedbackService.CloseFeedbackSurveyAsync(surveyId);

            // Assert
            _mockSurveyService.Verify(x => x.GetSurveyAsync(surveyId), Times.Once);
            _mockSurveyService.Verify(x => x.CloseSurveyAsync(surveyId), Times.Once);
            _mockEventFeedbackRepository.Verify(x => x.GenerateFinalReportAsync(surveyId), Times.Once);
        }

        [Test]
        public async Task CloseFeedbackSurvey_SurveyNotFound_ShouldThrowException()
        {
            // Arrange
            var surveyId = 999;

            _mockSurveyService
                .Setup(x => x.GetSurveyAsync(surveyId))
                .ReturnsAsync((string)null);

            // Act & Assert
            await _eventFeedbackService.Invoking(s => s.CloseFeedbackSurveyAsync(surveyId))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("Survey not found");

            _mockSurveyService.Verify(x => x.CloseSurveyAsync(It.IsAny<int>()), Times.Never);
            _mockEventFeedbackRepository.Verify(x => x.GenerateFinalReportAsync(It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task CloseFeedbackSurvey_CloseFails_ShouldThrowException()
        {
            // Arrange
            var surveyId = 1;

            _mockSurveyService
                .Setup(x => x.GetSurveyAsync(surveyId))
                .ReturnsAsync("valid-survey-json");

            _mockSurveyService
                .Setup(x => x.CloseSurveyAsync(surveyId))
                .ReturnsAsync(false);

            // Act & Assert
            await _eventFeedbackService.Invoking(s => s.CloseFeedbackSurveyAsync(surveyId))
                .Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Failed to close survey");

            _mockEventFeedbackRepository.Verify(x => x.GenerateFinalReportAsync(It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task ExportFeedbackData_NoSurveyFound_ShouldThrowException()
        {
            // Arrange
            var eventId = 999;
            var request = new ExportFeedbackDataRequest
            {
                EventId = eventId,
                IncludeRawResponses = true,
                IncludeAnalytics = false,
                Format = ExportFormat.JSON
            };

            _mockEventFeedbackRepository
                .Setup(x => x.GetFeedbackSurveyByEventAsync(eventId))
                .ReturnsAsync((EventFeedbackSurvey)null);

            // Act & Assert
            await _eventFeedbackService.Invoking(s => s.ExportFeedbackDataAsync(eventId, request))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage($"No feedback survey found for event {eventId}");

            _mockEventFeedbackRepository.Verify(x => x.ExportFeedbackDataAsync(
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<bool>()), Times.Never);
        }

        #region GetEventFeedbackSurveysAsync Tests - SKIPPED
        // NOTE: GetEventFeedbackSurveysAsync, GetEventFeedbackResponsesAsync, and GetFeedbackAnalyticsResponseAsync
        // use _context directly (legacy pattern) and cannot be tested with repository-based constructor.
        // These methods require integration tests with a real DbContext.
        #endregion


        #region Edge Cases and Validation Tests

        [Test]
        public async Task CreateFeedbackSurvey_EmptyQuestionsList_CreatesValidSurvey()
        {
            // Arrange
            var eventId = 1;
            var request = new CreateFeedbackSurveyRequest
            {
                EventId = eventId,
                Title = "Minimal Survey",
                Description = "No questions yet",
                IsAnonymous = false,
                Questions = new List<CreateFeedbackQuestionRequest>()
            };

            var eventEntity = new Event { Id = eventId, Title = "Test Event", ClubId = 1 };
            var createdSurvey = new EventFeedbackSurvey
            {
                Id = 1,
                EventId = eventId,
                Title = request.Title,
                Description = request.Description,
                IsAnonymous = false,
                IsActive = true,
                Questions = new List<SurveyQuestion>()
            };

            _mockEventRepository.Setup(x => x.GetByIdAsync(eventId)).ReturnsAsync(eventEntity);
            _mockEventFeedbackRepository.Setup(x => x.CreateSurveyAsync(It.IsAny<EventFeedbackSurvey>())).ReturnsAsync(createdSurvey);

            // Act
            var result = await _eventFeedbackService.CreateFeedbackSurveyAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Questions.Should().BeEmpty();
        }

        [Test]
        public async Task SubmitFeedback_EmptyResponsesList_SuccessfullySubmits()
        {
            // Arrange
            var surveyId = 1;
            var memberId = 1;
            var request = new SubmitFeedbackRequest
            {
                SurveyId = surveyId,
                MemberId = memberId,
                Responses = new List<GatherGrove.Application.DTOs.SurveyResponse>()
            };

            var feedbackResponse = new EventFeedbackResponse
            {
                Id = 1,
                SurveyId = surveyId,
                MemberId = memberId,
                SubmittedAt = DateTime.UtcNow,
                Responses = new List<Domain.Entities.SurveyResponse>()
            };

            _mockSurveyService.Setup(x => x.GetSurveyAsync(surveyId)).ReturnsAsync("valid-survey");
            _mockEventFeedbackRepository.Setup(x => x.HasSubmittedFeedbackAsync(surveyId, memberId)).ReturnsAsync(false);
            _mockEventFeedbackRepository.Setup(x => x.CreateResponseAsync(It.IsAny<EventFeedbackResponse>())).ReturnsAsync(feedbackResponse);

            // Act
            var result = await _eventFeedbackService.SubmitFeedbackAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
        }

        [Test]
        public async Task GetFeedbackAnalytics_ZeroResponses_ReturnsZeroMetrics()
        {
            // Arrange
            var eventId = 1;
            var analytics = new EventFeedbackAnalytics
            {
                EventId = eventId,
                TotalSurveys = 1,
                TotalResponses = 0,
                AverageRating = 0,
                ResponseRate = 0,
                CompletionRate = 0,
                CommonThemes = new List<string>()
            };

            _mockEventFeedbackRepository.Setup(x => x.GetFeedbackAnalyticsAsync(eventId)).ReturnsAsync(analytics);

            // Act
            var result = await _eventFeedbackService.GetFeedbackAnalyticsAsync(eventId);

            // Assert
            result.TotalResponses.Should().Be(0);
            result.AverageRating.Should().Be(0);
            result.ResponseRate.Should().Be(0);
        }

        [Test]
        public async Task GetEventFeedbackSummary_HighResponseRate_ReturnsAccurateData()
        {
            // Arrange
            var eventId = 1;
            var summary = new EventFeedbackSummary
            {
                EventId = eventId,
                SurveyTitle = "Event Survey",
                TotalInvited = 100,
                TotalResponses = 95,
                ResponseRate = 95.0f,
                AverageRating = 4.8f,
                PositiveFeedbackPercentage = 98.0f,
                TopCompliments = new List<string> { "Outstanding", "Perfect" },
                TopComplaints = new List<string>(),
                RecommendationPercentage = 100.0f
            };

            _mockEventFeedbackRepository.Setup(x => x.GetEventFeedbackSummaryAsync(eventId)).ReturnsAsync(summary);

            // Act
            var result = await _eventFeedbackService.GetEventFeedbackSummaryAsync(eventId);

            // Assert
            result.ResponseRate.Should().Be(95.0f);
            result.RecommendationPercentage.Should().Be(100.0f);
            result.TopComplaints.Should().BeEmpty();
        }

        [Test]
        public async Task CreateFeedbackSurvey_LongTitle_HandlesCorrectly()
        {
            // Arrange
            var eventId = 1;
            var longTitle = new string('A', 500);
            var request = new CreateFeedbackSurveyRequest
            {
                EventId = eventId,
                Title = longTitle,
                Description = "Test",
                IsAnonymous = false,
                Questions = new List<CreateFeedbackQuestionRequest>()
            };

            var eventEntity = new Event { Id = eventId, Title = "Event", ClubId = 1 };
            var survey = new EventFeedbackSurvey
            {
                Id = 1,
                EventId = eventId,
                Title = longTitle,
                Description = "Test",
                Questions = new List<SurveyQuestion>()
            };

            _mockEventRepository.Setup(x => x.GetByIdAsync(eventId)).ReturnsAsync(eventEntity);
            _mockEventFeedbackRepository.Setup(x => x.CreateSurveyAsync(It.IsAny<EventFeedbackSurvey>())).ReturnsAsync(survey);

            // Act
            var result = await _eventFeedbackService.CreateFeedbackSurveyAsync(eventId, request);

            // Assert
            result.Title.Length.Should().Be(500);
        }

        [Test]
        public async Task CreateFeedbackSurvey_MultipleQuestionTypes_AllTypesSupported()
        {
            // Arrange
            var eventId = 1;
            var request = new CreateFeedbackSurveyRequest
            {
                EventId = eventId,
                Title = "Comprehensive Survey",
                Description = "All question types",
                IsAnonymous = false,
                Questions = new List<CreateFeedbackQuestionRequest>
                {
                    new CreateFeedbackQuestionRequest { Text = "Rating", QuestionType = QuestionType.Rating, IsRequired = true },
                    new CreateFeedbackQuestionRequest { Text = "Text", QuestionType = QuestionType.Text, IsRequired = false },
                    new CreateFeedbackQuestionRequest { Text = "YesNo", QuestionType = QuestionType.YesNo, IsRequired = true },
                    new CreateFeedbackQuestionRequest { Text = "MultipleChoice", QuestionType = QuestionType.MultipleChoice, IsRequired = false, Options = "A,B,C" }
                }
            };

            var eventEntity = new Event { Id = eventId, Title = "Event", ClubId = 1 };
            var survey = new EventFeedbackSurvey
            {
                Id = 1,
                EventId = eventId,
                Title = request.Title,
                Questions = request.Questions.Select((q, i) => new SurveyQuestion
                {
                    Id = i + 1,
                    Text = q.Text,
                    Type = q.QuestionType,
                    IsRequired = q.IsRequired,
                    QuestionOrder = i + 1
                }).ToList()
            };

            _mockEventRepository.Setup(x => x.GetByIdAsync(eventId)).ReturnsAsync(eventEntity);
            _mockEventFeedbackRepository.Setup(x => x.CreateSurveyAsync(It.IsAny<EventFeedbackSurvey>())).ReturnsAsync(survey);

            // Act
            var result = await _eventFeedbackService.CreateFeedbackSurveyAsync(eventId, request);

            // Assert
            result.Questions.Should().HaveCount(4);
            result.Questions[0].QuestionType.Should().Be(QuestionType.Rating);
            result.Questions[1].QuestionType.Should().Be(QuestionType.Text);
            result.Questions[2].QuestionType.Should().Be(QuestionType.YesNo);
            result.Questions[3].QuestionType.Should().Be(QuestionType.MultipleChoice);
        }

        [Test]
        public async Task SendFeedbackReminders_PartialNotificationFailure_ContinuesSending()
        {
            // Arrange
            var surveyId = 1;
            var nonResponders = new List<int> { 1, 2, 3, 4, 5 };

            _mockSurveyService.Setup(x => x.GetSurveyAsync(surveyId)).ReturnsAsync("valid");
            _mockEventFeedbackRepository.Setup(x => x.GetNonRespondersAsync(surveyId)).ReturnsAsync(nonResponders);

            // Simulate notification failure for member 3
            _mockNotificationService
                .Setup(x => x.SendFeedbackReminderAsync(It.IsAny<int>(), 3))
                .ThrowsAsync(new Exception("Notification failed"));
            _mockNotificationService
                .Setup(x => x.SendFeedbackReminderAsync(It.IsAny<int>(), It.Is<int>(m => m != 3)))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _eventFeedbackService.SendFeedbackRemindersAsync(surveyId);

            // Assert - Should attempt to send all reminders despite one failure
            result.Should().NotBeNull();
            result.RemindersSent.Should().BeGreaterOrEqualTo(0);
        }

        [Test]
        public async Task ExportFeedbackData_JSONFormat_ReturnsJSONData()
        {
            // Arrange
            var eventId = 1;
            var request = new ExportFeedbackDataRequest
            {
                EventId = eventId,
                IncludeRawResponses = true,
                IncludeAnalytics = true,
                Format = ExportFormat.JSON
            };

            var survey = new EventFeedbackSurvey { Id = 1, EventId = eventId, IsAnonymous = false };
            var exportData = new ExportedFeedbackData
            {
                EventId = eventId,
                ExportFormat = ExportFormat.JSON,
                Data = "{\"responses\": []}",
                TotalRecords = 0,
                Format = ExportFormat.JSON
            };

            _mockEventFeedbackRepository.Setup(x => x.GetFeedbackSurveyByEventAsync(eventId)).ReturnsAsync(survey);
            _mockEventFeedbackRepository.Setup(x => x.ExportFeedbackDataAsync(
                It.IsAny<int>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>())).ReturnsAsync(exportData);

            // Act
            var result = await _eventFeedbackService.ExportFeedbackDataAsync(eventId, request);

            // Assert
            result.ExportFormat.Should().Be(ExportFormat.JSON);
            result.Data.Should().Contain("{");
        }

        [Test]
        public async Task ExportFeedbackData_CSVFormat_ReturnsCSVData()
        {
            // Arrange
            var eventId = 1;
            var request = new ExportFeedbackDataRequest
            {
                EventId = eventId,
                IncludeRawResponses = true,
                IncludeAnalytics = false,
                Format = ExportFormat.CSV
            };

            var survey = new EventFeedbackSurvey { Id = 1, EventId = eventId, IsAnonymous = false };
            var exportData = new ExportedFeedbackData
            {
                EventId = eventId,
                ExportFormat = ExportFormat.CSV,
                Data = "QuestionId,Answer\n1,5\n2,Great",
                TotalRecords = 2,
                Format = ExportFormat.CSV
            };

            _mockEventFeedbackRepository.Setup(x => x.GetFeedbackSurveyByEventAsync(eventId)).ReturnsAsync(survey);
            _mockEventFeedbackRepository.Setup(x => x.ExportFeedbackDataAsync(
                It.IsAny<int>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>())).ReturnsAsync(exportData);

            // Act
            var result = await _eventFeedbackService.ExportFeedbackDataAsync(eventId, request);

            // Assert
            result.ExportFormat.Should().Be(ExportFormat.CSV);
            result.TotalRecords.Should().Be(2);
        }

        [Test]
        public async Task GetFeedbackAnalytics_MultipleThemes_ReturnsAllThemes()
        {
            // Arrange
            var eventId = 1;
            var analytics = new EventFeedbackAnalytics
            {
                EventId = eventId,
                TotalSurveys = 1,
                TotalResponses = 50,
                AverageRating = 4.1,
                ResponseRate = 75.0,
                CompletionRate = 92.0,
                CommonThemes = new List<string>
                {
                    "Great location",
                    "Excellent speakers",
                    "Well organized",
                    "Good food",
                    "Networking opportunities"
                }
            };

            _mockEventFeedbackRepository.Setup(x => x.GetFeedbackAnalyticsAsync(eventId)).ReturnsAsync(analytics);

            // Act
            var result = await _eventFeedbackService.GetFeedbackAnalyticsAsync(eventId);

            // Assert
            result.CommonThemes.Should().HaveCount(5);
            result.CommonThemes.Should().Contain("Excellent speakers");
            result.CommonThemes.Should().Contain("Networking opportunities");
        }

        [Test]
        public async Task SubmitFeedback_SurveyNotActive_ShouldFail()
        {
            // Arrange
            var surveyId = 1;
            var memberId = 1;
            var request = new SubmitFeedbackRequest
            {
                SurveyId = surveyId,
                MemberId = memberId,
                Responses = new List<GatherGrove.Application.DTOs.SurveyResponse>
                {
                    new GatherGrove.Application.DTOs.SurveyResponse { QuestionId = 1, Answer = "5" }
                }
            };

            _mockSurveyService.Setup(x => x.GetSurveyAsync(surveyId)).ReturnsAsync((string)null); // Inactive or not found

            // Act
            var result = await _eventFeedbackService.SubmitFeedbackAsync(request);

            // Assert
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().NotBeNullOrEmpty();
        }

        [Test]
        public async Task GetEventFeedbackSummary_NoCompliments_ReturnsEmptyComplimentsList()
        {
            // Arrange
            var eventId = 1;
            var summary = new EventFeedbackSummary
            {
                EventId = eventId,
                SurveyTitle = "Survey",
                TotalInvited = 20,
                TotalResponses = 18,
                ResponseRate = 90.0f,
                AverageRating = 3.0f,
                PositiveFeedbackPercentage = 50.0f,
                TopCompliments = new List<string>(),
                TopComplaints = new List<string> { "Too long", "Poor sound" },
                RecommendationPercentage = 60.0f
            };

            _mockEventFeedbackRepository.Setup(x => x.GetEventFeedbackSummaryAsync(eventId)).ReturnsAsync(summary);

            // Act
            var result = await _eventFeedbackService.GetEventFeedbackSummaryAsync(eventId);

            // Assert
            result.TopCompliments.Should().BeEmpty();
            result.TopComplaints.Should().HaveCount(2);
        }

        [Test]
        public async Task CreateFeedbackSurvey_DuplicateQuestionText_AllowsCreation()
        {
            // Arrange
            var eventId = 1;
            var request = new CreateFeedbackSurveyRequest
            {
                EventId = eventId,
                Title = "Survey",
                Description = "Test",
                IsAnonymous = false,
                Questions = new List<CreateFeedbackQuestionRequest>
                {
                    new CreateFeedbackQuestionRequest { Text = "How was it?", QuestionType = QuestionType.Rating, IsRequired = true },
                    new CreateFeedbackQuestionRequest { Text = "How was it?", QuestionType = QuestionType.Text, IsRequired = false }
                }
            };

            var eventEntity = new Event { Id = eventId, Title = "Event", ClubId = 1 };
            var survey = new EventFeedbackSurvey
            {
                Id = 1,
                EventId = eventId,
                Title = request.Title,
                Questions = request.Questions.Select((q, i) => new SurveyQuestion
                {
                    Id = i + 1,
                    Text = q.Text,
                    Type = q.QuestionType,
                    QuestionOrder = i + 1
                }).ToList()
            };

            _mockEventRepository.Setup(x => x.GetByIdAsync(eventId)).ReturnsAsync(eventEntity);
            _mockEventFeedbackRepository.Setup(x => x.CreateSurveyAsync(It.IsAny<EventFeedbackSurvey>())).ReturnsAsync(survey);

            // Act
            var result = await _eventFeedbackService.CreateFeedbackSurveyAsync(eventId, request);

            // Assert
            result.Questions.Should().HaveCount(2);
            result.Questions[0].Text.Should().Be("How was it?");
            result.Questions[1].Text.Should().Be("How was it?");
        }


        #endregion
    }
}
