using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for tracking and analyzing communication metrics
/// </summary>
public class CommunicationAnalyticsService : ICommunicationAnalyticsService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<CommunicationAnalyticsService> _logger;

    public CommunicationAnalyticsService(
        GatherGroveDbContext context,
        ILogger<CommunicationAnalyticsService> _logger)
    {
        _context = context;
        this._logger = _logger;
    }

    public async Task<CommunicationAnalyticsResponse> GetAnalyticsSummaryAsync(int clubId, AnalyticsFilterRequest request)
    {
        var query = _context.CommunicationsLogs
            .Where(c => c.ClubId == clubId);

        if (request.StartDate.HasValue)
        {
            query = query.Where(c => c.SentAt >= request.StartDate.Value);
        }

        if (request.EndDate.HasValue)
        {
            query = query.Where(c => c.SentAt <= request.EndDate.Value);
        }

        if (!string.IsNullOrEmpty(request.CommunicationType))
        {
            query = query.Where(c => c.CommunicationType == request.CommunicationType);
        }

        if (request.TemplateId.HasValue)
        {
            query = query.Where(c => c.TemplateId == request.TemplateId.Value);
        }

        if (request.SegmentId.HasValue)
        {
            query = query.Where(c => c.SegmentId == request.SegmentId.Value);
        }

        var communications = await query.Select(c => c.Id).ToListAsync();

        var analytics = await _context.CommunicationAnalytics
            .Where(a => communications.Contains(a.CommunicationId))
            .ToListAsync();

        var totalSent = analytics.Count;
        var opened = analytics.Count(a => a.OpenedAt != null);
        var clicked = analytics.Count(a => a.ClickedAt != null);
        var bounced = analytics.Count(a => a.BouncedAt != null);
        var unsubscribed = analytics.Count(a => a.UnsubscribedAt != null);

        return new CommunicationAnalyticsResponse
        {
            CommunicationId = 0, // Summary across all
            TotalSent = totalSent,
            TotalDelivered = totalSent - bounced,
            TotalOpened = opened,
            TotalClicked = clicked,
            TotalUnsubscribed = unsubscribed,
            TotalBounced = bounced,
            DeliveryRate = totalSent > 0 ? (decimal)(totalSent - bounced) / totalSent * 100 : 0,
            OpenRate = totalSent > 0 ? (decimal)opened / totalSent * 100 : 0,
            ClickRate = totalSent > 0 ? (decimal)clicked / totalSent * 100 : 0,
            UnsubscribeRate = totalSent > 0 ? (decimal)unsubscribed / totalSent * 100 : 0,
            BounceRate = totalSent > 0 ? (decimal)bounced / totalSent * 100 : 0
        };
    }

    public async Task<CommunicationDetailsResponse> GetCommunicationDetailsAsync(int clubId, int communicationId)
    {
        var communication = await _context.CommunicationsLogs
            .FirstOrDefaultAsync(c => c.Id == communicationId && c.ClubId == clubId);

        if (communication == null)
        {
            throw new ArgumentException("Communication not found");
        }

        var analytics = await _context.CommunicationAnalytics
            .Where(a => a.CommunicationId == communicationId)
            .ToListAsync();

        var totalSent = analytics.Count;
        var delivered = analytics.Count(a => a.BouncedAt == null);
        var opened = analytics.Count(a => a.OpenedAt != null);
        var clicked = analytics.Count(a => a.ClickedAt != null);
        var unsubscribed = analytics.Count(a => a.UnsubscribedAt != null);
        var bounced = analytics.Count(a => a.BouncedAt != null);

        return new CommunicationDetailsResponse
        {
            CommunicationId = communicationId,
            CommunicationType = communication.CommunicationType,
            Subject = communication.Subject,
            SentAt = communication.SentAt,
            RecipientCount = totalSent,
            DeliveredCount = delivered,
            OpenedCount = opened,
            ClickedCount = clicked,
            UnsubscribedCount = unsubscribed,
            BouncedCount = bounced,
            DeliveryRate = totalSent > 0 ? (decimal)delivered / totalSent * 100 : 0,
            OpenRate = totalSent > 0 ? (decimal)opened / totalSent * 100 : 0,
            ClickRate = totalSent > 0 ? (decimal)clicked / totalSent * 100 : 0,
            Recipients = analytics.Select(a => new RecipientEngagement
            {
                MemberId = a.MemberId,
                MemberName = "Member " + a.MemberId,
                Email = "",
                Delivered = a.BouncedAt == null,
                Opened = a.OpenedAt != null,
                Clicked = a.ClickedAt != null,
                Unsubscribed = a.UnsubscribedAt != null,
                Bounced = a.BouncedAt != null,
                OpenedAt = a.OpenedAt,
                ClickedAt = a.ClickedAt
            }).ToList()
        };
    }

    public async Task TrackEmailOpenAsync(TrackEmailOpenRequest request)
    {
        var analytic = await _context.CommunicationAnalytics
            .FirstOrDefaultAsync(a => a.Id.ToString() == request.TrackingId);

        if (analytic == null)
        {
            _logger.LogWarning("Analytics record not found for tracking ID {TrackingId}", request.TrackingId);
            return;
        }

        if (analytic.OpenedAt == null)
        {
            analytic.OpenedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Tracked open for communication {CommunicationId}", analytic.CommunicationId);
        }
    }

    public async Task TrackLinkClickAsync(TrackLinkClickRequest request)
    {
        var analytic = await _context.CommunicationAnalytics
            .FirstOrDefaultAsync(a => a.Id.ToString() == request.TrackingId);

        if (analytic == null)
        {
            _logger.LogWarning("Analytics record not found for tracking ID {TrackingId}", request.TrackingId);
            return;
        }

        if (analytic.ClickedAt == null)
        {
            analytic.ClickedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Tracked click for communication {CommunicationId} on link {Link}",
                analytic.CommunicationId, request.LinkUrl);
        }
    }

    public async Task CreateAnalyticsRecordAsync(int communicationId, int memberId, string trackingId,
        int? templateId = null, int? abTestCampaignId = null, string? variantName = null)
    {
        var analytic = new CommunicationAnalytics
        {
            CommunicationId = communicationId,
            MemberId = memberId,
            SentAt = DateTime.UtcNow
        };

        _context.CommunicationAnalytics.Add(analytic);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created analytics record for communication {CommunicationId} and member {MemberId}",
            communicationId, memberId);
    }
}
