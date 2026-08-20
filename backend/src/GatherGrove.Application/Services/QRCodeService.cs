using GatherGrove.Application.DTOs;
using GatherGrove.Application.Security;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QRCoder;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for generating and managing QR codes for events
/// </summary>
public class QRCodeService : IQRCodeService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<QRCodeService> _logger;

    public QRCodeService(
        GatherGroveDbContext context,
        ILogger<QRCodeService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Generates a QR code for event check-in
    /// </summary>
    /// <param name="request">The QR code generation request</param>
    /// <returns>The generated QR code response</returns>
    public async Task<EventQRCodeResponse> GenerateEventQRCodeAsync(GenerateEventQRCodeRequest request)
    {
        _logger.LogInformation("Generating QR code for event {EventId}", request.EventId);

        // Validate event exists
        var eventEntity = await _context.Events.FindAsync(request.EventId);
        if (eventEntity == null)
        {
            throw new ArgumentException($"Event with ID {request.EventId} not found");
        }

        // Check if QR code already exists for this event
        var existingQRCode = await _context.EventQRCodes
            .FirstOrDefaultAsync(q => q.EventId == request.EventId && q.IsActive);

        if (existingQRCode != null)
        {
            return new EventQRCodeResponse
            {
                Id = existingQRCode.Id,
                EventId = existingQRCode.EventId,
                QRCodeData = existingQRCode.QRCodeToken,
                QRCodeImageBase64 = existingQRCode.QRCodeImageData ?? string.Empty,
                ExpiresAt = existingQRCode.ExpiresAt,
                IsActive = existingQRCode.IsActive,
                CreatedAt = existingQRCode.CreatedAt
            };
        }

        // Generate new QR code
        var qrCodeToken = $"GATHERGROVE_CHECKIN:{request.EventId}:{Guid.NewGuid()}";
        var qrCodeImage = GenerateQRCodeImage(qrCodeToken);

        var qrCode = new Domain.Entities.EventQRCode
        {
            EventId = request.EventId,
            QRCodeToken = qrCodeToken,
            QRCodeImageData = Convert.ToBase64String(qrCodeImage),
            ExpiresAt = request.ExpiresAt ?? eventEntity.EventDateTime.AddHours(2),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventQRCodes.Add(qrCode);
        await _context.SaveChangesAsync();

        _logger.LogInformation("QR code generated for event {EventId} with ID {QRCodeId}",
            request.EventId, qrCode.Id);

        return new EventQRCodeResponse
        {
            Id = qrCode.Id,
            EventId = qrCode.EventId,
            QRCodeData = qrCode.QRCodeToken,
            QRCodeImageBase64 = qrCode.QRCodeImageData ?? string.Empty,
            ExpiresAt = qrCode.ExpiresAt,
            IsActive = qrCode.IsActive,
            CreatedAt = qrCode.CreatedAt
        };
    }

    /// <summary>
    /// Validates a QR code for check-in
    /// </summary>
    /// <param name="request">The QR code validation request</param>
    /// <returns>The validation result</returns>
    public async Task<QRCodeValidationResult> ValidateQRCodeAsync(QRCodeCheckinRequest request)
    {
        _logger.LogInformation(
            "Validating QR code fingerprint {TokenFingerprint} for member {MemberId}",
            SensitiveLogValue.Fingerprint(request.QRCodeData),
            request.MemberId);

        // Find the QR code
        var qrCode = await _context.EventQRCodes
            .Include(q => q.Event)
            .FirstOrDefaultAsync(q => q.QRCodeToken == request.QRCodeData);

        if (qrCode == null)
        {
            return new QRCodeValidationResult
            {
                IsValid = false,
                ErrorMessage = "QR code not found",
                EventId = null
            };
        }

        // Check if QR code is active
        if (!qrCode.IsActive)
        {
            return new QRCodeValidationResult
            {
                IsValid = false,
                ErrorMessage = "QR code is no longer active",
                EventId = qrCode.EventId
            };
        }

        // Check if QR code has expired
        if (qrCode.ExpiresAt < DateTime.UtcNow)
        {
            return new QRCodeValidationResult
            {
                IsValid = false,
                ErrorMessage = "QR code has expired",
                EventId = qrCode.EventId
            };
        }

        // Check if member is registered for the event
        var registration = await _context.EventRsvps
            .FirstOrDefaultAsync(r => r.EventId == qrCode.EventId && r.MemberId == request.MemberId);

        if (registration == null)
        {
            return new QRCodeValidationResult
            {
                IsValid = false,
                ErrorMessage = "Member is not registered for this event",
                EventId = qrCode.EventId
            };
        }

        _logger.LogInformation("QR code validated successfully for member {MemberId} at event {EventId}",
            request.MemberId, qrCode.EventId);

        return new QRCodeValidationResult
        {
            IsValid = true,
            EventId = qrCode.EventId,
            EventName = qrCode.Event.Name,
            MemberId = request.MemberId,
            ValidatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Deactivates a QR code
    /// </summary>
    /// <param name="qrCodeId">The QR code ID</param>
    /// <returns>Task</returns>
    public async Task DeactivateQRCodeAsync(int qrCodeId)
    {
        _logger.LogInformation("Deactivating QR code {QRCodeId}", qrCodeId);

        var qrCode = await _context.EventQRCodes.FindAsync(qrCodeId);
        if (qrCode == null)
        {
            throw new ArgumentException($"QR code with ID {qrCodeId} not found");
        }

        qrCode.IsActive = false;
        qrCode.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("QR code {QRCodeId} deactivated successfully", qrCodeId);
    }

    /// <summary>
    /// Refreshes a QR code with new expiration
    /// </summary>
    /// <param name="qrCodeId">The QR code ID</param>
    /// <param name="newExpirationTime">The new expiration time</param>
    /// <returns>The updated QR code</returns>
    public async Task<EventQRCodeResponse> RefreshQRCodeAsync(int qrCodeId, DateTime newExpirationTime)
    {
        _logger.LogInformation("Refreshing QR code {QRCodeId} with new expiration {ExpirationTime}",
            qrCodeId, newExpirationTime);

        var qrCode = await _context.EventQRCodes.FindAsync(qrCodeId);
        if (qrCode == null)
        {
            throw new ArgumentException($"QR code with ID {qrCodeId} not found");
        }

        qrCode.ExpiresAt = newExpirationTime;
        qrCode.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("QR code {QRCodeId} refreshed successfully", qrCodeId);

        return new EventQRCodeResponse
        {
            Id = qrCode.Id,
            EventId = qrCode.EventId,
            QRCodeData = qrCode.QRCodeToken,
            QRCodeImageBase64 = qrCode.QRCodeImageData ?? string.Empty,
            ExpiresAt = qrCode.ExpiresAt,
            IsActive = qrCode.IsActive,
            CreatedAt = qrCode.CreatedAt
        };
    }

    /// <summary>
    /// Gets QR code usage statistics
    /// </summary>
    /// <param name="qrCodeId">The QR code ID</param>
    /// <returns>The usage statistics</returns>
    public async Task<QRCodeUsageStats> GetQRCodeUsageStatsAsync(int qrCodeId)
    {
        _logger.LogInformation("Getting usage statistics for QR code {QRCodeId}", qrCodeId);

        var qrCode = await _context.EventQRCodes.FindAsync(qrCodeId);
        if (qrCode == null)
        {
            throw new ArgumentException($"QR code with ID {qrCodeId} not found");
        }

        // Since we don't have a QRCodeUsages table, we'll return basic stats
        var stats = new QRCodeUsageStats
        {
            QRCodeId = qrCodeId,
            TotalScans = 0, // Would track actual scans in real implementation
            UniqueUsers = 0,
            FirstScanAt = null,
            LastScanAt = null,
            ScansByHour = new Dictionary<int, int>()
        };

        return stats;
    }

    /// <summary>
    /// Generates bulk QR codes for multiple events
    /// </summary>
    /// <param name="request">The bulk generation request</param>
    /// <returns>The generated QR codes</returns>
    public async Task<List<EventQRCodeResponse>> BulkGenerateQRCodesAsync(BulkGenerateQRCodesRequest request)
    {
        _logger.LogInformation("Bulk generating {Count} QR codes for event {EventId}", request.Count, request.EventId);

        var results = new List<EventQRCodeResponse>();

        for (int i = 0; i < request.Count; i++)
        {
            try
            {
                var qrCodeRequest = new GenerateEventQRCodeRequest
                {
                    EventId = request.EventId,
                    ExpiresAt = request.ExpiresAt
                };

                var qrCode = await GenerateEventQRCodeAsync(qrCodeRequest);
                results.Add(qrCode);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to generate QR code #{Index} for event {EventId}: {Error}", i + 1, request.EventId, ex.Message);
            }
        }

        _logger.LogInformation("Successfully generated {Count} QR codes out of {Total} requested",
            results.Count, request.Count);

        return results;
    }

    /// <summary>
    /// Gets all QR codes for an event
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <returns>List of QR codes for the event</returns>
    public async Task<List<EventQRCodeResponse>> GetEventQRCodesAsync(int eventId)
    {
        var qrCodes = await _context.EventQRCodes
            .Where(q => q.EventId == eventId)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        return qrCodes.Select(q => new EventQRCodeResponse
        {
            Id = q.Id,
            EventId = q.EventId,
            QRCodeData = q.QRCodeToken,
            QRCodeImageBase64 = q.QRCodeImageData ?? string.Empty,
            ExpiresAt = q.ExpiresAt,
            IsActive = q.IsActive,
            CreatedAt = q.CreatedAt
        }).ToList();
    }

    /// <summary>
    /// Generates a QR code specifically for a member to check into an event
    /// </summary>
    /// <param name="request">The member QR code generation request</param>
    /// <returns>The generated member QR code</returns>
    public async Task<DTOs.MemberEventQRCode> GenerateMemberQRCodeAsync(GenerateMemberQRCodeRequest request)
    {
        _logger.LogInformation("Generating QR code for member {MemberId} for event {EventId}",
            request.MemberId, request.EventId);

        // Validate event exists
        var eventEntity = await _context.Events.FindAsync(request.EventId);
        if (eventEntity == null)
        {
            throw new ArgumentException($"Event with ID {request.EventId} not found");
        }

        // Validate member exists
        var member = await _context.Members.FindAsync(request.MemberId);
        if (member == null)
        {
            throw new ArgumentException($"Member with ID {request.MemberId} not found");
        }

        // Generate unique token
        var token = Guid.NewGuid().ToString();
        var qrCodeData = $"CHECKIN:{request.EventId}:{request.MemberId}:{token}";

        // Generate QR code image
        var qrCodeImage = GenerateQRCodeImage(qrCodeData);
        var qrCodeImageBase64 = Convert.ToBase64String(qrCodeImage);

        var expiresAt = DateTime.UtcNow.AddHours(request.ValidForHours);

        // Create and save the QR code
        var memberQRCode = new EventQRCode
        {
            EventId = request.EventId,
            QRCodeToken = token,
            QRCodeImageData = qrCodeImageBase64,
            ExpiresAt = expiresAt,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventQRCodes.Add(memberQRCode);
        await _context.SaveChangesAsync();

        return new DTOs.MemberEventQRCode
        {
            Id = memberQRCode.Id,
            MemberId = request.MemberId,
            EventId = request.EventId,
            QRCodeData = qrCodeData,
            QRCodeImageBase64 = qrCodeImageBase64,
            ExpiresAt = expiresAt,
            IsActive = true
        };
    }

    private byte[] GenerateQRCodeImage(string qrCodeData)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeDataObject = qrGenerator.CreateQrCode(qrCodeData, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeDataObject);

        return qrCode.GetGraphic(20);
    }
}
