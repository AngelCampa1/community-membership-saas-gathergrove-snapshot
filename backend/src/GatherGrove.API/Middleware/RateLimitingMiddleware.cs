using Microsoft.Extensions.Caching.Memory;
using GatherGrove.API.Services;
using System.Collections.Concurrent;
using System.Net;
using System.Text.Json;

namespace GatherGrove.API.Middleware
{
    /// <summary>
    /// Rate limiting middleware with special protection for .well-known endpoints
    /// </summary>
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RateLimitingMiddleware> _logger;
        private readonly IMemoryCache _cache;
        private readonly IConfiguration _configuration;
        private readonly RateLimitConfiguration _config;
        private readonly ConcurrentDictionary<string, SuspiciousIpInfo> _suspiciousIPs;

        public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger,
            IMemoryCache cache, IConfiguration configuration)
        {
            _next = next;
            _logger = logger;
            _cache = cache;
            _configuration = configuration;
            _config = new RateLimitConfiguration(configuration);
            _suspiciousIPs = new ConcurrentDictionary<string, SuspiciousIpInfo>();
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var clientIp = GetClientIP(context);
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
            var userAgent = context.Request.Headers.UserAgent.ToString();

            // Check if IP is blocked
            if (IsIpBlocked(clientIp))
            {
                _logger.LogWarning("🚫 Blocked request from banned IP {IP} to {Path}", clientIp, path);
                context.Response.StatusCode = 429;
                await context.Response.WriteAsync("Rate limit exceeded - IP temporarily blocked");
                return;
            }

            // Special handling for export endpoints (more restrictive)
            if (path.Contains("/export") && context.Request.Method == "POST")
            {
                if (!await CheckExportRateLimit(context, clientIp, path))
                {
                    return; // Response already sent
                }
            }
            // Special handling for .well-known paths (SSL reconnaissance attacks)
            else if (path.Contains("/.well-known/"))
            {
                if (!await CheckWellKnownRateLimit(context, clientIp, path, userAgent))
                {
                    return; // Response already sent
                }
            }
            // Regular rate limiting for other paths
            else if (!await CheckGeneralRateLimit(context, clientIp, path))
            {
                return; // Response already sent
            }

            await _next(context);
        }

        private async Task<bool> CheckWellKnownRateLimit(HttpContext context, string clientIp, string path, string userAgent)
        {
            var rateLimitKey = $"wellknown_rate_{clientIp}";
            var suspiciousKey = $"wellknown_suspicious_{clientIp}";

            // Get current request count
            var requestInfo = _cache.Get<WellKnownRequestInfo>(rateLimitKey) ?? new WellKnownRequestInfo();

            // Reset counter if time window expired
            if (DateTime.UtcNow - requestInfo.WindowStart > TimeSpan.FromMinutes(_config.WellKnownWindowMinutes))
            {
                requestInfo = new WellKnownRequestInfo { WindowStart = DateTime.UtcNow };
            }

            requestInfo.RequestCount++;
            requestInfo.LastRequest = DateTime.UtcNow;
            requestInfo.Paths.Add(path);
            requestInfo.UserAgents.Add(userAgent);

            // Cache for the window duration
            _cache.Set(rateLimitKey, requestInfo, TimeSpan.FromMinutes(_config.WellKnownWindowMinutes));

            // Log the request for monitoring
            _logger.LogInformation("🔍 .well-known request from {IP}: {Path} | Count: {Count}/{Limit} | UA: {UserAgent}",
                clientIp, path, requestInfo.RequestCount, _config.WellKnownMaxRequests, userAgent);

            // Check if limit exceeded
            if (requestInfo.RequestCount > _config.WellKnownMaxRequests)
            {
                // Mark as suspicious
                MarkIpAsSuspicious(clientIp, $".well-known rate limit exceeded: {requestInfo.RequestCount} requests");

                _logger.LogWarning("🚨 SUSPICIOUS: {IP} exceeded .well-known rate limit ({Count}/{Limit}) - possible SSL reconnaissance attack",
                    clientIp, requestInfo.RequestCount, _config.WellKnownMaxRequests);

                // Block IP temporarily if highly suspicious
                if (requestInfo.RequestCount > _config.WellKnownMaxRequests * 2)
                {
                    BlockIpTemporarily(clientIp, TimeSpan.FromHours(1), "Excessive .well-known requests");
                    _logger.LogError("🔒 BLOCKED IP {IP} for 1 hour due to excessive .well-known requests ({Count})",
                        clientIp, requestInfo.RequestCount);
                }

                context.Response.StatusCode = 429;
                context.Response.Headers.Append("Retry-After", "3600");
                await context.Response.WriteAsync("Too Many Requests - SSL validation rate limit exceeded");
                return false;
            }

            return true;
        }

        private async Task<bool> CheckExportRateLimit(HttpContext context, string clientIp, string path)
        {
            var rateLimitKey = $"export_rate_{clientIp}";
            var requestCount = _cache.Get<int>(rateLimitKey);

            requestCount++;
            _cache.Set(rateLimitKey, requestCount, TimeSpan.FromMinutes(_config.ExportWindowMinutes));

            if (requestCount > _config.ExportMaxRequests)
            {
                _logger.LogWarning("⚠️ IP {IP} exceeded export rate limit ({Count}/{Limit}) for path {Path}",
                    clientIp, requestCount, _config.ExportMaxRequests, path);

                context.Response.StatusCode = 429;
                context.Response.Headers.Append("Retry-After", ((_config.ExportWindowMinutes * 60)).ToString());
                await context.Response.WriteAsync("Export rate limit exceeded - too many export requests");
                return false;
            }

            return true;
        }

        private async Task<bool> CheckGeneralRateLimit(HttpContext context, string clientIp, string path)
        {
            var rateLimitKey = $"general_rate_{clientIp}";
            var requestCount = _cache.Get<int>(rateLimitKey);

            requestCount++;
            _cache.Set(rateLimitKey, requestCount, TimeSpan.FromMinutes(_config.GeneralWindowMinutes));

            if (requestCount > _config.GeneralMaxRequests)
            {
                _logger.LogWarning("⚠️ IP {IP} exceeded general rate limit ({Count}/{Limit}) for path {Path}",
                    clientIp, requestCount, _config.GeneralMaxRequests, path);

                context.Response.StatusCode = 429;
                context.Response.Headers.Append("Retry-After", ((_config.GeneralWindowMinutes * 60)).ToString());
                await context.Response.WriteAsync("Rate limit exceeded");
                return false;
            }

            return true;
        }

        private string GetClientIP(HttpContext context)
        {
            return RequestClientIpResolver.GetClientIp(context, _configuration);
        }

        private void MarkIpAsSuspicious(string ip, string reason)
        {
            _suspiciousIPs.AddOrUpdate(ip,
                new SuspiciousIpInfo
                {
                    FirstSeen = DateTime.UtcNow,
                    LastSeen = DateTime.UtcNow,
                    IncidentCount = 1,
                    Reasons = new List<string> { reason }
                },
                (key, existing) =>
                {
                    existing.LastSeen = DateTime.UtcNow;
                    existing.IncidentCount++;
                    existing.Reasons.Add(reason);
                    return existing;
                });

            _logger.LogWarning("🚩 Marked IP {IP} as suspicious: {Reason}", ip, reason);
        }

        private void BlockIpTemporarily(string ip, TimeSpan duration, string reason)
        {
            var blockKey = $"blocked_ip_{ip}";
            _cache.Set(blockKey, new IpBlockInfo
            {
                BlockedAt = DateTime.UtcNow,
                BlockedUntil = DateTime.UtcNow.Add(duration),
                Reason = reason
            }, duration);

            _logger.LogError("🔒 Temporarily blocked IP {IP} for {Duration} - Reason: {Reason}", ip, duration, reason);
        }

        private bool IsIpBlocked(string ip)
        {
            var blockKey = $"blocked_ip_{ip}";
            var blockInfo = _cache.Get<IpBlockInfo>(blockKey);
            return blockInfo != null && DateTime.UtcNow < blockInfo.BlockedUntil;
        }
    }

    public class WellKnownRequestInfo
    {
        public DateTime WindowStart { get; set; } = DateTime.UtcNow;
        public DateTime LastRequest { get; set; } = DateTime.UtcNow;
        public int RequestCount { get; set; } = 0;
        public HashSet<string> Paths { get; set; } = new HashSet<string>();
        public HashSet<string> UserAgents { get; set; } = new HashSet<string>();
    }

    public class SuspiciousIpInfo
    {
        public DateTime FirstSeen { get; set; }
        public DateTime LastSeen { get; set; }
        public int IncidentCount { get; set; }
        public List<string> Reasons { get; set; } = new List<string>();
    }

    public class IpBlockInfo
    {
        public DateTime BlockedAt { get; set; }
        public DateTime BlockedUntil { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class RateLimitConfiguration
    {
        // .well-known specific limits (very restrictive)
        public int WellKnownMaxRequests { get; }
        public int WellKnownWindowMinutes { get; }

        // Export endpoint limits (moderately restrictive)
        public int ExportMaxRequests { get; }
        public int ExportWindowMinutes { get; }

        // General API limits
        public int GeneralMaxRequests { get; }
        public int GeneralWindowMinutes { get; }

        public RateLimitConfiguration(IConfiguration configuration)
        {
            // Check if we're in development mode
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
            var isDevelopment = environment == "Development" || environment == "Test";

            // SSL validation paths - relaxed for development
            WellKnownMaxRequests = configuration.GetValue<int>("RateLimit:WellKnown:MaxRequests", isDevelopment ? 100 : 3);
            WellKnownWindowMinutes = configuration.GetValue<int>("RateLimit:WellKnown:WindowMinutes", 60);

            // Export endpoints - relaxed for development
            ExportMaxRequests = configuration.GetValue<int>("RateLimit:Export:MaxRequests", isDevelopment ? 100 : 5);
            ExportWindowMinutes = configuration.GetValue<int>("RateLimit:Export:WindowMinutes", 10);

            // General API limits - relaxed for development
            GeneralMaxRequests = configuration.GetValue<int>("RateLimit:General:MaxRequests", isDevelopment ? 10000 : 1000);
            GeneralWindowMinutes = configuration.GetValue<int>("RateLimit:General:WindowMinutes", 60);
        }
    }

    public static class RateLimitingMiddlewareExtensions
    {
        public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RateLimitingMiddleware>();
        }
    }
}
