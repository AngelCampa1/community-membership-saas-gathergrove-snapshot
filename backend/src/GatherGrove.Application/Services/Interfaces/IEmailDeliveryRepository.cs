using GatherGrove.Application.DTOs.Export;

namespace GatherGrove.Application.Services.Interfaces;

public interface IEmailDeliveryRepository
{
    Task<EmailDeliveryRecord> SaveDeliveryRecordAsync(EmailDeliveryRecord record);
    Task<List<EmailDeliveryRecord>> GetDeliveryHistoryAsync(int limit);
    Task<EmailDeliveryStatistics> GetStatisticsAsync(DateTime startDate, DateTime endDate);
    Task<EmailDeliveryRecord> CreateDeliveryRecordAsync(EmailDeliveryRecord record);

    // Additional methods expected by tests
    Task<EmailDeliveryRecord?> GetDeliveryRecordAsync(string deliveryId);
    Task UpdateDeliveryStatusAsync(string deliveryId, string status, DateTime timestamp);
    Task<List<EmailDeliveryRecord>> GetDeliveryHistoryAsync(int clubId, int limit);
    Task<EmailDeliveryStatistics> GetDeliveryStatisticsAsync(DateTime startDate, DateTime endDate, int clubId);

    // Missing methods from tests
    Task<EmailDeliveryRecord?> GetDeliveryRecordByMessageIdAsync(string messageId);
    Task<EmailDeliveryRecord?> GetDeliveryRecordByIdAsync(string deliveryId);
    Task<EmailDeliveryRecord?> GetDeliveryRecordByEmailAsync(string recipientEmail);
    Task<List<EmailDeliveryRecord>> GetDeliveryHistoryByClubIdAsync(int clubId, int limit);
    Task UpdateDeliveryRecordAsync(EmailDeliveryRecord record);
    Task RecordBounceAsync(string messageId, EmailBounceNotification bounceNotification);
    Task<List<string>> GetDeliveryDigestDataAsync(DateTime startDate, DateTime endDate);
}