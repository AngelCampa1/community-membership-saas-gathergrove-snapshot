using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling marketing lead capture and analytics
/// </summary>
public interface IMarketingService
{
    /// <summary>
    /// Capture a marketing lead from the website
    /// </summary>
    /// <param name="request">Lead capture request</param>
    /// <returns>Lead capture response</returns>
    Task<CaptureLeadResponse> CaptureLeadAsync(CaptureLeadRequest request);

    /// <summary>
    /// Track an analytics event
    /// </summary>
    /// <param name="request">Analytics tracking request</param>
    /// <returns>Task representing the async operation</returns>
    Task TrackEventAsync(TrackAnalyticsRequest request);

    /// <summary>
    /// Get lead magnet content for download
    /// </summary>
    /// <param name="type">Type of lead magnet</param>
    /// <returns>Download URL and filename</returns>
    Task<(string downloadUrl, string fileName)> GetLeadMagnetAsync(string type);
}