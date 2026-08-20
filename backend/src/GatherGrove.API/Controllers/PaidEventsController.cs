using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Enums;
using GatherGrove.API.Extensions;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing paid events functionality
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId:int}/paid-events")]
[Authorize(Policy = "ClubMember")]
public class PaidEventsController : ControllerBase
{
    private readonly IEventPricingService _eventPricingService;
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<PaidEventsController> _logger;

    public PaidEventsController(
        IEventPricingService eventPricingService,
        IClubAuthorizationService authService,
        ILogger<PaidEventsController> logger)
    {
        _eventPricingService = eventPricingService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a paid event
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreatePaidEvent(
        [FromRoute] int clubId,
        [FromBody] CreateEventRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var authResult = await this.VerifyClubMemberAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var result = await _eventPricingService.CreatePaidEventAsync(clubId, request, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating paid event for club {ClubId}", clubId);
            return BadRequest(new { Error = "Failed to create paid event" });
        }
    }

    /// <summary>
    /// Processes payment for event registration
    /// </summary>
    [HttpPost("payment")]
    public async Task<IActionResult> ProcessPayment(
        [FromRoute] int clubId,
        [FromBody] ProcessEventPaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var authResult = await this.VerifyClubMemberAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var result = await _eventPricingService.ProcessEventPaymentAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment for club {ClubId}", clubId);
            return BadRequest(new { Error = "Failed to process payment" });
        }
    }

    /// <summary>
    /// Gets event pricing details
    /// </summary>
    [HttpGet("{eventId}/pricing")]
    public async Task<IActionResult> GetEventPricing(
        [FromRoute] int clubId,
        int eventId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var authResult = await this.VerifyClubMemberAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var result = await _eventPricingService.GetEventPricingDetailsAsync(eventId, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event pricing for club {ClubId}", clubId);
            return BadRequest(new { Error = "Failed to get event pricing" });
        }
    }

    /// <summary>
    /// Processes refund for event registration
    /// </summary>
    [HttpPost("refund")]
    public async Task<IActionResult> ProcessRefund(
        [FromRoute] int clubId,
        [FromBody] ProcessEventRefundRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var authResult = await this.VerifyClubMemberAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var result = await _eventPricingService.ProcessEventRefundAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing refund for club {ClubId}", clubId);
            return BadRequest(new { Error = "Failed to process refund" });
        }
    }
}
