using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Application.Services.Chat;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace GatherGrove.API.Hubs;

/// <summary>
/// SignalR hub for real-time club chat functionality
/// </summary>
[Authorize(Policy = "AdminOrMember")]
[Authorize(Policy = "GrowTierRequired")]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IChatService chatService, ILogger<ChatHub> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    /// <summary>
    /// Join a club's chat room
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    public async Task JoinClubChat(int clubId)
    {
        try
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Invalid user ID in token for SignalR chat join");
                return;
            }

            // Check if user has access to this club's chat
            var hasAccess = await _chatService.HasChatAccessAsync(clubId, userId);
            if (!hasAccess)
            {
                _logger.LogWarning("User {UserId} attempted to join chat for club {ClubId} without permission", userId, clubId);
                await Clients.Caller.SendAsync("AccessDenied", "You do not have access to this club's chat");
                return;
            }

            // Join the club-specific chat room
            var groupName = $"Club_{clubId}_Chat";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation("User {UserId} joined chat for club {ClubId}", userId, clubId);

            // Notify the user they've successfully joined
            await Clients.Caller.SendAsync("JoinedClubChat", clubId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining club chat for club {ClubId}", clubId);
            await Clients.Caller.SendAsync("Error", "Failed to join club chat");
        }
    }

    /// <summary>
    /// Leave a club's chat room
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    public async Task LeaveClubChat(int clubId)
    {
        try
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Invalid user ID in token for SignalR chat leave");
                return;
            }

            // Leave the club-specific chat room
            var groupName = $"Club_{clubId}_Chat";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation("User {UserId} left chat for club {ClubId}", userId, clubId);

            // Notify the user they've successfully left
            await Clients.Caller.SendAsync("LeftClubChat", clubId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving club chat for club {ClubId}", clubId);
        }
    }

    /// <summary>
    /// Handle connection events
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
        {
            _logger.LogInformation("User {UserId} connected to chat hub with connection {ConnectionId}", userId, Context.ConnectionId);
        }
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Handle disconnection events
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
        {
            _logger.LogInformation("User {UserId} disconnected from chat hub with connection {ConnectionId}", userId, Context.ConnectionId);
        }
        await base.OnDisconnectedAsync(exception);
    }

}
