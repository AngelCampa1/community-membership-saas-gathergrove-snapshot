using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using System.Security.Cryptography;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing event payment tokens
/// Provides secure token generation and validation for public payment links
/// </summary>
public class EventTokenService : IEventTokenService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<EventTokenService> _logger;
    private const int TokenLength = 32; // 32 bytes = 256 bits of entropy

    public EventTokenService(GatherGroveDbContext context, ILogger<EventTokenService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<string> GeneratePaymentTokenAsync(int eventId)
    {
        _logger.LogInformation("Generating payment token for event {EventId}", eventId);

        // Verify event exists
        var eventEntity = await _context.Events.FindAsync(eventId);
        if (eventEntity == null)
        {
            _logger.LogWarning("Event {EventId} not found", eventId);
            throw new ArgumentException($"Event with ID {eventId} not found", nameof(eventId));
        }

        // Generate cryptographically secure token
        var token = GenerateSecureToken();

        // Update event with token
        eventEntity.PaymentToken = token;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment token generated successfully for event {EventId}", eventId);
        return token;
    }

    /// <inheritdoc/>
    public async Task<Event?> ValidatePaymentTokenAsync(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }


        var eventEntity = await _context.Events
            .Include(e => e.Club)
            .FirstOrDefaultAsync(e => e.PaymentToken == token);

        if (eventEntity == null)
        {
            _logger.LogWarning("No event found with provided payment token");
            return null;
        }

        _logger.LogInformation("Payment token validated successfully for event {EventId}", eventEntity.Id);
        return eventEntity;
    }

    /// <inheritdoc/>
    public async Task<string> RegeneratePaymentTokenAsync(int eventId)
    {
        _logger.LogInformation("Regenerating payment token for event {EventId}", eventId);

        var eventEntity = await _context.Events.FindAsync(eventId);
        if (eventEntity == null)
        {
            _logger.LogWarning("Event {EventId} not found", eventId);
            throw new ArgumentException($"Event with ID {eventId} not found", nameof(eventId));
        }

        // Generate new token
        var newToken = GenerateSecureToken();

        // Update event
        eventEntity.PaymentToken = newToken;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment token regenerated successfully for event {EventId}", eventId);
        return newToken;
    }

    /// <summary>
    /// Generates a cryptographically secure URL-safe token
    /// Uses 256 bits of entropy for strong security
    /// </summary>
    private static string GenerateSecureToken()
    {
        // Generate 32 random bytes (256 bits)
        var randomBytes = new byte[TokenLength];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }

        // Convert to base64url (URL-safe) encoding
        // Remove padding and make URL-safe
        var base64 = Convert.ToBase64String(randomBytes);
        var urlSafe = base64
            .Replace('+', '-')
            .Replace('/', '_')
            .Replace("=", string.Empty);

        return urlSafe;
    }
}