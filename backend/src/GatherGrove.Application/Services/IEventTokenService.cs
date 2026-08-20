using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service interface for managing event payment tokens
/// Handles generation, validation, and retrieval of secure payment link tokens
/// </summary>
public interface IEventTokenService
{
    /// <summary>
    /// Generates a new cryptographically secure payment token for an event
    /// </summary>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>The generated token string</returns>
    /// <exception cref="ArgumentException">Thrown when event does not exist</exception>
    Task<string> GeneratePaymentTokenAsync(int eventId);

    /// <summary>
    /// Validates a payment token and returns the associated event if valid
    /// </summary>
    /// <param name="token">The payment token to validate</param>
    /// <returns>The event if token is valid, null otherwise</returns>
    Task<Event?> ValidatePaymentTokenAsync(string? token);

    /// <summary>
    /// Regenerates the payment token for an existing event
    /// Useful for security purposes if a token is compromised
    /// </summary>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>The new payment token</returns>
    /// <exception cref="ArgumentException">Thrown when event does not exist</exception>
    Task<string> RegeneratePaymentTokenAsync(int eventId);
}