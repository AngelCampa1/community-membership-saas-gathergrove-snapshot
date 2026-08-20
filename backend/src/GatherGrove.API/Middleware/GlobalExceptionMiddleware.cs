using System.Net;
using System.Text.Json;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Sentry;

namespace GatherGrove.API.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");

            // Capture exception in Sentry (inert when DSN is not configured)
            SentrySdk.CaptureException(ex);

            // Log to database in development/test environments
            if (_environment.IsDevelopment())
            {
                var errorLoggingService = context.RequestServices.GetService<IErrorLoggingService>();
                if (errorLoggingService != null)
                {
                    await LogExceptionToDatabase(ex, context, errorLoggingService);
                }
            }

            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task LogExceptionToDatabase(Exception ex, HttpContext context, IErrorLoggingService errorLoggingService)
    {
        try
        {
            var additionalData = new Dictionary<string, object>
            {
                ["TraceId"] = context.TraceIdentifier,
                ["RequestHeaders"] = context.Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString()),
            };

            // Add query parameters (sanitized)
            if (context.Request.Query.Any())
            {
                var sanitizedQuery = SanitizeQueryString(context.Request.QueryString.ToString());
                additionalData["QueryString"] = sanitizedQuery;
            }

            // Get user info from claims if available
            var userId = context.User?.Identity?.Name;
            var clubId = context.User?.Claims?.FirstOrDefault(c => c.Type == "ClubId")?.Value;

            await errorLoggingService.LogErrorAsync(
                exception: ex,
                source: "GlobalExceptionMiddleware",
                requestMethod: context.Request.Method,
                requestPath: context.Request.Path,
                userId: userId,
                userAgent: context.Request.Headers["User-Agent"].FirstOrDefault(),
                ipAddress: context.Connection.RemoteIpAddress?.ToString(),
                clubId: int.TryParse(clubId, out var cId) ? cId : null,
                additionalData: additionalData);
        }
        catch (Exception loggingEx)
        {
            // Don't let database logging failures break the application
            _logger.LogWarning(loggingEx, "Failed to log exception to database");
        }
    }

    private static string SanitizeQueryString(string queryString)
    {
        if (string.IsNullOrEmpty(queryString))
            return string.Empty;

        // Remove sensitive parameters
        var sensitiveParams = new[] { "password", "token", "key", "secret", "apikey" };
        var parts = queryString.TrimStart('?').Split('&');

        var sanitized = parts.Select(part =>
        {
            var keyValue = part.Split('=');
            if (keyValue.Length == 2 && sensitiveParams.Any(s => keyValue[0].Contains(s, StringComparison.OrdinalIgnoreCase)))
            {
                return $"{keyValue[0]}=***";
            }
            return part;
        });

        return string.Join("&", sanitized);
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse
        {
            Message = _environment.IsDevelopment() ? ex.Message : "An error occurred while processing your request.",
            Details = _environment.IsDevelopment() ? ex.ToString() : null,
            TraceId = context.TraceIdentifier
        };

        var statusCode = ex switch
        {
            ArgumentException => HttpStatusCode.BadRequest,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            InvalidOperationException => HttpStatusCode.BadRequest,
            NotImplementedException => HttpStatusCode.NotImplemented,
            _ => HttpStatusCode.InternalServerError
        };

        context.Response.StatusCode = (int)statusCode;

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}

public class ErrorResponse
{
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string TraceId { get; set; } = string.Empty;
}

// Extension method for environment checks
public static class EnvironmentExtensions
{
    public static bool IsStaging(this IWebHostEnvironment environment)
    {
        return environment.EnvironmentName.Equals("Staging", StringComparison.OrdinalIgnoreCase);
    }
}