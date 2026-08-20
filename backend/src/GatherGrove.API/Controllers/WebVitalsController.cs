using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for receiving Core Web Vitals metrics from the frontend
/// </summary>
[ApiController]
[Route("api/v1/analytics")]
public class WebVitalsController : ControllerBase
{
    private readonly ILogger<WebVitalsController> _logger;

    public WebVitalsController(ILogger<WebVitalsController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Receive web vitals metrics from the frontend
    /// </summary>
    /// <param name="request">Web vitals data</param>
    /// <returns>Acknowledgment</returns>
    [HttpPost("web-vitals")]
    [EnableRateLimiting("WebVitals")]
    public IActionResult TrackWebVitals([FromBody] WebVitalsRequest request)
    {
        try
        {
            // Validate the request
            if (request == null || string.IsNullOrEmpty(request.Name))
            {
                return BadRequest(new { success = false, message = "Invalid web vitals data" });
            }

            // Log the web vitals data for monitoring
            _logger.LogInformation(
                "Web Vital received: {MetricName} = {Value} ({Rating}) from {Url}",
                request.Name,
                request.Value,
                request.Rating ?? "unknown",
                request.Url ?? "unknown");

            // In production, you could:
            // 1. Store in Application Insights custom metrics
            // 2. Store in a database for trend analysis
            // 3. Forward to other analytics services

            return Ok(new { success = true, message = "Web vital recorded" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing web vitals data");
            return StatusCode(500, new { success = false, message = "An error occurred while processing web vitals" });
        }
    }
}

/// <summary>
/// Request model for web vitals metrics
/// </summary>
public class WebVitalsRequest
{
    /// <summary>
    /// The name of the metric (e.g., FCP, LCP, CLS, TTFB, FID, INP)
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The metric value
    /// </summary>
    public double Value { get; set; }

    /// <summary>
    /// The rating of the metric (good, needs-improvement, poor)
    /// </summary>
    public string? Rating { get; set; }

    /// <summary>
    /// The URL where the metric was captured
    /// </summary>
    public string? Url { get; set; }

    /// <summary>
    /// Timestamp when the metric was captured
    /// </summary>
    public long? Timestamp { get; set; }

    /// <summary>
    /// The unique ID for this metric instance
    /// </summary>
    public string? Id { get; set; }

    /// <summary>
    /// Navigation type (navigate, reload, back_forward, etc.)
    /// </summary>
    public string? NavigationType { get; set; }
}
