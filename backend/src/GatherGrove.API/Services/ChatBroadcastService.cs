using Microsoft.AspNetCore.SignalR;
using GatherGrove.Application.Services.Chat;
using GatherGrove.Application.DTOs.Chat;
using GatherGrove.API.Hubs;

namespace GatherGrove.API.Services;

/// <summary>
/// SignalR implementation of chat broadcast service
/// </summary>
public class ChatBroadcastService : IChatBroadcastService
{
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly ILogger<ChatBroadcastService> _logger;

    public ChatBroadcastService(IHubContext<ChatHub> hubContext, ILogger<ChatBroadcastService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task BroadcastMessageToClubAsync(int clubId, ChatMessageResponse message)
    {
        try
        {
            var groupName = $"Club_{clubId}_Chat";
            await _hubContext.Clients.Group(groupName).SendAsync("NewMessage", message);
            _logger.LogInformation("Successfully broadcasted message {MessageId} to club {ClubId} chat group", message.ChatMessageId, clubId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast message {MessageId} to club {ClubId} chat group", message.ChatMessageId, clubId);
            throw; // Re-throw so the caller can handle it appropriately
        }
    }
}