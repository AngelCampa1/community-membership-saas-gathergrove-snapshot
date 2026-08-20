using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace GatherGrove.API.Services;

public sealed class TurnstileVerificationService : ITurnstileVerificationService
{
    private const string VerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    private static int _missingProductionSecretLogged;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<TurnstileVerificationService> _logger;

    public TurnstileVerificationService(
        HttpClient httpClient,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger<TurnstileVerificationService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    public async Task<bool> VerifyAsync(string? token, string? remoteIp, CancellationToken cancellationToken = default)
    {
        var secret = FirstConfiguredValue(
            _configuration["Turnstile:SecretKey"],
            Environment.GetEnvironmentVariable("TURNSTILE_SECRET_KEY"));

        if (string.IsNullOrWhiteSpace(secret))
        {
            if (_environment.IsProduction())
            {
                if (Interlocked.Exchange(ref _missingProductionSecretLogged, 1) == 0)
                {
                    _logger.LogCritical("TURNSTILE_SECRET_KEY is not configured in production; rejecting public form submission");
                }

                return false;
            }

            return true;
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        try
        {
            var values = new Dictionary<string, string>
            {
                ["secret"] = secret,
                ["response"] = token
            };

            if (!string.IsNullOrWhiteSpace(remoteIp))
            {
                values["remoteip"] = remoteIp;
            }

            using var content = new FormUrlEncodedContent(values);
            using var response = await _httpClient.PostAsync(VerifyUrl, content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Turnstile verification returned non-success status {StatusCode}", response.StatusCode);
                return false;
            }

            var result = await response.Content.ReadFromJsonAsync<TurnstileSiteVerifyResponse>(
                cancellationToken: cancellationToken);

            return result?.Success == true;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            _logger.LogWarning(ex, "Turnstile verification failed closed");
            return false;
        }
    }

    private static string? FirstConfiguredValue(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }

    private sealed class TurnstileSiteVerifyResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
    }
}
