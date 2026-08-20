using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for generating application URLs consistently across the system
/// </summary>
public class UrlService : IUrlService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<UrlService> _logger;
    private readonly string _frontendBaseUrl;
    private readonly string _apiBaseUrl;

    public UrlService(IConfiguration configuration, ILogger<UrlService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        // Initialize base URLs from configuration
        _frontendBaseUrl = GetConfiguredUrl("App:FrontendUrl", "http://localhost:3000");
        _apiBaseUrl = GetConfiguredUrl("App:ApiUrl", "http://localhost:5284");

        _logger.LogInformation("UrlService initialized with Frontend: {FrontendUrl}, API: {ApiUrl}",
            _frontendBaseUrl, _apiBaseUrl);
    }

    private string GetConfiguredUrl(string key, string defaultValue)
    {
        var url = _configuration[key];
        if (string.IsNullOrEmpty(url))
        {
            _logger.LogWarning("Configuration key '{Key}' not found, using default: {Default}",
                key, defaultValue);
            return defaultValue;
        }

        // Ensure URL doesn't end with a slash for consistent concatenation
        return url.TrimEnd('/');
    }

    public string GetFrontendBaseUrl() => _frontendBaseUrl;

    public string GetApiBaseUrl() => _apiBaseUrl;

    public string GenerateJoinUrl(string inviteCode)
    {
        if (string.IsNullOrEmpty(inviteCode))
            throw new ArgumentException("Invite code cannot be empty", nameof(inviteCode));

        return $"{_frontendBaseUrl}/join/{inviteCode}";
    }

    public string GeneratePaymentUrl(string paymentToken)
    {
        if (string.IsNullOrEmpty(paymentToken))
            throw new ArgumentException("Payment token cannot be empty", nameof(paymentToken));

        return $"{_frontendBaseUrl}/payment/{paymentToken}";
    }

    public string GenerateActivationUrl(string activationToken)
    {
        if (string.IsNullOrEmpty(activationToken))
            throw new ArgumentException("Activation token cannot be empty", nameof(activationToken));

        return $"{_frontendBaseUrl}/activate-account?token={activationToken}";
    }

    public string GeneratePasswordResetUrl(string resetToken)
    {
        if (string.IsNullOrEmpty(resetToken))
            throw new ArgumentException("Reset token cannot be empty", nameof(resetToken));

        return $"{_frontendBaseUrl}/reset-password?token={resetToken}";
    }

    public string GenerateEventRsvpUrl(string rsvpToken)
    {
        if (string.IsNullOrEmpty(rsvpToken))
            throw new ArgumentException("RSVP token cannot be empty", nameof(rsvpToken));

        return $"{_frontendBaseUrl}/rsvp/{rsvpToken}";
    }

    public string GenerateStripeConnectRefreshUrl()
    {
        return $"{_frontendBaseUrl}/admin/dues?refresh=true";
    }

    public string GenerateStripeConnectReturnUrl()
    {
        return $"{_frontendBaseUrl}/admin/dues?connected=true";
    }
}