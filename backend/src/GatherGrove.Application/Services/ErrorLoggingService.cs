using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace GatherGrove.Application.Services;

public class ErrorLoggingService : IErrorLoggingService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<ErrorLoggingService> _logger;

    public ErrorLoggingService(GatherGroveDbContext context, ILogger<ErrorLoggingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogErrorAsync(
        string message,
        string source = "Application",
        string? stackTrace = null,
        string level = "Error",
        string? requestMethod = null,
        string? requestPath = null,
        string? userId = null,
        string? userAgent = null,
        string? ipAddress = null,
        int? clubId = null,
        Dictionary<string, object>? additionalData = null)
    {
        try
        {
            var errorLog = new ErrorLog
            {
                Message = message.Length > 500 ? message.Substring(0, 497) + "..." : message,
                StackTrace = stackTrace,
                Source = source.Length > 100 ? source.Substring(0, 100) : source,
                RequestMethod = requestMethod?.Length > 50 ? requestMethod.Substring(0, 50) : requestMethod,
                RequestPath = requestPath?.Length > 1000 ? requestPath.Substring(0, 997) + "..." : requestPath,
                UserId = userId?.Length > 100 ? userId.Substring(0, 100) : userId,
                UserAgent = userAgent?.Length > 50 ? userAgent.Substring(0, 47) + "..." : userAgent,
                IpAddress = ipAddress?.Length > 45 ? ipAddress.Substring(0, 45) : ipAddress,
                Level = level.Length > 50 ? level.Substring(0, 50) : level,
                ClubId = clubId,
                CreatedAt = DateTime.UtcNow,
                AdditionalData = additionalData != null ? JsonSerializer.Serialize(additionalData) : null
            };

            _context.ErrorLogs.Add(errorLog);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Fallback to regular logging if database logging fails
            _logger.LogError(ex, "Failed to log error to database. Original error: {OriginalMessage}", message);
        }
    }

    public async Task LogErrorAsync(
        Exception exception,
        string source = "Application",
        string? requestMethod = null,
        string? requestPath = null,
        string? userId = null,
        string? userAgent = null,
        string? ipAddress = null,
        int? clubId = null,
        Dictionary<string, object>? additionalData = null)
    {
        var additionalDataDict = additionalData ?? new Dictionary<string, object>();

        // Add exception details to additional data
        additionalDataDict["ExceptionType"] = exception.GetType().Name;
        if (exception.InnerException != null)
        {
            additionalDataDict["InnerException"] = exception.InnerException.Message;
            additionalDataDict["InnerExceptionType"] = exception.InnerException.GetType().Name;
        }

        await LogErrorAsync(
            message: exception.Message,
            source: source,
            stackTrace: exception.StackTrace,
            level: "Error",
            requestMethod: requestMethod,
            requestPath: requestPath,
            userId: userId,
            userAgent: userAgent,
            ipAddress: ipAddress,
            clubId: clubId,
            additionalData: additionalDataDict);
    }

    public async Task<List<ErrorLog>> GetErrorLogsAsync(
        int pageSize = 50,
        int pageNumber = 1,
        string? level = null,
        DateTime? startDate = null,
        DateTime? endDate = null)
    {
        try
        {
            var query = _context.ErrorLogs.AsQueryable();

            if (!string.IsNullOrEmpty(level))
            {
                query = query.Where(e => e.Level == level);
            }

            if (startDate.HasValue)
            {
                query = query.Where(e => e.CreatedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(e => e.CreatedAt <= endDate.Value);
            }

            return await query
                .OrderByDescending(e => e.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Include(e => e.Club)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve error logs from database");
            return new List<ErrorLog>();
        }
    }

    public async Task CleanupOldLogsAsync(int daysToKeep = 30)
    {
        try
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
            var oldLogs = _context.ErrorLogs.Where(e => e.CreatedAt < cutoffDate);

            _context.ErrorLogs.RemoveRange(oldLogs);
            var deletedCount = await _context.SaveChangesAsync();

            _logger.LogInformation("Cleaned up {DeletedCount} old error logs older than {CutoffDate}",
                deletedCount, cutoffDate);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cleanup old error logs");
        }
    }
}