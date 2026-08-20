using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data.Common;
using System.Diagnostics;

namespace GatherGrove.API.Middleware;

/// <summary>
/// Interceptor for logging database query performance and timeouts
/// </summary>
public class DatabaseLoggingInterceptor : DbCommandInterceptor
{
    private readonly ILogger<DatabaseLoggingInterceptor> _logger;
    private readonly IServiceProvider _serviceProvider;

    // Configurable thresholds
    private readonly TimeSpan _warningThreshold = TimeSpan.FromMilliseconds(1000); // 1 second
    private readonly TimeSpan _slowQueryThreshold = TimeSpan.FromMilliseconds(3000); // 3 seconds
    private readonly TimeSpan _timeoutThreshold = TimeSpan.FromSeconds(30); // 30 seconds

    public DatabaseLoggingInterceptor(ILogger<DatabaseLoggingInterceptor> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    public override async ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        var queryId = Guid.NewGuid().ToString("N")[..8];

        _logger.LogTrace("Executing query {QueryId}: {Query} with parameters {Parameters}",
            queryId,
            SanitizeQuery(command.CommandText),
            GetParametersSummary(command.Parameters));

        var httpContextAccessor = _serviceProvider.GetService<IHttpContextAccessor>();
        httpContextAccessor?.HttpContext?.Items.TryAdd($"DbQuery_{queryId}", stopwatch);

        return await base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override async ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result,
        CancellationToken cancellationToken = default)
    {
        var queryId = Guid.NewGuid().ToString("N")[..8];
        var httpContext = _serviceProvider.GetService<IHttpContextAccessor>()?.HttpContext;
        var duration = eventData.Duration;

        await LogQueryCompletion(queryId, command, duration, true, null, httpContext);

        return await base.ReaderExecutedAsync(command, eventData, result, cancellationToken);
    }

    public override async ValueTask<object?> ScalarExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        object? result,
        CancellationToken cancellationToken = default)
    {
        var queryId = Guid.NewGuid().ToString("N")[..8];
        var httpContext = _serviceProvider.GetService<IHttpContextAccessor>()?.HttpContext;
        var duration = eventData.Duration;

        await LogQueryCompletion(queryId, command, duration, true, null, httpContext);

        return await base.ScalarExecutedAsync(command, eventData, result, cancellationToken);
    }

    public override async ValueTask<int> NonQueryExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        var queryId = Guid.NewGuid().ToString("N")[..8];
        var httpContext = _serviceProvider.GetService<IHttpContextAccessor>()?.HttpContext;
        var duration = eventData.Duration;

        await LogQueryCompletion(queryId, command, duration, true, null, httpContext, result);

        return await base.NonQueryExecutedAsync(command, eventData, result, cancellationToken);
    }

    public override async Task CommandFailedAsync(
        DbCommand command,
        CommandErrorEventData eventData,
        CancellationToken cancellationToken = default)
    {
        var queryId = Guid.NewGuid().ToString("N")[..8];
        var httpContext = _serviceProvider.GetService<IHttpContextAccessor>()?.HttpContext;
        var duration = eventData.Duration;

        await LogQueryCompletion(queryId, command, duration, false, eventData.Exception, httpContext);

        await base.CommandFailedAsync(command, eventData, cancellationToken);
    }

    private async Task LogQueryCompletion(
        string queryId,
        DbCommand command,
        TimeSpan duration,
        bool success,
        Exception? exception,
        HttpContext? httpContext,
        int? affectedRows = null)
    {
        var durationMs = duration.TotalMilliseconds;
        var requestId = httpContext?.Items["RequestId"]?.ToString();
        var userId = httpContext?.User?.Identity?.Name ?? "System";

        // Determine log level and emoji based on performance and success
        var (logLevel, emoji) = GetLogLevelAndEmoji(duration, success, exception);

        // Create base log message
        var message = $"{emoji} DB Query {(success ? "Completed" : "Failed")}: {queryId} | " +
                     $"Duration: {durationMs:F2}ms | Request: {requestId} | User: {userId}";

        if (affectedRows.HasValue)
        {
            message += $" | Rows: {affectedRows.Value}";
        }

        if (!success && exception != null)
        {
            message += $" | Error: {exception.Message}";
        }

        // Log with appropriate level
        switch (logLevel)
        {
            case LogLevel.Warning:
                _logger.LogWarning("{Message} | Query: {Query}", message, SanitizeQuery(command.CommandText));
                break;
            case LogLevel.Error:
                _logger.LogError(exception, "{Message} | Query: {Query}", message, SanitizeQuery(command.CommandText));
                break;
            case LogLevel.Critical:
                _logger.LogCritical(exception, "{Message} | Query: {Query}", message, SanitizeQuery(command.CommandText));
                break;
            default:
                _logger.LogInformation("{Message}", message);
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug("Query: {Query}, Parameters: {Parameters}",
                        SanitizeQuery(command.CommandText),
                        GetParametersSummary(command.Parameters));
                }
                break;
        }

    }

    private static (LogLevel logLevel, string emoji) GetLogLevelAndEmoji(TimeSpan duration, bool success, Exception? exception)
    {
        if (!success)
        {
            if (exception is TimeoutException || duration.TotalSeconds > 30)
                return (LogLevel.Critical, "🔥");
            return (LogLevel.Error, "❌");
        }

        if (duration.TotalSeconds > 30)
            return (LogLevel.Critical, "🔥");
        if (duration.TotalMilliseconds > 3000)
            return (LogLevel.Warning, "🐌");
        if (duration.TotalMilliseconds > 1000)
            return (LogLevel.Warning, "⚠️");

        return (LogLevel.Debug, "⚡");
    }

    private static string ExtractQueryType(string commandText)
    {
        if (string.IsNullOrWhiteSpace(commandText))
            return "UNKNOWN";

        var trimmed = commandText.Trim().ToUpperInvariant();

        if (trimmed.StartsWith("SELECT")) return "SELECT";
        if (trimmed.StartsWith("INSERT")) return "INSERT";
        if (trimmed.StartsWith("UPDATE")) return "UPDATE";
        if (trimmed.StartsWith("DELETE")) return "DELETE";
        if (trimmed.StartsWith("CREATE")) return "CREATE";
        if (trimmed.StartsWith("ALTER")) return "ALTER";
        if (trimmed.StartsWith("DROP")) return "DROP";
        if (trimmed.StartsWith("EXEC") || trimmed.StartsWith("EXECUTE")) return "PROCEDURE";

        return "OTHER";
    }

    private static string SanitizeQuery(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return string.Empty;

        // Remove excessive whitespace and newlines for logging
        var sanitized = System.Text.RegularExpressions.Regex.Replace(query, @"\s+", " ").Trim();

        // Limit length for logging
        if (sanitized.Length > 500)
        {
            sanitized = sanitized[..497] + "...";
        }

        return sanitized;
    }

    private static string GetParametersSummary(DbParameterCollection parameters)
    {
        if (parameters.Count == 0)
            return "None";

        var summary = new List<string>();
        foreach (DbParameter param in parameters)
        {
            var value = param.Value?.ToString() ?? "NULL";

            // Sanitize sensitive parameter values
            var paramName = param.ParameterName?.ToLowerInvariant() ?? "";
            if (paramName.Contains("password") || paramName.Contains("token") ||
                paramName.Contains("secret") || paramName.Contains("key"))
            {
                value = "***";
            }
            else if (value.Length > 50)
            {
                value = value[..47] + "...";
            }

            summary.Add($"{param.ParameterName}={value}");
        }

        return string.Join(", ", summary);
    }
}