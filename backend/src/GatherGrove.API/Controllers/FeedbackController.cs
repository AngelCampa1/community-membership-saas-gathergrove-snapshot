using System.Security.Claims;
using GatherGrove.API.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for handling application feedback submissions
/// </summary>
[ApiController]
[Route("api/v1/feedback")]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;
    private readonly ITurnstileVerificationService _turnstileVerificationService;
    private readonly IMarketingLeadRateLimiter _rateLimiter;
    private readonly IConfiguration _configuration;
    private readonly ILogger<FeedbackController> _logger;

    public FeedbackController(
        IFeedbackService feedbackService,
        ITurnstileVerificationService turnstileVerificationService,
        IMarketingLeadRateLimiter rateLimiter,
        IConfiguration configuration,
        ILogger<FeedbackController> logger)
    {
        _feedbackService = feedbackService;
        _turnstileVerificationService = turnstileVerificationService;
        _rateLimiter = rateLimiter;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Submit feedback about the application
    /// Accessible to both authenticated users and guests
    /// </summary>
    /// <param name="request">Feedback submission request</param>
    /// <returns>Response indicating success or failure</returns>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AppFeedbackResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AppFeedbackResponse>> SubmitFeedback(
        [FromBody] SubmitAppFeedbackRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!string.IsNullOrWhiteSpace(request.CompanyWebsite))
            {
                return Ok(new AppFeedbackResponse
                {
                    Success = true,
                    Message = "Thank you for your feedback!"
                });
            }

            // Get user ID if authenticated
            int? userId = null;
            var isAuthenticated = User.Identity?.IsAuthenticated == true;
            if (isAuthenticated)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var id))
                {
                    userId = id;
                }
            }

            // Get client IP and user agent
            var ipAddress = RequestClientIpResolver.GetClientIp(HttpContext, _configuration);
            var userAgent = Request.Headers.UserAgent.ToString();

            if (!isAuthenticated)
            {
                if (!await _turnstileVerificationService.VerifyAsync(
                        request.TurnstileToken,
                        ipAddress,
                        HttpContext.RequestAborted))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new AppFeedbackResponse
                    {
                        Success = false,
                        Message = "Unable to verify this submission. Please refresh and try again."
                    });
                }

                var limiterKey = !string.IsNullOrWhiteSpace(request.Email)
                    ? request.Email
                    : $"ip:{ipAddress}";
                var rateLimit = await _rateLimiter.CheckAsync(limiterKey, HttpContext.RequestAborted);
                if (!rateLimit.IsAllowed)
                {
                    Response.Headers.RetryAfter = Math.Ceiling(rateLimit.RetryAfter.TotalSeconds).ToString("0");
                    return StatusCode(StatusCodes.Status429TooManyRequests, new AppFeedbackResponse
                    {
                        Success = false,
                        Message = "Too many requests. Please try again later."
                    });
                }
            }

            var result = await _feedbackService.SubmitFeedbackAsync(
                request, userId, ipAddress, userAgent);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting feedback");
            return StatusCode(500, new AppFeedbackResponse
            {
                Success = false,
                Message = "An error occurred while submitting your feedback. Please try again."
            });
        }
    }
}
