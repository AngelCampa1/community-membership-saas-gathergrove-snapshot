using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing A/B test campaigns
/// </summary>
public interface IABTestingService
{
    /// <summary>
    /// Creates a new A/B test campaign
    /// </summary>
    Task<ABTestCampaignResponse> CreateCampaignAsync(int clubId, int userId, CreateABTestCampaignRequest request);

    /// <summary>
    /// Gets an A/B test campaign by ID
    /// </summary>
    Task<ABTestCampaignResponse> GetCampaignAsync(int clubId, int campaignId);

    /// <summary>
    /// Gets all A/B test campaigns for a club
    /// </summary>
    Task<List<ABTestCampaignResponse>> GetCampaignsAsync(int clubId);

    /// <summary>
    /// Starts an A/B test campaign
    /// </summary>
    Task<ABTestCampaignResponse> StartCampaignAsync(int clubId, int campaignId, StartABTestRequest request);

    /// <summary>
    /// Gets results for an A/B test campaign
    /// </summary>
    Task<ABTestResultsResponse> GetCampaignResultsAsync(int clubId, int campaignId);

    /// <summary>
    /// Determines the winner of an A/B test
    /// </summary>
    Task<ABTestCampaignResponse> DetermineWinnerAsync(int clubId, int campaignId);
}

