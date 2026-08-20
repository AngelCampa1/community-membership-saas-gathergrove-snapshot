using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Services.TierValidation;
using GatherGrove.Domain.Entities;
using System.Security.Claims;
using ApplicationClubAuth = GatherGrove.Application.Services.IClubAuthorizationService;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing event feedback and surveys
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/events/{eventId}/feedback")]
[Authorize]
public class EventFeedbackController : ControllerBase
{
    private readonly IEventFeedbackService _feedbackService;
    private readonly ApplicationClubAuth _clubAuthorizationService;
    private readonly ITierGateService _tierGateService;
    private readonly ILogger<EventFeedbackController> _logger;

    public EventFeedbackController(
        IEventFeedbackService feedbackService,
        ApplicationClubAuth clubAuthorizationService,
        ITierGateService tierGateService,
        ILogger<EventFeedbackController> logger)
    {
        _feedbackService = feedbackService;
        _clubAuthorizationService = clubAuthorizationService;
        _tierGateService = tierGateService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a feedback survey for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="request">The survey creation request</param>
    /// <returns>The created feedback survey</returns>
    [HttpPost("surveys")]
    [ProducesResponseType(typeof(FeedbackSurveyResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CreateFeedbackSurvey(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] CreateFeedbackSurveyRequest request)
    {
        try
        {
            _logger.LogInformation("Creating feedback survey for event {EventId} in club {ClubId}", eventId, clubId);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            // Check tier restrictions for event feedback (unlimited tier feature)
            var tierValidation = await _tierGateService.ValidateFeatureAccessAsync(clubId, "EventFeedback");
            if (!tierValidation.HasAccess)
            {
                return Forbid("Feature not available for your tier");
            }

            var survey = await _feedbackService.CreateFeedbackSurveyAsync(eventId, request);

            _logger.LogInformation("Feedback survey created with ID {SurveyId} for event {EventId}",
                survey.Id, eventId);

            return CreatedAtAction(
                nameof(GetFeedbackSurvey),
                new { clubId, eventId, surveyId = survey.Id },
                survey);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for creating feedback survey: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating feedback survey for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while creating the feedback survey");
        }
    }

    /// <summary>
    /// Gets a feedback survey for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="surveyId">The ID of the survey</param>
    /// <returns>The feedback survey details</returns>
    [HttpGet("surveys/{surveyId}")]
    [ProducesResponseType(typeof(FeedbackSurveyResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetFeedbackSurvey(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int surveyId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var survey = await _feedbackService.GetFeedbackSurveyAsync(surveyId);
            if (survey == null)
            {
                return NotFound($"Feedback survey with ID {surveyId} not found");
            }

            return Ok(survey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback survey {SurveyId} for event {EventId}", surveyId, eventId);
            return StatusCode(500, "An error occurred while retrieving the feedback survey");
        }
    }

    /// <summary>
    /// Submits feedback for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="request">The feedback submission request</param>
    /// <returns>The submitted feedback response</returns>
    [HttpPost]
    [ProducesResponseType(typeof(FeedbackResponseDetails), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> SubmitFeedback(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] SubmitFeedbackRequest request)
    {
        try
        {
            _logger.LogInformation("Submitting feedback for event {EventId} from member {MemberId}",
                eventId, request.MemberId);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var feedbackResponse = await _feedbackService.SubmitFeedbackAsync(eventId, request);

            _logger.LogInformation("Feedback submitted with ID {FeedbackId} for event {EventId}",
                feedbackResponse.Id, eventId);

            return CreatedAtAction(
                nameof(GetFeedbackResponse),
                new { clubId, eventId, responseId = feedbackResponse.Id },
                feedbackResponse);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid feedback submission: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting feedback for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while submitting feedback");
        }
    }

    /// <summary>
    /// Gets a specific feedback response
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="responseId">The ID of the feedback response</param>
    /// <returns>The feedback response details</returns>
    [HttpGet("responses/{responseId}")]
    [ProducesResponseType(typeof(FeedbackResponseDetails), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetFeedbackResponse(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int responseId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var response = await _feedbackService.GetFeedbackResponseAsync(responseId);
            if (response == null)
            {
                return NotFound($"Feedback response with ID {responseId} not found");
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback response {ResponseId} for event {EventId}", responseId, eventId);
            return StatusCode(500, "An error occurred while retrieving the feedback response");
        }
    }

    /// <summary>
    /// Gets feedback analytics for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>The feedback analytics</returns>
    [HttpGet("analytics")]
    [ProducesResponseType(typeof(FeedbackAnalyticsResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetFeedbackAnalytics(
        [FromRoute] int clubId,
        [FromRoute] int eventId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var analytics = await _feedbackService.GetFeedbackAnalyticsAsync(eventId);

            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback analytics for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while retrieving feedback analytics");
        }
    }

    /// <summary>
    /// Sends feedback reminders to members who haven't submitted feedback
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="surveyId">The ID of the survey</param>
    /// <returns>The reminder sending result</returns>
    [HttpPost("surveys/{surveyId}/reminders")]
    [ProducesResponseType(typeof(FeedbackReminderResult), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> SendFeedbackReminders(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int surveyId)
    {
        try
        {
            _logger.LogInformation("Sending feedback reminders for survey {SurveyId} in event {EventId}",
                surveyId, eventId);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var result = await _feedbackService.SendFeedbackRemindersAsync(surveyId);

            _logger.LogInformation("Sent {Count} feedback reminders for survey {SurveyId}",
                result.RemindersSent, surveyId);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending feedback reminders for survey {SurveyId}", surveyId);
            return StatusCode(500, "An error occurred while sending feedback reminders");
        }
    }

    /// <summary>
    /// Closes a feedback survey to prevent further submissions
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="surveyId">The ID of the survey</param>
    /// <returns>No content on success</returns>
    [HttpPut("surveys/{surveyId}/close")]
    [ProducesResponseType(204)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CloseFeedbackSurvey(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromRoute] int surveyId)
    {
        try
        {
            _logger.LogInformation("Closing feedback survey {SurveyId} for event {EventId}", surveyId, eventId);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            await _feedbackService.CloseFeedbackSurveyAsync(surveyId);

            _logger.LogInformation("Feedback survey {SurveyId} closed successfully", surveyId);

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for closing feedback survey {SurveyId}: {Message}", surveyId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error closing feedback survey {SurveyId}", surveyId);
            return StatusCode(500, "An error occurred while closing the feedback survey");
        }
    }

    /// <summary>
    /// Exports feedback data for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="request">The export request</param>
    /// <returns>The exported feedback data</returns>
    [HttpPost("export")]
    [ProducesResponseType(typeof(ExportedFeedbackData), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ExportFeedbackData(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] ExportFeedbackDataRequest request)
    {
        try
        {
            _logger.LogInformation("Exporting feedback data for event {EventId} in format {Format}",
                eventId, request.Format);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var exportedData = await _feedbackService.ExportFeedbackDataAsync(eventId, request);

            _logger.LogInformation("Feedback data exported for event {EventId}, {RecordCount} records",
                eventId, exportedData.TotalRecords);

            return Ok(exportedData);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid export request for event {EventId}: {Message}", eventId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting feedback data for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while exporting feedback data");
        }
    }

    /// <summary>
    /// Gets all feedback surveys for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>List of feedback surveys for the event</returns>
    [HttpGet("surveys")]
    [ProducesResponseType(typeof(List<FeedbackSurveyResponse>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetEventFeedbackSurveys(
        [FromRoute] int clubId,
        [FromRoute] int eventId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var surveys = await _feedbackService.GetEventFeedbackSurveysAsync(eventId);

            return Ok(surveys);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback surveys for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while retrieving feedback surveys");
        }
    }

    /// <summary>
    /// Gets the feedback form for an event (mobile-compatible alias for surveys endpoint)
    /// Mobile expects: GET .../events/{eventId}/feedback-form
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <returns>List of feedback surveys for the event</returns>
    [HttpGet("feedback-form")]
    [ProducesResponseType(typeof(List<FeedbackSurveyResponse>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetFeedbackForm(
        [FromRoute] int clubId,
        [FromRoute] int eventId)
    {
        // Mobile-compatible alias - delegates to existing surveys endpoint logic
        return await GetEventFeedbackSurveys(clubId, eventId);
    }

    /// <summary>
    /// Gets all feedback responses for an event
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="eventId">The ID of the event</param>
    /// <param name="surveyId">Optional survey ID to filter responses</param>
    /// <returns>List of feedback responses for the event</returns>
    [HttpGet("responses")]
    [ProducesResponseType(typeof(List<FeedbackResponseDetails>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetEventFeedbackResponses(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromQuery] int? surveyId = null)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var responses = await _feedbackService.GetEventFeedbackResponsesAsync(eventId, surveyId);

            return Ok(responses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback responses for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while retrieving feedback responses");
        }
    }
}