using Microsoft.AspNetCore.Http;
using System.Text;
using System.Text.Json;

namespace GatherGrove.API.Middleware
{
    /// <summary>
    /// Security middleware for input validation, CSP headers, and XSS protection
    /// </summary>
    public class SecurityMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SecurityMiddleware> _logger;
        private readonly SecurityConfiguration _config;

        public SecurityMiddleware(RequestDelegate next, ILogger<SecurityMiddleware> logger, IConfiguration configuration)
        {
            _next = next;
            _logger = logger;
            _config = new SecurityConfiguration(configuration);
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Add security headers
            AddSecurityHeaders(context);

            // Validate request for potential security threats
            if (await ValidateRequest(context))
            {
                await _next(context);
            }
            else
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Bad Request: Security validation failed");
            }
        }

        private void AddSecurityHeaders(HttpContext context)
        {
            var response = context.Response;

            // Content Security Policy
            response.Headers.Append("Content-Security-Policy",
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' https://fonts.gstatic.com; " +
                "img-src 'self' data: https: blob:; " +
                "connect-src 'self' https://api.stripe.com; " +
                "frame-src 'self' https://js.stripe.com; " +
                "object-src 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'");

            // XSS Protection
            response.Headers.Append("X-XSS-Protection", "1; mode=block");
            response.Headers.Append("X-Content-Type-Options", "nosniff");
            response.Headers.Append("X-Frame-Options", "DENY");
            response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

            // HSTS (only in production)
            if (_config.IsProduction)
            {
                response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            }

            // Remove server information
            response.Headers.Remove("Server");
            response.Headers.Append("X-Powered-By", "");
        }

        private async Task<bool> ValidateRequest(HttpContext context)
        {
            // Check for SQL injection patterns in query parameters (only if enabled)
            if (_config.EnableSqlInjectionProtection && ContainsSqlInjectionPatterns(context.Request.QueryString.ToString()))
            {
                _logger.LogWarning("Potential SQL injection attempt detected in query string: {QueryString}",
                    context.Request.QueryString);
                return false;
            }

            // Validate request body for POST/PUT requests
            if (context.Request.Method == "POST" || context.Request.Method == "PUT")
            {
                context.Request.EnableBuffering();
                var body = await ReadRequestBody(context.Request);

                if (!string.IsNullOrEmpty(body))
                {
                    // Check for XSS patterns (only if enabled)
                    if (_config.EnableXssProtection && ContainsXssPatterns(body))
                    {
                        _logger.LogWarning("Potential XSS attempt detected in request body");
                        return false;
                    }

                    // Check for SQL injection patterns (only if enabled)
                    if (_config.EnableSqlInjectionProtection && ContainsSqlInjectionPatterns(body))
                    {
                        _logger.LogWarning("Potential SQL injection attempt detected in request body");
                        return false;
                    }
                }

                // Reset stream position
                context.Request.Body.Position = 0;
            }

            // Rate limiting check (simple implementation)
            if (!await CheckRateLimit(context))
            {
                _logger.LogWarning("Rate limit exceeded for IP: {RemoteIP}", context.Connection.RemoteIpAddress);
                return false;
            }

            return true;
        }

        private async Task<string> ReadRequestBody(HttpRequest request)
        {
            using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
            return await reader.ReadToEndAsync();
        }

        private bool ContainsSqlInjectionPatterns(string input)
        {
            if (string.IsNullOrEmpty(input))
                return false;

            var sqlPatterns = new[]
            {
                @"\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b",
                @"\b(or|and)\s+\d+\s*=\s*\d+",
                @"'(\s|;|--)",
                @"--\s",
                @"/\*.*\*/",
                @"\bxp_cmdshell\b",
                @"\bsp_executesql\b"
            };

            return sqlPatterns.Any(pattern =>
                System.Text.RegularExpressions.Regex.IsMatch(input, pattern,
                System.Text.RegularExpressions.RegexOptions.IgnoreCase));
        }

        private bool ContainsXssPatterns(string input)
        {
            if (string.IsNullOrEmpty(input))
                return false;

            var xssPatterns = new[]
            {
                @"<script[^>]*>.*?</script>",
                @"javascript:",
                @"vbscript:",
                @"onload\s*=",
                @"onerror\s*=",
                @"onclick\s*=",
                @"onmouseover\s*=",
                @"<iframe[^>]*>",
                @"<object[^>]*>",
                @"<embed[^>]*>"
            };

            return xssPatterns.Any(pattern =>
                System.Text.RegularExpressions.Regex.IsMatch(input, pattern,
                System.Text.RegularExpressions.RegexOptions.IgnoreCase));
        }

        private async Task<bool> CheckRateLimit(HttpContext context)
        {
            // Simple in-memory rate limiting (in production, use Redis or similar)
            var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var key = $"rate_limit_{clientIp}";

            // This is a simplified implementation
            // In production, implement proper distributed rate limiting
            return true; // Allow all requests for now
        }
    }

    public class SecurityConfiguration
    {
        public bool IsProduction { get; }
        public int RateLimitPerMinute { get; }
        public bool EnableXssProtection { get; }
        public bool EnableSqlInjectionProtection { get; }

        public SecurityConfiguration(IConfiguration configuration)
        {
            IsProduction = configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Production";
            RateLimitPerMinute = configuration.GetValue<int>("Security:RateLimitPerMinute", 100);
            EnableXssProtection = configuration.GetValue<bool>("Security:EnableXssProtection", true);
            EnableSqlInjectionProtection = configuration.GetValue<bool>("Security:EnableSqlInjectionProtection", true);
        }
    }

    public static class SecurityMiddlewareExtensions
    {
        public static IApplicationBuilder UseSecurityMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SecurityMiddleware>();
        }
    }
}