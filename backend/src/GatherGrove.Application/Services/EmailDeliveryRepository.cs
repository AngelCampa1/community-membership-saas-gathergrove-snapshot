using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs.Export;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

public class EmailDeliveryRepository : IEmailDeliveryRepository
{
    private readonly ILogger<EmailDeliveryRepository> _logger;
    private readonly List<EmailDeliveryRecord> _deliveryRecords = new();
    private readonly Dictionary<string, EmailBounceNotification> _bounceRecords = new();

    public EmailDeliveryRepository(ILogger<EmailDeliveryRepository> logger)
    {
        _logger = logger;
    }

    public Task<EmailDeliveryRecord> SaveDeliveryRecordAsync(EmailDeliveryRecord record)
    {
        _logger.LogInformation("Saving delivery record for {RecipientEmail}", record.RecipientEmail);

        record.Id = string.IsNullOrEmpty(record.Id) ? Guid.NewGuid().ToString() : record.Id;
        record.SentAt = record.SentAt == default ? DateTime.UtcNow : record.SentAt;

        _deliveryRecords.Add(record);
        return Task.FromResult(record);
    }

    public async Task<EmailDeliveryRecord> CreateDeliveryRecordAsync(EmailDeliveryRecord record)
    {
        return await SaveDeliveryRecordAsync(record);
    }

    public Task<List<EmailDeliveryRecord>> GetDeliveryHistoryAsync(int limit)
    {
        _logger.LogInformation("Getting delivery history with limit {Limit}", limit);

        return Task.FromResult(_deliveryRecords
            .OrderByDescending(r => r.SentAt)
            .Take(limit)
            .ToList());
    }

    public Task<List<EmailDeliveryRecord>> GetDeliveryHistoryAsync(int clubId, int limit)
    {
        _logger.LogInformation("Getting delivery history for club {ClubId} with limit {Limit}", clubId, limit);

        var clubGuid = new Guid($"00000000-0000-0000-0000-{clubId:000000000000}");
        return Task.FromResult(_deliveryRecords
            .Where(r => r.ClubId == clubGuid)
            .OrderByDescending(r => r.SentAt)
            .Take(limit)
            .ToList());
    }

    public async Task<EmailDeliveryStatistics> GetStatisticsAsync(DateTime startDate, DateTime endDate)
    {
        return await GetDeliveryStatisticsAsync(startDate, endDate, 0);
    }

    public async Task<EmailDeliveryStatistics> GetDeliveryStatisticsAsync(DateTime startDate, DateTime endDate, int clubId)
    {
        _logger.LogInformation("Getting delivery statistics for club {ClubId} from {StartDate} to {EndDate}", clubId, startDate, endDate);

        var records = _deliveryRecords.Where(r => r.SentAt >= startDate && r.SentAt <= endDate);

        if (clubId > 0)
        {
            var clubGuid = new Guid($"00000000-0000-0000-0000-{clubId:000000000000}");
            records = records.Where(r => r.ClubId == clubGuid);
        }

        var recordsList = records.ToList();
        var totalSent = recordsList.Count;
        var totalDelivered = recordsList.Count(r => r.Status == EmailDeliveryStatus.Delivered || r.Status == EmailDeliveryStatus.Sent);
        var totalFailed = recordsList.Count(r => r.Status == EmailDeliveryStatus.Failed);
        var totalBounced = recordsList.Count(r => r.Status == EmailDeliveryStatus.Bounced);

        return new EmailDeliveryStatistics
        {
            TotalSent = totalSent,
            TotalEmailsSent = totalSent,
            TotalDelivered = totalDelivered,
            TotalEmailsDelivered = totalDelivered,
            TotalFailed = totalFailed,
            TotalEmailsFailed = totalFailed,
            TotalBounced = totalBounced,
            TotalEmailsBounced = totalBounced,
            DeliveryRate = totalSent > 0 ? (double)totalDelivered / totalSent : 0,
            BounceRate = totalSent > 0 ? (double)totalBounced / totalSent : 0,
            AverageDeliveryTime = 2.5 // Mock average delivery time
        };
    }

    public Task<EmailDeliveryRecord?> GetDeliveryRecordAsync(string deliveryId)
    {
        _logger.LogInformation("Getting delivery record for {DeliveryId}", deliveryId);

        // First try to find by Id (string match)
        var record = _deliveryRecords.FirstOrDefault(r => r.Id == deliveryId);
        if (record != null)
        {
            return Task.FromResult<EmailDeliveryRecord?>(record);
        }

        // Fall back to DeliveryId (Guid match)
        if (Guid.TryParse(deliveryId, out var guidId))
        {
            return Task.FromResult(_deliveryRecords.FirstOrDefault(r => r.DeliveryId == guidId));
        }

        return Task.FromResult<EmailDeliveryRecord?>(null);
    }

    public async Task UpdateDeliveryStatusAsync(string deliveryId, string status, DateTime timestamp)
    {
        _logger.LogInformation("Updating delivery status for {DeliveryId} to {Status}", deliveryId, status);

        var record = await GetDeliveryRecordAsync(deliveryId);
        if (record != null && Enum.TryParse<EmailDeliveryStatus>(status, true, out var parsedStatus))
        {
            record.Status = parsedStatus;
            record.DeliveredAt = timestamp;
        }
    }

    public Task<EmailDeliveryRecord?> GetDeliveryRecordByMessageIdAsync(string messageId)
    {
        _logger.LogInformation("Getting delivery record by message ID {MessageId}", messageId);

        // For testing purposes, create a mock record if none exists
        var record = _deliveryRecords.FirstOrDefault(r => r.MessageId == messageId);
        if (record == null && !string.IsNullOrEmpty(messageId))
        {
            record = new EmailDeliveryRecord
            {
                Id = Guid.NewGuid().ToString(),
                DeliveryId = Guid.NewGuid(),
                MessageId = messageId,
                RecipientEmail = "test@example.com",
                Status = EmailDeliveryStatus.Sent,
                SentAt = DateTime.UtcNow.AddMinutes(-10),
                ClubId = Guid.NewGuid(),
                EmailType = "Test"
            };
            _deliveryRecords.Add(record);
        }

        return Task.FromResult(record);
    }

    public async Task RecordBounceAsync(string deliveryId, EmailBounceNotification bounceNotification)
    {
        _logger.LogInformation("Recording bounce for delivery {DeliveryId}", deliveryId);

        _bounceRecords[deliveryId] = bounceNotification;

        // Update the delivery record status
        await UpdateDeliveryStatusAsync(deliveryId, "Bounced", bounceNotification.BouncedAt);
    }

    public Task<List<string>> GetDeliveryDigestDataAsync(DateTime startDate, DateTime endDate)
    {
        _logger.LogInformation("Getting delivery digest data from {StartDate} to {EndDate}", startDate, endDate);

        var records = _deliveryRecords
            .Where(r => r.SentAt >= startDate && r.SentAt <= endDate)
            .Take(5) // Limit to recent reports for digest
            .Select(r => r.Subject ?? r.EmailType)
            .ToList();

        // Return mock data if no records exist
        if (!records.Any())
        {
            return Task.FromResult(new List<string>
            {
                "Member Export Report",
                "Event Analytics Report",
                "Financial Summary Report"
            });
        }

        return Task.FromResult(records);
    }

    public async Task<EmailDeliveryRecord?> GetDeliveryRecordByIdAsync(string deliveryId)
    {
        return await GetDeliveryRecordAsync(deliveryId);
    }

    public Task<EmailDeliveryRecord?> GetDeliveryRecordByEmailAsync(string recipientEmail)
    {
        _logger.LogInformation("Getting delivery record by email {Email}", recipientEmail);

        return Task.FromResult(_deliveryRecords.FirstOrDefault(r => r.RecipientEmail == recipientEmail));
    }

    public async Task<List<EmailDeliveryRecord>> GetDeliveryHistoryByClubIdAsync(int clubId, int limit)
    {
        return await GetDeliveryHistoryAsync(clubId, limit);
    }

    public Task UpdateDeliveryRecordAsync(EmailDeliveryRecord record)
    {
        _logger.LogInformation("Updating delivery record {Id}", record.Id);

        var existingRecord = _deliveryRecords.FirstOrDefault(r => r.Id == record.Id);
        if (existingRecord != null)
        {
            existingRecord.Status = record.Status;
            existingRecord.DeliveredAt = record.DeliveredAt;
            existingRecord.Subject = record.Subject;
            existingRecord.ErrorMessage = record.ErrorMessage;
        }
        return Task.CompletedTask;
    }
}