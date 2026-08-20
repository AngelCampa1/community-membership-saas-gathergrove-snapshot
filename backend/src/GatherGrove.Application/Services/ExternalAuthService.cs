using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for external OAuth authentication (Google, Apple SSO)
/// </summary>
public class ExternalAuthService : IExternalAuthService
{
    private readonly GatherGroveDbContext _context;
    private readonly IGoogleTokenValidator _googleValidator;
    private readonly IAppleTokenValidator _appleValidator;
    private readonly IAuthService _authService;
    private readonly ILogger<ExternalAuthService> _logger;

    public ExternalAuthService(
        GatherGroveDbContext context,
        IGoogleTokenValidator googleValidator,
        IAppleTokenValidator appleValidator,
        IAuthService authService,
        ILogger<ExternalAuthService> logger)
    {
        _context = context;
        _googleValidator = googleValidator;
        _appleValidator = appleValidator;
        _authService = authService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ExternalAuthResult> AuthenticateWithGoogleAsync(string idToken, string platform = "web", string? fullName = null)
    {
        var validationResult = await _googleValidator.ValidateAsync(idToken, platform);
        if (!validationResult.IsValid)
        {
            return new ExternalAuthResult
            {
                Success = false,
                ErrorMessage = validationResult.ErrorMessage
            };
        }

        return await ProcessExternalAuthAsync(validationResult, fullName, platform);
    }

    /// <inheritdoc />
    public async Task<ExternalAuthResult> AuthenticateWithAppleAsync(string idToken, string platform = "web", string? fullName = null, string? nonce = null)
    {
        var validationResult = await _appleValidator.ValidateAsync(idToken, platform, nonce);
        if (!validationResult.IsValid)
        {
            return new ExternalAuthResult
            {
                Success = false,
                ErrorMessage = validationResult.ErrorMessage
            };
        }

        return await ProcessExternalAuthAsync(validationResult, fullName, platform);
    }

    private async Task<ExternalAuthResult> ProcessExternalAuthAsync(TokenValidationResult tokenResult, string? fullName, string platform)
    {
        var now = DateTime.UtcNow;

        // Check if this external provider is already linked to a user
        var existingLink = await _context.ExternalAuthProviders
            .Include(e => e.User)
                .ThenInclude(u => u.ClubAdmins)
                    .ThenInclude(ca => ca.Club)
            .FirstOrDefaultAsync(e =>
                e.Provider == tokenResult.Provider &&
                e.ProviderUserId == tokenResult.ProviderUserId);

        if (existingLink != null)
        {
            // User already has this provider linked, log them in
            existingLink.LastUsedAt = now;
            await _context.SaveChangesAsync();

            _logger.LogInformation("SSO login for existing linked user: {UserId}, Provider: {Provider}",
                existingLink.UserId, tokenResult.Provider);

            return await CreateAuthResultAsync(existingLink.User, isNewUser: false, wasLinked: false, platform);
        }

        // Check if a user with this email already exists
        var existingUser = await _context.Users
            .Include(u => u.ClubAdmins)
                .ThenInclude(ca => ca.Club)
            .Include(u => u.ExternalAuthProviders)
            .FirstOrDefaultAsync(u => u.Email == tokenResult.Email);

        if (existingUser != null)
        {
            // Auto-link the SSO provider to the existing account (email is verified by provider)
            var externalAuthProvider = new ExternalAuthProvider
            {
                UserId = existingUser.Id,
                Provider = tokenResult.Provider,
                ProviderUserId = tokenResult.ProviderUserId,
                ProviderEmail = tokenResult.Email,
                EmailVerifiedAtLinking = tokenResult.EmailVerified,
                LinkedAt = now,
                LastUsedAt = now
            };

            _context.ExternalAuthProviders.Add(externalAuthProvider);
            await _context.SaveChangesAsync();

            _logger.LogInformation("SSO provider {Provider} linked to existing user: {UserId}",
                tokenResult.Provider, existingUser.Id);

            return await CreateAuthResultAsync(existingUser, isNewUser: false, wasLinked: true, platform);
        }

        // Create a new user with this SSO provider
        var userName = fullName ?? tokenResult.FullName ?? tokenResult.Email?.Split('@')[0] ?? "User";

        var newUser = new User
        {
            FullName = userName,
            Email = tokenResult.Email ?? throw new InvalidOperationException("Email is required for SSO registration"),
            PasswordHash = string.Empty, // SSO-only users don't have a password
            IsActive = true, // SSO users are automatically activated
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        // Create the external auth provider link
        var newExternalAuthProvider = new ExternalAuthProvider
        {
            UserId = newUser.Id,
            Provider = tokenResult.Provider,
            ProviderUserId = tokenResult.ProviderUserId,
            ProviderEmail = tokenResult.Email,
            EmailVerifiedAtLinking = tokenResult.EmailVerified,
            LinkedAt = now,
            LastUsedAt = now
        };

        _context.ExternalAuthProviders.Add(newExternalAuthProvider);
        await _context.SaveChangesAsync();

        _logger.LogInformation("New user created via SSO: {UserId}, Provider: {Provider}",
            newUser.Id, tokenResult.Provider);

        return await CreateAuthResultAsync(newUser, isNewUser: true, wasLinked: false, platform);
    }

    private async Task<ExternalAuthResult> CreateAuthResultAsync(User user, bool isNewUser, bool wasLinked, string platform)
    {
        // Get user's club and role information
        var clubAdmin = user.ClubAdmins.FirstOrDefault();
        var clubId = clubAdmin?.ClubId ?? 0;
        var role = clubAdmin != null ? "Admin" : "Member";

        // For mobile clients or new users, include the token
        string? token = null;
        if (platform != "web" || isNewUser)
        {
            token = _authService.GenerateJwtToken(user.Id, user.Email, clubId, role);
        }

        return new ExternalAuthResult
        {
            Success = true,
            User = user,
            IsNewUser = isNewUser,
            WasLinkedToExisting = wasLinked,
            Token = token
        };
    }

    /// <inheritdoc />
    public async Task<bool> LinkProviderAsync(int userId, string provider, string idToken, string platform = "web")
    {
        // Validate the token
        TokenValidationResult validationResult;
        if (provider.Equals("Google", StringComparison.OrdinalIgnoreCase))
        {
            validationResult = await _googleValidator.ValidateAsync(idToken, platform);
        }
        else if (provider.Equals("Apple", StringComparison.OrdinalIgnoreCase))
        {
            validationResult = await _appleValidator.ValidateAsync(idToken, platform);
        }
        else
        {
            _logger.LogWarning("Unsupported provider for linking: {Provider}", provider);
            return false;
        }

        if (!validationResult.IsValid)
        {
            _logger.LogWarning("Failed to validate token for linking: {Error}", validationResult.ErrorMessage);
            return false;
        }

        // Check if this provider account is already linked to another user
        var existingLink = await _context.ExternalAuthProviders
            .FirstOrDefaultAsync(e =>
                e.Provider == validationResult.Provider &&
                e.ProviderUserId == validationResult.ProviderUserId);

        if (existingLink != null)
        {
            if (existingLink.UserId == userId)
            {
                // Already linked to this user
                return true;
            }

            _logger.LogWarning("Provider account already linked to different user: {Provider}, {ProviderUserId}",
                validationResult.Provider, validationResult.ProviderUserId);
            return false;
        }

        // Check if user already has this provider linked
        var userHasProvider = await _context.ExternalAuthProviders
            .AnyAsync(e => e.UserId == userId && e.Provider == validationResult.Provider);

        if (userHasProvider)
        {
            _logger.LogWarning("User {UserId} already has {Provider} linked", userId, validationResult.Provider);
            return false;
        }

        // Create the link
        var now = DateTime.UtcNow;
        var externalAuthProvider = new ExternalAuthProvider
        {
            UserId = userId,
            Provider = validationResult.Provider,
            ProviderUserId = validationResult.ProviderUserId,
            ProviderEmail = validationResult.Email,
            EmailVerifiedAtLinking = validationResult.EmailVerified,
            LinkedAt = now,
            LastUsedAt = now
        };

        _context.ExternalAuthProviders.Add(externalAuthProvider);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully linked {Provider} to user {UserId}", provider, userId);
        return true;
    }

    /// <inheritdoc />
    public async Task<(bool Success, string? ErrorMessage)> UnlinkProviderAsync(int userId, string provider)
    {
        var user = await _context.Users
            .Include(u => u.ExternalAuthProviders)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return (false, "User not found");
        }

        var providerLink = user.ExternalAuthProviders
            .FirstOrDefault(e => e.Provider.Equals(provider, StringComparison.OrdinalIgnoreCase));

        if (providerLink == null)
        {
            return (false, $"{provider} is not linked to this account");
        }

        // Check if this would leave the user without any authentication method
        var hasPassword = !string.IsNullOrEmpty(user.PasswordHash);
        var otherProvidersCount = user.ExternalAuthProviders.Count - 1;

        if (!hasPassword && otherProvidersCount == 0)
        {
            return (false, "Cannot unlink the only authentication method. Please set a password first.");
        }

        _context.ExternalAuthProviders.Remove(providerLink);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully unlinked {Provider} from user {UserId}", provider, userId);
        return (true, null);
    }

    /// <inheritdoc />
    public async Task<LinkedProvidersInfo> GetLinkedProvidersAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.ExternalAuthProviders)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new LinkedProvidersInfo();
        }

        var googleProvider = user.ExternalAuthProviders
            .FirstOrDefault(e => e.Provider == "Google");
        var appleProvider = user.ExternalAuthProviders
            .FirstOrDefault(e => e.Provider == "Apple");

        return new LinkedProvidersInfo
        {
            HasPassword = !string.IsNullOrEmpty(user.PasswordHash),
            GoogleLinked = googleProvider != null,
            GoogleLinkedAt = googleProvider?.LinkedAt,
            AppleLinked = appleProvider != null,
            AppleLinkedAt = appleProvider?.LinkedAt
        };
    }

    /// <inheritdoc />
    public async Task<bool> SetPasswordAsync(int userId, string newPassword)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return false;
        }

        // Only allow setting password if user doesn't already have one
        if (!string.IsNullOrEmpty(user.PasswordHash))
        {
            _logger.LogWarning("User {UserId} already has a password set", userId);
            return false;
        }

        user.PasswordHash = _authService.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Password set for SSO-only user {UserId}", userId);
        return true;
    }
}
