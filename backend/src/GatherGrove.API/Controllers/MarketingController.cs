using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for handling marketing operations (public endpoints for lead capture and analytics)
/// </summary>
[ApiController]
[Route("api/v1/marketing")]
[AllowAnonymous] // Marketing endpoints are public - used on landing pages before authentication
public class MarketingController : ControllerBase
{
    private readonly IMarketingService _marketingService;
    private readonly IPdfGenerationService _pdfGenerationService;
    private readonly ITurnstileVerificationService _turnstileVerificationService;
    private readonly IMarketingLeadRateLimiter _leadRateLimiter;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MarketingController> _logger;

    public MarketingController(
        IMarketingService marketingService,
        IPdfGenerationService pdfGenerationService,
        ITurnstileVerificationService turnstileVerificationService,
        IMarketingLeadRateLimiter leadRateLimiter,
        IConfiguration configuration,
        ILogger<MarketingController> logger)
    {
        _marketingService = marketingService;
        _pdfGenerationService = pdfGenerationService;
        _turnstileVerificationService = turnstileVerificationService;
        _leadRateLimiter = leadRateLimiter;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Return the public Turnstile site key used by marketing forms.
    /// </summary>
    /// <returns>Public Turnstile site key.</returns>
    [HttpGet("turnstile/site-key")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    public IActionResult GetTurnstileSiteKey()
    {
        var siteKey = FirstConfiguredValue(
            _configuration["Turnstile:SiteKey"],
            Environment.GetEnvironmentVariable("TURNSTILE_SITE_KEY"),
            Environment.GetEnvironmentVariable("PUBLIC_TURNSTILE_SITE_KEY"),
            Environment.GetEnvironmentVariable("NEXT_PUBLIC_TURNSTILE_SITE_KEY"));

        if (string.IsNullOrWhiteSpace(siteKey))
        {
            return NotFound(new { message = "Turnstile site key is not configured." });
        }

        return Ok(new { siteKey });
    }

    private static string? FirstConfiguredValue(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }

    /// <summary>
    /// Capture a marketing lead from the website
    /// </summary>
    /// <param name="request">Lead capture request</param>
    /// <returns>Lead capture response</returns>
    [HttpPost("leads")]
    [ProducesResponseType(typeof(CaptureLeadResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<CaptureLeadResponse>> CaptureLeadAsync([FromBody] CaptureLeadRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!string.IsNullOrWhiteSpace(request.CompanyWebsite))
            {
                return Ok(new CaptureLeadResponse
                {
                    Success = true,
                    Message = "Thank you for your interest! We'll be in touch soon."
                });
            }

            var remoteIp = RequestClientIpResolver.GetClientIp(HttpContext, _configuration);
            if (!await _turnstileVerificationService.VerifyAsync(
                    request.TurnstileToken,
                    remoteIp,
                    HttpContext.RequestAborted))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new CaptureLeadResponse
                {
                    Success = false,
                    Message = "Unable to verify this submission. Please refresh and try again."
                });
            }

            var rateLimit = await _leadRateLimiter.CheckAsync(request.Email, HttpContext.RequestAborted);
            if (!rateLimit.IsAllowed)
            {
                Response.Headers.RetryAfter = Math.Ceiling(rateLimit.RetryAfter.TotalSeconds).ToString("0");
                return StatusCode(StatusCodes.Status429TooManyRequests, new CaptureLeadResponse
                {
                    Success = false,
                    Message = "Too many requests. Please try again later."
                });
            }

            var response = await _marketingService.CaptureLeadAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error capturing marketing lead");
            return StatusCode(500, new CaptureLeadResponse
            {
                Success = false,
                Message = "An error occurred while processing your request."
            });
        }
    }

    /// <summary>
    /// Track an analytics event
    /// </summary>
    /// <param name="request">Analytics tracking request</param>
    /// <returns>Success response</returns>
    [HttpPost("analytics")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> TrackEventAsync([FromBody] TrackAnalyticsRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _marketingService.TrackEventAsync(request);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking analytics event");
            // Don't return error for analytics - fail silently
            return Ok(new { success = false });
        }
    }

    /// <summary>
    /// Get lead magnet download information
    /// </summary>
    /// <param name="type">Type of lead magnet</param>
    /// <returns>Download URL and filename</returns>
    [HttpGet("lead-magnets/{type}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetLeadMagnetAsync(string type)
    {
        try
        {
            var (downloadUrl, fileName) = await _marketingService.GetLeadMagnetAsync(type);
            return Ok(new { downloadUrl, fileName });
        }
        catch (ArgumentException)
        {
            return NotFound(new { error = "Lead magnet type not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting lead magnet for type: {Type}", type);
            return StatusCode(500, new { error = "An error occurred while processing your request." });
        }
    }

    /// <summary>
    /// Download the Club Management Checklist PDF
    /// </summary>
    /// <returns>PDF file</returns>
    [HttpGet("lead-magnets/club-management-checklist/download")]
    [ProducesResponseType(typeof(FileResult), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DownloadClubManagementChecklistAsync()
    {
        try
        {
            var pdfContent = await _pdfGenerationService.GenerateClubManagementChecklistPdfAsync();
            return File(pdfContent, "application/pdf", "Ultimate Club Management Checklist.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading club management checklist");
            return StatusCode(500, new { error = "Unable to generate PDF. Please try again later." });
        }
    }

    /// <summary>
    /// Download a template PDF by slug
    /// </summary>
    /// <param name="slug">Kebab-case template identifier</param>
    /// <returns>PDF file</returns>
    [HttpGet("templates/{slug}/download")]
    [ProducesResponseType(typeof(FileResult), 200)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> DownloadTemplateAsync(string slug)
    {
        try
        {
            var pdfContent = await _pdfGenerationService.GenerateTemplatePdfAsync(slug);
            var fileName = System.Globalization.CultureInfo.CurrentCulture.TextInfo
                .ToTitleCase(slug.Replace('-', ' ')) + ".pdf";
            return File(pdfContent, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading template: {Slug}", slug);
            return StatusCode(500, new { error = "Unable to generate PDF. Please try again later." });
        }
    }

}
