using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing billing and subscription operations
/// </summary>
[ApiController]
[Route("api/v1/billing")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;
    private readonly IPromotionService _promotionService;
    private readonly ILogger<BillingController> _logger;

    public BillingController(
        IBillingService billingService,
        IPromotionService promotionService,
        ILogger<BillingController> logger)
    {
        _billingService = billingService;
        _promotionService = promotionService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the current billing status and subscription information for the authenticated user's club
    /// </summary>
    /// <returns>Current billing status and subscription details</returns>
    /// <response code="200">Returns the billing status successfully</response>
    /// <response code="401">User is not authenticated</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">An error occurred while retrieving billing status</response>
    [HttpGet("status")]
    [ProducesResponseType(typeof(BillingStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<BillingStatusResponse>> GetBillingStatus()
    {
        try
        {
            var clubId = GetClubIdFromClaims();
            var status = await _billingService.GetBillingStatusAsync(clubId);
            return Ok(status);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to billing status: {Error}", ex.Message);
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Club not found for billing status: {Error}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving billing status");
            return StatusCode(500, new { message = "An error occurred while retrieving billing status" });
        }
    }

    /// <summary>
    /// Upgrades the authenticated admin user's club subscription
    /// </summary>
    /// <param name="request">The upgrade request containing payment method and plan details</param>
    /// <returns>The upgrade result with subscription details</returns>
    /// <response code="200">Successfully upgraded subscription</response>
    /// <response code="400">Invalid request data or payment failed</response>
    /// <response code="401">User is not authenticated</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">An error occurred during subscription upgrade</response>
    [HttpPost("upgrade")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(UpgradeSubscriptionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UpgradeSubscriptionResponse>> UpgradeSubscription([FromBody] UpgradeSubscriptionRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var clubId = GetClubIdFromClaims();
            var result = await _billingService.UpgradeSubscriptionAsync(clubId, request);

            _logger.LogInformation("Successfully upgraded club {ClubId} to {Tier}", clubId, result.NewTier);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to billing upgrade: {Error}", ex.Message);
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid upgrade request: {Error}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for upgrade: {Error}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during subscription upgrade");
            return StatusCode(500, new { message = "An error occurred during subscription upgrade" });
        }
    }

    /// <summary>
    /// Claims a 30-day free trial for the authenticated user's club.
    /// </summary>
    [HttpPost("claim-trial")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ClaimTrialResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ClaimTrialResponse>> ClaimTrial([FromBody] ClaimTrialRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var clubId = GetClubIdFromClaims();
            var result = await _billingService.ClaimTrialAsync(clubId, request.TargetTier, request.PaymentMethodId, request.BillingCycle);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to claim trial: {Error}", ex.Message);
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid claim trial request: {Error}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid claim trial operation: {Error}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error claiming trial");
            return StatusCode(500, new { message = "An error occurred while claiming the trial" });
        }
    }

    /// <summary>
    /// Creates a Stripe customer portal session for payment method updates.
    /// </summary>
    [HttpPost("customer-portal-session")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(CreateCustomerPortalSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CreateCustomerPortalSessionResponse>> CreateCustomerPortalSession()
    {
        try
        {
            var clubId = GetClubIdFromClaims();
            var result = await _billingService.CreateCustomerPortalSessionAsync(clubId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to customer portal session: {Error}", ex.Message);
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid customer portal request: {Error}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid customer portal operation: {Error}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating customer portal session");
            return StatusCode(500, new { message = "An error occurred while creating customer portal session" });
        }
    }

    /// <summary>
    /// Cancels the authenticated user's club subscription
    /// </summary>
    /// <returns>Success status of the cancellation</returns>
    /// <response code="200">Successfully cancelled subscription</response>
    /// <response code="400">No active subscription to cancel</response>
    /// <response code="401">User is not authenticated</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">An error occurred during subscription cancellation</response>
    [HttpPost("cancel")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> CancelSubscription()
    {
        try
        {
            var clubId = GetClubIdFromClaims();
            var success = await _billingService.CancelSubscriptionAsync(clubId);

            if (success)
            {
                _logger.LogInformation("Successfully cancelled subscription for club {ClubId}", clubId);
                return Ok(new { message = "Subscription cancelled successfully" });
            }
            else
            {
                return StatusCode(500, new { message = "Failed to cancel subscription" });
            }
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to subscription cancellation: {Error}", ex.Message);
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Club not found for cancellation: {Error}", ex.Message);
            return NotFound(new { message = "Club not found" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid cancellation request: {Error}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during subscription cancellation");
            return StatusCode(500, new { message = "An error occurred during subscription cancellation" });
        }
    }

    /// <summary>
    /// Webhook endpoint for processing Stripe events to keep subscription status in sync
    /// </summary>
    /// <returns>Success status of webhook processing</returns>
    /// <response code="200">Webhook processed successfully</response>
    /// <response code="400">Invalid webhook signature or payload</response>
    /// <response code="500">An error occurred while processing webhook</response>
    [HttpPost("webhook")]
    [AllowAnonymous]
    [EnableRateLimiting("WebhookApi")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> ProcessWebhook()
    {
        try
        {
            // Enable buffering and reset position so we can read even if middleware already consumed the stream
            HttpContext.Request.EnableBuffering();
            HttpContext.Request.Body.Position = 0;
            var json = await new StreamReader(HttpContext.Request.Body, leaveOpen: true).ReadToEndAsync();
            var stripeSignature = Request.Headers["Stripe-Signature"].ToString();

            if (string.IsNullOrEmpty(stripeSignature))
            {
                _logger.LogWarning("Missing Stripe signature in webhook request");
                return BadRequest(new { message = "Missing Stripe signature" });
            }

            var success = await _billingService.ProcessWebhookAsync(json, stripeSignature);

            if (success)
            {
                return Ok();
            }
            else
            {
                return StatusCode(500, new { message = "Failed to process webhook" });
            }
        }
        catch (ArgumentException ex)
        {
            _logger.LogError(ex, "Error processing Stripe webhook");
            return BadRequest(new { message = "Invalid webhook payload" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Stripe webhook");
            return StatusCode(500, new { message = "An error occurred while processing webhook" });
        }
    }

    /// <summary>
    /// Gets the current active promotion (auto-apply) if one is available
    /// </summary>
    /// <returns>Active promotion details if available</returns>
    /// <response code="200">Returns active promotion info (may indicate no promotion available)</response>
    /// <response code="500">An error occurred while retrieving promotion info</response>
    [HttpGet("active-promotion")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ActivePromotionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ActivePromotionResponse>> GetActivePromotion()
    {
        try
        {
            var response = await _promotionService.GetActivePromotionResponseAsync();
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active promotion");
            return StatusCode(500, new { message = "An error occurred while retrieving promotion info" });
        }
    }

    /// <summary>
    /// Validates a promo code and returns the associated promotion details if valid
    /// </summary>
    /// <param name="request">The promo code to validate</param>
    /// <returns>Validation result with promotion details if valid</returns>
    /// <response code="200">Returns validation result (may indicate invalid code)</response>
    /// <response code="400">Invalid request</response>
    /// <response code="500">An error occurred during validation</response>
    [HttpPost("validate-promo")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthApi")]
    [ProducesResponseType(typeof(ValidatePromoCodeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ValidatePromoCodeResponse>> ValidatePromoCode([FromBody] ValidatePromoCodeRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _promotionService.ValidatePromoCodeAsync(request.PromoCode);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating promo code");
            return StatusCode(500, new { message = "An error occurred during promo code validation" });
        }
    }

    /// <summary>
    /// Helper method to extract club ID from JWT claims
    /// </summary>
    private int GetClubIdFromClaims()
    {
        var clubIdClaim = User.FindFirst("ClubId")?.Value;
        if (string.IsNullOrEmpty(clubIdClaim) || !int.TryParse(clubIdClaim, out var clubId))
        {
            throw new UnauthorizedAccessException("Invalid or missing club ID in token");
        }
        return clubId;
    }
}
