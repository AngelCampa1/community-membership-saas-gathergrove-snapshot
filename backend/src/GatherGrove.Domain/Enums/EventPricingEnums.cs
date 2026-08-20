namespace GatherGrove.Domain.Enums;

/// <summary>
/// RSVP status for event attendees
/// </summary>
public enum RsvpStatus
{
    Pending = 0,
    Confirmed = 1,
    Declined = 2,
    Cancelled = 3,
    NoShow = 4,
    CheckedIn = 5
}

/// <summary>
/// Refund policy types for paid events
/// </summary>
public enum RefundPolicyType
{
    NoRefunds = 0,
    FullRefund = 1,
    PartialRefund = 2,
    RefundableUntilEventDate = 3,
    RefundableUntil24Hours = 4,
    RefundableUntil48Hours = 5,
    RefundableUntil1Week = 6,
    Custom = 7
}

/// <summary>
/// Refund status for processed refunds
/// </summary>
public enum RefundStatus
{
    Requested = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3,
    Cancelled = 4,
    Denied = 5
}

/// <summary>
/// Payment status for event registrations
/// </summary>
public enum EventPaymentStatus
{
    Pending = 0,
    Succeeded = 1,
    Failed = 2,
    Cancelled = 3,
    Refunded = 4,
    PartiallyRefunded = 5,
    RequiresPaymentMethod = 6,
    RequiresConfirmation = 7,
    RequiresAction = 8,
    Processing = 9,
    RequiresCapture = 10,
    Disputed = 11
}

/// <summary>
/// Alias for EventPaymentStatus for compatibility
/// </summary>
public enum PaymentStatus
{
    Pending = 0,
    Succeeded = 1,
    Failed = 2,
    Cancelled = 3,
    Refunded = 4,
    PartiallyRefunded = 5,
    RequiresPaymentMethod = 6,
    RequiresConfirmation = 7,
    RequiresAction = 8,
    Processing = 9,
    RequiresCapture = 10,
    Disputed = 11
}