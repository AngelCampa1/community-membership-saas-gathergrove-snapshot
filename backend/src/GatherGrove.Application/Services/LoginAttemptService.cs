using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace GatherGrove.Application.Services;

public interface ILoginAttemptService
{
    Task<bool> IsAccountLockedAsync(string email);
    Task RecordFailedAttemptAsync(string email);
    Task RecordSuccessfulLoginAsync(string email);
    Task<int> GetFailedAttemptsAsync(string email);
}

/// <summary>
/// Service for tracking login attempts and account lockout
/// </summary>
public class LoginAttemptService : ILoginAttemptService
{
    private readonly ILogger<LoginAttemptService> _logger;
    private readonly ConcurrentDictionary<string, LoginAttemptRecord> _attempts = new();

    // Configuration constants
    private const int MaxFailedAttempts = 5;
    private const int LockoutDurationMinutes = 15;
    private const int ResetAttemptsAfterMinutes = 60;

    public LoginAttemptService(ILogger<LoginAttemptService> logger)
    {
        _logger = logger;
    }

    public Task<bool> IsAccountLockedAsync(string email)
    {
        var normalizedEmail = email.ToLowerInvariant();

        if (!_attempts.TryGetValue(normalizedEmail, out var record))
        {
            return Task.FromResult(false);
        }

        // Clean up old records
        if (DateTime.UtcNow - record.LastAttempt > TimeSpan.FromMinutes(ResetAttemptsAfterMinutes))
        {
            _attempts.TryRemove(normalizedEmail, out _);
            return Task.FromResult(false);
        }

        // Check if account is locked
        if (record.FailedAttempts >= MaxFailedAttempts)
        {
            var lockoutExpiry = record.LastAttempt.AddMinutes(LockoutDurationMinutes);
            var isLocked = DateTime.UtcNow < lockoutExpiry;

            if (isLocked)
            {
                _logger.LogWarning("Account locked for {Email}. Lockout expires at {LockoutExpiry}",
                    email, lockoutExpiry);
            }
            else
            {
                // Lockout expired, reset attempts
                _attempts.TryRemove(normalizedEmail, out _);
            }

            return Task.FromResult(isLocked);
        }

        return Task.FromResult(false);
    }

    public Task RecordFailedAttemptAsync(string email)
    {
        var normalizedEmail = email.ToLowerInvariant();
        var now = DateTime.UtcNow;

        _attempts.AddOrUpdate(normalizedEmail,
            new LoginAttemptRecord { FailedAttempts = 1, LastAttempt = now },
            (key, existing) =>
            {
                // Reset attempts if too much time has passed
                if (now - existing.LastAttempt > TimeSpan.FromMinutes(ResetAttemptsAfterMinutes))
                {
                    return new LoginAttemptRecord { FailedAttempts = 1, LastAttempt = now };
                }

                return existing with
                {
                    FailedAttempts = existing.FailedAttempts + 1,
                    LastAttempt = now
                };
            });

        var record = _attempts[normalizedEmail];

        _logger.LogWarning("Failed login attempt for {Email}. Attempt {AttemptNumber} of {MaxAttempts}",
            email, record.FailedAttempts, MaxFailedAttempts);

        if (record.FailedAttempts >= MaxFailedAttempts)
        {
            _logger.LogWarning("Account locked for {Email} due to {FailedAttempts} failed attempts",
                email, record.FailedAttempts);
        }

        return Task.CompletedTask;
    }

    public Task RecordSuccessfulLoginAsync(string email)
    {
        var normalizedEmail = email.ToLowerInvariant();
        _attempts.TryRemove(normalizedEmail, out _);

        _logger.LogInformation("Successful login for {Email}, cleared failed attempts", email);

        return Task.CompletedTask;
    }

    public Task<int> GetFailedAttemptsAsync(string email)
    {
        var normalizedEmail = email.ToLowerInvariant();

        if (!_attempts.TryGetValue(normalizedEmail, out var record))
        {
            return Task.FromResult(0);
        }

        // Clean up old records
        if (DateTime.UtcNow - record.LastAttempt > TimeSpan.FromMinutes(ResetAttemptsAfterMinutes))
        {
            _attempts.TryRemove(normalizedEmail, out _);
            return Task.FromResult(0);
        }

        return Task.FromResult(record.FailedAttempts);
    }
}

public record LoginAttemptRecord
{
    public int FailedAttempts { get; init; }
    public DateTime LastAttempt { get; init; }
}