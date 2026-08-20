using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling application feedback submissions
/// </summary>
public interface IFeedbackService
{
    /// <summary>
    /// Submits feedback and sends email notification
    /// </summary>
    /// <param name="request">The feedback request</param>
    /// <param name="userId">User ID if authenticated (null for guests)</param>
    /// <param name="ipAddress">Client IP address</param>
    /// <param name="userAgent">Client user agent string</param>
    /// <returns>Response indicating success or failure</returns>
    Task<AppFeedbackResponse> SubmitFeedbackAsync(
        SubmitAppFeedbackRequest request,
        int? userId,
        string? ipAddress,
        string? userAgent);
}
