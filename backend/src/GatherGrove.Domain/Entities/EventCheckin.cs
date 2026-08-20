using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents an event check-in record
/// </summary>
public class EventCheckin
{
    /// <summary>
    /// Unique identifier for the check-in
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The event this check-in is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// The member checking in
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// When the member checked in
    /// </summary>
    public DateTime CheckinTime { get; set; }

    /// <summary>
    /// When the member checked out (optional)
    /// </summary>
    public DateTime? CheckoutTime { get; set; }

    /// <summary>
    /// Method used for check-in
    /// </summary>
    public CheckinMethod CheckinMethod { get; set; } = CheckinMethod.Manual;

    /// <summary>
    /// Location where check-in occurred
    /// </summary>
    [MaxLength(200)]
    public string? CheckinLocation { get; set; }

    /// <summary>
    /// QR code token used for check-in (if applicable)
    /// </summary>
    [MaxLength(100)]
    public string? QRCodeToken { get; set; }

    /// <summary>
    /// Additional notes about the check-in
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    /// <summary>
    /// Whether this check-in was verified
    /// </summary>
    public bool IsVerified { get; set; } = true;

    /// <summary>
    /// IP address of the check-in (for security)
    /// </summary>
    [MaxLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent of the check-in device
    /// </summary>
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Navigation properties
    /// </summary>
    public virtual Event? Event { get; set; }
    public virtual Member? Member { get; set; }
}

/// <summary>
/// Check-in method enumeration
/// </summary>
public enum CheckinMethod
{
    Manual = 1,
    QRCode = 2,
    NFC = 3,
    Auto = 4
}