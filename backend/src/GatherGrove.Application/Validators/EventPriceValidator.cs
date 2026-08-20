using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Validators;

/// <summary>
/// Validates event pricing data
/// </summary>
public static class EventPriceValidator
{
    private const decimal MaxPrice = 10000.00m;

    /// <summary>
    /// Validates pricing data in CreateEventRequest
    /// </summary>
    /// <param name="request">The create event request to validate</param>
    /// <exception cref="ArgumentException">Thrown when validation fails</exception>
    public static void ValidateEventPrices(CreateEventRequest request)
    {
        ValidatePriceRanges(request.MemberPrice, request.NonMemberPrice);
        ValidatePriceLogic(request.MemberPrice, request.NonMemberPrice);
    }

    /// <summary>
    /// Validates pricing data in UpdateEventRequest
    /// </summary>
    /// <param name="request">The update event request to validate</param>
    /// <exception cref="ArgumentException">Thrown when validation fails</exception>
    public static void ValidateEventPrices(UpdateEventRequest request)
    {
        ValidatePriceRanges(request.MemberPrice, request.NonMemberPrice);
        ValidatePriceLogic(request.MemberPrice, request.NonMemberPrice);
    }

    /// <summary>
    /// Validates that prices are within acceptable ranges
    /// </summary>
    private static void ValidatePriceRanges(decimal? memberPrice, decimal? nonMemberPrice)
    {
        if (memberPrice.HasValue && memberPrice.Value < 0)
        {
            throw new ArgumentException("Member price cannot be negative");
        }

        if (nonMemberPrice.HasValue && nonMemberPrice.Value < 0)
        {
            throw new ArgumentException("Non-member price cannot be negative");
        }

        if (memberPrice.HasValue && memberPrice.Value > MaxPrice)
        {
            throw new ArgumentException($"Price cannot exceed ${MaxPrice:N0}");
        }

        if (nonMemberPrice.HasValue && nonMemberPrice.Value > MaxPrice)
        {
            throw new ArgumentException($"Price cannot exceed ${MaxPrice:N0}");
        }

        // Validate decimal places (max 2 decimal places)
        if (memberPrice.HasValue && decimal.Round(memberPrice.Value, 2) != memberPrice.Value)
        {
            throw new ArgumentException("Member price can have at most 2 decimal places");
        }

        if (nonMemberPrice.HasValue && decimal.Round(nonMemberPrice.Value, 2) != nonMemberPrice.Value)
        {
            throw new ArgumentException("Non-member price can have at most 2 decimal places");
        }
    }

    /// <summary>
    /// Validates pricing business logic
    /// </summary>
    private static void ValidatePriceLogic(decimal? memberPrice, decimal? nonMemberPrice)
    {
        if (memberPrice.HasValue && nonMemberPrice.HasValue &&
            memberPrice.Value > nonMemberPrice.Value)
        {
            throw new ArgumentException("Member price cannot be greater than non-member price");
        }
    }
}