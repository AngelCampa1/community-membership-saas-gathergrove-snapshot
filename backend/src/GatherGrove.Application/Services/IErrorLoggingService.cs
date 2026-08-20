using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services;

public interface IErrorLoggingService
{
    Task LogErrorAsync(
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
        Dictionary<string, object>? additionalData = null);

    Task LogErrorAsync(Exception exception,
        string source = "Application",
        string? requestMethod = null,
        string? requestPath = null,
        string? userId = null,
        string? userAgent = null,
        string? ipAddress = null,
        int? clubId = null,
        Dictionary<string, object>? additionalData = null);

    Task<List<ErrorLog>> GetErrorLogsAsync(
        int pageSize = 50,
        int pageNumber = 1,
        string? level = null,
        DateTime? startDate = null,
        DateTime? endDate = null);

    Task CleanupOldLogsAsync(int daysToKeep = 30);
}