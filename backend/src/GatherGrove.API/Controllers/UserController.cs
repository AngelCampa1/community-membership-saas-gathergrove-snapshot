using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for user profile management operations
/// </summary>
[ApiController]
[Route("api/v1/users")]
[Authorize]
[Produces("application/json")]
public class UserController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IPushNotificationService _pushNotificationService;
    private readonly ILogger<UserController> _logger;
    private readonly IMemberService _memberService;

    public UserController(
        IAuthService authService,
        IPushNotificationService pushNotificationService,
        ILogger<UserController> logger,
        IMemberService memberService)
    {
        _authService = authService;
        _pushNotificationService = pushNotificationService;
        _logger = logger;
        _memberService = memberService;
    }

    /// <summary>
    /// Registers a device token for push notifications
    /// </summary>
    /// <remarks>
    /// Registers or updates a device token for the authenticated user to receive push notifications.
    /// The device token is provided by FCM (Android) or APNs (iOS) and is used to send notifications to specific devices.
    /// If the device token already exists for the user, it will be updated with the new device type and login time.
    /// </remarks>
    /// <param name="request">The device token registration request containing the token and device type.</param>
    /// <response code="200">Device token registered successfully.</response>
    /// <response code="400">If the request body fails validation (e.g., invalid device type or missing token).</response>
    /// <response code="401">If the request lacks a valid JWT token.</response>
    /// <response code="500">If an unexpected error occurs during registration.</response>
    [HttpPost("me/device-tokens")]
    [ProducesResponseType(typeof(RegisterDeviceTokenResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> RegisterDeviceToken([FromBody] RegisterDeviceTokenRequest request)
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Device token registration attempt without valid user ID in token");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            _logger.LogInformation("Registering device token for user: {UserId}", userId);

            // Validate the request
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Device token registration validation failed for user: {UserId}", userId);
                return BadRequest(ModelState);
            }

            // Register the device token
            var response = await _pushNotificationService.RegisterDeviceTokenAsync(userId, request);

            if (response.Success)
            {
                _logger.LogInformation("Device token registered successfully for user: {UserId}", userId);
                return Ok(response);
            }
            else
            {
                _logger.LogWarning("Device token registration failed for user: {UserId} - {Message}", userId, response.Message);
                return StatusCode(500, new ProblemDetails
                {
                    Title = "Device Token Registration Error",
                    Detail = response.Message ?? "Failed to register device token.",
                    Status = 500
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during device token registration for user");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Device Token Registration Error",
                Detail = "An unexpected error occurred while registering your device token. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Updates the current user's profile information
    /// </summary>
    /// <remarks>
    /// Updates the authenticated user's profile information such as full name.
    /// The user must be authenticated and can only update their own profile.
    /// This endpoint is used in the Account Settings page.
    /// </remarks>
    /// <param name="request">The profile update request containing the new full name.</param>
    /// <response code="200">Profile updated successfully.</response>
    /// <response code="400">If the request body fails validation (e.g., missing or invalid full name).</response>
    /// <response code="401">If the request lacks a valid JWT token.</response>
    /// <response code="404">If the authenticated user is not found.</response>
    /// <response code="500">If an unexpected error occurs during the update.</response>
    [HttpPut("me/profile")]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Update profile attempt without valid user ID in token");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            _logger.LogInformation("Updating profile for user: {UserId}", userId);

            // Validate the request
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Profile update validation failed for user: {UserId}", userId);
                return BadRequest(ModelState);
            }

            // Update the profile
            await _authService.UpdateProfileAsync(userId, request);

            _logger.LogInformation("Profile updated successfully for user: {UserId}", userId);

            return Ok(new { message = "Profile updated successfully!" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Profile update failed: {Message}", ex.Message);
            return NotFound(new ProblemDetails
            {
                Title = "User Not Found",
                Detail = ex.Message,
                Status = 404
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during profile update");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Profile Update Error",
                Detail = "An unexpected error occurred while updating your profile. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Changes the current user's password
    /// </summary>
    /// <remarks>
    /// Changes the authenticated user's password after verifying their current password.
    /// The user must provide their current password for security verification.
    /// The new password must meet security requirements.
    /// This endpoint is used in the Account Settings page.
    /// </remarks>
    /// <param name="request">The password change request containing current and new passwords.</param>
    /// <response code="200">Password changed successfully.</response>
    /// <response code="400">If the request body fails validation (e.g., weak new password).</response>
    /// <response code="401">If the request lacks a valid JWT token or current password is incorrect.</response>
    /// <response code="404">If the authenticated user is not found.</response>
    /// <response code="500">If an unexpected error occurs during the password change.</response>
    [HttpPut("me/change-password")]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Change password attempt without valid user ID in token");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            _logger.LogInformation("Changing password for user: {UserId}", userId);

            // Validate the request
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Password change validation failed for user: {UserId}", userId);
                return BadRequest(ModelState);
            }

            // Change the password
            await _authService.ChangePasswordAsync(userId, request);

            _logger.LogInformation("Password changed successfully for user: {UserId}", userId);

            return Ok(new { message = "Password changed successfully!" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Password change failed: {Message}", ex.Message);
            return NotFound(new ProblemDetails
            {
                Title = "User Not Found",
                Detail = ex.Message,
                Status = 404
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Password change failed due to incorrect current password for user");
            return Unauthorized(new ProblemDetails
            {
                Title = "Authentication Error",
                Detail = ex.Message,
                Status = 401
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during password change");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Password Change Error",
                Detail = "An unexpected error occurred while changing your password. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Gets the current user's digital membership card data
    /// </summary>
    /// <remarks>
    /// Returns the digital membership card information for the authenticated user,
    /// including their name, membership type, expiry date, and QR code data.
    /// This endpoint is used by the mobile app to display the digital membership card.
    /// Requires the user to be an authenticated member of a club.
    /// </remarks>
    /// <response code="200">Returns the membership card data.</response>
    /// <response code="401">If the request lacks a valid JWT token.</response>
    /// <response code="404">If the user's membership information is not found.</response>
    /// <response code="500">If an unexpected error occurs during retrieval.</response>
    [HttpGet("me/membership-card")]
    [ProducesResponseType(typeof(MembershipCardResponse), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> GetMembershipCard()
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Membership card request without valid user ID in token");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            // Get the user's email from the JWT token
            var userEmailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(userEmailClaim))
            {
                _logger.LogWarning("Membership card request without email claim for user: {UserId}", userId);
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            _logger.LogInformation("Getting membership card for user: {UserId}", userId);

            // Get the membership card data
            var membershipCard = await _authService.GetMembershipCardAsync(userEmailClaim);

            _logger.LogInformation("Membership card retrieved successfully for user: {UserId}", userId);

            return Ok(membershipCard);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Membership card request failed: {Message}", ex.Message);
            return NotFound(new ProblemDetails
            {
                Title = "Membership Not Found",
                Detail = ex.Message,
                Status = 404
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during membership card retrieval");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Membership Card Error",
                Detail = "An unexpected error occurred while retrieving your membership card. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Gets the current user's member profile details (Mobile App Story M14)
    /// </summary>
    /// <remarks>
    /// Returns the member profile information for the authenticated user,
    /// including custom field data in a simplified format for mobile display.
    /// This endpoint is specifically designed for the mobile app profile screen.
    /// Custom fields without values are excluded from the response.
    /// </remarks>
    /// <response code="200">Returns the member's profile details with custom fields.</response>
    /// <response code="401">If the request lacks a valid JWT token.</response>
    /// <response code="404">If the user's member profile is not found.</response>
    /// <response code="500">If an unexpected error occurs during retrieval.</response>
    [HttpGet("me/profile-details")]
    [ProducesResponseType(typeof(UserProfileDetailsResponse), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> GetUserProfileDetails()
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Profile details request without valid user ID in token");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            _logger.LogInformation("Getting profile details for user: {UserId}", userId);

            // Get the member profile data using existing service
            var memberProfile = await _memberService.GetMemberProfileAsync(userId);

            // Transform to the M14 specification format
            var profileDetails = new UserProfileDetailsResponse
            {
                FullName = memberProfile.FullName,
                Email = memberProfile.Email,
                PhoneNumber = memberProfile.PhoneNumber,
                MembershipTypeName = memberProfile.MembershipTypeName,
                DuesPaidUntil = memberProfile.DuesPaidUntil,
                CustomFields = memberProfile.CustomFieldValues
                    .Where(cf => !string.IsNullOrWhiteSpace(cf.FieldValue)) // Only include fields with values
                    .Select(cf => new CustomFieldData
                    {
                        Label = cf.FieldLabel,
                        Value = cf.FieldValue
                    })
                    .ToList()
            };

            _logger.LogInformation("Profile details retrieved successfully for user: {UserId}", userId);

            return Ok(profileDetails);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Profile details request failed: {Message}", ex.Message);
            return NotFound(new ProblemDetails
            {
                Title = "Profile Not Found",
                Detail = ex.Message,
                Status = 404
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during profile details retrieval");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Profile Details Error",
                Detail = "An unexpected error occurred while retrieving your profile details. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Removes a specific device token for the authenticated user
    /// </summary>
    /// <remarks>
    /// Removes a device token for the authenticated user, typically used during logout
    /// to prevent further push notifications to the device. The device token is provided
    /// in the URL path and must match an existing token for the authenticated user.
    /// </remarks>
    /// <param name="deviceToken">The device token to remove.</param>
    /// <response code="200">Device token removed successfully.</response>
    /// <response code="401">If the request lacks a valid JWT token.</response>
    /// <response code="404">If the device token is not found for the authenticated user.</response>
    /// <response code="500">If an unexpected error occurs during removal.</response>
    [HttpDelete("me/device-tokens/{deviceToken}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> RemoveDeviceToken(string deviceToken)
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Device token removal attempt without valid user ID in token");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            _logger.LogInformation("Removing device token for user: {UserId}", userId);

            // Remove the device token
            var success = await _pushNotificationService.RemoveDeviceTokenAsync(userId, deviceToken);

            if (success)
            {
                _logger.LogInformation("Device token removed successfully for user: {UserId}", userId);
                return Ok(new { message = "Device token removed successfully" });
            }
            else
            {
                _logger.LogWarning("Device token not found for user: {UserId}", userId);
                return NotFound(new ProblemDetails
                {
                    Title = "Device Token Not Found",
                    Detail = "The specified device token was not found for this user.",
                    Status = 404
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during device token removal for user");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Device Token Removal Error",
                Detail = "An unexpected error occurred while removing your device token. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Gets the payment configuration status for the authenticated user's club
    /// </summary>
    /// <remarks>
    /// Returns the Stripe payment configuration status for the authenticated user's club,
    /// including whether payments are configured and if development mode is enabled.
    /// This endpoint is used by mobile and web clients to determine payment availability.
    /// </remarks>
    /// <response code="200">Returns the payment configuration status.</response>
    /// <response code="401">If the request lacks a valid JWT token.</response>
    /// <response code="404">If the user's membership information is not found.</response>
    /// <response code="500">If an unexpected error occurs during retrieval.</response>
    [HttpGet("me/payment-config")]
    [ProducesResponseType(typeof(StripeConfigResponse), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> GetPaymentConfiguration()
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Payment config request without valid user ID in token");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            _logger.LogInformation("Getting payment configuration for user: {UserId}", userId);

            // Get the payment configuration
            var paymentConfig = await _memberService.GetPaymentConfigurationAsync(userId);

            _logger.LogInformation("Payment configuration retrieved successfully for user: {UserId}", userId);

            return Ok(paymentConfig);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Payment config request failed: {Message}", ex.Message);
            return NotFound(new ProblemDetails
            {
                Title = "Membership Not Found",
                Detail = ex.Message,
                Status = 404
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during payment config retrieval");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Payment Configuration Error",
                Detail = "An unexpected error occurred while retrieving payment configuration. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Allows the authenticated user to pay their own membership dues
    /// </summary>
    /// <remarks>
    /// Processes a dues payment for the authenticated user using Stripe payment processing.
    /// The user must provide a valid Stripe payment method ID and their membership type ID.
    /// This endpoint validates the user's membership and processes the payment securely.
    /// </remarks>
    /// <param name="request">The dues payment request containing payment method and membership type.</param>
    /// <response code="200">Returns the processed payment details.</response>
    /// <response code="400">If the request body fails validation or payment processing fails.</response>
    /// <response code="401">If the request lacks a valid JWT token.</response>
    /// <response code="404">If the user's membership information is not found.</response>
    /// <response code="500">If an unexpected error occurs during payment processing.</response>
    [HttpPost("me/dues/pay")]
    [ProducesResponseType(typeof(PaymentResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> PayMyDues([FromBody] PayMyDuesRequest request)
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Dues payment attempt without valid user ID in token");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            _logger.LogInformation("Processing dues payment for user: {UserId}", userId);

            // Validate the request
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Dues payment validation failed for user: {UserId}", userId);
                return BadRequest(ModelState);
            }

            // Process the dues payment
            var payment = await _memberService.PayMemberDuesAsync(userId, request);

            _logger.LogInformation("Dues payment processed successfully for user: {UserId}, payment: {PaymentId}", userId, payment.PaymentId);

            return Ok(payment);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Dues payment failed: {Message}", ex.Message);
            return BadRequest(new ProblemDetails
            {
                Title = "Payment Error",
                Detail = ex.Message,
                Status = 400
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Dues payment invalid operation: {Message}", ex.Message);
            return BadRequest(new ProblemDetails
            {
                Title = "Payment Error",
                Detail = ex.Message,
                Status = 400
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during dues payment processing");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Payment Processing Error",
                Detail = "An unexpected error occurred while processing your dues payment. Please try again.",
                Status = 500
            });
        }
    }

    // Account deletion functionality moved to dedicated AccountDeletionController
}