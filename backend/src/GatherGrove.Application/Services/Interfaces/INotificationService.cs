namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Service interface for sending notifications to members
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Sends a general notification to a user
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="message">The notification message</param>
    /// <param name="type">The notification type</param>
    /// <returns>Task representing the notification operation</returns>
    Task SendNotificationAsync(int userId, string message, string type = "info");

    /// <summary>
    /// Sends bulk notifications to multiple users
    /// </summary>
    /// <param name="userIds">List of user IDs</param>
    /// <param name="message">The notification message</param>
    /// <param name="type">The notification type</param>
    /// <returns>Task representing the notification operation</returns>
    Task SendBulkNotificationAsync(List<int> userIds, string message, string type = "info");

    /// <summary>
    /// Sends a notification when a member is promoted from the waitlist
    /// </summary>
    /// <param name="memberId">The member ID</param>
    /// <param name="eventId">The event ID</param>
    /// <returns>Task representing the notification operation</returns>
    Task SendWaitlistPromotionNotificationAsync(int memberId, int eventId);

    /// <summary>
    /// Sends a notification about waitlist position changes
    /// </summary>
    /// <param name="memberId">The member ID</param>
    /// <param name="eventId">The event ID</param>
    /// <param name="newPosition">The new position in the waitlist</param>
    /// <returns>Task representing the notification operation</returns>
    Task SendWaitlistPositionUpdateNotificationAsync(int memberId, int eventId, int newPosition);

    /// <summary>
    /// Sends event reminder notifications
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="reminderType">Type of reminder (24h, 1h, etc.)</param>
    /// <returns>Task representing the notification operation</returns>
    Task SendEventReminderNotificationAsync(int eventId, string reminderType);

    /// <summary>
    /// Sends feedback survey notification after event completion
    /// </summary>
    /// <param name="memberId">The member ID</param>
    /// <param name="eventId">The event ID</param>
    /// <param name="surveyId">The survey ID</param>
    /// <returns>Task representing the notification operation</returns>
    Task SendFeedbackSurveyNotificationAsync(int memberId, int eventId, int surveyId);

    /// <summary>
    /// Sends QR code check-in notification
    /// </summary>
    /// <param name="memberId">The member ID</param>
    /// <param name="eventId">The event ID</param>
    /// <returns>Task representing the notification operation</returns>
    Task SendCheckInConfirmationNotificationAsync(int memberId, int eventId);

    /// <summary>
    /// Sends check-in confirmation notification
    /// </summary>
    /// <param name="memberId">The member ID</param>
    /// <param name="eventId">The event ID</param>
    /// <returns>Task representing the notification operation</returns>
    Task SendCheckinConfirmationAsync(int memberId, int eventId);

    /// <summary>
    /// Sends feedback reminder notification
    /// </summary>
    /// <param name="memberId">The member ID</param>
    /// <param name="eventId">The event ID</param>
    /// <returns>Task representing the notification operation</returns>
    Task SendFeedbackReminderAsync(int memberId, int eventId);

    /// <summary>
    /// Sends feedback survey invitations to event attendees
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="surveyId">The survey ID</param>
    /// <returns>Task representing the notification operation</returns>
    Task SendFeedbackSurveyInvitationsAsync(int eventId, int surveyId);
}