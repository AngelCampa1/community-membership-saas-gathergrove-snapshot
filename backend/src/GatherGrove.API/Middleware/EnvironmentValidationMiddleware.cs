using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;

namespace GatherGrove.API.Middleware;

/// <summary>
/// Middleware to validate that all required environment variables are configured correctly
/// </summary>
public class EnvironmentValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<EnvironmentValidationMiddleware> _logger;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public EnvironmentValidationMiddleware(
        RequestDelegate next,
        ILogger<EnvironmentValidationMiddleware> logger,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _configuration = configuration;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only validate on startup in production environment
        if (_environment.IsProduction() && context.Request.Path == "/health/environment")
        {
            var validationResults = await ValidateEnvironmentAsync();

            if (validationResults.Any(r => r.IsError))
            {
                _logger.LogCritical("Environment validation failed. Application cannot start safely.");

                context.Response.StatusCode = 503; // Service Unavailable
                context.Response.ContentType = "application/json";

                var response = new
                {
                    status = "error",
                    message = "Environment validation failed",
                    errors = validationResults.Where(r => r.IsError).Select(r => r.Message),
                    warnings = validationResults.Where(r => !r.IsError).Select(r => r.Message)
                };

                await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
                return;
            }

            var successResponse = new
            {
                status = "healthy",
                message = "Environment validation passed",
                warnings = validationResults.Where(r => !r.IsError).Select(r => r.Message),
                timestamp = DateTime.UtcNow
            };

            context.Response.StatusCode = 200;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(successResponse));
            return;
        }

        await _next(context);
    }

    private async Task<List<ValidationResult>> ValidateEnvironmentAsync()
    {
        var results = new List<ValidationResult>();

        try
        {
            // Validate database connection
            await ValidateDatabaseConnectionAsync(results);

            // Validate JWT settings
            ValidateJwtSettings(results);

            // Validate Stripe configuration
            ValidateStripeConfiguration(results);

            // Validate CORS settings
            ValidateCorsSettings(results);

            // Validate security settings
            ValidateSecuritySettings(results);

            // Validate external URLs
            await ValidateExternalUrlsAsync(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during environment validation");
            results.Add(new ValidationResult { IsError = true, Message = $"Validation error: {ex.Message}" });
        }

        return results;
    }

    private async Task ValidateDatabaseConnectionAsync(List<ValidationResult> results)
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrEmpty(connectionString))
        {
            results.Add(new ValidationResult { IsError = true, Message = "Database connection string is not configured" });
            return;
        }

        if (connectionString.Contains("localdb") && _environment.IsProduction())
        {
            results.Add(new ValidationResult { IsError = true, Message = "LocalDB detected in production environment" });
            return;
        }

        // Test database connectivity
        try
        {
            // This would require injecting a database context or connection factory
            // For now, just validate the connection string format
            if (!connectionString.Contains("Server=") && !connectionString.Contains("Data Source="))
            {
                results.Add(new ValidationResult { IsError = true, Message = "Invalid database connection string format" });
            }
            else
            {
                results.Add(new ValidationResult { IsError = false, Message = "Database connection string format is valid" });
            }
        }
        catch (Exception ex)
        {
            results.Add(new ValidationResult { IsError = true, Message = $"Database connection validation failed: {ex.Message}" });
        }
    }

    private void ValidateJwtSettings(List<ValidationResult> results)
    {
        var secretKey = _configuration["JwtSettings:SecretKey"];
        var issuer = _configuration["JwtSettings:Issuer"];
        var audience = _configuration["JwtSettings:Audience"];

        if (string.IsNullOrEmpty(secretKey))
        {
            results.Add(new ValidationResult { IsError = true, Message = "JWT Secret Key is not configured" });
        }
        else if (secretKey.Length < 32)
        {
            results.Add(new ValidationResult { IsError = true, Message = "JWT Secret Key is too short (minimum 32 characters)" });
        }
        else if (secretKey.Contains("Super-Secret-Key") && _environment.IsProduction())
        {
            results.Add(new ValidationResult { IsError = true, Message = "Default JWT Secret Key detected in production" });
        }
        else
        {
            results.Add(new ValidationResult { IsError = false, Message = "JWT Secret Key is properly configured" });
        }

        if (string.IsNullOrEmpty(issuer))
        {
            results.Add(new ValidationResult { IsError = true, Message = "JWT Issuer is not configured" });
        }

        if (string.IsNullOrEmpty(audience))
        {
            results.Add(new ValidationResult { IsError = true, Message = "JWT Audience is not configured" });
        }
    }

    private void ValidateStripeConfiguration(List<ValidationResult> results)
    {
        var secretKey = _configuration["Stripe:SecretKey"];
        var publishableKey = _configuration["Stripe:PublishableKey"];
        var webhookSecret = _configuration["Stripe:WebhookSecret"];

        if (string.IsNullOrEmpty(secretKey))
        {
            results.Add(new ValidationResult { IsError = true, Message = "Stripe Secret Key is not configured" });
        }
        else if (_environment.IsProduction() && !secretKey.StartsWith("sk_live_"))
        {
            results.Add(new ValidationResult { IsError = true, Message = "Production environment detected but using Stripe test keys" });
        }
        else if (!_environment.IsProduction() && !secretKey.StartsWith("sk_test_"))
        {
            results.Add(new ValidationResult { IsError = false, Message = "Using Stripe test keys in non-production environment" });
        }

        if (string.IsNullOrEmpty(publishableKey))
        {
            results.Add(new ValidationResult { IsError = true, Message = "Stripe Publishable Key is not configured" });
        }

        if (string.IsNullOrEmpty(webhookSecret))
        {
            results.Add(new ValidationResult { IsError = true, Message = "Stripe Webhook Secret is not configured" });
        }
        else
        {
            results.Add(new ValidationResult { IsError = false, Message = "Stripe configuration appears valid" });
        }
    }

    private void ValidateCorsSettings(List<ValidationResult> results)
    {
        var frontendUrl = _configuration["App:FrontendUrl"];

        if (string.IsNullOrEmpty(frontendUrl))
        {
            results.Add(new ValidationResult { IsError = true, Message = "Frontend URL is not configured" });
        }
        else if (frontendUrl.Contains("localhost") && _environment.IsProduction())
        {
            results.Add(new ValidationResult { IsError = true, Message = "Localhost URL detected in production environment" });
        }
        else if (!Uri.IsWellFormedUriString(frontendUrl, UriKind.Absolute))
        {
            results.Add(new ValidationResult { IsError = true, Message = "Frontend URL format is invalid" });
        }
        else
        {
            results.Add(new ValidationResult { IsError = false, Message = "Frontend URL configuration is valid" });
        }
    }

    private void ValidateSecuritySettings(List<ValidationResult> results)
    {
        if (_environment.IsProduction())
        {
            var requireHttps = _configuration.GetValue<bool>("App:RequireHttps", true);
            if (!requireHttps)
            {
                results.Add(new ValidationResult { IsError = true, Message = "HTTPS is not required in production environment" });
            }

            var enableSecurityHeaders = _configuration.GetValue<bool>("Security:EnableSecurityHeaders", false);
            if (!enableSecurityHeaders)
            {
                results.Add(new ValidationResult { IsError = false, Message = "Security headers are not enabled" });
            }
        }

        var rateLimitPerMinute = _configuration.GetValue<int>("Security:RateLimitPerMinute", 0);
        if (rateLimitPerMinute <= 0)
        {
            results.Add(new ValidationResult { IsError = false, Message = "Rate limiting is not configured" });
        }
        else if (rateLimitPerMinute > 10000)
        {
            results.Add(new ValidationResult { IsError = false, Message = "Rate limit seems very high, consider reviewing" });
        }
    }

    private async Task ValidateExternalUrlsAsync(List<ValidationResult> results)
    {
        using var httpClient = new HttpClient();
        httpClient.Timeout = TimeSpan.FromSeconds(5);

        // Validate frontend URL accessibility
        var frontendUrl = _configuration["App:FrontendUrl"];
        if (!string.IsNullOrEmpty(frontendUrl))
        {
            try
            {
                var response = await httpClient.GetAsync(frontendUrl);
                if (!response.IsSuccessStatusCode)
                {
                    results.Add(new ValidationResult { IsError = false, Message = $"Frontend URL returned {response.StatusCode}" });
                }
            }
            catch (TaskCanceledException)
            {
                results.Add(new ValidationResult { IsError = false, Message = "Frontend URL validation timed out" });
            }
            catch (Exception ex)
            {
                results.Add(new ValidationResult { IsError = false, Message = $"Frontend URL validation failed: {ex.Message}" });
            }
        }
    }

    private static bool IsValidEmail(string email)
    {
        return !string.IsNullOrEmpty(email) &&
               email.Contains("@") &&
               email.Contains(".") &&
               email.Length > 5;
    }

    public class ValidationResult
    {
        public bool IsError { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}

/// <summary>
/// Extension method to register environment validation middleware
/// </summary>
public static class EnvironmentValidationMiddlewareExtensions
{
    public static IApplicationBuilder UseEnvironmentValidation(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<EnvironmentValidationMiddleware>();
    }
}
