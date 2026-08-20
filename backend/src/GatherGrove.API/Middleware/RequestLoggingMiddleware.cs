using System.Diagnostics;
using System.Text;
using System.Text.Json;
using GatherGrove.API.Services;

namespace GatherGrove.API.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    // Configurable timeouts (in milliseconds)
    private readonly long _warningThreshold = 5000; // 5 seconds
    private readonly long _timeoutThreshold = 30000; // 30 seconds

    public RequestLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestLoggingMiddleware> logger,
        IWebHostEnvironment environment,
        IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestStartTime = DateTimeOffset.UtcNow;
        context.Items["StartTime"] = requestStartTime;

        // Generate unique request ID for correlation
        var requestId = Guid.NewGuid().ToString("N")[..8];
        context.Items["RequestId"] = requestId;

        // Extract request details for logging
        var requestDetails = await ExtractRequestDetails(context, requestId);

        // Log request start
        _logger.LogInformation("🚀 Request Started: {RequestId} {Method} {Path} | IP: {IP} | User: {User}",
            requestId,
            context.Request.Method,
            context.Request.Path,
            RequestClientIpResolver.GetClientIp(context, _configuration),
            GetUserId(context) ?? "Anonymous");

        // Track original response stream
        var originalResponseStream = context.Response.Body;

        try
        {
            using var responseStream = new MemoryStream();
            context.Response.Body = responseStream;

            await _next(context);

            stopwatch.Stop();
            var duration = stopwatch.ElapsedMilliseconds;

            // Log response details
            await LogResponse(context, requestId, duration, responseStream);

            // Copy response back to original stream
            responseStream.Seek(0, SeekOrigin.Begin);
            await responseStream.CopyToAsync(originalResponseStream);
        }
        catch (OperationCanceledException ex) when (context.RequestAborted.IsCancellationRequested)
        {
            stopwatch.Stop();
            var duration = stopwatch.ElapsedMilliseconds;

            _logger.LogWarning("⏰ Request Timeout/Cancelled: {RequestId} {Method} {Path} | Duration: {Duration}ms | User: {User} | IP: {IP}",
                requestId,
                context.Request.Method,
                context.Request.Path,
                duration,
                GetUserId(context) ?? "Anonymous",
                RequestClientIpResolver.GetClientIp(context, _configuration));

            throw;
        }
        catch (TimeoutException ex)
        {
            stopwatch.Stop();
            var duration = stopwatch.ElapsedMilliseconds;

            _logger.LogError("🔥 Request Timeout Exception: {RequestId} {Method} {Path} | Duration: {Duration}ms | User: {User} | IP: {IP} | Error: {Error}",
                requestId,
                context.Request.Method,
                context.Request.Path,
                duration,
                GetUserId(context) ?? "Anonymous",
                RequestClientIpResolver.GetClientIp(context, _configuration),
                ex.Message);

            throw;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            var duration = stopwatch.ElapsedMilliseconds;

            _logger.LogError("❌ Request Failed: {RequestId} {Method} {Path} | Duration: {Duration}ms | User: {User} | IP: {IP} | Error: {Error}",
                requestId,
                context.Request.Method,
                context.Request.Path,
                duration,
                GetUserId(context) ?? "Anonymous",
                RequestClientIpResolver.GetClientIp(context, _configuration),
                ex.Message);

            throw;
        }
        finally
        {
            context.Response.Body = originalResponseStream;
        }
    }

    private async Task<RequestLogDetails> ExtractRequestDetails(HttpContext context, string requestId)
    {
        var details = new RequestLogDetails
        {
            RequestId = requestId,
            Method = context.Request.Method,
            Path = context.Request.Path,
            QueryString = SanitizeQueryString(context.Request.QueryString.ToString()),
            UserAgent = context.Request.Headers["User-Agent"].FirstOrDefault() ?? "",
            Referer = context.Request.Headers["Referer"].FirstOrDefault() ?? "",
            ContentType = context.Request.ContentType ?? "",
            ContentLength = context.Request.ContentLength,
            Headers = ExtractHeaders(context.Request.Headers),
            ClientIp = RequestClientIpResolver.GetClientIp(context, _configuration),
            UserId = GetUserId(context),
            Timestamp = DateTimeOffset.UtcNow
        };

        // Log request body for POST/PUT requests (with size limit and sensitive data filtering)
        if (ShouldLogRequestBody(context))
        {
            details.RequestBody = await ReadRequestBody(context);
        }

        return details;
    }

    private async Task LogResponse(HttpContext context, string requestId, long duration, MemoryStream responseStream)
    {
        var statusCode = context.Response.StatusCode;
        var responseSize = responseStream.Length;

        // Determine log level based on status code and duration
        var logLevel = GetLogLevel(statusCode, duration);

        var emoji = GetStatusEmoji(statusCode, duration);
        var message = $"{emoji} Request Completed: {requestId} {context.Request.Method} {context.Request.Path} | " +
                     $"Status: {statusCode} | Duration: {duration}ms | Size: {responseSize} bytes | " +
                     $"User: {GetUserId(context) ?? "Anonymous"} | IP: {RequestClientIpResolver.GetClientIp(context, _configuration)}";

        // Log with appropriate level
        switch (logLevel)
        {
            case LogLevel.Warning:
                _logger.LogWarning(message);
                break;
            case LogLevel.Error:
                _logger.LogError(message);
                break;
            default:
                _logger.LogInformation(message);
                break;
        }

        // Log slow requests separately for performance monitoring
        if (duration > _warningThreshold)
        {
            _logger.LogWarning("🐌 Slow Request Detected: {RequestId} {Method} {Path} | Duration: {Duration}ms | " +
                              "Status: {Status} | User: {User} | Query: {Query}",
                requestId, context.Request.Method, context.Request.Path, duration, statusCode,
                GetUserId(context) ?? "Anonymous", context.Request.QueryString);
        }

        // Log response body for errors (in development)
        if (_environment.IsDevelopment() && statusCode >= 400)
        {
            var responseBody = await ReadResponseBody(responseStream);
            if (!string.IsNullOrEmpty(responseBody))
            {
            }
        }
    }

    private static LogLevel GetLogLevel(int statusCode, long duration)
    {
        if (statusCode >= 500) return LogLevel.Error;
        if (statusCode >= 400) return LogLevel.Warning;
        if (duration > 10000) return LogLevel.Warning; // > 10 seconds
        return LogLevel.Information;
    }

    private static string GetStatusEmoji(int statusCode, long duration)
    {
        if (duration > 30000) return "🔥"; // Timeout
        if (duration > 5000) return "🐌";  // Slow
        if (statusCode >= 500) return "❌"; // Server error
        if (statusCode >= 400) return "⚠️";  // Client error
        if (statusCode >= 300) return "🔄"; // Redirect
        return "✅"; // Success
    }

    private static string GetUserId(HttpContext context)
    {
        return context.User?.Identity?.Name ??
               context.User?.Claims?.FirstOrDefault(c => c.Type == "sub")?.Value ??
               context.User?.Claims?.FirstOrDefault(c => c.Type == "userId")?.Value;
    }

    private static Dictionary<string, string> ExtractHeaders(IHeaderDictionary headers)
    {
        var sensitiveHeaders = new[] { "authorization", "cookie", "x-api-key", "authentication" };

        return headers
            .Where(h => !sensitiveHeaders.Contains(h.Key.ToLowerInvariant()))
            .ToDictionary(h => h.Key, h => string.Join(", ", h.Value.AsEnumerable()));
    }

    private static string SanitizeQueryString(string queryString)
    {
        if (string.IsNullOrEmpty(queryString))
            return string.Empty;

        var sensitiveParams = new[] { "password", "token", "key", "secret", "apikey", "auth" };
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

    private static bool ShouldLogRequestBody(HttpContext context)
    {
        if (context.Request.ContentLength == null || context.Request.ContentLength == 0)
            return false;

        if (context.Request.ContentLength > 10 * 1024) // 10KB limit
            return false;

        var method = context.Request.Method.ToUpperInvariant();
        return method is "POST" or "PUT" or "PATCH";
    }

    private static async Task<string> ReadRequestBody(HttpContext context)
    {
        try
        {
            context.Request.EnableBuffering();
            context.Request.Body.Seek(0, SeekOrigin.Begin);

            using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            context.Request.Body.Seek(0, SeekOrigin.Begin);

            return SanitizeRequestBody(body);
        }
        catch
        {
            return "[Error reading request body]";
        }
    }

    private static async Task<string> ReadResponseBody(MemoryStream responseStream)
    {
        try
        {
            responseStream.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(responseStream, Encoding.UTF8, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            responseStream.Seek(0, SeekOrigin.Begin);
            return body;
        }
        catch
        {
            return "[Error reading response body]";
        }
    }

    private static string SanitizeRequestBody(string body)
    {
        if (string.IsNullOrEmpty(body))
            return body;

        try
        {
            // Try to parse as JSON and sanitize sensitive fields
            var jsonDoc = JsonDocument.Parse(body);
            var sensitiveFields = new[] { "password", "token", "key", "secret", "apikey", "auth", "credentials" };

            // For now, just return a sanitized indication if it contains sensitive data
            var lowerBody = body.ToLowerInvariant();
            if (sensitiveFields.Any(field => lowerBody.Contains(field)))
            {
                return "[Request body contains sensitive data - sanitized]";
            }

            return body;
        }
        catch
        {
            // Not JSON, return as-is with length limit
            return body.Length > 1000 ? body[..1000] + "..." : body;
        }
    }
}

public class RequestLogDetails
{
    public string RequestId { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string QueryString { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string Referer { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long? ContentLength { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
    public string ClientIp { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public string? RequestBody { get; set; }
}
