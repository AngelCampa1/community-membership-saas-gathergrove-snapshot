using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Security;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using BCrypt.Net;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling member account activation process
/// </summary>
public class MemberActivationService : IMemberActivationService
{
    private readonly GatherGroveDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<MemberActivationService> _logger;

    public MemberActivationService(
        GatherGroveDbContext context,
        IEmailService emailService,
        ILogger<MemberActivationService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a dormant User account for a new Member without sending activation email
    /// This is called when an admin adds a new member to a "Sprout" tier club
    /// </summary>
    public async Task<bool> CreateDormantMemberAccountAsync(int memberId, int clubId)
    {
        try
        {
            // Get the member and club information
            var member = await _context.Members
                .Include(m => m.Club)
                .FirstOrDefaultAsync(m => m.Id == memberId && m.ClubId == clubId);

            if (member == null)
            {
                _logger.LogError("Member {MemberId} not found in club {ClubId}", memberId, clubId);
                return false;
            }

            // Check if user account already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == member.Email);

            if (existingUser != null)
            {
                _logger.LogWarning("User account already exists for email {Email}", member.Email);
                return false;
            }

            // Generate activation token (for future use if club upgrades)
            var (token, expiresAt) = GenerateActivationToken();

            // Create User account (inactive, dormant state)
            var user = new User
            {
                FullName = member.FullName,
                Email = member.Email,
                PasswordHash = GenerateTemporaryPasswordHash(), // Temporary hash until activation
                IsActive = false,
                ActivationToken = token,
                ActivationTokenExpiresAt = expiresAt,
                OnboardingCompleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Dormant member account created for {Email} in club {ClubName} (no activation email sent)",
                member.Email, member.Club.Name);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create dormant member account for member {MemberId}", memberId);
            return false;
        }
    }

    /// <summary>
    /// Creates a User account for a new Member and sends activation email
    /// This is called when an admin adds a new member to a "Grow" tier club
    /// </summary>
    public async Task<bool> CreateMemberAccountAndSendActivationEmailAsync(int memberId, int clubId)
    {
        try
        {
            // Get the member and club information
            var member = await _context.Members
                .Include(m => m.Club)
                .FirstOrDefaultAsync(m => m.Id == memberId && m.ClubId == clubId);

            if (member == null)
            {
                _logger.LogError("Member {MemberId} not found in club {ClubId}", memberId, clubId);
                return false;
            }

            // Only create accounts for "Grow" tier clubs
            if (member.Club.Tier != "Grow")
            {
                _logger.LogInformation("Skipping account creation for member {MemberId} - club {ClubId} is not on Grow tier", memberId, clubId);
                return true; // Return true as this is expected behavior
            }

            // Check if user account already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == member.Email);

            if (existingUser != null)
            {
                _logger.LogWarning("User account already exists for email {Email}", member.Email);
                return false;
            }

            // Generate activation token
            var (token, expiresAt) = GenerateActivationToken();

            // Create User account (inactive)
            var user = new User
            {
                FullName = member.FullName,
                Email = member.Email,
                PasswordHash = GenerateTemporaryPasswordHash(), // Temporary hash until activation
                IsActive = false,
                ActivationToken = token,
                ActivationTokenExpiresAt = expiresAt,
                OnboardingCompleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Send activation email
            await _emailService.SendMemberActivationEmailAsync(
                member.Email,
                member.FullName,
                member.Club.Name,
                token);

            _logger.LogInformation("Member account created and activation email sent for {Email} in club {ClubName}",
                member.Email, member.Club.Name);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create member account and send activation email for member {MemberId}", memberId);
            return false;
        }
    }

    /// <summary>
    /// Activates a member account using the activation token and sets their password
    /// </summary>
    public async Task<ActivateMemberAccountResponse> ActivateMemberAccountAsync(ActivateMemberAccountRequest request)
    {
        try
        {
            // Find user by activation token
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.ActivationToken == request.ActivationToken);

            if (user == null)
            {
                _logger.LogWarning("Invalid activation token fingerprint: {TokenFingerprint}",
                    SensitiveLogValue.Fingerprint(request.ActivationToken));
                return new ActivateMemberAccountResponse
                {
                    Success = false,
                    Message = "Invalid activation link. Please request a new activation email."
                };
            }

            // Check if token is expired
            if (user.ActivationTokenExpiresAt.HasValue && user.ActivationTokenExpiresAt.Value < DateTime.UtcNow)
            {
                _logger.LogWarning("Expired activation token for user {UserId}", user.Id);
                return new ActivateMemberAccountResponse
                {
                    Success = false,
                    Message = "Activation link has expired. Please request a new activation email."
                };
            }

            // Check if account is already active
            if (user.IsActive)
            {
                _logger.LogInformation("Account already activated for user {UserId}", user.Id);
                return new ActivateMemberAccountResponse
                {
                    Success = false,
                    Message = "Account is already activated. You can log in with your existing password."
                };
            }

            // Set the new password and activate the account
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.IsActive = true;
            user.ActivationToken = null; // Clear the activation token
            user.ActivationTokenExpiresAt = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Account activated successfully for user {UserId} ({Email})", user.Id, user.Email);

            return new ActivateMemberAccountResponse
            {
                Success = true,
                Message = "Account activated successfully."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to activate member account with token fingerprint {TokenFingerprint}",
                SensitiveLogValue.Fingerprint(request.ActivationToken));
            return new ActivateMemberAccountResponse
            {
                Success = false,
                Message = "An error occurred while activating your account. Please try again."
            };
        }
    }

    /// <summary>
    /// Generates a secure activation token and expiry date
    /// </summary>
    public (string token, DateTime expiresAt) GenerateActivationToken()
    {
        // Generate a 32-byte random token
        var randomBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }

        var token = Convert.ToBase64String(randomBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", ""); // URL-safe base64

        var expiresAt = DateTime.UtcNow.AddHours(72); // 72 hour expiry

        return (token, expiresAt);
    }

    /// <summary>
    /// Generates a temporary password hash for accounts before activation
    /// </summary>
    private string GenerateTemporaryPasswordHash()
    {
        // Generate a random temporary password that will be replaced during activation
        var tempPassword = Guid.NewGuid().ToString();
        return BCrypt.Net.BCrypt.HashPassword(tempPassword);
    }

    /// <summary>
    /// Resends activation email to a member with a new activation token
    /// </summary>
    public async Task<ResendActivationResponse> ResendActivationEmailAsync(string email)
    {
        try
        {
            // Find the user by email
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                // Don't reveal whether user exists for security
                return new ResendActivationResponse
                {
                    Success = true,
                    Message = "If an account exists with this email, an activation link has been sent."
                };
            }

            // Check if account is already active
            if (user.IsActive)
            {
                return new ResendActivationResponse
                {
                    Success = false,
                    Message = "This account is already activated. Please log in with your password."
                };
            }

            // Get member and club info
            var member = await _context.Members
                .Include(m => m.Club)
                .FirstOrDefaultAsync(m => m.Email == email);

            if (member == null || member.Club == null)
            {
                _logger.LogWarning("Member not found for email {Email} during resend activation", email);
                return new ResendActivationResponse
                {
                    Success = true,
                    Message = "If an account exists with this email, an activation link has been sent."
                };
            }

            // Only resend for "Grow" tier clubs
            if (member.Club.Tier != "Grow")
            {
                return new ResendActivationResponse
                {
                    Success = false,
                    Message = "Your club tier does not support member portal access."
                };
            }

            // Generate new activation token
            var (token, expiresAt) = GenerateActivationToken();

            // Update user with new token
            user.ActivationToken = token;
            user.ActivationTokenExpiresAt = expiresAt;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Send activation email
            await _emailService.SendMemberActivationEmailAsync(
                user.Email,
                user.FullName,
                member.Club.Name,
                token);

            _logger.LogInformation("Activation email resent successfully to {Email}", email);

            return new ResendActivationResponse
            {
                Success = true,
                Message = "A new activation link has been sent to your email address."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resend activation email for {Email}", email);
            return new ResendActivationResponse
            {
                Success = false,
                Message = "An error occurred while sending the activation email. Please try again."
            };
        }
    }
}
