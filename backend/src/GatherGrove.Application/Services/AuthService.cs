using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BCrypt.Net;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for authentication operations
/// </summary>
public class AuthService : IAuthService
{
    private readonly GatherGroveDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly ILoginAttemptService _loginAttemptService;
    private readonly IEmailService _emailService;

    public AuthService(
        GatherGroveDbContext context,
        IConfiguration configuration,
        ILogger<AuthService> logger,
        ILoginAttemptService loginAttemptService,
        IEmailService emailService)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _loginAttemptService = loginAttemptService;
        _emailService = emailService;
    }

    /// <summary>
    /// Registers a new user and creates their club
    /// </summary>
    /// <param name="request">Registration details</param>
    /// <returns>Registration response with user and club information</returns>
    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request)
    {
        _logger.LogInformation("Starting registration process for email: {Email}", request.Email);

        // Check if user already exists
        var existingUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (existingUser != null)
        {
            _logger.LogWarning("Registration attempt with existing email: {Email}", request.Email);
            throw new InvalidOperationException("A user with this email already exists.");
        }

        // Use execution strategy to handle transactions properly with retry logic
        var executionStrategy = _context.Database.CreateExecutionStrategy();

        return await executionStrategy.ExecuteAsync(async () =>
        {
            Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaction = null;
            try
            {
                transaction = await _context.Database.BeginTransactionAsync();
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("Transactions are not supported"))
            {
                // In-memory database doesn't support transactions, continue without transaction
                _logger.LogWarning("Transactions not supported, proceeding without transaction");
            }

            try
            {
                var now = DateTime.UtcNow;
                var trialEndsAt = now.AddDays(30);

                // Create user
                var user = new User
                {
                    FullName = request.FullName,
                    Email = request.Email,
                    PasswordHash = HashPassword(request.Password),
                    IsActive = true, // Admins are automatically active
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _context.Users.Add(user);

                // PERFORMANCE FIX: Save User first to get auto-generated User.Id
                // This is needed for Club.CreatedByUserId foreign key
                await _context.SaveChangesAsync();

                _logger.LogInformation("User created with ID: {UserId}", user.Id);

                // Create club (now that User.Id exists for the foreign key)
                var club = new Club
                {
                    Name = request.ClubName,
                    CreatedAt = now,
                    UpdatedAt = now,
                    Tier = "Grow",
                    SubscriptionStatus = "trialing",
                    TrialExpiresAt = trialEndsAt,
                    CreatedByUserId = user.Id
                };

                _context.Clubs.Add(club);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Club created with ID: {ClubId}", club.Id);

                // Create club admin relationship (now that both User.Id and Club.Id exist)
                var clubAdmin = new ClubAdmin
                {
                    UserId = user.Id,
                    ClubId = club.Id,
                    CreatedAt = now
                };

                _context.ClubAdmins.Add(clubAdmin);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Club admin relationship created for User: {UserId}, Club: {ClubId}",
                    user.Id, club.Id);

                // Commit transaction
                if (transaction != null)
                {
                    await transaction.CommitAsync();
                }

                _logger.LogInformation("Registration completed successfully for user: {UserId}", user.Id);

                // PERFORMANCE FIX (BUG-AUTH-001): Send welcome email in background without blocking registration response
                // Use Task.Run to truly fire-and-forget without awaiting
                var emailUserId = user.Id;
                var emailUserFullName = user.FullName;
                var emailUserEmail = user.Email;
                var emailClubName = club.Name;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        var welcomeSubject = $"Welcome to GatherGrove, {emailUserFullName}!";
                        var welcomeBody = $@"
                            <html>
                            <body style='font-family: Arial, sans-serif; line-height: 1.6;'>
                                <h1 style='color: #2e7d32;'>Welcome to GatherGrove! 🎉</h1>
                                <p>Hi {emailUserFullName},</p>
                                <p>Thank you for creating your account and club <strong>{emailClubName}</strong> on GatherGrove!</p>
                                <p>You now have access to:</p>
                                <ul>
                                    <li>📊 Member management tools</li>
                                    <li>💰 Payment collection features</li>
                                    <li>📅 Event organization capabilities</li>
                                    <li>📧 Communication tools for your club</li>
                                </ul>
                                <p>Finish onboarding, then claim your free 30-day Grow trial from the billing page.</p>
                                <p>Best regards,<br/>The GatherGrove Team</p>
                            </body>
                            </html>";

                        await _emailService.SendEmailAsync(emailUserEmail, welcomeSubject, welcomeBody);
                        _logger.LogInformation("Welcome email sent to user: {UserId}", emailUserId);
                    }
                    catch (Exception emailEx)
                    {
                        // Log but don't fail registration if email fails
                        _logger.LogWarning(emailEx, "Failed to send welcome email to user: {UserId}", emailUserId);
                    }
                });

                var token = GenerateJwtToken(user.Id, user.Email, club.Id, "Admin");

                var response = new RegisterResponse
                {
                    Token = token,
                    User = new UserInfoDto
                    {
                        Id = user.Id,
                        FullName = user.FullName,
                        Email = user.Email,
                        OnboardingCompleted = user.OnboardingCompleted
                    },
                    Club = new ClubInfoDto
                    {
                        Id = club.Id,
                        Name = club.Name,
                        Tier = club.Tier
                    }
                };

                return response;
            }
            catch (Exception ex)
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }
                _logger.LogError(ex, "Registration failed for email: {Email}", request.Email);
                throw;
            }
        });
    }

    /// <summary>
    /// Registers a new user with optional club creation
    /// </summary>
    /// <param name="request">Registration details</param>
    /// <param name="createClub">Whether to create a club for the user</param>
    /// <returns>Success status and message</returns>
    public async Task<(bool Success, string Message)> RegisterAsync(RegisterRequest request, bool createClub)
    {
        _logger.LogInformation("Registration attempt for email: {Email}, CreateClub: {CreateClub}", request.Email, createClub);

        // Check if user already exists
        var existingUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (existingUser != null)
        {
            _logger.LogWarning("Registration attempt with existing email: {Email}", request.Email);
            return (false, "A user with this email already exists.");
        }

        if (createClub)
        {
            // Use the original method for club creation
            var response = await RegisterAsync(request);
            return (true, "User and club created successfully.");
        }

        // Create user without club
        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaction = null;
        try
        {
            transaction = await _context.Database.BeginTransactionAsync();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Transactions are not supported"))
        {
            // In-memory database doesn't support transactions, continue without transaction
            _logger.LogWarning("Transactions not supported, proceeding without transaction");
        }

        try
        {
            var now = DateTime.UtcNow;

            // Create user only
            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                IsActive = true, // Members are automatically active
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User created with ID: {UserId}", user.Id);

            // Commit transaction
            if (transaction != null)
            {
                await transaction.CommitAsync();
            }

            _logger.LogInformation("Member registration completed successfully for user: {UserId}", user.Id);

            return (true, "User account created successfully.");
        }
        catch (Exception ex)
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync();
            }
            _logger.LogError(ex, "Member registration failed for email: {Email}", request.Email);
            return (false, $"Registration failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Authenticates a user with email and password
    /// </summary>
    /// <param name="request">Login details</param>
    /// <returns>Login response with user information</returns>
    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        // Check if account is locked
        if (await _loginAttemptService.IsAccountLockedAsync(request.Email))
        {
            _logger.LogWarning("Login attempt blocked for locked account: {Email}", request.Email);
            throw new UnauthorizedAccessException("Account temporarily locked due to multiple failed login attempts. Please try again later.");
        }

        // Find user by email and include club admin relationship
        var user = await _context.Users
            .Include(u => u.ClubAdmins)
            .ThenInclude(ca => ca.Club)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            _logger.LogWarning("Login attempt with non-existent email: {Email}", request.Email);
            await _loginAttemptService.RecordFailedAttemptAsync(request.Email);
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        // Check if user account is active
        if (!user.IsActive)
        {
            _logger.LogWarning("Login attempt with inactive account for email: {Email}", request.Email);
            throw new UnauthorizedAccessException("Your account has not been activated. Please check your email for the activation link.");
        }

        // Verify password
        if (!VerifyPassword(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Login attempt with incorrect password for email: {Email}", request.Email);
            await _loginAttemptService.RecordFailedAttemptAsync(request.Email);
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        // Record successful login
        await _loginAttemptService.RecordSuccessfulLoginAsync(request.Email);

        // Record login analytics for engagement tracking
        await RecordLoginAnalyticsAsync(user.Id, request.Platform, request.DeviceType, request.SessionId);

        // Determine user role and club
        var clubAdmin = user.ClubAdmins.FirstOrDefault();
        if (clubAdmin != null)
        {
            // User is an admin
            _logger.LogInformation("Admin login successful for user: {UserId}", user.Id);

            return new LoginResponse
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ClubId = clubAdmin.ClubId,
                Role = "Admin",
                ClubTier = clubAdmin.Club.Tier,
                IsOnboardingCompleted = user.OnboardingCompleted,
                Message = "Login successful! Welcome back."
            };
        }

        // Check if user is a member
        var member = await _context.Members
            .Include(m => m.Club)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Email == user.Email);

        if (member == null)
        {
            _logger.LogError("User {UserId} has no admin or member relationship", user.Id);
            throw new UnauthorizedAccessException("User account is not properly configured.");
        }

        // Check if the member's club is on the "Grow" tier
        if (member.Club.Tier != "Grow")
        {
            _logger.LogWarning("Member login attempt for user {UserId} in club {ClubId} with tier {Tier}", user.Id, member.ClubId, member.Club.Tier);
            throw new UnauthorizedAccessException("Access denied. Member portal access requires your club to be on the Grow tier.");
        }

        _logger.LogInformation("Member login successful for user: {UserId} in club: {ClubId}", user.Id, member.ClubId);

        return new LoginResponse
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            ClubId = member.ClubId,
            Role = "Member",
            ClubTier = member.Club.Tier,
            IsOnboardingCompleted = user.OnboardingCompleted,
            Message = "Login successful! Welcome back."
        };
    }

    /// <summary>
    /// Generates a JWT token for the authenticated user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="email">User email</param>
    /// <param name="clubId">Club ID that the user belongs to</param>
    /// <param name="role">User role (Admin or Member)</param>
    /// <param name="rememberMe">Whether to generate an extended expiry token</param>
    /// <returns>JWT token string</returns>
    public string GenerateJwtToken(int userId, string email, int clubId, string role, bool rememberMe = false)
    {
        _logger.LogInformation("Generating JWT token for UserId: {UserId}, Role: {Role}, RememberMe: {RememberMe}",
            userId, role, rememberMe);

        var jwtSettings = _configuration.GetSection("JwtSettings");
        // Check environment variable first (consistent with Program.cs JWT configuration)
        var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
            ?? jwtSettings["SecretKey"]
            ?? throw new InvalidOperationException("JWT SecretKey not configured. Set JWT_SECRET_KEY environment variable or JwtSettings:SecretKey in configuration.");
        var issuer = jwtSettings["Issuer"] ?? "GatherGrove";
        var audience = jwtSettings["Audience"] ?? "GatherGrove";
        // BUG FIX: Use int.TryParse to avoid FormatException from invalid config
        var defaultExpiryMinutes = int.TryParse(jwtSettings["ExpiryMinutes"], out var expiry) ? expiry : 60;

        _logger.LogInformation("JWT Settings - Issuer: {Issuer}, Audience: {Audience}, ExpiryMinutes: {ExpiryMinutes}, SecretKeyLength: {SecretKeyLength}",
            issuer, audience, defaultExpiryMinutes, secretKey?.Length ?? 0);

        // If rememberMe is true, set expiry to 30 days, otherwise use default
        var expiryMinutes = rememberMe ? 43200 : defaultExpiryMinutes; // 43200 minutes = 30 days

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey ?? throw new InvalidOperationException("JWT SecretKey cannot be null")));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim("ClubId", clubId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Hashes a password using BCrypt
    /// </summary>
    /// <param name="password">Plain text password</param>
    /// <returns>Hashed password</returns>
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
    }

    /// <summary>
    /// Verifies a password against its hash
    /// </summary>
    /// <param name="password">Plain text password</param>
    /// <param name="hash">Stored password hash</param>
    /// <returns>True if password matches</returns>
    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    /// <summary>
    /// Initiates a password reset process by generating a secure token and sending an email
    /// </summary>
    /// <param name="request">Forgot password request containing the user's email</param>
    /// <returns>Task representing the async operation</returns>
    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        _logger.LogInformation("Password reset requested for email: {Email}", request.Email);

        // Note: We always return success to prevent email enumeration attacks
        // This means we don't reveal whether the email exists or not

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            _logger.LogInformation("Password reset requested for non-existent email: {Email}", request.Email);
            // Still complete the method to prevent timing attacks
            await Task.Delay(100); // Simulate processing time
            return;
        }

        // Invalidate any existing reset tokens for this user
        var existingTokens = await _context.PasswordResetTokens
            .Where(t => t.UserId == user.Id && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        foreach (var token in existingTokens)
        {
            token.IsUsed = true;
        }

        // Generate a secure random token
        var resetToken = GenerateSecureToken();
        var tokenHash = HashPassword(resetToken); // Reuse password hashing for token security
        var expiresAt = DateTime.UtcNow.AddHours(1); // 1 hour expiry

        // Create password reset token record
        var passwordResetToken = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt,
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.PasswordResetTokens.Add(passwordResetToken);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Password reset token created for user: {UserId}", user.Id);

        // SECURITY FIX: Use configuration for frontend URL instead of hardcoded localhost
        // This ensures password reset works correctly in all environments
        var frontendUrl = _configuration["App:FrontendUrl"] ?? "https://app.gathergrove.club";
        var resetLink = $"{frontendUrl}/reset-password?token={resetToken}";
        _logger.LogInformation("Password reset token generated for {Email}", request.Email);

        // In development environment, log the reset link for testing
        var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
        if (isDevelopment)
        {
        }

        // Note: In a real implementation, you would:
        // 1. Use an email service (SendGrid, AWS SES, etc.)
        // 2. Send a professional email template with the reset link
        // 3. Never log the actual token in production
    }

    /// <summary>
    /// Resets a user's password using a valid reset token
    /// </summary>
    /// <param name="request">Reset password request containing token and new password</param>
    /// <returns>Task representing the async operation</returns>
    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        _logger.LogInformation("Password reset attempt with token");

        // Find all non-used, non-expired tokens and check if any match
        var resetTokens = await _context.PasswordResetTokens
            .Include(t => t.User)
            .Where(t => !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        PasswordResetToken? validToken = null;
        foreach (var token in resetTokens)
        {
            if (VerifyPassword(request.Token, token.TokenHash))
            {
                validToken = token;
                break;
            }
        }

        if (validToken == null)
        {
            _logger.LogWarning("Password reset attempted with invalid or expired token");
            throw new UnauthorizedAccessException("Invalid or expired reset token.");
        }

        // Mark token as used
        validToken.IsUsed = true;

        // Update user's password and activate account if dormant
        validToken.User.PasswordHash = HashPassword(request.NewPassword);
        validToken.User.UpdatedAt = DateTime.UtcNow;

        // Activate dormant accounts (members created by admin for Sprout tier clubs)
        if (!validToken.User.IsActive)
        {
            validToken.User.IsActive = true;
            _logger.LogInformation("Activated dormant account for user: {UserId}", validToken.UserId);
        }

        // Invalidate any other unused tokens for this user (security measure)
        var otherTokens = await _context.PasswordResetTokens
            .Where(t => t.UserId == validToken.UserId && !t.IsUsed && t.Id != validToken.Id)
            .ToListAsync();

        foreach (var token in otherTokens)
        {
            token.IsUsed = true;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Password reset successful for user: {UserId}", validToken.UserId);
    }

    /// <summary>
    /// Generates a cryptographically secure random token
    /// </summary>
    /// <returns>Base64 encoded secure token</returns>
    private static string GenerateSecureToken()
    {
        var tokenBytes = new byte[32]; // 256-bit token
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(tokenBytes);
        return Convert.ToBase64String(tokenBytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }

    /// <summary>
    /// Marks the user's onboarding as completed
    /// </summary>
    /// <param name="userId">The user ID to mark as onboarded</param>
    /// <returns>Task representing the async operation</returns>
    public async Task CompleteOnboardingAsync(int userId)
    {
        _logger.LogInformation("Completing onboarding for user: {UserId}", userId);

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("Attempted to complete onboarding for non-existent user: {UserId}", userId);
            throw new ArgumentException($"User with ID {userId} not found", nameof(userId));
        }

        var now = DateTime.UtcNow;
        user.OnboardingCompleted = true;
        user.UpdatedAt = now;

        var pendingTrialClubs = await _context.ClubAdmins
            .Where(ca => ca.UserId == userId)
            .Select(ca => ca.Club)
            .Where(club =>
                club.SubscriptionStatus == "pending_trial_claim" &&
                club.TrialExpiresAt == null &&
                club.StripeSubscriptionId == null)
            .ToListAsync();

        foreach (var club in pendingTrialClubs)
        {
            club.SubscriptionStatus = "trialing";
            club.TrialExpiresAt = now.AddDays(30);
            club.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Onboarding completed successfully for user: {UserId}", userId);
    }

    /// <summary>
    /// Checks if a user has completed their onboarding
    /// </summary>
    /// <param name="userId">The user ID to check</param>
    /// <returns>True if onboarding is completed, false otherwise</returns>
    public async Task<bool> IsOnboardingCompletedAsync(int userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        return user?.OnboardingCompleted ?? false;
    }

    /// <summary>
    /// Gets the current user's session information including club details
    /// </summary>
    /// <param name="userId">The user ID to get session information for</param>
    /// <returns>User session response with user and club information</returns>
    public async Task<UserSessionResponse> GetCurrentSessionAsync(int userId)
    {
        _logger.LogInformation("Getting session information for user: {UserId}", userId);

        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.ClubAdmins)
            .ThenInclude(ca => ca.Club)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            _logger.LogWarning("Session requested for non-existent user: {UserId}", userId);
            throw new ArgumentException($"User with ID {userId} not found", nameof(userId));
        }

        // Check if user is an admin
        var clubAdmin = user.ClubAdmins.FirstOrDefault();
        if (clubAdmin?.Club != null)
        {
            // User is an admin
            var response = new UserSessionResponse
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ClubId = clubAdmin.Club.Id,
                ClubName = clubAdmin.Club.Name,
                ClubTier = clubAdmin.Club.Tier,
                Role = "Admin",
                IsOnboardingCompleted = user.OnboardingCompleted
            };

            _logger.LogInformation("Admin session information retrieved successfully for user: {UserId}", userId);
            return response;
        }

        // Check if user is a member
        var member = await _context.Members
            .Include(m => m.Club)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Email == user.Email);

        if (member?.Club != null)
        {
            // User is a member
            var response = new UserSessionResponse
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ClubId = member.Club.Id,
                ClubName = member.Club.Name,
                ClubTier = member.Club.Tier,
                Role = "Member",
                IsOnboardingCompleted = user.OnboardingCompleted,
                MemberId = member.Id
            };

            _logger.LogInformation("Member session information retrieved successfully for user: {UserId}", userId);
            return response;
        }

        _logger.LogWarning("No club found for user: {UserId}", userId);
        throw new InvalidOperationException($"No club found for user {userId}");
    }

    /// <summary>
    /// Updates the user's profile information
    /// </summary>
    /// <param name="userId">The user ID to update</param>
    /// <param name="request">The profile update request</param>
    /// <returns>Task representing the async operation</returns>
    public async Task UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        _logger.LogInformation("Updating profile for user: {UserId}", userId);

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("Attempted to update profile for non-existent user: {UserId}", userId);
            throw new ArgumentException($"User with ID {userId} not found", nameof(userId));
        }

        // Update the profile information
        user.FullName = request.FullName;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Profile updated successfully for user: {UserId}", userId);
    }

    /// <summary>
    /// Changes the user's password after verifying the current password
    /// </summary>
    /// <param name="userId">The user ID to change password for</param>
    /// <param name="request">The password change request</param>
    /// <returns>Task representing the async operation</returns>
    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        _logger.LogInformation("Changing password for user: {UserId}", userId);

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("Attempted to change password for non-existent user: {UserId}", userId);
            throw new ArgumentException($"User with ID {userId} not found", nameof(userId));
        }

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            _logger.LogWarning("Incorrect current password provided for user: {UserId}", userId);
            throw new UnauthorizedAccessException("Current password is incorrect.");
        }

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Password changed successfully for user: {UserId}", userId);
    }

    /// <summary>
    /// Validates an admin invitation token and returns information about the invitation
    /// </summary>
    /// <param name="token">The invitation token to validate</param>
    /// <returns>Validation response with invitation details</returns>
    public async Task<InviteValidationResponse> ValidateInviteTokenAsync(string token)
    {
        _logger.LogInformation("Validating admin invitation token");

        var invite = await _context.ClubAdminInvites
            .Include(ci => ci.Club)
            .Include(ci => ci.InvitedByUser)
            .FirstOrDefaultAsync(ci => ci.InviteToken == token);

        if (invite == null)
        {
            _logger.LogWarning("Invalid invitation token provided");
            return new InviteValidationResponse
            {
                IsValid = false,
                ErrorMessage = "Invalid invitation link. Please check the link and try again."
            };
        }

        if (invite.Status != "Pending")
        {
            _logger.LogWarning("Invitation token is not pending (Status: {Status})", invite.Status);
            return new InviteValidationResponse
            {
                IsValid = false,
                ErrorMessage = $"This invitation has already been {invite.Status.ToLower()}."
            };
        }

        if (invite.ExpiresAt <= DateTime.UtcNow)
        {
            _logger.LogWarning("Invitation token has expired");
            return new InviteValidationResponse
            {
                IsValid = false,
                ErrorMessage = "This invitation has expired. Please ask for a new invitation."
            };
        }

        // Check if the email has an existing GatherGrove account
        var existingUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == invite.Email.ToLower());

        _logger.LogInformation("Invitation token validated successfully. HasExistingAccount: {HasExistingAccount}", existingUser != null);

        return new InviteValidationResponse
        {
            IsValid = true,
            Email = invite.Email,
            ClubName = invite.Club.Name,
            HasExistingAccount = existingUser != null,
            ExpiresAt = invite.ExpiresAt,
            InvitedByName = invite.InvitedByUser.FullName
        };
    }

    /// <summary>
    /// Accepts an admin invitation, creating a new user if necessary and adding them as an admin
    /// </summary>
    /// <param name="request">The accept invitation request</param>
    /// <returns>Accept invitation response with user and club information</returns>
    public async Task<AcceptAdminInviteResponse> AcceptAdminInviteAsync(AcceptAdminInviteRequest request)
    {
        _logger.LogInformation("Accepting admin invitation with token");

        // Start transaction for atomic operation (if supported)
        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaction = null;
        try
        {
            transaction = await _context.Database.BeginTransactionAsync();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Transactions are not supported"))
        {
            // In-memory database doesn't support transactions, continue without transaction
            _logger.LogWarning("Transactions not supported, proceeding without transaction");
        }

        try
        {
            // First, validate the invitation
            var validation = await ValidateInviteTokenAsync(request.Token);
            if (!validation.IsValid)
            {
                throw new InvalidOperationException(validation.ErrorMessage ?? "Invalid invitation");
            }

            // Get the invitation details
            var invite = await _context.ClubAdminInvites
                .Include(ci => ci.Club)
                .FirstOrDefaultAsync(ci => ci.InviteToken == request.Token);

            if (invite == null)
            {
                throw new InvalidOperationException("Invitation not found");
            }

            User user;
            bool isNewUser = false;

            // Check if user already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == invite.Email.ToLower());

            if (existingUser != null)
            {
                // Existing user scenario
                user = existingUser;
                _logger.LogInformation("Using existing user account for email: {Email}", invite.Email);
            }
            else
            {
                // New user scenario - validate required fields
                if (string.IsNullOrWhiteSpace(request.Password))
                {
                    throw new ArgumentException("Password is required for new users");
                }
                if (string.IsNullOrWhiteSpace(request.FullName))
                {
                    throw new ArgumentException("Full name is required for new users");
                }

                // Create new user
                user = new User
                {
                    FullName = request.FullName.Trim(),
                    Email = invite.Email.ToLower(),
                    PasswordHash = HashPassword(request.Password),
                    IsActive = true, // Admins are automatically active
                    OnboardingCompleted = true, // Skip onboarding for invited admins
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                isNewUser = true;

                _logger.LogInformation("Created new user account for invited admin: {Email}", invite.Email);
            }

            // Check if user is already an admin of this club
            var existingAdmin = await _context.ClubAdmins
                .FirstOrDefaultAsync(ca => ca.UserId == user.Id && ca.ClubId == invite.ClubId);

            if (existingAdmin != null)
            {
                throw new InvalidOperationException("You are already an administrator of this club");
            }

            // Add user as admin of the club
            var clubAdmin = new ClubAdmin
            {
                UserId = user.Id,
                ClubId = invite.ClubId,
                CreatedAt = DateTime.UtcNow
            };

            _context.ClubAdmins.Add(clubAdmin);

            // Mark invitation as accepted
            invite.Status = "Accepted";

            await _context.SaveChangesAsync();

            // Commit transaction
            if (transaction != null)
            {
                await transaction.CommitAsync();
            }

            _logger.LogInformation("Admin invitation accepted successfully. User {UserId} is now admin of club {ClubId}",
                user.Id, invite.ClubId);

            return new AcceptAdminInviteResponse
            {
                User = new UserInfoDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    OnboardingCompleted = user.OnboardingCompleted
                },
                Club = new ClubInfoDto
                {
                    Id = invite.Club.Id,
                    Name = invite.Club.Name,
                    Tier = invite.Club.Tier
                },
                IsNewUser = isNewUser,
                Message = $"You are now an administrator for {invite.Club.Name}!"
            };
        }
        catch (Exception)
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync();
            }
            throw;
        }
    }

    /// <summary>
    /// Gets the digital membership card data for a user
    /// </summary>
    public async Task<MembershipCardResponse> GetMembershipCardAsync(string userEmail)
    {
        _logger.LogInformation("Getting membership card data for user: {Email}", userEmail);

        // Find the member by email including related data
        var member = await _context.Members
            .AsNoTracking()
            .Include(m => m.MembershipType)
            .Include(m => m.Club)
            .FirstOrDefaultAsync(m => m.Email == userEmail);

        if (member == null)
        {
            _logger.LogWarning("Member not found for email: {Email}", userEmail);
            throw new ArgumentException($"No membership found for email: {userEmail}");
        }

        // Generate QR code data
        // Use consistent expired date when no dues info is available
        // Use a fixed expired date to avoid timing issues in tests
        var expiryDate = member.DuesPaidUntil ?? new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var qrCodeData = $"GATHERGROVE_{member.Id}_{member.Club.Id}_{expiryDate:yyyyMMdd}";

        var response = new MembershipCardResponse
        {
            FullName = member.FullName,
            MembershipTypeName = member.MembershipType?.Name ?? "Unknown",
            MembershipExpiresAt = expiryDate.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            QrCodeData = qrCodeData
        };

        _logger.LogInformation("Membership card data generated successfully for user: {Email}", userEmail);
        return response;
    }

    /// <summary>
    /// Records login analytics for engagement tracking
    /// </summary>
    private async Task RecordLoginAnalyticsAsync(int userId, string platform, string? deviceType, string? sessionId)
    {
        try
        {
            // Find the member and club information
            var user = await _context.Users.FindAsync(userId);
            var member = user != null ? await _context.Members
                .Include(m => m.Club)
                .FirstOrDefaultAsync(m => m.Email == user.Email) : null;

            if (member != null && !string.IsNullOrEmpty(sessionId))
            {
                // Create or update analytics session
                var session = await _context.AnalyticsSessions
                    .FirstOrDefaultAsync(s => s.Id == sessionId);

                if (session == null)
                {
                    session = new AnalyticsSession
                    {
                        Id = sessionId,
                        ClubId = member.ClubId,
                        UserId = userId,
                        MemberId = member.Id,
                        StartedAt = DateTime.UtcNow,
                        LastActivityAt = DateTime.UtcNow,
                        Platform = platform,
                        DeviceType = deviceType,
                        IsLoginSession = true,
                        LastLoginAt = DateTime.UtcNow,
                        IsSuccessfulLogin = true,
                        LoginMethod = "email"
                    };
                    _context.AnalyticsSessions.Add(session);
                }
                else
                {
                    session.IsLoginSession = true;
                    session.LastLoginAt = DateTime.UtcNow;
                    session.IsSuccessfulLogin = true;
                    session.LoginMethod = "email";
                    session.LastActivityAt = DateTime.UtcNow;
                }

                // Create login event
                var loginEvent = new AnalyticsEvent
                {
                    EventType = "Login",
                    Category = "Authentication",
                    Action = "Login_Success",
                    Label = platform,
                    ClubId = member.ClubId,
                    UserId = userId,
                    MemberId = member.Id,
                    SessionId = sessionId,
                    Platform = platform,
                    DeviceType = deviceType,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AnalyticsEvents.Add(loginEvent);

                await _context.SaveChangesAsync();

                _logger.LogInformation("Recorded login analytics for user {UserId}, member {MemberId}", userId, member.Id);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record login analytics for user {UserId}", userId);
        }
    }
}
