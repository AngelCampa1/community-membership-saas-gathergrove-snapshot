using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for handling Resend inbound email webhooks
/// All emails sent to @gathergrove.club are forwarded to the configured admin email
/// </summary>
[ApiController]
[Route("api/v1/email")]
public class EmailWebhookController : ControllerBase
{
    private readonly IResendWebhookService _webhookService;
    private readonly ILogger<EmailWebhookController> _logger;

    public EmailWebhookController(
        IResendWebhookService webhookService,
        ILogger<EmailWebhookController> logger)
    {
        _webhookService = webhookService ?? throw new ArgumentNullException(nameof(webhookService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Webhook endpoint for processing Resend inbound emails
    /// All received emails are forwarded to the admin email address
    /// </summary>
    /// <returns>200 OK if processed, 400 Bad Request if signature invalid</returns>
    /// <response code="200">Webhook processed successfully</response>
    /// <response code="400">Invalid webhook signature or missing headers</response>
    [HttpPost("webhook")]
    [AllowAnonymous]
    [IgnoreAntiforgeryToken] // Webhooks use signature authentication, not CSRF tokens
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> ProcessWebhook()
    {
        try
        {
            // Read raw request body (required for signature verification)
            var payload = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();

            // Extract Svix signature headers
            var headers = new Dictionary<string, string>
            {
                ["svix-id"] = Request.Headers["svix-id"].ToString(),
                ["svix-timestamp"] = Request.Headers["svix-timestamp"].ToString(),
                ["svix-signature"] = Request.Headers["svix-signature"].ToString()
            };

            // Validate required headers are present
            if (string.IsNullOrEmpty(headers["svix-id"]) ||
                string.IsNullOrEmpty(headers["svix-timestamp"]) ||
                string.IsNullOrEmpty(headers["svix-signature"]))
            {
                _logger.LogWarning("Missing required Svix signature headers");
                return BadRequest(new { message = "Missing Svix signature headers" });
            }

            // Process webhook (handles signature verification + email forwarding)
            var success = await _webhookService.ProcessInboundEmailWebhookAsync(payload, headers);

            if (success)
            {
                return Ok();
            }
            else
            {
                // Still return 200 to prevent Resend retries per requirements
                _logger.LogWarning("Webhook processing returned false but returning 200 OK to prevent retries");
                return Ok();
            }
        }
        catch (ArgumentException ex)
        {
            // Signature verification failed - return 400
            _logger.LogError(ex, "Invalid Resend webhook signature");
            return BadRequest(new { message = "Invalid webhook signature" });
        }
        catch (Exception ex)
        {
            // Log error but return 200 to prevent Resend from retrying
            _logger.LogError(ex, "Error processing Resend webhook");
            return Ok(); // Return 200 per requirements
        }
    }
}
