using System.Collections.Generic;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing a list of event payments
/// </summary>
public class EventPaymentListDto
{
    /// <summary>
    /// List of payments
    /// </summary>
    public List<EventPaymentDetailsDto> Payments { get; set; } = new();

    /// <summary>
    /// Total number of payments
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Total amount paid (sum of successful payments)
    /// </summary>
    public decimal TotalAmountPaid { get; set; }

    /// <summary>
    /// Number of successful payments
    /// </summary>
    public int SuccessfulPaymentCount { get; set; }

    /// <summary>
    /// Number of pending payments
    /// </summary>
    public int PendingPaymentCount { get; set; }

    /// <summary>
    /// Number of failed payments
    /// </summary>
    public int FailedPaymentCount { get; set; }

    /// <summary>
    /// Number of refunded payments
    /// </summary>
    public int RefundedPaymentCount { get; set; }
}
