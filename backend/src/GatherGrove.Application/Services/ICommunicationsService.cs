using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Communications;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for sending communications (email and push) to club members
/// </summary>
public interface ICommunicationsService
{
    /// <summary>
    /// Sends a bulk email to all active members of a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The user sending the email</param>
    /// <param name="request">The email content</param>
    /// <returns>Response indicating success and details</returns>
    Task<SendBulkEmailResponse> SendBulkEmailAsync(int clubId, int userId, SendBulkEmailRequest request);

    /// <summary>
    /// Gets the current email usage statistics for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Usage statistics including limits and current usage</returns>
    Task<EmailUsageStatsResponse> GetEmailUsageStatsAsync(int clubId);

    /// <summary>
    /// Checks if sending to a specified number of recipients would exceed the club's email limit
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="recipientCount">Number of recipients</param>
    /// <returns>True if it would exceed the limit</returns>
    Task<bool> WouldExceedEmailLimitAsync(int clubId, int recipientCount);

    /// <summary>
    /// Gets the communication history for a club with pagination and filtering
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">Pagination and filtering parameters</param>
    /// <returns>Paginated communication history</returns>
    Task<GetCommunicationHistoryResponse> GetCommunicationHistoryAsync(int clubId, GetCommunicationHistoryRequest request);

    /// <summary>
    /// Sends a bulk push notification to members with registered devices
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The user sending the push notification</param>
    /// <param name="request">The push notification content</param>
    /// <returns>Response indicating success and details</returns>
    Task<SendPushNotificationResponse> SendBulkPushNotificationAsync(int clubId, int userId, SendPushNotificationRequest request);

    /// <summary>
    /// Gets the push notification usage statistics for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Push notification usage statistics including device counts</returns>
    Task<PushNotificationUsageStatsResponse> GetPushNotificationUsageStatsAsync(int clubId);

    /// <summary>
    /// Sends engagement alerts to club administrators about member engagement issues
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="engagementData">List of member engagement data</param>
    /// <returns>Success status of the alert sending</returns>
    Task<bool> SendEngagementAlertAsync(int clubId, List<MemberEngagementResponse> engagementData);

    /// <summary>
    /// Sends a unified outreach to selected members via email or push notification
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The user sending the outreach</param>
    /// <param name="request">The outreach request with recipients, message, and type</param>
    /// <returns>Response indicating success and details</returns>
    Task<SendOutreachResponse> SendOutreachAsync(int clubId, int userId, SendOutreachRequest request);
}
