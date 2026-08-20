using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Repository interface for QR code operations
/// </summary>
public interface IQRCodeRepository
{
    /// <summary>
    /// Generate a unique token for QR codes
    /// </summary>
    Task<string> GenerateUniqueTokenAsync(string prefix = "evt");

    /// <summary>
    /// Create a new QR code
    /// </summary>
    Task<EventQRCode> CreateAsync(EventQRCode qrCode);

    /// <summary>
    /// Get QR code by ID
    /// </summary>
    Task<EventQRCode?> GetByIdAsync(int id);

    /// <summary>
    /// Get QR code by token
    /// </summary>
    Task<EventQRCode?> GetByTokenAsync(string token);

    /// <summary>
    /// Get QR codes for an event
    /// </summary>
    Task<IEnumerable<EventQRCode>> GetByEventIdAsync(int eventId);

    /// <summary>
    /// Update QR code
    /// </summary>
    Task<EventQRCode> UpdateAsync(EventQRCode qrCode);

    /// <summary>
    /// Delete QR code
    /// </summary>
    Task DeleteAsync(int id);

    /// <summary>
    /// Validate QR code token
    /// </summary>
    Task<bool> ValidateTokenAsync(string token);
}