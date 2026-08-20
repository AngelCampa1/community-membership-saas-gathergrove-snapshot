using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing A/B testing campaigns for communications
/// </summary>
public class ABTestingService : IABTestingService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<ABTestingService> _logger;

    public ABTestingService(
        GatherGroveDbContext context,
        ILogger<ABTestingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ABTestCampaignResponse> CreateCampaignAsync(int clubId, int userId, CreateABTestCampaignRequest request)
    {
        _logger.LogInformation("Creating A/B test campaign for club {ClubId}", clubId);

        // Validate templates exist
        var variantA = await _context.EmailTemplates.FindAsync(request.VariantATemplateId!.Value);
        var variantB = await _context.EmailTemplates.FindAsync(request.VariantBTemplateId!.Value);

        if (variantA == null || variantB == null)
        {
            throw new ArgumentException("One or both template variants not found");
        }

        if (variantA.ClubId != clubId || variantB.ClubId != clubId)
        {
            throw new InvalidOperationException("Templates must belong to the specified club");
        }

        var campaign = new ABTestCampaign
        {
            ClubId = clubId,
            CampaignName = request.CampaignName,
            VariantATemplateId = request.VariantATemplateId!.Value,
            VariantBTemplateId = request.VariantBTemplateId!.Value,
            TestPercentage = request.TestPercentage,
            CreatedAt = DateTime.UtcNow
        };

        _context.ABTestCampaigns.Add(campaign);
        await _context.SaveChangesAsync();

        return MapToResponse(campaign);
    }

    public async Task<ABTestCampaignResponse> GetCampaignAsync(int clubId, int campaignId)
    {
        var campaign = await _context.ABTestCampaigns
            .Include(c => c.VariantATemplate)
            .Include(c => c.VariantBTemplate)
            .FirstOrDefaultAsync(c => c.Id == campaignId && c.ClubId == clubId);

        if (campaign == null)
        {
            throw new ArgumentException("Campaign not found");
        }

        return MapToResponse(campaign);
    }

    public async Task<List<ABTestCampaignResponse>> GetCampaignsAsync(int clubId)
    {
        var campaigns = await _context.ABTestCampaigns
            .Where(c => c.ClubId == clubId)
            .Include(c => c.VariantATemplate)
            .Include(c => c.VariantBTemplate)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return campaigns.Select(c => MapToResponse(c)).ToList();
    }

    public async Task<ABTestCampaignResponse> StartCampaignAsync(int clubId, int campaignId, StartABTestRequest request)
    {
        var campaign = await _context.ABTestCampaigns
            .Include(c => c.VariantATemplate)
            .Include(c => c.VariantBTemplate)
            .FirstOrDefaultAsync(c => c.Id == campaignId && c.ClubId == clubId);

        if (campaign == null)
        {
            throw new ArgumentException("Campaign not found");
        }

        // Validate campaign can be started
        if (campaign.Status == "Running")
        {
            throw new InvalidOperationException("Campaign is already running");
        }

        if (campaign.Status == "Completed" || campaign.Status == "Cancelled")
        {
            throw new InvalidOperationException($"Cannot start a {campaign.Status.ToLower()} campaign");
        }

        // Validate both variants are configured
        if (campaign.VariantATemplateId == null || campaign.VariantBTemplateId == null)
        {
            throw new InvalidOperationException("Both variant templates must be configured before starting the campaign");
        }

        // Validate variants exist
        if (campaign.VariantATemplate == null || campaign.VariantBTemplate == null)
        {
            throw new InvalidOperationException("One or both template variants not found");
        }

        // Set campaign status and timestamps
        campaign.Status = "Running";
        campaign.StartedAt = request.ScheduledFor ?? DateTime.UtcNow;
        campaign.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Started A/B test campaign {CampaignId} for club {ClubId}. Variant A: Template {VariantA}, Variant B: Template {VariantB}, Test Percentage: {TestPercentage}%",
            campaignId,
            clubId,
            campaign.VariantATemplateId,
            campaign.VariantBTemplateId,
            campaign.TestPercentage);

        return MapToResponse(campaign);
    }

    public async Task<ABTestCampaignResponse> DetermineWinnerAsync(int clubId, int campaignId)
    {
        var campaign = await _context.ABTestCampaigns
            .FirstOrDefaultAsync(c => c.Id == campaignId && c.ClubId == clubId);

        if (campaign == null)
        {
            throw new ArgumentException("Campaign not found");
        }

        if (campaign.EndedAt != null)
        {
            throw new InvalidOperationException("Campaign has already ended");
        }

        // BUG FIX: Validate that both variant template IDs are set before determining winner
        if (!campaign.VariantATemplateId.HasValue || !campaign.VariantBTemplateId.HasValue)
        {
            throw new InvalidOperationException("Campaign is missing variant template IDs");
        }

        // Get results for both variants
        var variantAStats = await GetVariantStatsAsync(campaign.VariantATemplateId.Value);
        var variantBStats = await GetVariantStatsAsync(campaign.VariantBTemplateId.Value);

        // Determine winner based on open rate
        int winnerId = variantAStats.OpenRate >= variantBStats.OpenRate
            ? campaign.VariantATemplateId.Value
            : campaign.VariantBTemplateId.Value;

        campaign.WinnerId = winnerId;
        campaign.EndedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("A/B test campaign {CampaignId} winner determined: Template {WinnerId}",
            campaignId, winnerId);

        return MapToResponse(campaign);
    }

    public async Task<ABTestCampaignResponse> ManualSelectWinnerAsync(int clubId, int campaignId, int winnerTemplateId)
    {
        var campaign = await _context.ABTestCampaigns
            .FirstOrDefaultAsync(c => c.Id == campaignId && c.ClubId == clubId);

        if (campaign == null)
        {
            throw new ArgumentException("Campaign not found");
        }

        if (campaign.EndedAt != null)
        {
            throw new InvalidOperationException("Campaign has already ended");
        }

        if (winnerTemplateId != campaign.VariantATemplateId!.Value && winnerTemplateId != campaign.VariantBTemplateId!.Value)
        {
            throw new ArgumentException("Winner must be one of the test variants");
        }

        campaign.WinnerId = winnerTemplateId;
        campaign.EndedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("A/B test campaign {CampaignId} completed with winner {WinnerId}", campaignId, winnerTemplateId);

        return MapToResponse(campaign);
    }

    public async Task<ABTestResultsResponse> GetCampaignResultsAsync(int clubId, int campaignId)
    {
        var campaign = await _context.ABTestCampaigns
            .FirstOrDefaultAsync(c => c.Id == campaignId && c.ClubId == clubId);

        if (campaign == null)
        {
            throw new ArgumentException("Campaign not found");
        }

        // Get analytics for both variants
        var variantAStats = await GetVariantStatsAsync(campaign.VariantATemplateId!.Value);
        var variantBStats = await GetVariantStatsAsync(campaign.VariantBTemplateId!.Value);

        return new ABTestResultsResponse
        {
            CampaignId = campaign.Id,
            CampaignName = campaign.CampaignName,
            VariantA = variantAStats,
            VariantB = variantBStats,
            TestPercentage = campaign.TestPercentage,
            WinnerId = campaign.WinnerId,
            IsComplete = campaign.EndedAt != null
        };
    }

    public async Task DeleteCampaignAsync(int clubId, int campaignId)
    {
        var campaign = await _context.ABTestCampaigns
            .FirstOrDefaultAsync(c => c.Id == campaignId && c.ClubId == clubId);

        if (campaign == null)
        {
            throw new ArgumentException("Campaign not found");
        }

        _context.ABTestCampaigns.Remove(campaign);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted A/B test campaign {CampaignId}", campaignId);
    }

    private async Task<VariantStatsResponse> GetVariantStatsAsync(int templateId)
    {
        // Get communication logs that used this template
        var communications = await _context.CommunicationsLogs
            .Where(c => c.TemplateId == templateId)
            .Select(c => c.Id)
            .ToListAsync();

        if (!communications.Any())
        {
            return new VariantStatsResponse
            {
                TemplateId = templateId,
                TotalSent = 0,
                OpenRate = 0,
                ClickRate = 0
            };
        }

        // Get analytics for these communications
        var analytics = await _context.CommunicationAnalytics
            .Where(a => communications.Contains(a.CommunicationId))
            .ToListAsync();

        var totalSent = analytics.Count;
        var opened = analytics.Count(a => a.OpenedAt != null);
        var clicked = analytics.Count(a => a.ClickedAt != null);

        return new VariantStatsResponse
        {
            TemplateId = templateId,
            TotalSent = totalSent,
            TotalOpened = opened,
            TotalClicked = clicked,
            OpenRate = totalSent > 0 ? (decimal)opened / totalSent * 100 : 0,
            ClickRate = totalSent > 0 ? (decimal)clicked / totalSent * 100 : 0
        };
    }

    private ABTestCampaignResponse MapToResponse(ABTestCampaign campaign)
    {
        return new ABTestCampaignResponse
        {
            Id = campaign.Id,
            ClubId = campaign.ClubId,
            CampaignName = campaign.CampaignName,
            Description = campaign.Description,
            TestType = campaign.TestType,
            Status = campaign.Status,
            VariantATemplateId = campaign.VariantATemplateId ?? 0,
            VariantBTemplateId = campaign.VariantBTemplateId ?? 0,
            TestPercentage = campaign.TestPercentage,
            MinimumSampleSize = campaign.MinimumSampleSize,
            ConfidenceLevel = campaign.ConfidenceLevel,
            SegmentId = campaign.SegmentId,
            WinnerId = campaign.WinnerId,
            WinnerVariant = campaign.WinnerVariant,
            StatisticalSignificance = campaign.StatisticalSignificance,
            StartedAt = campaign.StartedAt,
            EndedAt = campaign.EndedAt,
            CreatedAt = campaign.CreatedAt,
            UpdatedAt = campaign.UpdatedAt
        };
    }
}

