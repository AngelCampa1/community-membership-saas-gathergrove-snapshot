using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using GatherGrove.Application.Services.TierValidation;
using GatherGrove.Application.Services.Branding;
using GatherGrove.Application.DTOs.Branding;

namespace GatherGrove.Application.Services.Wrappers;

/// <summary>
/// Tier-aware wrapper for BrandingService
/// White-label branding is exclusive to Expand tier
/// Prevents resource allocation for branding features on non-Expand clubs
/// </summary>
public class TierAwareBrandingService : IBrandingService
{
    private readonly IBrandingService _innerService;
    private readonly ITierGateService _tierGateService;
    private readonly ILogger<TierAwareBrandingService> _logger;

    public TierAwareBrandingService(
        IBrandingService innerService,
        ITierGateService tierGateService,
        ILogger<TierAwareBrandingService> logger)
    {
        _innerService = innerService;
        _tierGateService = tierGateService;
        _logger = logger;
    }

    /// <summary>
    /// Gets branding settings with tier validation
    /// Even retrieving branding settings should be limited to Expand tier
    /// </summary>
    public async Task<BrandingResponse> GetBrandingAsync(int clubId, int userId)
    {

        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from branding access - feature not available for basic tier", clubId);
            throw new UnauthorizedAccessException("White-label branding requires Expand tier subscription");
        }

        return await _innerService.GetBrandingAsync(clubId, userId);
    }

    /// <summary>
    /// Creates branding with tier validation
    /// Prevents resource allocation for branding setup and file storage
    /// </summary>
    public async Task<BrandingResponse> CreateBrandingAsync(int clubId, int userId, CreateBrandingRequest request)
    {

        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from branding creation - preventing resource allocation", clubId);
            throw new UnauthorizedAccessException("White-label branding creation requires Expand tier subscription");
        }

        // Validate resource allocation for branding operations
        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = 1, // Basic database operations
            CacheSize = 50, // Branding cache
            BackgroundProcessing = false // Branding creation is synchronous
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.CreateBrandingAsync(clubId, userId, request);
    }

    /// <summary>
    /// Updates branding with tier validation
    /// Branding updates can involve file operations and CSS processing
    /// </summary>
    public async Task<BrandingResponse> UpdateBrandingAsync(int clubId, int userId, UpdateBrandingRequest request)
    {

        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from branding update - unauthorized tier", clubId);
            throw new UnauthorizedAccessException("White-label branding updates require Expand tier subscription");
        }

        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = 2, // Update operations
            CacheSize = 75, // Updated branding cache
            BackgroundProcessing = false
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.UpdateBrandingAsync(clubId, userId, request);
    }

    /// <summary>
    /// Deletes branding with tier validation
    /// Includes cleanup of file storage resources
    /// </summary>
    public async Task DeleteBrandingAsync(int clubId, int userId)
    {

        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from branding deletion - feature not available", clubId);
            throw new UnauthorizedAccessException("White-label branding deletion requires Expand tier subscription");
        }

        await _innerService.DeleteBrandingAsync(clubId, userId);
    }

    /// <summary>
    /// Uploads logo with tier validation
    /// Logo uploads involve file processing, storage, and potential image optimization
    /// </summary>
    public async Task<LogoUploadResponse> UploadLogoAsync(int clubId, int userId, IFormFile file)
    {

        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from logo upload - preventing file processing resources", clubId);
            throw new UnauthorizedAccessException("Logo upload requires Expand tier subscription");
        }

        // File uploads can be resource intensive
        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = 2, // File metadata operations
            CacheSize = 100, // File caching
            BackgroundProcessing = false // File upload is synchronous
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.UploadLogoAsync(clubId, userId, file);
    }

    /// <summary>
    /// Uploads favicon with tier validation
    /// Similar to logo upload but specific to favicon processing
    /// </summary>
    public async Task<FaviconUploadResponse> UploadFaviconAsync(int clubId, int userId, IFormFile file)
    {

        if (!await _tierGateService.ValidateUnlimitedAccessAsync(clubId))
        {
            _logger.LogInformation("Club {ClubId} blocked from favicon upload - file processing optimization", clubId);
            throw new UnauthorizedAccessException("Favicon upload requires Expand tier subscription");
        }

        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = 2,
            CacheSize = 50, // Favicons are smaller
            BackgroundProcessing = false
        };

        await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        return await _innerService.UploadFaviconAsync(clubId, userId, file);
    }
}