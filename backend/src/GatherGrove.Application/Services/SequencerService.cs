using System.Net.Http.Json;
using GatherGrove.Application.Configuration;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace GatherGrove.Application.Services;

public class SequencerService : ISequencerService
{
    private readonly HttpClient _httpClient;
    private readonly SequencerSettings _settings;
    private readonly ILogger<SequencerService> _logger;

    public SequencerService(
        HttpClient httpClient,
        IOptions<SequencerSettings> settings,
        ILogger<SequencerService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task EnrollMarketingLeadAsync(
        MarketingLead lead,
        CaptureLeadRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ClientId) ||
            string.IsNullOrWhiteSpace(_settings.ClientSecret))
        {
            _logger.LogWarning("Sequencer credentials are not configured; skipping marketing lead enrollment for {Email}", lead.Email);
            return;
        }

        var payload = new
        {
            email = lead.Email,
            product = "gathergrove",
            sequence_slug = _settings.MarketingNurtureSequenceSlug,
            source = $"marketing:{lead.Source}",
            properties = new Dictionary<string, object?>
            {
                ["lead_id"] = lead.Id.ToString(),
                ["name"] = lead.Name,
                ["source"] = lead.Source,
                ["variant"] = lead.Variant,
                ["referrer"] = lead.ReferrerUrl,
                ["current_url"] = lead.CurrentUrl,
                ["session_id"] = lead.SessionId,
                ["metadata"] = lead.Metadata
            }
        };

        using var message = new HttpRequestMessage(HttpMethod.Post, "/api/v1/enrollments")
        {
            Content = JsonContent.Create(payload)
        };
        message.Headers.Add("CF-Access-Client-Id", _settings.ClientId);
        message.Headers.Add("CF-Access-Client-Secret", _settings.ClientSecret);

        using var response = await _httpClient.SendAsync(message, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            _logger.LogInformation(
                "Enrolled marketing lead {Email} into Sequencer sequence {SequenceSlug}",
                lead.Email,
                _settings.MarketingNurtureSequenceSlug);
            return;
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        _logger.LogError(
            "Sequencer enrollment failed for {Email} with status {StatusCode}: {Body}",
            lead.Email,
            (int)response.StatusCode,
            body);
        response.EnsureSuccessStatusCode();
    }
}
