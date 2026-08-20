using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs.Chat;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services.Chat;

/// <summary>
/// Service implementation for chat functionality
/// </summary>
public class ChatService : IChatService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<ChatService> _logger;
    private readonly IChatBroadcastService _chatBroadcastService;

    public ChatService(GatherGroveDbContext context, ILogger<ChatService> logger, IChatBroadcastService chatBroadcastService)
    {
        _context = context;
        _logger = logger;
        _chatBroadcastService = chatBroadcastService;
    }

    /// <inheritdoc />
    public async Task<ChatHistoryResponse> GetChatHistoryAsync(int clubId, int currentUserId, DateTime? before = null, int limit = 50)
    {
        _logger.LogInformation("Getting chat history for club {ClubId}, user {UserId}", clubId, currentUserId);

        // Validate user has access to this club's chat
        if (!await HasChatAccessAsync(clubId, currentUserId))
        {
            throw new UnauthorizedAccessException("User does not have access to this club's chat");
        }

        // Check if chat is enabled for this club
        if (!await IsChatEnabledAsync(clubId))
        {
            throw new InvalidOperationException("Chat is not enabled for this club");
        }

        // Check if club has required subscription tier for chat
        if (!await HasRequiredSubscriptionTierAsync(clubId))
        {
            throw new InvalidOperationException("Chat feature requires a Grow tier subscription");
        }

        // Build query for messages
        var query = _context.ClubChatMessages
            .AsNoTracking()
            .Where(m => m.ClubId == clubId);

        // Apply "before" filter for pagination
        if (before.HasValue)
        {
            query = query.Where(m => m.SentAt < before.Value);
        }

        // Get total count for this club
        var totalCount = await _context.ClubChatMessages
            .AsNoTracking()
            .CountAsync(m => m.ClubId == clubId);

        // Get messages with pagination, ordered by newest first for limit, then reversed
        var messages = await query
            .OrderByDescending(m => m.SentAt)
            .Take(limit + 1) // Get one extra to check if there are more
            .Include(m => m.SenderUser)
            .Select(m => new ChatMessageResponse
            {
                ChatMessageId = m.ChatMessageId,
                ClubId = m.ClubId,
                SenderUserId = m.SenderUserId,
                SenderName = m.SenderUser.FullName,
                MessageContent = m.MessageContent,
                SentAt = m.SentAt
            })
            .ToListAsync();

        // Check if there are more messages
        var hasMore = messages.Count > limit;
        if (hasMore)
        {
            messages = messages.Take(limit).ToList();
        }

        // For pagination (when 'before' is specified), return in reverse-chronological order (newest first)
        // For initial load (no 'before'), return in chronological order (oldest first)
        if (!before.HasValue)
        {
            messages.Reverse();
        }

        var response = new ChatHistoryResponse
        {
            Messages = messages,
            HasMore = hasMore,
            TotalCount = totalCount,
            // Fix: OldestMessageTimestamp should be the oldest message, not first in the list
            OldestMessageTimestamp = !before.HasValue && messages.Any()
                ? messages.FirstOrDefault()?.SentAt  // For initial load, first message is oldest after reverse
                : messages.LastOrDefault()?.SentAt   // For pagination, last message is oldest
        };

        _logger.LogInformation("Retrieved {MessageCount} messages for club {ClubId}", messages.Count, clubId);
        return response;
    }

    /// <inheritdoc />
    public async Task<ChatMessageResponse> SendMessageAsync(int clubId, int currentUserId, SendMessageRequest request)
    {
        _logger.LogInformation("Sending chat message to club {ClubId} from user {UserId}", clubId, currentUserId);

        // Validate message content
        if (string.IsNullOrWhiteSpace(request.MessageContent))
        {
            throw new ArgumentException("Message content cannot be empty", nameof(request));
        }

        // Validate user has access to this club's chat
        if (!await HasChatAccessAsync(clubId, currentUserId))
        {
            throw new UnauthorizedAccessException("User does not have access to this club's chat");
        }

        // Check if chat is enabled for this club
        if (!await IsChatEnabledAsync(clubId))
        {
            throw new InvalidOperationException("Chat is not enabled for this club");
        }

        // Check if club has required subscription tier for chat
        if (!await HasRequiredSubscriptionTierAsync(clubId))
        {
            throw new InvalidOperationException("Chat feature requires a Grow tier subscription");
        }

        // Get the sender's information
        var sender = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == currentUserId);

        if (sender == null)
        {
            throw new InvalidOperationException("Sender user not found");
        }

        // Create the chat message
        var chatMessage = new Domain.Entities.ClubChatMessage
        {
            ClubId = clubId,
            SenderUserId = currentUserId,
            MessageContent = request.MessageContent.Trim(),
            SentAt = DateTime.UtcNow
        };

        _context.ClubChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Chat message {MessageId} sent to club {ClubId}", chatMessage.ChatMessageId, clubId);

        // Create the response message
        var sentMessage = new ChatMessageResponse
        {
            ChatMessageId = chatMessage.ChatMessageId,
            ClubId = chatMessage.ClubId,
            SenderUserId = chatMessage.SenderUserId,
            SenderName = sender.FullName,
            MessageContent = chatMessage.MessageContent,
            SentAt = chatMessage.SentAt
        };

        // Broadcast the new message to all connected users in the club chat
        try
        {
            await _chatBroadcastService.BroadcastMessageToClubAsync(clubId, sentMessage);
            _logger.LogInformation("Broadcasted new message {MessageId} to club {ClubId} chat group", chatMessage.ChatMessageId, clubId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast message {MessageId} to club {ClubId} chat group", chatMessage.ChatMessageId, clubId);
            // Don't throw - message was saved successfully, broadcast failure is not critical
        }

        return sentMessage;
    }

    /// <inheritdoc />
    public async Task<bool> IsChatEnabledAsync(int clubId)
    {
        var club = await _context.Clubs
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == clubId);

        return club?.IsChatEnabled ?? false;
    }

    /// <inheritdoc />
    public async Task<bool> HasChatAccessAsync(int clubId, int currentUserId)
    {
        // User has access if they are either:
        // 1. An admin of the club, OR
        // 2. A member of the club

        // Check if user is admin
        var isAdmin = await _context.ClubAdmins
            .AsNoTracking()
            .AnyAsync(ca => ca.ClubId == clubId && ca.UserId == currentUserId);

        if (isAdmin)
        {
            return true;
        }

        // Check if user is a member (via User -> Member relationship for member users)
        var isMember = await _context.Members
            .AsNoTracking()
            .AnyAsync(m => m.ClubId == clubId &&
                          m.Status == "Active" &&
                          m.Email == _context.Users
                              .Where(u => u.Id == currentUserId)
                              .Select(u => u.Email)
                              .FirstOrDefault());

        return isMember;
    }

    /// <summary>
    /// Checks if the club has the required subscription tier for chat functionality
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <returns>True if club has Grow tier subscription, false otherwise</returns>
    private async Task<bool> HasRequiredSubscriptionTierAsync(int clubId)
    {
        var club = await _context.Clubs
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == clubId);

        return club?.Tier == "Grow";
    }
}