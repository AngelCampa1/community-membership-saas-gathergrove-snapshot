using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;
using GatherGrove.API.Services;
using GatherGrove.API.Middleware;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for security monitoring and reporting
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Policy = "AdminOnly")]
[EnableRateLimiting("GeneralApi")]
public class SecurityController : ControllerBase
{
    private readonly ISecurityAuditService _securityAuditService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<SecurityController> _logger;
    private readonly IConfiguration _configuration;

    public SecurityController(
        ISecurityAuditService securityAuditService,
        IMemoryCache cache,
        ILogger<SecurityController> logger,
        IConfiguration configuration)
    {
        _securityAuditService = securityAuditService;
        _cache = cache;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Get recent security events
    /// </summary>
    /// <param name="hours">Number of hours to look back (default 24)</param>
    /// <returns>List of security events</returns>
    [HttpGet("events")]
    public async Task<ActionResult<List<SecurityEvent>>> GetSecurityEvents([FromQuery] int hours = 24)
    {
        try
        {
            var events = await _securityAuditService.GetRecentSecurityEventsAsync(hours);
            return Ok(events);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving security events");
            return StatusCode(500, "Error retrieving security events");
        }
    }

    /// <summary>
    /// Get threat summary for the last 24 hours
    /// </summary>
    /// <returns>Dictionary of threat types and counts</returns>
    [HttpGet("threat-summary")]
    public async Task<ActionResult<Dictionary<string, int>>> GetThreatSummary()
    {
        try
        {
            var summary = await _securityAuditService.GetThreatSummaryAsync();
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving threat summary");
            return StatusCode(500, "Error retrieving threat summary");
        }
    }

    /// <summary>
    /// Get security health status
    /// </summary>
    /// <returns>Security health information</returns>
    [HttpGet("health")]
    public async Task<ActionResult<object>> GetSecurityHealth()
    {
        try
        {
            var events = await _securityAuditService.GetRecentSecurityEventsAsync(24);
            var criticalEvents = events.Count(e => e.Severity == SecurityEventSeverity.Critical);
            var highEvents = events.Count(e => e.Severity == SecurityEventSeverity.High);
            var totalEvents = events.Count;

            var healthStatus = "Good";
            if (criticalEvents > 0)
                healthStatus = "Critical";
            else if (highEvents > 5)
                healthStatus = "Warning";
            else if (totalEvents > 100)
                healthStatus = "Elevated";

            return Ok(new
            {
                Status = healthStatus,
                TotalEvents = totalEvents,
                CriticalEvents = criticalEvents,
                HighSeverityEvents = highEvents,
                LastUpdated = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving security health status");
            return StatusCode(500, "Error retrieving security health status");
        }
    }

    /// <summary>
    /// Get rate limiting status and blocked IPs
    /// </summary>
    /// <returns>Rate limiting status information</returns>
    [HttpGet("rate-limit-status")]
    public ActionResult<object> GetRateLimitStatus()
    {
        try
        {
            var clientIp = GetClientIP();

            // Check if current IP or any IPs are blocked
            var blockedIPs = new List<object>();

            // In a real implementation, you'd iterate through known blocked IPs
            // For now, we'll check if the current IP is blocked
            var isCurrentIpBlocked = _cache.Get<IpBlockInfo>($"blocked_ip_{clientIp}") != null;

            var status = new
            {
                RateLimitingEnabled = true,
                WellKnownProtectionEnabled = true,
                CurrentClientIP = clientIp,
                IsCurrentIPBlocked = isCurrentIpBlocked,
                BlockedIPsCount = blockedIPs.Count,
                LastChecked = DateTime.UtcNow,
                Configuration = new
                {
                    WellKnownMaxRequests = 3,
                    WellKnownWindowMinutes = 60,
                    GeneralMaxRequests = 1000,
                    GeneralWindowMinutes = 60
                }
            };

            _logger.LogInformation("📊 Rate limit status requested by admin from IP {IP}", clientIp);

            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving rate limit status");
            return StatusCode(500, "Error retrieving rate limit status");
        }
    }

    /// <summary>
    /// Test .well-known rate limiting by simulating requests
    /// </summary>
    /// <returns>Test results</returns>
    [HttpPost("test-wellknown-protection")]
    public ActionResult<object> TestWellKnownProtection()
    {
        try
        {
            var clientIp = GetClientIP();
            var testKey = $"wellknown_rate_{clientIp}";
            var currentInfo = _cache.Get<WellKnownRequestInfo>(testKey);

            var testResult = new
            {
                ClientIP = clientIp,
                CurrentRequestCount = currentInfo?.RequestCount ?? 0,
                MaxAllowed = 3,
                WindowMinutes = 60,
                IsBlocked = currentInfo?.RequestCount >= 3,
                WindowStart = currentInfo?.WindowStart,
                LastRequest = currentInfo?.LastRequest,
                TestNote = "This is a simulation - actual .well-known requests would be rate limited",
                Timestamp = DateTime.UtcNow
            };

            _logger.LogInformation("🧪 .well-known protection test performed by admin from IP {IP}", clientIp);

            return Ok(testResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during .well-known protection test");
            return StatusCode(500, "Error during .well-known protection test");
        }
    }

    private string GetClientIP()
    {
        return RequestClientIpResolver.GetClientIp(HttpContext, _configuration);
    }
}
