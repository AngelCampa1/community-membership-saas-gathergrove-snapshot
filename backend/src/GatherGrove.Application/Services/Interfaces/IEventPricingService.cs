using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Service for managing event pricing functionality
/// </summary>
public interface IEventPricingService
{
    /// <summary>
    /// Creates a paid event with pricing information
    /// </summary>
    Task<CreateEventResponse> CreatePaidEventAsync(int clubId, CreateEventRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates event pricing information
    /// </summary>
    Task<UpdateEventResponse> UpdateEventPricingAsync(int eventId, UpdateEventPricingRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculates pricing for an event based on member status
    /// </summary>
    Task<EventPricingCalculationResponse> CalculateEventPricingAsync(int eventId, int memberId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Processes payment for event registration
    /// </summary>
    Task<PaymentResponse> ProcessEventPaymentAsync(ProcessEventPaymentRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Processes refund for event registration
    /// </summary>
    Task<RefundResponse> ProcessEventRefundAsync(ProcessEventRefundRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets revenue analytics for events
    /// </summary>
    Task<EventRevenueAnalyticsResponse> GetEventRevenueAnalyticsAsync(int clubId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates event pricing configuration
    /// </summary>
    Task<DTOs.EventPricingValidationResult> ValidateEventPricingAsync(ValidateEventPricingRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets event pricing details
    /// </summary>
    Task<EventPricingDetailsResponse> GetEventPricingDetailsAsync(int eventId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Applies promo code to event registration
    /// </summary>
    Task<PromoCodeApplicationResult> ApplyPromoCodeAsync(ApplyPromoCodeRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets refund policy for an event
    /// </summary>
    Task<RefundPolicyResponse> GetEventRefundPolicyAsync(int eventId, CancellationToken cancellationToken = default);
}

// DTOs for the service methods
public class UpdateEventPricingRequest
{
    public decimal? MemberPrice { get; set; }
    public decimal? NonMemberPrice { get; set; }
    public RefundPolicyType RefundPolicy { get; set; }
    public string? PromoCode { get; set; }
    public DateTime? EarlyBirdDeadline { get; set; }
    public decimal? EarlyBirdDiscount { get; set; }
}

public class EventPricingCalculationResponse
{
    public decimal Price { get; set; }
    public bool IsFree { get; set; }
    public bool IsMemberPrice { get; set; }
    public decimal? DiscountAmount { get; set; }
    public string? DiscountReason { get; set; }
}

public class ProcessEventPaymentRequest
{
    public int EventId { get; set; }
    public int MemberId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethodId { get; set; } = string.Empty;
    public string? PromoCode { get; set; }
}

public class ProcessEventRefundRequest
{
    public int EventId { get; set; }
    public int MemberId { get; set; }
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public RefundPolicyType RefundPolicy { get; set; }
}

public class RefundResponse
{
    public bool IsSuccess { get; set; }
    public string RefundId { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public RefundStatus Status { get; set; }
    public string? Message { get; set; }
}

public class EventRevenueAnalyticsResponse
{
    public decimal TotalRevenue { get; set; }
    public int TotalPaidRegistrations { get; set; }
    public int TotalFreeRegistrations { get; set; }
    public decimal AverageTicketPrice { get; set; }
    public List<EventRevenueDetail> EventDetails { get; set; } = new();
}

public class EventRevenueDetail
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int PaidRegistrations { get; set; }
    public int FreeRegistrations { get; set; }
}

public class ValidateEventPricingRequest
{
    public decimal? MemberPrice { get; set; }
    public decimal? NonMemberPrice { get; set; }
    public RefundPolicyType RefundPolicy { get; set; }
    public DateTime EventDate { get; set; }
}


public class EventPricingDetailsResponse
{
    public int EventId { get; set; }
    public decimal? MemberPrice { get; set; }
    public decimal? NonMemberPrice { get; set; }
    public bool IsFree { get; set; }
    public RefundPolicyType RefundPolicy { get; set; }
    public string RefundPolicyDescription { get; set; } = string.Empty;
    public DateTime? EarlyBirdDeadline { get; set; }
    public decimal? EarlyBirdDiscount { get; set; }
}

public class ApplyPromoCodeRequest
{
    public int EventId { get; set; }
    public int MemberId { get; set; }
    public string PromoCode { get; set; } = string.Empty;
}

public class PromoCodeApplicationResult
{
    public bool IsValid { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FinalPrice { get; set; }
    public string? Message { get; set; }
}

public class RefundPolicyResponse
{
    public RefundPolicyType PolicyType { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsRefundable { get; set; }
    public DateTime? RefundDeadline { get; set; }
    public decimal RefundPercentage { get; set; }
}

/// <summary>
/// New version of update request for pricing compatibility
/// </summary>
public class UpdateEventPricingRequestNew : UpdateEventPricingRequest
{
    public int? MaxCapacity { get; set; }
    public bool? EnableWaitlist { get; set; }
}