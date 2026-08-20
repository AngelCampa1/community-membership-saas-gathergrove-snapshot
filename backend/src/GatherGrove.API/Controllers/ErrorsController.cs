using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for handling error logging from frontend
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class ErrorsController : ControllerBase
{
    private readonly IErrorLoggingService _errorLoggingService;
    private readonly IWebHostEnvironment _environment;

    public ErrorsController(IErrorLoggingService errorLoggingService, IWebHostEnvironment environment)
    {
        _errorLoggingService = errorLoggingService;
        _environment = environment;
    }

    /// <summary>
    /// Log an error from the frontend to the database (development only)
    /// </summary>
    /// <param name="request">Frontend error log request</param>
    /// <returns>Success response</returns>
    [HttpPost("log")]
    public async Task<IActionResult> LogError([FromBody] FrontendErrorLogRequest request)
    {
        // Only allow error logging in development environment
        if (!_environment.IsDevelopment())
        {
            return NotFound(); // Hide this endpoint in production
        }

        try
        {
            await _errorLoggingService.LogErrorAsync(
                message: request.Message,
                source: "Frontend",
                stackTrace: request.StackTrace,
                level: request.Level,
                userId: request.UserId,
                userAgent: request.UserAgent,
                additionalData: request.AdditionalData
            );

            return Ok(new { message = "Error logged successfully" });
        }
        catch (Exception ex)
        {
            // Don't let logging errors break the API
            return StatusCode(500, new { message = "Failed to log error" });
        }
    }
}

/// <summary>
/// Request model for frontend error logging
/// </summary>
public class FrontendErrorLogRequest
{
    public string Level { get; set; } = "Error";
    public string Message { get; set; } = string.Empty;
    public string? Exception { get; set; }
    public string? StackTrace { get; set; }
    public string? UserId { get; set; }
    public string? UserAgent { get; set; }
    public string? Url { get; set; }
    public Dictionary<string, object>? AdditionalData { get; set; }
}