using GatherGrove.Application.DTOs;
using GatherGrove.Application.Security;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for handling payment operations
/// </summary>
[ApiController]
[Route("api/v1")]
[EnableRateLimiting("StrictApi")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(IPaymentService paymentService, ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    /// <summary>
    /// Request online payment from a member (Admin only)
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="memberId">The member ID</param>
    /// <param name="request">Payment request details</param>
    /// <returns>Success confirmation</returns>
    [HttpPost("clubs/{clubId}/members/{memberId}/request-payment")]
    [Authorize]
    public async Task<IActionResult> RequestPayment(int clubId, int memberId, [FromBody] RequestPaymentRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Invalid user authentication");
            }

            // Verify user has admin role
            if (!User.IsInRole("Admin"))
            {
                return Forbid("Admin access required");
            }

            // Verify user belongs to the requested club
            var userClubIdClaim = User.FindFirst("ClubId")?.Value;
            if (string.IsNullOrEmpty(userClubIdClaim) || !int.TryParse(userClubIdClaim, out var userClubId) || userClubId != clubId)
            {
                return Forbid("Access denied: You can only request payments for your own club");
            }

            await _paymentService.RequestPaymentAsync(clubId, memberId, request);

            _logger.LogInformation("Payment request created for member {MemberId} by user {UserId}", memberId, userId);

            return Ok(new { message = "Payment request sent successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request for payment from member {MemberId}", memberId);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Payment request failed for member {MemberId}", memberId);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error requesting payment from member {MemberId}", memberId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Get payment page details for a secure token (Public endpoint)
    /// </summary>
    /// <param name="secureToken">The secure payment token</param>
    /// <returns>Payment page details</returns>
    [HttpGet("payment-page/{secureToken}")]
    public async Task<IActionResult> GetPaymentPage(string secureToken)
    {
        try
        {
            var paymentPage = await _paymentService.GetPaymentPageAsync(secureToken);
            return Ok(paymentPage);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid payment token fingerprint: {TokenFingerprint}", SensitiveLogValue.Fingerprint(secureToken));
            return NotFound(new { message = "Payment link not found or invalid" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving payment page for token fingerprint {TokenFingerprint}", SensitiveLogValue.Fingerprint(secureToken));
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Process payment for a secure token (Public endpoint)
    /// </summary>
    /// <param name="secureToken">The secure payment token</param>
    /// <param name="request">Payment processing details</param>
    /// <returns>Payment success confirmation</returns>
    [HttpPost("payment-page/{secureToken}/pay")]
    public async Task<IActionResult> ProcessPayment(string secureToken, [FromBody] GatherGrove.Application.DTOs.ProcessPaymentRequest request)
    {
        try
        {
            // Process payment using the payment service
            await _paymentService.ProcessPaymentAsync(secureToken, request);

            _logger.LogInformation("Payment processed successfully for token fingerprint {TokenFingerprint}", SensitiveLogValue.Fingerprint(secureToken));

            return Ok(new { message = "Payment processed successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid payment token fingerprint: {TokenFingerprint}", SensitiveLogValue.Fingerprint(secureToken));
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Payment processing failed for token fingerprint {TokenFingerprint}", SensitiveLogValue.Fingerprint(secureToken));
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing payment for token fingerprint {TokenFingerprint}", SensitiveLogValue.Fingerprint(secureToken));
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Get all payments for a club (Admin only)
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="year">The year to filter payments (optional, defaults to current year)</param>
    /// <returns>List of payments for the club</returns>
    [HttpGet("clubs/{clubId}/payments")]
    [Authorize]
    public async Task<IActionResult> GetClubPayments(int clubId, [FromQuery] int? year)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Invalid user authentication");
            }

            // Verify user has admin role
            if (!User.IsInRole("Admin"))
            {
                return Forbid("Admin access required");
            }

            // Verify user belongs to the requested club
            var userClubIdClaim = User.FindFirst("ClubId")?.Value;
            if (string.IsNullOrEmpty(userClubIdClaim) || !int.TryParse(userClubIdClaim, out var userClubId) || userClubId != clubId)
            {
                return Forbid("Access denied: You can only access payments for your own club");
            }

            var payments = await _paymentService.GetClubPaymentsAsync(clubId, year);

            return Ok(payments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving payments for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Log payment error for analytics (public endpoint for frontend error tracking)
    /// PHASE 2 FIX: Added endpoint to track payment failures from frontend
    /// </summary>
    /// <param name="request">Payment error details</param>
    /// <returns>Success confirmation</returns>
    [HttpPost("payments/log-error")]
    [AllowAnonymous] // No auth needed for error logging
    [EnableRateLimiting("Permissive")] // Less strict rate limiting for error logs
    public IActionResult LogPaymentError([FromBody] PaymentErrorLogRequest request)
    {
        try
        {
            // Log payment error with context for analytics and debugging
            _logger.LogWarning(
                "Payment error logged - TokenFingerprint: {TokenFingerprint}, Error: {Error}, Timestamp: {Timestamp}, UserAgent: {UserAgent}",
                SensitiveLogValue.Fingerprint(request.Token),
                request.Error,
                request.Timestamp,
                request.UserAgent
            );

            // Optional: Store in database for analytics
            // Can be implemented later if needed:
            // await _paymentErrorRepository.LogErrorAsync(request);

            return Ok(new { success = true, message = "Error logged successfully" });
        }
        catch (Exception ex)
        {
            // Even error logging shouldn't crash - log and continue
            _logger.LogError(ex, "Failed to log payment error for token fingerprint {TokenFingerprint}", SensitiveLogValue.Fingerprint(request?.Token));
            return Ok(new { success = false, message = "Failed to log error, but processing continues" });
        }
    }
}
