using NUnit.Framework;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class NotificationServiceTests
{
    private NotificationService _notificationService = null!;
    private Mock<ILogger<NotificationService>> _mockLogger = null!;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<NotificationService>>();
        _notificationService = new NotificationService(_mockLogger.Object);
    }

    #region SendNotificationAsync Tests

    [Test]
    public async Task SendNotificationAsync_ValidParameters_CompletesSuccessfully()
    {
        // Arrange
        var userId = 1;
        var message = "Test notification";
        var type = "info";

        // Act & Assert - should not throw
        await _notificationService.SendNotificationAsync(userId, message, type);
    }

    [Test]
    public async Task SendNotificationAsync_DefaultType_UsesInfo()
    {
        // Arrange
        var userId = 1;
        var message = "Test notification";

        // Act - call without type parameter
        await _notificationService.SendNotificationAsync(userId, message);

        // Assert - verify logging was called (implicitly verifies method completed)
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Notification sent")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendNotificationAsync_DifferentTypes_CompletesSuccessfully()
    {
        // Arrange
        var userId = 1;
        var message = "Test notification";
        var types = new[] { "info", "warning", "error", "success" };

        // Act & Assert - all types should work
        foreach (var type in types)
        {
            await _notificationService.SendNotificationAsync(userId, message, type);
        }
    }

    [Test]
    public async Task SendNotificationAsync_LargeUserId_CompletesSuccessfully()
    {
        // Arrange
        var userId = int.MaxValue;
        var message = "Test notification";

        // Act & Assert
        await _notificationService.SendNotificationAsync(userId, message);
    }

    [Test]
    public async Task SendNotificationAsync_EmptyMessage_CompletesSuccessfully()
    {
        // Arrange
        var userId = 1;
        var message = "";

        // Act & Assert
        await _notificationService.SendNotificationAsync(userId, message);
    }

    #endregion

    #region SendBulkNotificationAsync Tests

    [Test]
    public async Task SendBulkNotificationAsync_ValidParameters_CompletesSuccessfully()
    {
        // Arrange
        var userIds = new List<int> { 1, 2, 3, 4, 5 };
        var message = "Bulk notification";
        var type = "info";

        // Act & Assert
        await _notificationService.SendBulkNotificationAsync(userIds, message, type);
    }

    [Test]
    public async Task SendBulkNotificationAsync_EmptyList_CompletesSuccessfully()
    {
        // Arrange
        var userIds = new List<int>();
        var message = "Bulk notification";

        // Act & Assert
        await _notificationService.SendBulkNotificationAsync(userIds, message);
    }

    [Test]
    public async Task SendBulkNotificationAsync_SingleUser_CompletesSuccessfully()
    {
        // Arrange
        var userIds = new List<int> { 42 };
        var message = "Bulk notification to one user";

        // Act & Assert
        await _notificationService.SendBulkNotificationAsync(userIds, message);
    }

    [Test]
    public async Task SendBulkNotificationAsync_LargeList_CompletesSuccessfully()
    {
        // Arrange
        var userIds = Enumerable.Range(1, 1000).ToList();
        var message = "Large bulk notification";

        // Act & Assert
        await _notificationService.SendBulkNotificationAsync(userIds, message);
    }

    [Test]
    public async Task SendBulkNotificationAsync_LogsCorrectCount()
    {
        // Arrange
        var userIds = new List<int> { 1, 2, 3 };
        var message = "Test bulk";

        // Act
        await _notificationService.SendBulkNotificationAsync(userIds, message);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("3 users")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendWaitlistPromotionNotificationAsync Tests

    [Test]
    public async Task SendWaitlistPromotionNotificationAsync_ValidParameters_CompletesSuccessfully()
    {
        // Arrange
        var memberId = 1;
        var eventId = 100;

        // Act & Assert
        await _notificationService.SendWaitlistPromotionNotificationAsync(memberId, eventId);
    }

    [Test]
    public async Task SendWaitlistPromotionNotificationAsync_LogsCorrectly()
    {
        // Arrange
        var memberId = 42;
        var eventId = 123;

        // Act
        await _notificationService.SendWaitlistPromotionNotificationAsync(memberId, eventId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) =>
                    v.ToString()!.Contains("Waitlist promotion") &&
                    v.ToString()!.Contains("42") &&
                    v.ToString()!.Contains("123")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendWaitlistPositionUpdateNotificationAsync Tests

    [Test]
    public async Task SendWaitlistPositionUpdateNotificationAsync_ValidParameters_CompletesSuccessfully()
    {
        // Arrange
        var memberId = 1;
        var eventId = 100;
        var newPosition = 5;

        // Act & Assert
        await _notificationService.SendWaitlistPositionUpdateNotificationAsync(memberId, eventId, newPosition);
    }

    [Test]
    public async Task SendWaitlistPositionUpdateNotificationAsync_PositionOne_CompletesSuccessfully()
    {
        // Arrange - first position in waitlist
        var memberId = 1;
        var eventId = 100;
        var newPosition = 1;

        // Act & Assert
        await _notificationService.SendWaitlistPositionUpdateNotificationAsync(memberId, eventId, newPosition);
    }

    [Test]
    public async Task SendWaitlistPositionUpdateNotificationAsync_LargePosition_CompletesSuccessfully()
    {
        // Arrange
        var memberId = 1;
        var eventId = 100;
        var newPosition = 999;

        // Act & Assert
        await _notificationService.SendWaitlistPositionUpdateNotificationAsync(memberId, eventId, newPosition);
    }

    #endregion

    #region SendEventReminderNotificationAsync Tests

    [Test]
    public async Task SendEventReminderNotificationAsync_ValidParameters_CompletesSuccessfully()
    {
        // Arrange
        var eventId = 100;
        var reminderType = "24h";

        // Act & Assert
        await _notificationService.SendEventReminderNotificationAsync(eventId, reminderType);
    }

    [Test]
    public async Task SendEventReminderNotificationAsync_DifferentReminderTypes_CompletesSuccessfully()
    {
        // Arrange
        var eventId = 100;
        var reminderTypes = new[] { "24h", "1h", "30min", "15min" };

        // Act & Assert
        foreach (var type in reminderTypes)
        {
            await _notificationService.SendEventReminderNotificationAsync(eventId, type);
        }
    }

    #endregion

    #region SendFeedbackSurveyNotificationAsync Tests

    [Test]
    public async Task SendFeedbackSurveyNotificationAsync_ValidParameters_CompletesSuccessfully()
    {
        // Arrange
        var memberId = 1;
        var eventId = 100;
        var surveyId = 50;

        // Act & Assert
        await _notificationService.SendFeedbackSurveyNotificationAsync(memberId, eventId, surveyId);
    }

    [Test]
    public async Task SendFeedbackSurveyNotificationAsync_LogsAllParameters()
    {
        // Arrange
        var memberId = 10;
        var eventId = 20;
        var surveyId = 30;

        // Act
        await _notificationService.SendFeedbackSurveyNotificationAsync(memberId, eventId, surveyId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) =>
                    v.ToString()!.Contains("Feedback survey notification") &&
                    v.ToString()!.Contains("10") &&
                    v.ToString()!.Contains("20") &&
                    v.ToString()!.Contains("30")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendCheckInConfirmationNotificationAsync Tests

    [Test]
    public async Task SendCheckInConfirmationNotificationAsync_ValidParameters_CompletesSuccessfully()
    {
        // Arrange
        var memberId = 1;
        var eventId = 100;

        // Act & Assert
        await _notificationService.SendCheckInConfirmationNotificationAsync(memberId, eventId);
    }

    #endregion

    #region SendCheckinConfirmationAsync Tests

    [Test]
    public async Task SendCheckinConfirmationAsync_ValidParameters_CompletesSuccessfully()
    {
        // Arrange
        var memberId = 1;
        var eventId = 100;

        // Act & Assert
        await _notificationService.SendCheckinConfirmationAsync(memberId, eventId);
    }

    [Test]
    public async Task SendCheckinConfirmationAsync_LogsCorrectly()
    {
        // Arrange
        var memberId = 5;
        var eventId = 10;

        // Act
        await _notificationService.SendCheckinConfirmationAsync(memberId, eventId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) =>
                    v.ToString()!.Contains("Check-in confirmation") &&
                    v.ToString()!.Contains("5") &&
                    v.ToString()!.Contains("10")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region SendFeedbackReminderAsync Tests

    [Test]
    public async Task SendFeedbackReminderAsync_ValidParameters_CompletesSuccessfully()
    {
        // Arrange
        var memberId = 1;
        var eventId = 100;

        // Act & Assert
        await _notificationService.SendFeedbackReminderAsync(memberId, eventId);
    }

    #endregion

    #region SendFeedbackSurveyInvitationsAsync Tests

    [Test]
    public async Task SendFeedbackSurveyInvitationsAsync_ValidParameters_CompletesSuccessfully()
    {
        // Arrange
        var eventId = 100;
        var surveyId = 50;

        // Act & Assert
        await _notificationService.SendFeedbackSurveyInvitationsAsync(eventId, surveyId);
    }

    [Test]
    public async Task SendFeedbackSurveyInvitationsAsync_LogsCorrectly()
    {
        // Arrange
        var eventId = 15;
        var surveyId = 25;

        // Act
        await _notificationService.SendFeedbackSurveyInvitationsAsync(eventId, surveyId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) =>
                    v.ToString()!.Contains("Feedback survey invitations") &&
                    v.ToString()!.Contains("15") &&
                    v.ToString()!.Contains("25")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Concurrent Access Tests

    [Test]
    public async Task AllMethods_ConcurrentCalls_CompleteSuccessfully()
    {
        // Arrange
        var tasks = new List<Task>
        {
            _notificationService.SendNotificationAsync(1, "msg1"),
            _notificationService.SendBulkNotificationAsync(new List<int> { 1, 2 }, "bulk"),
            _notificationService.SendWaitlistPromotionNotificationAsync(1, 100),
            _notificationService.SendWaitlistPositionUpdateNotificationAsync(1, 100, 5),
            _notificationService.SendEventReminderNotificationAsync(100, "24h"),
            _notificationService.SendFeedbackSurveyNotificationAsync(1, 100, 50),
            _notificationService.SendCheckInConfirmationNotificationAsync(1, 100),
            _notificationService.SendCheckinConfirmationAsync(1, 100),
            _notificationService.SendFeedbackReminderAsync(1, 100),
            _notificationService.SendFeedbackSurveyInvitationsAsync(100, 50)
        };

        // Act & Assert - all tasks should complete without exception
        await Task.WhenAll(tasks);
    }

    [Test]
    public async Task SendNotificationAsync_MultipleConcurrentCalls_CompleteSuccessfully()
    {
        // Arrange
        var tasks = Enumerable.Range(1, 100)
            .Select(i => _notificationService.SendNotificationAsync(i, $"Message {i}"))
            .ToList();

        // Act & Assert
        await Task.WhenAll(tasks);
    }

    #endregion
}
