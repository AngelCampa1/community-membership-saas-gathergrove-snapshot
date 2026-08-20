using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace GatherGrove.API.Middleware
{
    /// <summary>
    /// CSRF Protection Middleware for ASP.NET Core API
    /// Implements Double Submit Cookie pattern with secure token generation
    /// </summary>
    public class CSRFProtectionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<CSRFProtectionMiddleware> _logger;
        private readonly string _secretKey;
        private readonly IWebHostEnvironment _environment;

        private const string CSRF_TOKEN_HEADER = "X-CSRF-Token";
        private const string CSRF_COOKIE_NAME = "csrf-token";

        public CSRFProtectionMiddleware(RequestDelegate next, ILogger<CSRFProtectionMiddleware> logger, IConfiguration configuration, IWebHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;

            // BUG FIX: Remove fallback secret - fail fast if not configured
            var csrfSecret = configuration["Security:CSRFSecretKey"];

            // In production/staging, CSRF secret MUST be configured
            if (environment.IsProduction() || environment.IsStaging())
            {
                if (string.IsNullOrWhiteSpace(csrfSecret))
                {
                    throw new InvalidOperationException(
                        "CRITICAL SECURITY ERROR: Security:CSRFSecretKey is not configured. " +
                        "Set CSRF_SECRET_KEY in environment variables or Azure Key Vault. " +
                        "See backend/.env.example for generation instructions.");
                }

                if (csrfSecret.Length < 32)
                {
                    throw new InvalidOperationException(
                        "CRITICAL SECURITY ERROR: Security:CSRFSecretKey must be at least 32 characters. " +
                        "Current length: " + csrfSecret.Length);
                }
            }
            else if (environment.IsDevelopment())
            {
                // In development, warn but allow fallback for convenience
                if (string.IsNullOrWhiteSpace(csrfSecret))
                {
                    _logger.LogWarning(
                        "⚠️ WARNING: CSRF secret not configured. Using temporary fallback for development. " +
                        "Set CSRF_SECRET_KEY in .env file for proper security testing.");
                    csrfSecret = "development-fallback-csrf-secret-not-for-production-use-only";
                }
            }

            _secretKey = csrfSecret ?? throw new InvalidOperationException("CSRF secret key could not be initialized");
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip CSRF protection in Testing environment for integration tests
            if (_environment.IsEnvironment("Testing"))
            {
                await _next(context);
                return;
            }

            // For GET requests, set CSRF token in cookie
            if (context.Request.Method == "GET")
            {
                await SetCSRFToken(context);
                await _next(context);
                return;
            }

            // For state-changing requests, verify CSRF token
            if (RequiresCSRFProtection(context.Request.Method))
            {
                if (IsBearerAuthorizationRequest(context) || ShouldSkipCSRFProtection(context.Request.Path))
                {
                    await _next(context);
                    return;
                }

                if (!await ValidateCSRFToken(context))
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new
                    {
                        error = "CSRF token validation failed",
                        message = "Invalid or missing CSRF token"
                    }));
                    return;
                }
            }

            await _next(context);
        }

        // BUG FIX B-05: Removed 'async' keyword - no await operations in this method
        private Task SetCSRFToken(HttpContext context)
        {
            var existingToken = context.Request.Cookies[CSRF_COOKIE_NAME];

            if (string.IsNullOrEmpty(existingToken) || !IsValidCSRFToken(existingToken))
            {
                var newToken = GenerateCSRFToken();

                context.Response.Cookies.Append(CSRF_COOKIE_NAME, newToken, new CookieOptions
                {
                    HttpOnly = false, // Needs to be accessible to JavaScript for AJAX requests
                    Secure = !_environment.IsDevelopment(),
                    SameSite = SameSiteMode.Strict,
                    MaxAge = TimeSpan.FromHours(1),
                    Path = "/"
                });
            }

            return Task.CompletedTask;
        }

        // BUG FIX B-05: Removed 'async' keyword - no await operations in this method
        private Task<bool> ValidateCSRFToken(HttpContext context)
        {
            var cookieToken = context.Request.Cookies[CSRF_COOKIE_NAME];
            var headerToken = context.Request.Headers[CSRF_TOKEN_HEADER].FirstOrDefault();

            if (string.IsNullOrEmpty(cookieToken) || string.IsNullOrEmpty(headerToken))
            {
                _logger.LogWarning("CSRF validation failed: Missing token. Cookie: {HasCookie}, Header: {HasHeader}",
                    !string.IsNullOrEmpty(cookieToken), !string.IsNullOrEmpty(headerToken));
                return Task.FromResult(false);
            }

            if (!IsValidCSRFToken(cookieToken) || cookieToken != headerToken)
            {
                _logger.LogWarning("CSRF validation failed: Invalid token or mismatch");
                return Task.FromResult(false);
            }

            return Task.FromResult(true);
        }

        private string GenerateCSRFToken()
        {
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }

            var randomValue = Convert.ToHexString(randomBytes);
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_secretKey));
            var signature = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(randomValue + timestamp)));

            return $"{randomValue}.{timestamp}.{signature}";
        }

        private bool IsValidCSRFToken(string token)
        {
            try
            {
                var parts = token.Split('.');
                if (parts.Length != 3) return false;

                var randomValue = parts[0];
                var timestamp = parts[1];
                var signature = parts[2];

                // Check token age (valid for 1 hour)
                if (!long.TryParse(timestamp, out var timestampValue))
                    return false;

                var tokenAge = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - timestampValue;
                if (tokenAge > 60 * 60 * 1000) // 1 hour in milliseconds
                    return false;

                // Verify signature
                using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_secretKey));
                var expectedSignature = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(randomValue + timestamp)));

                // Use timing-safe comparison to prevent timing attacks
                return CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(expectedSignature),
                    Encoding.UTF8.GetBytes(signature));
            }
            catch (Exception ex)
            {
                _logger.LogWarning("CSRF token validation error: {Error}", ex.Message);
                return false;
            }
        }

        private bool RequiresCSRFProtection(string method)
        {
            return method.ToUpperInvariant() switch
            {
                "POST" or "PUT" or "PATCH" or "DELETE" => true,
                _ => false
            };
        }

        private static bool IsBearerAuthorizationRequest(HttpContext context)
        {
            var authorization = context.Request.Headers.Authorization.FirstOrDefault();
            return authorization?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true;
        }

        private bool ShouldSkipCSRFProtection(PathString path)
        {
            // Public or externally signed endpoints that cannot rely on a browser CSRF cookie.
            var skipPaths = new[]
            {
                "/api/v1/auth/login",
                "/api/v1/auth/register",
                "/api/v1/auth/forgot-password",         // Unauthenticated - no CSRF cookie yet
                "/api/v1/auth/reset-password",          // Unauthenticated - uses token from email
                "/api/v1/auth/google",                  // SSO - uses ID token for auth
                "/api/v1/auth/apple",                   // SSO - uses ID token for auth
                "/api/v1/auth/activate-member-account", // Unauthenticated - uses activation token
                "/api/v1/auth/resend-activation",       // Unauthenticated - no CSRF cookie yet
                "/api/v1/errors/log",
                "/api/v1/email/webhook",
                "/health"
            };

            // Skip CSRF for SignalR hub negotiate endpoints (they use bearer tokens)
            if (path.StartsWithSegments("/chathub/negotiate", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWithSegments("/eventEngagementHub/negotiate", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWithSegments("/hubs/analytics/negotiate", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Skip CSRF for marketing endpoints - public endpoints called before authentication
            // These are used on landing pages where no CSRF cookie can be set
            if (path.StartsWithSegments("/api/v1/marketing", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return skipPaths.Any(skipPath => path.StartsWithSegments(skipPath, StringComparison.OrdinalIgnoreCase));
        }
    }

    public static class CSRFProtectionMiddlewareExtensions
    {
        public static IApplicationBuilder UseCSRFProtection(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<CSRFProtectionMiddleware>();
        }
    }
}
