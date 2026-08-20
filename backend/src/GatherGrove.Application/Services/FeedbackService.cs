using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling application feedback submissions
/// </summary>
public class FeedbackService : IFeedbackService
{
    private readonly GatherGroveDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<FeedbackService> _logger;
    private const string FEEDBACK_RECIPIENT = "support@gathergrove.club";

    public FeedbackService(
        GatherGroveDbContext context,
        IEmailService emailService,
        ILogger<FeedbackService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<AppFeedbackResponse> SubmitFeedbackAsync(
        SubmitAppFeedbackRequest request,
        int? userId,
        string? ipAddress,
        string? userAgent)
    {
        try
        {
            // Get user info if authenticated
            string? userName = request.Name;
            string? userEmail = request.Email;

            if (userId.HasValue)
            {
                var user = await _context.Users.FindAsync(userId.Value);
                if (user != null)
                {
                    userName = user.FullName;
                    userEmail = user.Email;
                }
            }

            // Create feedback entity
            var feedback = new AppFeedback
            {
                Rating = request.Rating,
                Subject = request.Subject,
                Message = request.Message,
                Name = userName,
                Email = userEmail,
                UserId = userId,
                Platform = request.Platform,
                IpAddress = ipAddress,
                UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent,
                PageUrl = request.PageUrl,
                AppVersion = request.AppVersion,
                OsVersion = request.OsVersion,
                DeviceModel = request.DeviceModel,
                ScreenResolution = request.ScreenResolution,
                BrowserInfo = request.BrowserInfo,
                CreatedAt = DateTime.UtcNow
            };

            // Save to database
            _context.AppFeedback.Add(feedback);
            await _context.SaveChangesAsync();

            // Send email notification
            var emailSent = await SendFeedbackEmailAsync(feedback);

            feedback.EmailSent = emailSent;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Feedback submitted: ID={FeedbackId}, Rating={Rating}, Platform={Platform}, EmailSent={EmailSent}",
                feedback.Id, feedback.Rating, feedback.Platform, emailSent);

            return new AppFeedbackResponse
            {
                Success = true,
                Message = "Thank you for your feedback!",
                FeedbackId = feedback.Id
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to submit feedback");
            return new AppFeedbackResponse
            {
                Success = false,
                Message = "An error occurred while submitting your feedback. Please try again."
            };
        }
    }

    private async Task<bool> SendFeedbackEmailAsync(AppFeedback feedback)
    {
        try
        {
            var starsFilled = new string('★', feedback.Rating);
            var starsEmpty = new string('☆', 5 - feedback.Rating);
            var userInfo = !string.IsNullOrEmpty(feedback.Name)
                ? $"{feedback.Name}" + (!string.IsNullOrEmpty(feedback.Email) ? $" ({feedback.Email})" : "")
                : "Anonymous";

            var subject = $"[GatherGrove Feedback] {feedback.Subject} - {starsFilled}{starsEmpty}";

            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>New Feedback Received</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #2e6b4d; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .rating {{ font-size: 28px; margin: 15px 0; }}
        .star-filled {{ color: #FFD700; }}
        .star-empty {{ color: #ccc; }}
        .detail-box {{ background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2e6b4d; }}
        .label {{ font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }}
        .value {{ color: #333; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1 style='margin: 0;'>New Feedback Received</h1>
    </div>
    <div class='content'>
        <div class='rating'>
            <span class='star-filled'>{starsFilled}</span><span class='star-empty'>{starsEmpty}</span>
            <span style='font-size: 16px; color: #333; margin-left: 10px;'>({feedback.Rating}/5)</span>
        </div>

        <div class='detail-box'>
            <p class='label'>Subject</p>
            <p class='value'>{System.Net.WebUtility.HtmlEncode(feedback.Subject)}</p>
        </div>

        <div class='detail-box'>
            <p class='label'>Message</p>
            <p class='value'>{System.Net.WebUtility.HtmlEncode(feedback.Message).Replace("\n", "<br>")}</p>
        </div>

        <div class='detail-box'>
            <p class='label'>Submitted By</p>
            <p class='value'>{System.Net.WebUtility.HtmlEncode(userInfo)}</p>
        </div>

        <div class='detail-box'>
            <p class='label'>Details</p>
            <p class='value'>
                <strong>Platform:</strong> {System.Net.WebUtility.HtmlEncode(feedback.Platform)}<br>
                <strong>Page:</strong> {System.Net.WebUtility.HtmlEncode(feedback.PageUrl ?? "N/A")}<br>
                <strong>Submitted:</strong> {feedback.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC<br>
                <strong>Feedback ID:</strong> {feedback.Id}
            </p>
        </div>

        <div class='detail-box'>
            <p class='label'>Device Information</p>
            <p class='value'>
                <strong>App Version:</strong> {System.Net.WebUtility.HtmlEncode(feedback.AppVersion ?? "N/A")}<br>
                <strong>OS:</strong> {System.Net.WebUtility.HtmlEncode(feedback.OsVersion ?? "N/A")}<br>
                <strong>Device:</strong> {System.Net.WebUtility.HtmlEncode(feedback.DeviceModel ?? "N/A")}<br>
                <strong>Screen:</strong> {System.Net.WebUtility.HtmlEncode(feedback.ScreenResolution ?? "N/A")}<br>
                <strong>Browser:</strong> {System.Net.WebUtility.HtmlEncode(feedback.BrowserInfo ?? "N/A")}
            </p>
        </div>
    </div>
    <div class='footer'>
        <p>This is an automated notification from GatherGrove</p>
    </div>
</body>
</html>";

            return await _emailService.SendEmailAsync(
                FEEDBACK_RECIPIENT,
                subject,
                htmlBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send feedback notification email for feedback ID {FeedbackId}", feedback.Id);
            return false;
        }
    }
}
