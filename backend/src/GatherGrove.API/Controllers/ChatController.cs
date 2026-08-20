using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Application.Services.Chat;
using GatherGrove.Application.DTOs.Chat;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing club chat functionality
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/chat")]
[Authorize(Policy = "AdminOrMember")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    /// <summary>
    /// Gets chat message history for a club with optional pagination
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <param name="before">Get messages before this timestamp (optional)</param>
    /// <param name="limit">Maximum number of messages to return (default 50, max 100)</param>
    /// <returns>Chat history with messages and pagination info</returns>
    [HttpGet("messages")]
    [Authorize(Policy = "GrowTierRequired")]
    public async Task<ActionResult<ChatHistoryResponse>> GetChatHistory(
        int clubId,
        [FromQuery] DateTime? before = null,
        [FromQuery] int limit = 50)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Invalid user ID in token for chat history request");
                return Unauthorized("Invalid user authentication");
            }

            _logger.LogInformation("Getting chat history for club {ClubId} by user {UserId}", clubId, userId);

            var chatHistory = await _chatService.GetChatHistoryAsync(clubId, userId, before, limit);

            _logger.LogInformation("Successfully retrieved chat history for club {ClubId} with {MessageCount} messages",
                clubId, chatHistory.Messages.Count);

            return Ok(chatHistory);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to chat for club {ClubId}: {Message}", clubId, ex.Message);
            return Forbid("You do not have access to this club's chat");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for chat in club {ClubId}: {Message}", clubId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving chat history for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving chat history");
        }
    }

    /// <summary>
    /// Checks if the current user has access to the club's chat
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <returns>Chat access status and whether chat is enabled</returns>
    [HttpGet("access")]
    public async Task<ActionResult<ChatAccessResponse>> CheckChatAccess(int clubId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Invalid user ID in token for chat access check");
                return Unauthorized("Invalid user authentication");
            }

            _logger.LogInformation("Checking chat access for club {ClubId} by user {UserId}", clubId, userId);

            var hasAccess = await _chatService.HasChatAccessAsync(clubId, userId);
            var isChatEnabled = await _chatService.IsChatEnabledAsync(clubId);

            var response = new ChatAccessResponse
            {
                HasAccess = hasAccess,
                IsChatEnabled = isChatEnabled
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking chat access for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while checking chat access");
        }
    }

    /// <summary>
    /// Sends a new message to the club chat
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <param name="request">Message content to send</param>
    /// <returns>The sent message details</returns>
    [HttpPost("messages")]
    [Authorize(Policy = "GrowTierRequired")]
    public async Task<ActionResult<ChatMessageResponse>> SendMessage(
        int clubId,
        [FromBody] SendMessageRequest request)
    {
        try
        {
            // Validate request
            if (request == null)
            {
                _logger.LogWarning("Null request received for send message to club {ClubId}", clubId);
                return BadRequest("Message request cannot be null");
            }

            if (string.IsNullOrWhiteSpace(request.MessageContent))
            {
                _logger.LogWarning("Empty message content received for club {ClubId}", clubId);
                return BadRequest("Message content cannot be empty");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Invalid user ID in token for send message request");
                return Unauthorized("Invalid user authentication");
            }

            _logger.LogInformation("Sending message to club {ClubId} from user {UserId}", clubId, userId);

            var sentMessage = await _chatService.SendMessageAsync(clubId, userId, request);

            _logger.LogInformation("Successfully sent message {MessageId} to club {ClubId}",
                sentMessage.ChatMessageId, clubId);

            return CreatedAtAction(
                nameof(GetChatHistory),
                new { clubId },
                sentMessage);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized attempt to send message to club {ClubId}: {Message}", clubId, ex.Message);
            return Forbid("You do not have access to this club's chat");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for sending message to club {ClubId}: {Message}", clubId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message to club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while sending the message");
        }
    }
}