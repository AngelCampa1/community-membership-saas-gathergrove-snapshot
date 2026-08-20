using System.Text.Json;

namespace GatherGrove.API.Services;

public interface ISecurityAuditService
{
    Task LogSecurityEventAsync(SecurityEvent securityEvent);
    Task<List<SecurityEvent>> GetRecentSecurityEventsAsync(int hours = 24);
    Task<Dictionary<string, int>> GetThreatSummaryAsync();
}

/// <summary>
/// Service for logging and analyzing security events
/// </summary>
public class SecurityAuditService : ISecurityAuditService
{
    private readonly ILogger<SecurityAuditService> _logger;
    private static readonly List<SecurityEvent> _securityEvents = new();
    private static readonly object _lock = new();

    public SecurityAuditService(ILogger<SecurityAuditService> logger)
    {
        _logger = logger;
    }

    public async Task LogSecurityEventAsync(SecurityEvent securityEvent)
    {
        lock (_lock)
        {
            _securityEvents.Add(securityEvent);

            // Keep only recent events (last 7 days)
            var cutoff = DateTime.UtcNow.AddDays(-7);
            _securityEvents.RemoveAll(e => e.Timestamp < cutoff);
        }

        // Log to application logger
        var logLevel = securityEvent.Severity switch
        {
            SecurityEventSeverity.Critical => LogLevel.Critical,
            SecurityEventSeverity.High => LogLevel.Error,
            SecurityEventSeverity.Medium => LogLevel.Warning,
            SecurityEventSeverity.Low => LogLevel.Information,
            _ => LogLevel.Information
        };

        _logger.Log(logLevel, "Security Event: {EventType} from {ClientIP} - {Description}",
            securityEvent.EventType, securityEvent.ClientIP, securityEvent.Description);

        // In production, you might want to send critical events to external monitoring
        if (securityEvent.Severity == SecurityEventSeverity.Critical)
        {
            await NotifySecurityTeamAsync(securityEvent);
        }
    }

    public Task<List<SecurityEvent>> GetRecentSecurityEventsAsync(int hours = 24)
    {
        var cutoff = DateTime.UtcNow.AddHours(-hours);

        lock (_lock)
        {
            return Task.FromResult(_securityEvents
                .Where(e => e.Timestamp >= cutoff)
                .OrderByDescending(e => e.Timestamp)
                .ToList());
        }
    }

    public Task<Dictionary<string, int>> GetThreatSummaryAsync()
    {
        var last24Hours = DateTime.UtcNow.AddHours(-24);

        lock (_lock)
        {
            return Task.FromResult(_securityEvents
                .Where(e => e.Timestamp >= last24Hours)
                .GroupBy(e => e.EventType)
                .ToDictionary(g => g.Key, g => g.Count()));
        }
    }

    private Task NotifySecurityTeamAsync(SecurityEvent securityEvent)
    {
        // In production, implement:
        // - Email alerts to security team
        // - Slack/Teams notifications
        // - Integration with SIEM systems
        // - Push alerts for critical events

        _logger.LogCritical("CRITICAL SECURITY ALERT: {EventType} from {ClientIP} - {Description}. " +
                           "This event requires immediate attention.",
            securityEvent.EventType, securityEvent.ClientIP, securityEvent.Description);

        return Task.CompletedTask;
    }
}

public class SecurityEvent
{
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string EventType { get; set; } = string.Empty;
    public SecurityEventSeverity Severity { get; set; }
    public string ClientIP { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string RequestPath { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Dictionary<string, string> AdditionalData { get; set; } = new();
}

public enum SecurityEventSeverity
{
    Low,
    Medium,
    High,
    Critical
}
