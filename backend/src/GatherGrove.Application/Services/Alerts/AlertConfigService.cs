using System.Text.Json;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs.Alerts;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Repositories;

namespace GatherGrove.Application.Services.Alerts;

/// <summary>
/// Service implementation for managing club alert configurations
/// </summary>
public class AlertConfigService : IAlertConfigService
{
    private readonly IAlertConfigRepository _alertConfigRepository;
    private readonly IClubRepository _clubRepository;
    private readonly ILogger<AlertConfigService> _logger;

    public AlertConfigService(
        IAlertConfigRepository alertConfigRepository,
        IClubRepository clubRepository,
        ILogger<AlertConfigService> logger)
    {
        _alertConfigRepository = alertConfigRepository;
        _clubRepository = clubRepository;
        _logger = logger;
    }

    /// <summary>
    /// Gets the alert configuration for a club
    /// </summary>
    public async Task<AlertConfigResponse> GetAlertConfigAsync(int clubId, int userId)
    {
        _logger.LogInformation("Getting alert configuration for club {ClubId} by user {UserId}", clubId, userId);

        // Verify user is admin of this club
        var club = await _clubRepository.GetClubWithAdminCheckAsync(clubId, userId);
        if (club == null)
        {
            throw new UnauthorizedAccessException($"User {userId} does not have admin access to club {clubId}");
        }

        var config = await _alertConfigRepository.GetByClubIdAsync(clubId);
        if (config == null)
        {
            throw new KeyNotFoundException($"Alert configuration not found for club {clubId}");
        }

        return MapToResponse(config);
    }

    /// <summary>
    /// Creates a new alert configuration for a club
    /// </summary>
    public async Task<AlertConfigResponse> CreateAlertConfigAsync(int clubId, int userId, CreateAlertConfigRequest request)
    {
        _logger.LogInformation("Creating alert configuration for club {ClubId} by user {UserId}", clubId, userId);

        // Verify user is admin of this club
        var club = await _clubRepository.GetClubWithAdminCheckAsync(clubId, userId);
        if (club == null)
        {
            throw new UnauthorizedAccessException($"User {userId} does not have admin access to club {clubId}");
        }

        // Check if configuration already exists
        var existingConfig = await _alertConfigRepository.GetByClubIdAsync(clubId);
        if (existingConfig != null)
        {
            throw new InvalidOperationException($"Alert configuration already exists for club {clubId}");
        }

        // Validate thresholds
        ValidateThresholds(request.ChurnRiskThreshold, request.EngagementScoreThreshold);

        var config = new AlertConfiguration
        {
            ClubId = clubId,
            EngagementAlerts = request.EngagementAlerts,
            ChurnRiskAlerts = request.ChurnRiskAlerts,
            EventReminderAlerts = request.EventReminderAlerts,
            ChurnRiskThreshold = request.ChurnRiskThreshold,
            EngagementScoreThreshold = request.EngagementScoreThreshold,
            AlertEmailRecipientsJson = JsonSerializer.Serialize(request.AlertEmailRecipients ?? new List<string>()),
            SlackWebhookUrl = request.SlackWebhookUrl,
            IsEnabled = request.IsEnabled
        };

        var createdConfig = await _alertConfigRepository.AddAsync(config);
        _logger.LogInformation("Successfully created alert configuration for club {ClubId}", clubId);

        return MapToResponse(createdConfig);
    }

    /// <summary>
    /// Updates the alert configuration for a club
    /// </summary>
    public async Task<AlertConfigResponse> UpdateAlertConfigAsync(int clubId, int userId, UpdateAlertConfigRequest request)
    {
        _logger.LogInformation("Updating alert configuration for club {ClubId} by user {UserId}", clubId, userId);

        // Verify user is admin of this club
        var club = await _clubRepository.GetClubWithAdminCheckAsync(clubId, userId);
        if (club == null)
        {
            throw new UnauthorizedAccessException($"User {userId} does not have admin access to club {clubId}");
        }

        var config = await _alertConfigRepository.GetByClubIdAsync(clubId);
        if (config == null)
        {
            throw new KeyNotFoundException($"Alert configuration not found for club {clubId}");
        }

        // Validate thresholds
        ValidateThresholds(request.ChurnRiskThreshold, request.EngagementScoreThreshold);

        // Update configuration
        config.EngagementAlerts = request.EngagementAlerts;
        config.ChurnRiskAlerts = request.ChurnRiskAlerts;
        config.EventReminderAlerts = request.EventReminderAlerts;
        config.ChurnRiskThreshold = request.ChurnRiskThreshold;
        config.EngagementScoreThreshold = request.EngagementScoreThreshold;
        config.AlertEmailRecipientsJson = JsonSerializer.Serialize(request.AlertEmailRecipients ?? new List<string>());
        config.SlackWebhookUrl = request.SlackWebhookUrl;
        config.IsEnabled = request.IsEnabled;

        var updatedConfig = await _alertConfigRepository.UpdateAsync(config);
        _logger.LogInformation("Successfully updated alert configuration for club {ClubId}", clubId);

        return MapToResponse(updatedConfig);
    }

    private static void ValidateThresholds(int churnRiskThreshold, int engagementScoreThreshold)
    {
        if (churnRiskThreshold < 0 || churnRiskThreshold > 100)
        {
            throw new InvalidOperationException("Churn risk threshold must be between 0 and 100");
        }

        if (engagementScoreThreshold < 0 || engagementScoreThreshold > 100)
        {
            throw new InvalidOperationException("Engagement score threshold must be between 0 and 100");
        }
    }

    private static AlertConfigResponse MapToResponse(AlertConfiguration config)
    {
        var emailRecipients = new List<string>();
        try
        {
            if (!string.IsNullOrEmpty(config.AlertEmailRecipientsJson))
            {
                emailRecipients = JsonSerializer.Deserialize<List<string>>(config.AlertEmailRecipientsJson) ?? new List<string>();
            }
        }
        catch
        {
            // If JSON parsing fails, return empty list
        }

        return new AlertConfigResponse
        {
            ClubId = config.ClubId,
            EngagementAlerts = config.EngagementAlerts,
            ChurnRiskAlerts = config.ChurnRiskAlerts,
            EventReminderAlerts = config.EventReminderAlerts,
            ChurnRiskThreshold = config.ChurnRiskThreshold,
            EngagementScoreThreshold = config.EngagementScoreThreshold,
            AlertEmailRecipients = emailRecipients,
            SlackWebhookUrl = config.SlackWebhookUrl,
            IsEnabled = config.IsEnabled,
            CreatedAt = config.CreatedAt,
            UpdatedAt = config.UpdatedAt
        };
    }
}
