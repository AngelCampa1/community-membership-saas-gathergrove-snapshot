using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GatherGrove.Application.Configuration;
using Stripe;
using Microsoft.EntityFrameworkCore;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling Stripe Connect operations (Story 18)
/// </summary>
public class StripeConnectService : IStripeConnectService
{
    private readonly GatherGroveDbContext _context;
    private readonly StripeSettings _stripeSettings;
    private readonly ILogger<StripeConnectService> _logger;
    private readonly IUrlService _urlService;

    public StripeConnectService(
        GatherGroveDbContext context,
        IOptions<StripeSettings> stripeSettings,
        ILogger<StripeConnectService> logger,
        IUrlService urlService)
    {
        _context = context;
        _stripeSettings = stripeSettings.Value;
        _logger = logger;
        _urlService = urlService;

        // Validate Stripe configuration
        var secretKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY") ?? _stripeSettings.SecretKey;
        if (string.IsNullOrEmpty(secretKey))
        {
            _logger.LogError("Stripe SecretKey is not configured");
            throw new InvalidOperationException("Stripe SecretKey is not configured");
        }
    }

    /// <summary>
    /// Generates a Stripe Connect onboarding link for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userEmail">The email of the user creating the account</param>
    /// <param name="country">Optional country code for the connected account</param>
    /// <returns>Onboarding link response</returns>
    public async Task<StripeConnectLinkResponse> GenerateConnectLinkAsync(int clubId, string userEmail, string? country = null)
    {
        _logger.LogInformation("Generating Stripe Connect link for club {ClubId}", clubId);

        // Check if Stripe Connect is enabled
        if (!_stripeSettings.IsConnectEnabled)
        {
            _logger.LogWarning("Stripe Connect is not enabled in configuration");
            throw new InvalidOperationException("Payment processing is not currently available. Please contact support to enable this feature.");
        }

        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new InvalidOperationException("Club not found");
        }

        // If club already has a Stripe account, verify it exists and create account link
        if (!string.IsNullOrEmpty(club.StripeAccountId))
        {
            try
            {
                // Verify the account exists in Stripe
                var accountService = new AccountService();
                var requestOptions = new RequestOptions
                {
                    ApiKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY") ?? _stripeSettings.SecretKey
                };

                var existingAccount = await accountService.GetAsync(club.StripeAccountId, null, requestOptions);

                // Account exists, create account link for re-authentication
                var accountLinkService = new AccountLinkService();
                var accountLinkOptions = new AccountLinkCreateOptions
                {
                    Account = club.StripeAccountId,
                    RefreshUrl = _urlService.GenerateStripeConnectRefreshUrl(),
                    ReturnUrl = _urlService.GenerateStripeConnectReturnUrl(),
                    Type = "account_onboarding",
                };

                var accountLink = await accountLinkService.CreateAsync(accountLinkOptions, requestOptions);

                return new StripeConnectLinkResponse
                {
                    OnboardingUrl = accountLink.Url
                };
            }
            catch (StripeException ex) when (ex.StripeError?.Code == "resource_missing" || ex.Message.Contains("does not exist"))
            {
                // Account doesn't exist in Stripe, clear it and create a new one
                _logger.LogWarning("Stripe account {AccountId} for club {ClubId} does not exist. Creating new account.",
                    club.StripeAccountId, clubId);

                club.StripeAccountId = null;
                club.StripeAccountCountry = null;
                await _context.SaveChangesAsync();
            }
        }

        // Create new Stripe Express account
        var newAccountService = new AccountService();
        var accountOptions = new AccountCreateOptions
        {
            Type = "express",
            Country = country ?? _stripeSettings.DefaultCountry ?? "US", // Use provided country, then default, then US fallback
            Email = userEmail,
            Capabilities = new AccountCapabilitiesOptions
            {
                CardPayments = new AccountCapabilitiesCardPaymentsOptions
                {
                    Requested = true,
                },
                Transfers = new AccountCapabilitiesTransfersOptions
                {
                    Requested = true,
                },
            },
        };

        Account account;
        try
        {
            var requestOptions = new RequestOptions
            {
                ApiKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY") ?? _stripeSettings.SecretKey
            };
            account = await newAccountService.CreateAsync(accountOptions, requestOptions);
        }
        catch (StripeException ex) when (ex.Message.Contains("You can only create new accounts if you've signed up for Connect"))
        {
            _logger.LogError("Stripe Connect is not enabled for this account. Please enable Connect in your Stripe dashboard.");
            throw new InvalidOperationException("Stripe Connect is not enabled for your platform account. Please visit https://dashboard.stripe.com/connect/onboarding to enable Stripe Connect, then try again.", ex);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to create Stripe Connect account: {Message}", ex.Message);

            // Provide more specific error messages based on the Stripe error
            if (ex.Message.Contains("Connect"))
            {
                throw new InvalidOperationException("Stripe Connect needs to be enabled for your platform. Please visit https://dashboard.stripe.com/connect/onboarding to complete setup.", ex);
            }

            // Check for platform profile setup requirement
            if (ex.Message.Contains("Please review the responsibilities") || ex.Message.Contains("platform-profile"))
            {
                _logger.LogWarning("Platform profile not completed. Returning temporary unavailable message to user.");
                // Return a URL that indicates the service is temporarily unavailable
                return new StripeConnectLinkResponse
                {
                    OnboardingUrl = _urlService.GenerateStripeConnectReturnUrl() + "&status=platform_setup_required"
                };
            }

            throw new InvalidOperationException($"Failed to create payment account: {ex.Message}", ex);
        }

        // Store the account ID and country in our database
        club.StripeAccountId = account.Id;
        club.StripeAccountCountry = account.Country;
        club.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created Stripe account {StripeAccountId} for club {ClubId}", account.Id, clubId);

        // Create onboarding link
        var linkService = new AccountLinkService();
        var linkOptions = new AccountLinkCreateOptions
        {
            Account = account.Id,
            RefreshUrl = _urlService.GenerateStripeConnectRefreshUrl(),
            ReturnUrl = _urlService.GenerateStripeConnectReturnUrl(),
            Type = "account_onboarding",
        };

        var linkRequestOptions = new RequestOptions
        {
            ApiKey = _stripeSettings.SecretKey
        };

        var link = await linkService.CreateAsync(linkOptions, linkRequestOptions);

        return new StripeConnectLinkResponse
        {
            OnboardingUrl = link.Url
        };
    }

    /// <summary>
    /// Gets the Stripe Connect status for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Connection status</returns>
    public async Task<StripeConnectStatusResponse> GetConnectStatusAsync(int clubId)
    {
        _logger.LogInformation("Getting Stripe Connect status for club {ClubId}", clubId);

        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new InvalidOperationException("Club not found");
        }

        if (string.IsNullOrEmpty(club.StripeAccountId))
        {
            return new StripeConnectStatusResponse
            {
                IsConnected = false,
                StripeAccountId = null,
                IsDevelopmentMode = false
            };
        }

        // Check if the Stripe account is properly set up
        try
        {
            var accountService = new AccountService();
            var requestOptions = new RequestOptions
            {
                ApiKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY") ?? _stripeSettings.SecretKey
            };
            var account = await accountService.GetAsync(club.StripeAccountId, null, requestOptions);

            // Check if account is fully onboarded
            bool isConnected = account.DetailsSubmitted &&
                              account.ChargesEnabled &&
                              account.PayoutsEnabled;

            return new StripeConnectStatusResponse
            {
                IsConnected = isConnected,
                StripeAccountId = isConnected ? club.StripeAccountId : null,
                IsDevelopmentMode = false
            };
        }
        catch (StripeException ex)
        {
            _logger.LogWarning("Error checking Stripe account {StripeAccountId} for club {ClubId}: {Error}",
                club.StripeAccountId, clubId, ex.Message);

            return new StripeConnectStatusResponse
            {
                IsConnected = false,
                StripeAccountId = null,
                IsDevelopmentMode = false
            };
        }
    }

    /// <summary>
    /// Disconnects a club's Stripe account (for future use)
    /// </summary>
    /// <param name="clubId">The club ID</param>
    public async Task DisconnectAsync(int clubId)
    {
        _logger.LogInformation("Disconnecting Stripe account for club {ClubId}", clubId);

        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new InvalidOperationException("Club not found");
        }

        if (!string.IsNullOrEmpty(club.StripeAccountId))
        {
            // Note: We don't delete the Stripe account itself, just remove the connection
            // The club admin can manage their Stripe account directly if needed
            club.StripeAccountId = null;
            club.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Disconnected Stripe account for club {ClubId}", clubId);
        }
    }
}