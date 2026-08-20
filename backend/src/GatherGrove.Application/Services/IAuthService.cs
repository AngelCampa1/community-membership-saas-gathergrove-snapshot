using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for authentication services
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Registers a new user and creates their club
    /// </summary>
    /// <param name="request">Registration details</param>
    /// <returns>Registration response with user and club information</returns>
    Task<RegisterResponse> RegisterAsync(RegisterRequest request);

    /// <summary>
    /// Registers a new user with optional club creation
    /// </summary>
    /// <param name="request">Registration details</param>
    /// <param name="createClub">Whether to create a club for the user</param>
    /// <returns>Registration response with user information</returns>
    Task<(bool Success, string Message)> RegisterAsync(RegisterRequest request, bool createClub);

    /// <summary>
    /// Authenticates a user with email and password
    /// </summary>
    /// <param name="request">Login details</param>
    /// <returns>Login response with user information</returns>
    Task<LoginResponse> LoginAsync(LoginRequest request);

    /// <summary>
    /// Generates a JWT token for the authenticated user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="email">User email</param>
    /// <param name="clubId">Club ID that the user belongs to</param>
    /// <param name="role">User role (Admin or Member)</param>
    /// <param name="rememberMe">Whether to generate an extended expiry token</param>
    /// <returns>JWT token string</returns>
    string GenerateJwtToken(int userId, string email, int clubId, string role, bool rememberMe = false);

    /// <summary>
    /// Hashes a password using BCrypt
    /// </summary>
    /// <param name="password">Plain text password</param>
    /// <returns>Hashed password</returns>
    string HashPassword(string password);

    /// <summary>
    /// Verifies a password against its hash
    /// </summary>
    /// <param name="password">Plain text password</param>
    /// <param name="hash">Stored password hash</param>
    /// <returns>True if password matches</returns>
    bool VerifyPassword(string password, string hash);

    /// <summary>
    /// Initiates a password reset process by generating a secure token and sending an email
    /// </summary>
    /// <param name="request">Forgot password request containing the user's email</param>
    /// <returns>Task representing the async operation</returns>
    Task ForgotPasswordAsync(ForgotPasswordRequest request);

    /// <summary>
    /// Resets a user's password using a valid reset token
    /// </summary>
    /// <param name="request">Reset password request containing token and new password</param>
    /// <returns>Task representing the async operation</returns>
    Task ResetPasswordAsync(ResetPasswordRequest request);

    /// <summary>
    /// Marks the user's onboarding as completed
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Task representing the async operation</returns>
    Task CompleteOnboardingAsync(int userId);

    /// <summary>
    /// Checks if the user has completed onboarding
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>True if onboarding is completed</returns>
    Task<bool> IsOnboardingCompletedAsync(int userId);

    /// <summary>
    /// Gets the current authenticated user's session information
    /// </summary>
    /// <param name="userId">User ID from JWT token</param>
    /// <returns>User session response with current user and club information</returns>
    Task<UserSessionResponse> GetCurrentSessionAsync(int userId);

    /// <summary>
    /// Updates the user's profile information
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="request">Update profile request</param>
    /// <returns>Task representing the async operation</returns>
    Task UpdateProfileAsync(int userId, UpdateProfileRequest request);

    /// <summary>
    /// Changes the user's password
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="request">Change password request</param>
    /// <returns>Task representing the async operation</returns>
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request);

    /// <summary>
    /// Validates an admin invite token and returns invitation details
    /// </summary>
    /// <param name="token">The invite token to validate</param>
    /// <returns>Validation response with invite details</returns>
    Task<InviteValidationResponse> ValidateInviteTokenAsync(string token);

    /// <summary>
    /// Accepts an admin invitation and creates/updates user account
    /// </summary>
    /// <param name="request">Accept invite request with token and user details</param>
    /// <returns>Accept invite response with success status and login token</returns>
    Task<AcceptAdminInviteResponse> AcceptAdminInviteAsync(AcceptAdminInviteRequest request);

    /// <summary>
    /// Gets the digital membership card data for a user
    /// </summary>
    /// <param name="userEmail">User's email address</param>
    /// <returns>Membership card response with card details</returns>
    Task<MembershipCardResponse> GetMembershipCardAsync(string userEmail);
}