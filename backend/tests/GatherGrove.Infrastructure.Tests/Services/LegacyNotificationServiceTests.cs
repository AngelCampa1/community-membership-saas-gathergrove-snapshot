using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.Infrastructure.Tests.Services;

/// <summary>
/// TDD Tests for LegacyNotificationService - Legacy notification logging implementation
/// Tests notification method logging and parameter validation
/// Mocks only ILogger (external boundary)
/// </summary>
[TestFixture]
public class LegacyNotificationServiceTests
{
    private Mock<ILogger<LegacyNotificationService>> _mockLogger = null!;
    private LegacyNotificationService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<LegacyNotificationService>>();
        _service = new LegacyNotificationService(_mockLogger.Object);
    }

    #region SendNotificationAsync Tests (2 tests)

    [Test]
    public async Task SendNotificationAsync_ValidParameters_LogsInformation()
    {
        // Arrange
        var userId = 123;
        var message = "Your event has been updated";
        var type = "update";

        // Act
        await _service.SendNotificationAsync(userId, message, type);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"user {userId}")
                    && v.ToString()!.Contains(message)
                    && v.ToString()!.Contains(type)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendNotificationAsync_DefaultType_UsesInfoType()
    {
        // Arrange
        var userId = 456;
        var message = "Welcome to the club!";

        // Act
        await _service.SendNotificationAsync(userId, message);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("info")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendBulkNotificationAsync Tests (3 tests)

    [Test]
    public async Task SendBulkNotificationAsync_ValidParameters_LogsInformationWithCount()
    {
        // Arrange
        var userIds = new List<int> { 1, 2, 3, 4, 5 };
        var message = "Event cancelled due to weather";
        var type = "alert";

        // Act
        await _service.SendBulkNotificationAsync(userIds, message, type);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"{userIds.Count} users")
                    && v.ToString()!.Contains(message)
                    && v.ToString()!.Contains(type)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendBulkNotificationAsync_EmptyList_LogsZeroCount()
    {
        // Arrange
        var userIds = new List<int>();
        var message = "Test message";

        // Act
        await _service.SendBulkNotificationAsync(userIds, message);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("0 users")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendBulkNotificationAsync_LargeList_LogsCorrectCount()
    {
        // Arrange
        var userIds = Enumerable.Range(1, 1000).ToList();
        var message = "System maintenance scheduled";

        // Act
        await _service.SendBulkNotificationAsync(userIds, message);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("1000 users")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendWaitlistPromotionNotificationAsync Tests (2 tests)

    [Test]
    public async Task SendWaitlistPromotionNotificationAsync_ValidParameters_LogsInformation()
    {
        // Arrange
        var memberId = 789;
        var eventId = 456;

        // Act
        await _service.SendWaitlistPromotionNotificationAsync(memberId, eventId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"member {memberId}")
                    && v.ToString()!.Contains($"event {eventId}")
                    && v.ToString()!.Contains("Waitlist promotion")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendWaitlistPromotionNotificationAsync_ZeroIds_LogsWithZeroValues()
    {
        // Arrange
        var memberId = 0;
        var eventId = 0;

        // Act
        await _service.SendWaitlistPromotionNotificationAsync(memberId, eventId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("member 0")
                    && v.ToString()!.Contains("event 0")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendWaitlistPositionUpdateNotificationAsync Tests (2 tests)

    [Test]
    public async Task SendWaitlistPositionUpdateNotificationAsync_ValidParameters_LogsInformation()
    {
        // Arrange
        var memberId = 123;
        var eventId = 456;
        var newPosition = 3;

        // Act
        await _service.SendWaitlistPositionUpdateNotificationAsync(memberId, eventId, newPosition);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"member {memberId}")
                    && v.ToString()!.Contains($"event {eventId}")
                    && v.ToString()!.Contains($"position: {newPosition}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendWaitlistPositionUpdateNotificationAsync_FirstPosition_LogsCorrectly()
    {
        // Arrange
        var memberId = 999;
        var eventId = 111;
        var newPosition = 1;

        // Act
        await _service.SendWaitlistPositionUpdateNotificationAsync(memberId, eventId, newPosition);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("position: 1")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendEventReminderNotificationAsync Tests (2 tests)

    [Test]
    public async Task SendEventReminderNotificationAsync_ValidParameters_LogsInformation()
    {
        // Arrange
        var eventId = 789;
        var reminderType = "24h";

        // Act
        await _service.SendEventReminderNotificationAsync(eventId, reminderType);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"event {eventId}")
                    && v.ToString()!.Contains(reminderType)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendEventReminderNotificationAsync_DifferentReminderTypes_LogsCorrectly()
    {
        // Arrange
        var eventId = 555;

        // Act
        await _service.SendEventReminderNotificationAsync(eventId, "1h");

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("1h")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendFeedbackSurveyNotificationAsync Tests (2 tests)

    [Test]
    public async Task SendFeedbackSurveyNotificationAsync_ValidParameters_LogsInformation()
    {
        // Arrange
        var memberId = 111;
        var eventId = 222;
        var surveyId = 333;

        // Act
        await _service.SendFeedbackSurveyNotificationAsync(memberId, eventId, surveyId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"member {memberId}")
                    && v.ToString()!.Contains($"event {eventId}")
                    && v.ToString()!.Contains($"survey {surveyId}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendFeedbackSurveyNotificationAsync_AllIdsZero_LogsWithZeroValues()
    {
        // Arrange
        var memberId = 0;
        var eventId = 0;
        var surveyId = 0;

        // Act
        await _service.SendFeedbackSurveyNotificationAsync(memberId, eventId, surveyId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("member 0")
                    && v.ToString()!.Contains("event 0")
                    && v.ToString()!.Contains("survey 0")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendCheckInConfirmationNotificationAsync Tests (2 tests)

    [Test]
    public async Task SendCheckInConfirmationNotificationAsync_ValidParameters_LogsInformation()
    {
        // Arrange
        var memberId = 444;
        var eventId = 555;

        // Act
        await _service.SendCheckInConfirmationNotificationAsync(memberId, eventId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"member {memberId}")
                    && v.ToString()!.Contains($"event {eventId}")
                    && v.ToString()!.Contains("Check-in confirmation")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendCheckInConfirmationNotificationAsync_HighMemberIds_LogsCorrectly()
    {
        // Arrange
        var memberId = 999999;
        var eventId = 888888;

        // Act
        await _service.SendCheckInConfirmationNotificationAsync(memberId, eventId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("member 999999")
                    && v.ToString()!.Contains("event 888888")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendCheckinConfirmationAsync Tests (2 tests)

    [Test]
    public async Task SendCheckinConfirmationAsync_ValidParameters_LogsInformation()
    {
        // Arrange
        var memberId = 666;
        var eventId = 777;

        // Act
        await _service.SendCheckinConfirmationAsync(memberId, eventId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"member {memberId}")
                    && v.ToString()!.Contains($"event {eventId}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendCheckinConfirmationAsync_NegativeIds_LogsCorrectly()
    {
        // Arrange
        var memberId = -1;
        var eventId = -1;

        // Act
        await _service.SendCheckinConfirmationAsync(memberId, eventId);

        // Assert - Should still log (no validation in service)
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendFeedbackReminderAsync Tests (2 tests)

    [Test]
    public async Task SendFeedbackReminderAsync_ValidParameters_LogsInformation()
    {
        // Arrange
        var memberId = 321;
        var eventId = 654;

        // Act
        await _service.SendFeedbackReminderAsync(memberId, eventId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"member {memberId}")
                    && v.ToString()!.Contains($"event {eventId}")
                    && v.ToString()!.Contains("Feedback reminder")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendFeedbackReminderAsync_SameMemberMultipleTimes_LogsEachTime()
    {
        // Arrange
        var memberId = 100;
        var eventId = 200;

        // Act
        await _service.SendFeedbackReminderAsync(memberId, eventId);
        await _service.SendFeedbackReminderAsync(memberId, eventId);

        // Assert - Should log twice
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"member {memberId}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Exactly(2));
    }

    #endregion

    #region SendFeedbackSurveyInvitationsAsync Tests (3 tests)

    [Test]
    public async Task SendFeedbackSurveyInvitationsAsync_ValidParameters_LogsInformation()
    {
        // Arrange
        var eventId = 987;
        var surveyId = 654;

        // Act
        await _service.SendFeedbackSurveyInvitationsAsync(eventId, surveyId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"event {eventId}")
                    && v.ToString()!.Contains($"survey {surveyId}")
                    && v.ToString()!.Contains("invitations")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendFeedbackSurveyInvitationsAsync_ZeroIds_LogsWithZeroValues()
    {
        // Arrange
        var eventId = 0;
        var surveyId = 0;

        // Act
        await _service.SendFeedbackSurveyInvitationsAsync(eventId, surveyId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("event 0")
                    && v.ToString()!.Contains("survey 0")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendFeedbackSurveyInvitationsAsync_MultipleInvocations_LogsEachTime()
    {
        // Arrange
        var eventId = 500;
        var surveyId1 = 100;
        var surveyId2 = 200;

        // Act
        await _service.SendFeedbackSurveyInvitationsAsync(eventId, surveyId1);
        await _service.SendFeedbackSurveyInvitationsAsync(eventId, surveyId2);

        // Assert - Should log twice, once for each survey
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Exactly(2));
    }

    #endregion
}
