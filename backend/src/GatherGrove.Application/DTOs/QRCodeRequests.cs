using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to generate an event QR code
/// </summary>
public class GenerateEventQRCodeRequest
{
    /// <summary>
    /// The expected route club for this event. When supplied, the event must belong to this club.
    /// </summary>
    public int? ClubId { get; set; }

    /// <summary>
    /// The event ID
    /// </summary>
    [Required]
    public int EventId { get; set; }

    /// <summary>
    /// When the QR code expires
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Whether multiple scans are allowed
    /// </summary>
    public bool AllowMultipleScans { get; set; } = false;

    /// <summary>
    /// Whether an RSVP is required to use this QR code
    /// </summary>
    public bool RequireRSVP { get; set; } = true;

    /// <summary>
    /// Expiration time in minutes from creation
    /// </summary>
    public int? ExpirationMinutes { get; set; }

    /// <summary>
    /// Whether location validation is required
    /// </summary>
    public bool RequireLocation { get; set; } = false;
}

/// <summary>
/// Request to generate a member-specific QR code
/// </summary>
public class GenerateMemberQRCodeRequest
{
    /// <summary>
    /// The event ID
    /// </summary>
    [Required]
    public int EventId { get; set; }

    /// <summary>
    /// The member ID
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// How long the QR code is valid for in hours
    /// </summary>
    public int ValidForHours { get; set; } = 24;

    /// <summary>
    /// Custom data to include in the QR code
    /// </summary>
    public Dictionary<string, string>? CustomData { get; set; }
}

/// <summary>
/// Request for QR code check-in
/// </summary>
public class QRCodeCheckinRequest
{
    /// <summary>
    /// The expected route club for this check-in. When supplied, the event must belong to this club.
    /// </summary>
    public int? ClubId { get; set; }

    /// <summary>
    /// The expected route event for this check-in. When supplied, the QR token must resolve to this event.
    /// </summary>
    public int? EventId { get; set; }

    /// <summary>
    /// The QR code data/token
    /// </summary>
    [Required]
    public string QRCodeData { get; set; } = string.Empty;

    /// <summary>
    /// The QR code token (alternative property name for compatibility)
    /// </summary>
    public string QRCodeToken { get; set; } = string.Empty;

    /// <summary>
    /// The member checking in
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// When the check-in occurred
    /// </summary>
    public DateTime CheckinTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Location of the check-in
    /// </summary>
    public string? Location { get; set; }
}

/// <summary>
/// Request to bulk generate QR codes
/// </summary>
public class BulkGenerateQRCodesRequest
{
    /// <summary>
    /// The event ID to generate QR codes for
    /// </summary>
    [Required]
    public int EventId { get; set; }

    /// <summary>
    /// Number of QR codes to generate
    /// </summary>
    [Required]
    public int Count { get; set; } = 1;

    /// <summary>
    /// How long the QR codes are valid for in minutes
    /// </summary>
    public int ValidForMinutes { get; set; } = 1440; // 24 hours

    /// <summary>
    /// Type of QR codes to generate
    /// </summary>
    public QRCodeType QRCodeType { get; set; } = QRCodeType.EventCheckin;

    /// <summary>
    /// When the QR codes expire
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Name prefix for the generated codes
    /// </summary>
    public string? NamePrefix { get; set; }
}

/// <summary>
/// Response for check-in operations
/// </summary>
public class CheckinResponse
{
    /// <summary>
    /// Whether the check-in was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// The check-in time
    /// </summary>
    public DateTime? CheckinTime { get; set; }

    /// <summary>
    /// The checkout time (if checking out)
    /// </summary>
    public DateTime? CheckoutTime { get; set; }

    /// <summary>
    /// Duration of attendance
    /// </summary>
    public TimeSpan? Duration { get; set; }

    /// <summary>
    /// The check-in method used
    /// </summary>
    public Domain.Entities.CheckinMethod? CheckinMethod { get; set; }

    /// <summary>
    /// Alternative property name for check-in method
    /// </summary>
    public Domain.Entities.CheckinMethod? Method { get; set; }

    /// <summary>
    /// Member ID for the check-in
    /// </summary>
    public int? MemberId { get; set; }

    /// <summary>
    /// Event ID for the check-in
    /// </summary>
    public int? EventId { get; set; }

    /// <summary>
    /// Location of the check-in
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// Error message if check-in failed
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Response containing check-in statistics
/// </summary>
public class CheckinStatisticsResponse
{
    /// <summary>
    /// Total number of check-ins
    /// </summary>
    public int TotalCheckins { get; set; }

    /// <summary>
    /// Number of QR code check-ins
    /// </summary>
    public int QRCodeCheckins { get; set; }

    /// <summary>
    /// Number of manual check-ins
    /// </summary>
    public int ManualCheckins { get; set; }

    /// <summary>
    /// Number of NFC check-ins
    /// </summary>
    public int NFCCheckins { get; set; }

    /// <summary>
    /// Breakdown by check-in method
    /// </summary>
    public Dictionary<Domain.Entities.CheckinMethod, int> CheckinMethodBreakdown { get; set; } = new();

    /// <summary>
    /// Average check-in time
    /// </summary>
    public TimeSpan AverageCheckinTime { get; set; }

    /// <summary>
    /// Peak check-in hour
    /// </summary>
    public int PeakCheckinHour { get; set; }

    /// <summary>
    /// Event ID for statistics context
    /// </summary>
    public int? EventId { get; set; }

    /// <summary>
    /// Total number of checkouts
    /// </summary>
    public int TotalCheckouts { get; set; }

    /// <summary>
    /// Number of people currently present
    /// </summary>
    public int CurrentlyPresent { get; set; }

    /// <summary>
    /// Check-ins broken down by hour
    /// </summary>
    public Dictionary<int, int> CheckinsByHour { get; set; } = new();

    /// <summary>
    /// Average stay duration
    /// </summary>
    public TimeSpan AverageStayDuration { get; set; }

    /// <summary>
    /// Peak hour for attendance
    /// </summary>
    public int PeakHour { get; set; }
}

/// <summary>
/// QR code usage statistics
/// </summary>
public class QRCodeUsageStatistics
{
    /// <summary>
    /// The QR code token
    /// </summary>
    public string QRCodeToken { get; set; } = string.Empty;

    /// <summary>
    /// Total number of scans
    /// </summary>
    public int TotalScans { get; set; }

    /// <summary>
    /// Number of unique scans
    /// </summary>
    public int UniqueScans { get; set; }

    /// <summary>
    /// When it was last scanned
    /// </summary>
    public DateTime? LastScannedAt { get; set; }

    /// <summary>
    /// Scans broken down by hour
    /// </summary>
    public Dictionary<int, int> ScansByHour { get; set; } = new();

    /// <summary>
    /// Most active hour
    /// </summary>
    public int MostActiveHour { get; set; }
}



/// <summary>
/// Event QR code response
/// </summary>
public class EventQRCodeResponse
{
    /// <summary>
    /// QR code ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Event ID
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// QR code data
    /// </summary>
    public string QRCodeData { get; set; } = string.Empty;

    /// <summary>
    /// QR code image as Base64
    /// </summary>
    public string QRCodeImageBase64 { get; set; } = string.Empty;

    /// <summary>
    /// QR code type
    /// </summary>
    public QRCodeType QRCodeType { get; set; }

    /// <summary>
    /// Expiration time
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Whether the QR code is active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// When created
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// QR code validation result
/// </summary>
public class QRCodeValidationResult
{
    /// <summary>
    /// Whether the QR code is valid
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// Event ID if valid
    /// </summary>
    public int? EventId { get; set; }

    /// <summary>
    /// Event name if valid
    /// </summary>
    public string? EventName { get; set; }

    /// <summary>
    /// Member ID
    /// </summary>
    public int? MemberId { get; set; }

    /// <summary>
    /// When validated
    /// </summary>
    public DateTime? ValidatedAt { get; set; }

    /// <summary>
    /// Error message if invalid
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// QR code usage statistics
/// </summary>
public class QRCodeUsageStats
{
    /// <summary>
    /// QR code ID
    /// </summary>
    public int QRCodeId { get; set; }

    /// <summary>
    /// Total scans
    /// </summary>
    public int TotalScans { get; set; }

    /// <summary>
    /// Unique users
    /// </summary>
    public int UniqueUsers { get; set; }

    /// <summary>
    /// First scan time
    /// </summary>
    public DateTime? FirstScanAt { get; set; }

    /// <summary>
    /// Last scan time
    /// </summary>
    public DateTime? LastScanAt { get; set; }

    /// <summary>
    /// Scans by hour
    /// </summary>
    public Dictionary<int, int> ScansByHour { get; set; } = new();
}

/// <summary>
/// Member-specific QR code
/// </summary>
public class MemberEventQRCode
{
    /// <summary>
    /// QR code ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Event ID
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// QR code data
    /// </summary>
    public string QRCodeData { get; set; } = string.Empty;

    /// <summary>
    /// QR code image as Base64
    /// </summary>
    public string QRCodeImageBase64 { get; set; } = string.Empty;

    /// <summary>
    /// Expiration time
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Whether active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// When created
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

