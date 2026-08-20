using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a QR code for event check-in
/// </summary>
public class EventQRCode
{
    /// <summary>
    /// Unique identifier for the QR code
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The event this QR code is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Unique token for the QR code
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string QRCodeToken { get; set; } = string.Empty;

    /// <summary>
    /// Type of QR code
    /// </summary>
    public QRCodeType QRCodeType { get; set; } = QRCodeType.EventCheckin;

    /// <summary>
    /// When this QR code expires
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Whether multiple scans are allowed
    /// </summary>
    public bool AllowMultipleScans { get; set; } = false;

    /// <summary>
    /// Whether RSVP is required to use this QR code
    /// </summary>
    public bool RequireRSVP { get; set; } = true;

    /// <summary>
    /// Whether this QR code is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Base64 encoded QR code image data
    /// </summary>
    public string? QRCodeImageData { get; set; }

    /// <summary>
    /// Custom name for this QR code (e.g., "Main Entrance", "VIP Entrance")
    /// </summary>
    [MaxLength(100)]
    public string? Name { get; set; }

    /// <summary>
    /// Location where this QR code should be used
    /// </summary>
    [MaxLength(200)]
    public string? Location { get; set; }

    /// <summary>
    /// When this QR code was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this QR code was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the event
    /// </summary>
    public virtual Event Event { get; set; } = null!;

    /// <summary>
    /// Navigation property for QR code scans
    /// </summary>
    public virtual ICollection<QRCodeScan> Scans { get; set; } = new List<QRCodeScan>();
}

/// <summary>
/// Represents a personalized QR code for a specific member and event
/// </summary>
public class MemberEventQRCode
{
    /// <summary>
    /// Unique identifier for the member QR code
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The event this QR code is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// The member this QR code belongs to
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Unique token for the QR code
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string QRCodeToken { get; set; } = string.Empty;

    /// <summary>
    /// When this QR code expires
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Whether this QR code is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Base64 encoded QR code image data
    /// </summary>
    public string? QRCodeImageData { get; set; }

    /// <summary>
    /// Custom data associated with this member QR code
    /// </summary>
    public Dictionary<string, string>? CustomData { get; set; }

    /// <summary>
    /// When this QR code was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Navigation property for the event
    /// </summary>
    public virtual Event Event { get; set; } = null!;

    /// <summary>
    /// Navigation property for the member
    /// </summary>
    public virtual Member Member { get; set; } = null!;
}

/// <summary>
/// Represents a scan/usage of a QR code
/// </summary>
public class QRCodeScan
{
    /// <summary>
    /// Unique identifier for the scan
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The QR code that was scanned
    /// </summary>
    public int QRCodeId { get; set; }

    /// <summary>
    /// The member who scanned the QR code
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// When the QR code was scanned
    /// </summary>
    public DateTime ScannedAt { get; set; }

    /// <summary>
    /// Location where the scan occurred
    /// </summary>
    [MaxLength(200)]
    public string? ScanLocation { get; set; }

    /// <summary>
    /// Device or method used for scanning
    /// </summary>
    [MaxLength(100)]
    public string? ScanMethod { get; set; }

    /// <summary>
    /// Whether the scan was successful
    /// </summary>
    public bool IsSuccessful { get; set; } = true;

    /// <summary>
    /// Error message if scan failed
    /// </summary>
    [MaxLength(500)]
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Navigation property for the QR code
    /// </summary>
    public virtual EventQRCode QRCode { get; set; } = null!;

    /// <summary>
    /// Navigation property for the member
    /// </summary>
    public virtual Member Member { get; set; } = null!;
}

/// <summary>
/// QR code type enumeration
/// </summary>
public enum QRCodeType
{
    EventCheckin = 1,
    MembershipCard = 2,
    TicketValidation = 3,
    AccessControl = 4
}