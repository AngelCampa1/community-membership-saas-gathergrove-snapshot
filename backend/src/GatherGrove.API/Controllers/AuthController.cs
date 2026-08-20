using GatherGrove.Application.DTOs;
using GatherGrove.Application.Security;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Linq;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for authentication operations
/// </summary>
[ApiController]
[Route("api/v1/auth")]
[Produces("application/json")]
[EnableRateLimiting("AuthApi")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IMemberActivationService _memberActivationService;
    private readonly IExternalAuthService _externalAuthService;
    private readonly ILogger<AuthController> _logger;
    private readonly IWebHostEnvironment _webHostEnvironment;
    private readonly IConfiguration _configuration;

    public AuthController(
        IAuthService authService,
        IMemberActivationService memberActivationService,
        IExternalAuthService externalAuthService,
        ILogger<AuthController> logger,
        IWebHostEnvironment webHostEnvironment,
        IConfiguration configuration)
    {
        _authService = authService;
        _memberActivationService = memberActivationService;
        _externalAuthService = externalAuthService;
        _logger = logger;
        _webHostEnvironment = webHostEnvironment;
        _configuration = configuration;
    }

    /// <summary>
    /// Gets the appropriate cookie domain based on the current environment
    /// BUG FIX B-06: Improved cookie security - don't set Domain for localhost, use config for production
    /// </summary>
    private string? GetCookieDomain()
    {
        if (_webHostEnvironment.IsDevelopment() || _webHostEnvironment.EnvironmentName == "Testing")
        {
            // BUG FIX B-06: Don't set Domain attribute for localhost
            // Setting Domain="localhost" allows cookie sharing across ALL localhost ports (security risk)
            // By leaving Domain null, cookies are scoped to the exact origin (host + port)
            return null;
        }

        // For staging/production, use domain from configuration
        // This allows proper cookie sharing between main domain and subdomains
        var cookieDomain = _configuration["App:CookieDomain"];
        return !string.IsNullOrEmpty(cookieDomain) ? cookieDomain : ".gathergrove.club";
    }

    /// <summary>
    /// Registers a new admin user and creates their club
    /// </summary>
    /// <remarks>
    /// Creates a new user account and club in a single atomic operation.
    /// The user becomes the admin of the newly created club.
    /// New clubs start on Grow and can claim a 30-day free trial after onboarding.
    /// Upon successful registration, a JWT token is set as an HttpOnly cookie.
    /// </remarks>
    /// <param name="request">The registration details including user and club information.</param>
    /// <response code="201">Returns the newly created user and club details with success message.</response>
    /// <response code="400">If the request body fails validation (e.g., missing fields, invalid email format, weak password).</response>
    /// <response code="409">If a user with the provided email already exists.</response>
    /// <response code="500">If an unexpected error occurs during registration.</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponse), 201)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            _logger.LogInformation("Registration attempt for email: {Email}", request.Email);

            // Validate the request
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Registration validation failed for email: {Email}", request.Email);
                return BadRequest(ModelState);
            }

            _logger.LogInformation("Starting registration process for email: {Email}", request.Email);

            // Register the user
            var response = await _authService.RegisterAsync(request);

            _logger.LogInformation("Registration service completed for email: {Email}, UserId: {UserId}",
                request.Email, response.User.Id);

            // Generate JWT token
            _logger.LogInformation("Generating JWT token for user: {UserId}", response.User.Id);
            var token = _authService.GenerateJwtToken(response.User.Id, response.User.Email, response.Club.Id, "Admin", false);

            // Set JWT as HttpOnly cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !_webHostEnvironment.IsDevelopment(), // Only secure in production
                SameSite = _webHostEnvironment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict, // Strict for security in staging/production
                Expires = DateTime.UtcNow.AddHours(1), // Match JWT expiry
                Domain = GetCookieDomain(), // Smart domain assignment based on environment
                Path = "/", // Restrict to API paths only
                IsEssential = true // Mark as essential for GDPR compliance
            };

            _logger.LogInformation("Cookie configuration - Environment: {Environment}, Secure: {Secure}, SameSite: {SameSite}, Domain: {Domain}",
                _webHostEnvironment.EnvironmentName, cookieOptions.Secure, cookieOptions.SameSite, cookieOptions.Domain ?? "null");

            _logger.LogInformation("Setting JWT cookie for user: {UserId}. Cookie secure: {IsSecure}, SameSite: {SameSite}, HttpOnly: {HttpOnly}, Expires: {Expires}",
                response.User.Id, cookieOptions.Secure, cookieOptions.SameSite, cookieOptions.HttpOnly, cookieOptions.Expires);

            Response.Cookies.Append("jwt", token, cookieOptions);

            _logger.LogInformation("JWT cookie set for user: {UserId} in environment: {Environment}",
                response.User.Id, _webHostEnvironment.EnvironmentName);

            _logger.LogInformation("Registration successful for user: {UserId}, club: {ClubId}",
                response.User.Id, response.Club.Id);

            return CreatedAtAction(nameof(Register), new { id = response.User.Id }, response);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            _logger.LogWarning("Registration conflict: {Message}", ex.Message);
            return Conflict(new ProblemDetails
            {
                Title = "Registration Conflict",
                Detail = ex.Message,
                Status = 409
            });
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            _logger.LogError(ex, "Registration timeout for email: {Email}", request.Email);
            return StatusCode(504, new ProblemDetails
            {
                Title = "Registration Timeout",
                Detail = "The registration request timed out. Please try again.",
                Status = 504
            });
        }
        catch (TimeoutException ex)
        {
            _logger.LogError(ex, "Registration timeout for email: {Email}", request.Email);
            return StatusCode(504, new ProblemDetails
            {
                Title = "Registration Timeout",
                Detail = "The registration request timed out. Please try again.",
                Status = 504
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during registration for email: {Email}. Exception type: {ExceptionType}",
                request.Email, ex.GetType().Name);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Registration Error",
                Detail = "An unexpected error occurred during registration. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Authenticates a user with email and password
    /// </summary>
    /// <remarks>
    /// Validates user credentials against the database.
    /// Upon successful authentication, a JWT token is set as an HttpOnly cookie.
    /// The user can then be redirected to their dashboard.
    /// </remarks>
    /// <param name="request">The login credentials including email and password.</param>
    /// <response code="200">Returns the authenticated user's details with success message.</response>
    /// <response code="400">If the request body fails validation (e.g., missing email or password, invalid email format).</response>
    /// <response code="401">If the email or password is incorrect.</response>
    /// <response code="500">If an unexpected error occurs during authentication.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            _logger.LogInformation("Login attempt for email: {Email}", request.Email);

            // Validate the request
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Login validation failed for email: {Email}", request.Email);
                return BadRequest(ModelState);
            }

            // Authenticate the user
            var response = await _authService.LoginAsync(request);

            // Generate JWT token
            var token = _authService.GenerateJwtToken(response.UserId, response.Email, response.ClubId, response.Role, request.RememberMe);

            // Determine whether this is the GatherGrove native mobile app.
            // A-003 FIX: the previous check treated ANY User-Agent containing the
            // generic substring "Mobile" as a mobile client. Mobile-browser web
            // users (iOS Safari / Android Chrome UAs both contain "Mobile") were
            // therefore misclassified: they received the token in the response
            // body but NO HttpOnly cookie, so the web app — which authenticates
            // solely via the cookie — silently failed on every subsequent request.
            // The native app sends a definitive X-Mobile-Client header and a
            // specific "GatherGrove-Mobile" User-Agent (plus some paths use a
            // "ReactNative-*" UA), so match those precise signals instead.
            var userAgent = Request.Headers["User-Agent"].ToString();
            var isMobileClient = Request.Headers.ContainsKey("X-Mobile-Client") ||
                               userAgent.Contains("ReactNative", StringComparison.OrdinalIgnoreCase) ||
                               userAgent.Contains("GatherGrove-Mobile", StringComparison.OrdinalIgnoreCase);

            if (isMobileClient)
            {
                // For mobile clients, include token in response body
                response.Token = token;
                _logger.LogInformation("Mobile login successful for user: {UserId}", response.UserId);
            }
            else
            {
                // For web clients, set JWT as HttpOnly cookie
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = !_webHostEnvironment.IsDevelopment(), // Only secure in production
                    SameSite = _webHostEnvironment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict, // Strict for security in staging/production
                    Expires = request.RememberMe ? DateTime.UtcNow.AddDays(30) : DateTime.UtcNow.AddHours(1), // Extended expiry if "Remember me" is checked
                    Domain = GetCookieDomain(), // Smart domain assignment based on environment
                    Path = "/", // Restrict to API paths only
                    IsEssential = true // Mark as essential for GDPR compliance
                };

                Response.Cookies.Append("jwt", token, cookieOptions);
                _logger.LogInformation("Web login successful for user: {UserId}, RememberMe: {RememberMe}", response.UserId, request.RememberMe);
            }

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Login unauthorized: {Message}", ex.Message);

            // Return specific error messages as required by the user story
            if (ex.Message.Contains("not been activated"))
            {
                return StatusCode(403, new ProblemDetails
                {
                    Title = "Account Not Activated",
                    Detail = ex.Message,
                    Status = 403
                });
            }

            if (ex.Message.Contains("Grow tier"))
            {
                return StatusCode(403, new ProblemDetails
                {
                    Title = "Access Denied",
                    Detail = ex.Message,
                    Status = 403
                });
            }

            return Unauthorized(new ProblemDetails
            {
                Title = "Authentication Failed",
                Detail = "Invalid email or password.",
                Status = 401
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during login for email: {Email}", request.Email);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Login Error",
                Detail = "An unexpected error occurred during login. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Logs out the current user by clearing the JWT authentication cookie
    /// </summary>
    /// <remarks>
    /// This endpoint clears the HTTP-only JWT cookie, effectively logging out the user.
    /// The frontend should also clear any local session data.
    /// </remarks>
    /// <response code="200">User logged out successfully</response>
    [HttpPost("logout")]
    [ProducesResponseType(200)]
    public IActionResult Logout()
    {
        try
        {
            // Clear the JWT cookie by setting it with an expiry in the past
            Response.Cookies.Delete("jwt", new CookieOptions
            {
                HttpOnly = true,
                Secure = !_webHostEnvironment.IsDevelopment(),
                SameSite = _webHostEnvironment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict,
                Domain = GetCookieDomain(),
                Path = "/",
                IsEssential = true
            });

            _logger.LogInformation("User logged out successfully");

            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during logout");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Logout Error",
                Detail = "An unexpected error occurred during logout. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Initiates a password reset process for a user
    /// </summary>
    /// <remarks>
    /// Sends a password reset email to the specified email address if the user exists.
    /// Always returns 202 Accepted to prevent email enumeration attacks.
    /// The email will contain a secure, time-limited link valid for 1 hour.
    /// </remarks>
    /// <param name="request">The email address to send the reset link to.</param>
    /// <response code="202">Request processed. If the email exists, a reset link has been sent.</response>
    /// <response code="400">If the request body fails validation (e.g., missing or invalid email format).</response>
    /// <response code="500">If an unexpected error occurs during the reset process.</response>
    [HttpPost("forgot-password")]
    [ProducesResponseType(202)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            _logger.LogInformation("Forgot password request received");

            // Validate the request
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Forgot password validation failed");
                return BadRequest(ModelState);
            }

            // Process the forgot password request
            await _authService.ForgotPasswordAsync(request);

            _logger.LogInformation("Forgot password request processed");

            // Always return the same response to prevent email enumeration
            return Accepted(new
            {
                message = "If an account with that email exists, a password reset link has been sent."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during forgot password request");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Password Reset Error",
                Detail = "An unexpected error occurred while processing your request. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Resets a user's password using a valid reset token
    /// </summary>
    /// <remarks>
    /// Validates the reset token and updates the user's password.
    /// The token is single-use and expires after 1 hour.
    /// The new password must meet security requirements.
    /// </remarks>
    /// <param name="request">The reset token and new password details.</param>
    /// <response code="200">Password reset successful.</response>
    /// <response code="400">If the request body fails validation (e.g., weak password, mismatched confirmation).</response>
    /// <response code="401">If the reset token is invalid, expired, or already used.</response>
    /// <response code="500">If an unexpected error occurs during the reset process.</response>
    [HttpPost("reset-password")]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            _logger.LogInformation("Password reset request received");

            // Validate the request
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Password reset validation failed");
                return BadRequest(ModelState);
            }

            // Reset the password
            await _authService.ResetPasswordAsync(request);

            _logger.LogInformation("Password reset successful");

            return Ok(new
            {
                message = "Password reset successful. You can now log in with your new password."
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Password reset unauthorized: {Message}", ex.Message);
            return Unauthorized(new ProblemDetails
            {
                Title = "Invalid Reset Token",
                Detail = "The reset token is invalid, expired, or has already been used.",
                Status = 401
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during password reset");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Password Reset Error",
                Detail = "An unexpected error occurred while resetting your password. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Marks the user's onboarding as completed
    /// </summary>
    /// <remarks>
    /// Completes the onboarding process for the authenticated user.
    /// This should be called after the user has finished the setup wizard.
    /// Requires valid authentication via JWT token.
    /// </remarks>
    /// <param name="request">The onboarding completion request (typically empty)</param>
    /// <response code="200">Onboarding marked as completed successfully.</response>
    /// <response code="400">If the request body fails validation.</response>
    /// <response code="401">If the request lacks a valid JWT token.</response>
    /// <response code="404">If the authenticated user is not found.</response>
    /// <response code="500">If an unexpected error occurs during the process.</response>
    [HttpPost("complete-onboarding")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> CompleteOnboarding([FromBody] CompleteOnboardingRequest request)
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Complete onboarding attempt without valid user ID in token");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            _logger.LogInformation("Completing onboarding for user: {UserId}", userId);

            // Mark onboarding as complete
            await _authService.CompleteOnboardingAsync(userId);

            _logger.LogInformation("Onboarding completed successfully for user: {UserId}", userId);

            return Ok(new { message = "Onboarding completed successfully!" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Complete onboarding failed: {Message}", ex.Message);
            return NotFound(new ProblemDetails
            {
                Title = "User Not Found",
                Detail = ex.Message,
                Status = 404
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during complete onboarding");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Complete Onboarding Error",
                Detail = "An unexpected error occurred. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Gets the current authenticated user's session information
    /// </summary>
    /// <remarks>
    /// Returns the current user's details including their club information.
    /// Requires valid authentication via JWT token.
    /// This endpoint is used to get the user's session data for the frontend.
    /// </remarks>
    /// <response code="200">Returns the current user's session information.</response>
    /// <response code="401">If the request lacks a valid JWT token.</response>
    /// <response code="404">If the authenticated user is not found.</response>
    /// <response code="500">If an unexpected error occurs during the process.</response>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserSessionResponse), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> GetCurrentSession()
    {
        try
        {
            _logger.LogInformation("GetCurrentSession called. User identity: {IsAuthenticated}, Claims count: {ClaimsCount}",
                User.Identity?.IsAuthenticated ?? false,
                User.Claims?.Count() ?? 0);

            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Get current session attempt without valid user ID in token. UserIdClaim: {UserIdClaim}, All claims: {Claims}",
                    userIdClaim?.Value ?? "null",
                    string.Join("; ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            _logger.LogInformation("Getting current session for user: {UserId}", userId);

            // Get user session data
            var sessionResponse = await _authService.GetCurrentSessionAsync(userId);

            _logger.LogInformation("Current session retrieved successfully for user: {UserId}", userId);

            return Ok(sessionResponse);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Get current session failed: {Message}", ex.Message);
            return NotFound(new ProblemDetails
            {
                Title = "User Not Found",
                Detail = ex.Message,
                Status = 404
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during get current session for user ID from token");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Session Error",
                Detail = "An unexpected error occurred while retrieving your session. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Validates an admin invitation token and returns information about the invitation
    /// </summary>
    /// <remarks>
    /// Validates the invitation token without requiring authentication.
    /// Returns information about the invitation including whether the invited email
    /// has an existing GatherGrove account, which determines the acceptance flow.
    /// </remarks>
    /// <param name="token">The invitation token from the email link</param>
    /// <response code="200">Returns invitation validation details.</response>
    /// <response code="400">If the token parameter is missing or invalid.</response>
    /// <response code="500">If an unexpected error occurs during validation.</response>
    [HttpGet("validate-invite")]
    [ProducesResponseType(typeof(InviteValidationResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> ValidateInviteToken([FromQuery] string token)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                _logger.LogWarning("Validate invite token request missing token parameter");
                return BadRequest(new ValidationProblemDetails
                {
                    Title = "Missing Token",
                    Detail = "The invitation token is required.",
                    Status = 400
                });
            }

            _logger.LogInformation("Validating invitation token");

            var validation = await _authService.ValidateInviteTokenAsync(token);

            _logger.LogInformation("Invitation token validation completed. IsValid: {IsValid}", validation.IsValid);

            return Ok(validation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during invitation token validation");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Validation Error",
                Detail = "An unexpected error occurred while validating the invitation. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Accepts an admin invitation, creating a new user if necessary and adding them as an admin
    /// </summary>
    /// <remarks>
    /// Accepts an administrator invitation. For new users, creates an account.
    /// For existing users, adds them as an admin to the club.
    /// Automatically logs in the user and sets authentication cookies.
    /// </remarks>
    /// <param name="request">The accept invitation request with token and optional user details</param>
    /// <response code="200">Invitation accepted successfully, user logged in.</response>
    /// <response code="400">If the request body fails validation or invitation is invalid.</response>
    /// <response code="409">If the user is already an admin of the club.</response>
    /// <response code="500">If an unexpected error occurs during acceptance.</response>
    [HttpPost("accept-admin-invite")]
    [ProducesResponseType(typeof(AcceptAdminInviteResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> AcceptAdminInvite([FromBody] AcceptAdminInviteRequest request)
    {
        try
        {
            _logger.LogInformation("Admin invitation acceptance request received");

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Accept admin invite validation failed");
                return BadRequest(ModelState);
            }

            var result = await _authService.AcceptAdminInviteAsync(request);

            // Generate JWT token and set authentication cookie
            var token = _authService.GenerateJwtToken(result.User.Id, result.User.Email, result.Club.Id, "Admin");

            // Set the JWT as an HttpOnly cookie
            Response.Cookies.Append("jwt", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = !_webHostEnvironment.IsDevelopment(), // Only use HTTPS in production
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(30)
            });

            _logger.LogInformation("Admin invitation accepted successfully. User {UserId} is now admin of club {ClubId}",
                result.User.Id, result.Club.Id);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation during admin invite acceptance: {Message}", ex.Message);

            // Check if this is a "already an admin" case
            if (ex.Message.Contains("already an administrator"))
            {
                return Conflict(new ProblemDetails
                {
                    Title = "Already Administrator",
                    Detail = ex.Message,
                    Status = 409
                });
            }

            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Invitation",
                Detail = ex.Message,
                Status = 400
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Argument error during admin invite acceptance: {Message}", ex.Message);
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Request",
                Detail = ex.Message,
                Status = 400
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during admin invitation acceptance");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Invitation Acceptance Error",
                Detail = "An unexpected error occurred while accepting the invitation. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Activates a member account using activation token and sets password
    /// </summary>
    /// <param name="request">The activation request containing token and new password</param>
    /// <returns>Activation response</returns>
    /// <response code="200">Account activated successfully</response>
    /// <response code="400">Invalid request, expired token, or password validation errors</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("activate-member-account")]
    [ProducesResponseType(typeof(ActivateMemberAccountResponse), 200)]
    [ProducesResponseType(typeof(ActivateMemberAccountResponse), 400)]
    public async Task<ActionResult<ActivateMemberAccountResponse>> ActivateMemberAccount([FromBody] ActivateMemberAccountRequest request)
    {
        try
        {
            _logger.LogInformation(
                "Member account activation request received for token fingerprint: {TokenFingerprint}",
                SensitiveLogValue.Fingerprint(request.ActivationToken));

            var response = await _memberActivationService.ActivateMemberAccountAsync(request);

            if (response.Success)
            {
                _logger.LogInformation("Member account activated successfully");
                return Ok(response);
            }
            else
            {
                _logger.LogWarning("Member account activation failed: {Message}", response.Message);
                return BadRequest(response);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during member account activation");
            return StatusCode(500, new ActivateMemberAccountResponse
            {
                Success = false,
                Message = "An unexpected error occurred while activating your account. Please try again."
            });
        }
    }

    /// <summary>
    /// Resends activation email to a member with a new activation token
    /// </summary>
    /// <param name="request">The request containing member email</param>
    /// <returns>Response indicating whether email was sent</returns>
    /// <response code="200">Activation email sent successfully</response>
    /// <response code="400">Invalid request or member not found</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("resend-activation")]
    [ProducesResponseType(typeof(ResendActivationResponse), 200)]
    [ProducesResponseType(typeof(ResendActivationResponse), 400)]
    public async Task<ActionResult<ResendActivationResponse>> ResendActivation([FromBody] ResendActivationRequest request)
    {
        try
        {
            _logger.LogInformation("Resend activation request received for email: {Email}", request.Email);

            var response = await _memberActivationService.ResendActivationEmailAsync(request.Email);

            if (response.Success)
            {
                _logger.LogInformation("Activation email resent successfully to {Email}", request.Email);
                return Ok(response);
            }
            else
            {
                _logger.LogWarning("Failed to resend activation email: {Message}", response.Message);
                return BadRequest(response);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while resending activation email");
            return StatusCode(500, new ResendActivationResponse
            {
                Success = false,
                Message = "An unexpected error occurred. Please try again later."
            });
        }
    }

    #region External Authentication (SSO)

    /// <summary>
    /// Authenticates a user with Google SSO
    /// </summary>
    /// <param name="request">The Google SSO request containing the ID token</param>
    /// <returns>Authentication response with user details</returns>
    /// <response code="200">Authentication successful</response>
    /// <response code="400">Invalid token or authentication failed</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("google")]
    [ProducesResponseType(typeof(ExternalAuthResponse), 200)]
    [ProducesResponseType(typeof(ExternalAuthResponse), 400)]
    public async Task<ActionResult<ExternalAuthResponse>> GoogleLogin([FromBody] ExternalAuthRequest request)
    {
        try
        {
            _logger.LogInformation("Google SSO login attempt from platform: {Platform}", request.Platform);

            var result = await _externalAuthService.AuthenticateWithGoogleAsync(
                request.IdToken,
                request.Platform,
                request.FullName);

            if (!result.Success)
            {
                _logger.LogWarning("Google SSO authentication failed: {Error}", result.ErrorMessage);
                return BadRequest(new ExternalAuthResponse
                {
                    Success = false,
                    Message = result.ErrorMessage ?? "Google authentication failed"
                });
            }

            var user = result.User!;
            var clubAdmin = user.ClubAdmins.FirstOrDefault();
            var clubId = clubAdmin?.ClubId ?? 0;
            var role = clubAdmin != null ? "Admin" : "Member";
            var clubTier = clubAdmin?.Club?.Tier ?? "";

            // Set JWT cookie for web clients
            if (request.Platform == "web" && !result.IsNewUser)
            {
                var token = _authService.GenerateJwtToken(user.Id, user.Email, clubId, role);
                SetAuthCookie(token);
            }

            _logger.LogInformation("Google SSO login successful for user: {UserId}, IsNewUser: {IsNewUser}",
                user.Id, result.IsNewUser);

            return Ok(new ExternalAuthResponse
            {
                Success = true,
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ClubId = clubId,
                Role = role,
                ClubTier = clubTier,
                IsOnboardingCompleted = user.OnboardingCompleted,
                IsNewUser = result.IsNewUser,
                WasLinked = result.WasLinkedToExisting,
                Token = result.Token,
                Message = result.IsNewUser ? "Account created successfully" :
                          result.WasLinkedToExisting ? "Google account linked successfully" :
                          "Welcome back!"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Google SSO login");
            return StatusCode(500, new ExternalAuthResponse
            {
                Success = false,
                Message = "An unexpected error occurred during Google authentication"
            });
        }
    }

    /// <summary>
    /// Authenticates a user with Apple SSO
    /// </summary>
    /// <param name="request">The Apple SSO request containing the ID token</param>
    /// <returns>Authentication response with user details</returns>
    /// <response code="200">Authentication successful</response>
    /// <response code="400">Invalid token or authentication failed</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("apple")]
    [ProducesResponseType(typeof(ExternalAuthResponse), 200)]
    [ProducesResponseType(typeof(ExternalAuthResponse), 400)]
    public async Task<ActionResult<ExternalAuthResponse>> AppleLogin([FromBody] ExternalAuthRequest request)
    {
        try
        {
            _logger.LogInformation("Apple SSO login attempt from platform: {Platform}", request.Platform);

            var result = await _externalAuthService.AuthenticateWithAppleAsync(
                request.IdToken,
                request.Platform,
                request.FullName,
                request.Nonce);

            if (!result.Success)
            {
                _logger.LogWarning("Apple SSO authentication failed: {Error}", result.ErrorMessage);
                return BadRequest(new ExternalAuthResponse
                {
                    Success = false,
                    Message = result.ErrorMessage ?? "Apple authentication failed"
                });
            }

            var user = result.User!;
            var clubAdmin = user.ClubAdmins.FirstOrDefault();
            var clubId = clubAdmin?.ClubId ?? 0;
            var role = clubAdmin != null ? "Admin" : "Member";
            var clubTier = clubAdmin?.Club?.Tier ?? "";

            // Set JWT cookie for web clients
            if (request.Platform == "web" && !result.IsNewUser)
            {
                var token = _authService.GenerateJwtToken(user.Id, user.Email, clubId, role);
                SetAuthCookie(token);
            }

            _logger.LogInformation("Apple SSO login successful for user: {UserId}, IsNewUser: {IsNewUser}",
                user.Id, result.IsNewUser);

            return Ok(new ExternalAuthResponse
            {
                Success = true,
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ClubId = clubId,
                Role = role,
                ClubTier = clubTier,
                IsOnboardingCompleted = user.OnboardingCompleted,
                IsNewUser = result.IsNewUser,
                WasLinked = result.WasLinkedToExisting,
                Token = result.Token,
                Message = result.IsNewUser ? "Account created successfully" :
                          result.WasLinkedToExisting ? "Apple account linked successfully" :
                          "Welcome back!"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Apple SSO login");
            return StatusCode(500, new ExternalAuthResponse
            {
                Success = false,
                Message = "An unexpected error occurred during Apple authentication"
            });
        }
    }

    /// <summary>
    /// Links an external provider to the current user's account
    /// </summary>
    /// <param name="request">The provider linking request</param>
    /// <returns>Success status</returns>
    /// <response code="200">Provider linked successfully</response>
    /// <response code="400">Invalid request or linking failed</response>
    /// <response code="401">User is not authenticated</response>
    [HttpPost("link-provider")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<IActionResult> LinkProvider([FromBody] LinkProviderRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
            {
                return Unauthorized(new ProblemDetails { Title = "Unauthorized", Detail = "Invalid user session" });
            }

            _logger.LogInformation("Linking provider {Provider} to user {UserId}", request.Provider, userId);

            var success = await _externalAuthService.LinkProviderAsync(
                userId,
                request.Provider,
                request.IdToken,
                request.Platform);

            if (!success)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Linking Failed",
                    Detail = $"Failed to link {request.Provider} account. It may already be linked to another account."
                });
            }

            return Ok(new { success = true, message = $"{request.Provider} account linked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error linking provider");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Server Error",
                Detail = "An unexpected error occurred while linking the provider"
            });
        }
    }

    /// <summary>
    /// Unlinks an external provider from the current user's account
    /// </summary>
    /// <param name="provider">The provider to unlink (Google or Apple)</param>
    /// <returns>Success status</returns>
    /// <response code="200">Provider unlinked successfully</response>
    /// <response code="400">Cannot unlink (last auth method) or other error</response>
    /// <response code="401">User is not authenticated</response>
    [HttpDelete("unlink-provider/{provider}")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<IActionResult> UnlinkProvider(string provider)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
            {
                return Unauthorized(new ProblemDetails { Title = "Unauthorized", Detail = "Invalid user session" });
            }

            _logger.LogInformation("Unlinking provider {Provider} from user {UserId}", provider, userId);

            var (success, errorMessage) = await _externalAuthService.UnlinkProviderAsync(userId, provider);

            if (!success)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Unlinking Failed",
                    Detail = errorMessage ?? "Failed to unlink provider"
                });
            }

            return Ok(new { success = true, message = $"{provider} account unlinked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unlinking provider");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Server Error",
                Detail = "An unexpected error occurred while unlinking the provider"
            });
        }
    }

    /// <summary>
    /// Gets the linked providers for the current user
    /// </summary>
    /// <returns>Information about linked providers</returns>
    /// <response code="200">Returns the linked providers info</response>
    /// <response code="401">User is not authenticated</response>
    [HttpGet("linked-providers")]
    [Authorize]
    [ProducesResponseType(typeof(LinkedProvidersResponse), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<ActionResult<LinkedProvidersResponse>> GetLinkedProviders()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
            {
                return Unauthorized(new ProblemDetails { Title = "Unauthorized", Detail = "Invalid user session" });
            }

            var info = await _externalAuthService.GetLinkedProvidersAsync(userId);

            return Ok(new LinkedProvidersResponse
            {
                HasPassword = info.HasPassword,
                GoogleLinked = info.GoogleLinked,
                GoogleLinkedAt = info.GoogleLinkedAt,
                AppleLinked = info.AppleLinked,
                AppleLinkedAt = info.AppleLinkedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting linked providers");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Server Error",
                Detail = "An unexpected error occurred"
            });
        }
    }

    /// <summary>
    /// Sets a password for an SSO-only account
    /// </summary>
    /// <param name="request">The new password</param>
    /// <returns>Success status</returns>
    /// <response code="200">Password set successfully</response>
    /// <response code="400">User already has a password or validation error</response>
    /// <response code="401">User is not authenticated</response>
    [HttpPost("set-password")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<IActionResult> SetPassword([FromBody] SetPasswordRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
            {
                return Unauthorized(new ProblemDetails { Title = "Unauthorized", Detail = "Invalid user session" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _externalAuthService.SetPasswordAsync(userId, request.NewPassword);

            if (!success)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Cannot Set Password",
                    Detail = "You already have a password set. Use the change password feature instead."
                });
            }

            _logger.LogInformation("Password set successfully for SSO user {UserId}", userId);
            return Ok(new { success = true, message = "Password set successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting password");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Server Error",
                Detail = "An unexpected error occurred while setting the password"
            });
        }
    }

    /// <summary>
    /// Helper method to set authentication cookie
    /// </summary>
    private void SetAuthCookie(string token)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !_webHostEnvironment.IsDevelopment(),
            SameSite = _webHostEnvironment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddMinutes(60),
            Path = "/"
        };

        var domain = GetCookieDomain();
        if (!string.IsNullOrEmpty(domain))
        {
            cookieOptions.Domain = domain;
        }

        Response.Cookies.Append("jwt", token, cookieOptions);
    }

    #endregion
}
