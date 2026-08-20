using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for creating an event
/// </summary>
public class CreateEventResponse
{
    public bool IsSuccess { get; set; }
    public int EventId { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Response for updating an event
/// </summary>
public class UpdateEventResponse
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Response for event pricing validation
/// </summary>
public class EventPricingValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// Current event pricing information
/// </summary>
public class CurrentEventPricing
{
    public int EventId { get; set; }
    public decimal MemberPrice { get; set; }
    public decimal NonMemberPrice { get; set; }
    public decimal? EarlyBirdPrice { get; set; }
    public DateTime? EarlyBirdDeadline { get; set; }
    public bool IsEarlyBirdActive { get; set; }
    public string Currency { get; set; } = "USD";
    public string FormattedPrice { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Event registration result for paid events
/// </summary>
public class PaidEventRegistrationResult
{
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
    public int? RegistrationId { get; set; }
    public string? PaymentIntentId { get; set; }
    public decimal AmountPaid { get; set; }
}