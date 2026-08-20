using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services.Chat;
using GatherGrove.Application.DTOs.Chat;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class ChatServiceTests
{
    private ChatService _chatService;
    private GatherGroveDbContext _context;
    private Mock<ILogger<ChatService>> _mockLogger;
    private Mock<IChatBroadcastService> _mockChatBroadcastService;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<ChatService>>();
        _mockChatBroadcastService = new Mock<IChatBroadcastService>();
        _chatService = new ChatService(_context, _mockLogger.Object, _mockChatBroadcastService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(User user, Club club, Member member, MembershipType membershipType)> CreateTestUserClubAndMember()
    {
        var user = new User
        {
            FullName = "Test Member",
            Email = "member@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            IsChatEnabled = true
        };

        var membershipType = new MembershipType
        {
            Name = "Standard",
            ClubId = club.Id,
            Description = "Standard membership",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member = new Member
        {
            Club = club,
            MembershipType = membershipType,
            FullName = "Test Member",
            Email = "member@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        _context.MembershipTypes.Add(membershipType);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        return (user, club, member, membershipType);
    }

    private async Task<ClubChatMessage> CreateTestMessage(Club club, User user, string content = "Test message")
    {
        var message = new ClubChatMessage
        {
            ClubId = club.Id,
            SenderUserId = user.Id,
            MessageContent = content,
            SentAt = DateTime.UtcNow
        };

        _context.ClubChatMessages.Add(message);
        await _context.SaveChangesAsync();

        return message;
    }

    #region GetChatHistoryAsync Tests

    [Test]
    public async Task GetChatHistoryAsync_WithValidMember_ReturnsHistory()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        var message = await CreateTestMessage(club, user);

        // Act
        var result = await _chatService.GetChatHistoryAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Messages, Has.Count.EqualTo(1));
        Assert.That(result.Messages[0].MessageContent, Is.EqualTo("Test message"));
        Assert.That(result.Messages[0].SenderName, Is.EqualTo("Test Member"));
        Assert.That(result.HasMore, Is.False);
    }

    [Test]
    public async Task GetChatHistoryAsync_WithUnauthorizedUser_ThrowsUnauthorized()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        var unauthorizedUser = new User
        {
            FullName = "Unauthorized",
            Email = "unauthorized@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(unauthorizedUser);
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _chatService.GetChatHistoryAsync(club.Id, unauthorizedUser.Id));

        Assert.That(exception.Message, Does.Contain("does not have access"));
    }

    [Test]
    public async Task GetChatHistoryAsync_WithChatDisabled_ThrowsInvalidOperation()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        club.IsChatEnabled = false;
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _chatService.GetChatHistoryAsync(club.Id, user.Id));

        Assert.That(exception.Message, Does.Contain("Chat is not enabled"));
    }

    [Test]
    public async Task GetChatHistoryAsync_WithPagination_ReturnsCorrectMessages()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();

        // Create multiple messages with different timestamps
        var baseTime = DateTime.UtcNow.AddHours(-2);
        var message1 = new ClubChatMessage
        {
            ClubId = club.Id,
            SenderUserId = user.Id,
            MessageContent = "First message",
            SentAt = baseTime
        };
        var message2 = new ClubChatMessage
        {
            ClubId = club.Id,
            SenderUserId = user.Id,
            MessageContent = "Second message",
            SentAt = baseTime.AddMinutes(30)
        };
        var message3 = new ClubChatMessage
        {
            ClubId = club.Id,
            SenderUserId = user.Id,
            MessageContent = "Third message",
            SentAt = baseTime.AddMinutes(60)
        };

        _context.ClubChatMessages.AddRange(message1, message2, message3);
        await _context.SaveChangesAsync();

        // Act - Get messages before the third message
        var result = await _chatService.GetChatHistoryAsync(club.Id, user.Id, message3.SentAt, 2);

        // Assert
        Assert.That(result.Messages, Has.Count.EqualTo(2));
        Assert.That(result.Messages[0].MessageContent, Is.EqualTo("Second message")); // Most recent first
        Assert.That(result.Messages[1].MessageContent, Is.EqualTo("First message"));
        Assert.That(result.HasMore, Is.False);
    }

    #endregion

    #region SendMessageAsync Tests

    [Test]
    public async Task SendMessageAsync_WithValidRequest_SendsAndBroadcasts()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        var request = new SendMessageRequest
        {
            MessageContent = "Hello from test!"
        };

        // Act
        var result = await _chatService.SendMessageAsync(club.Id, user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.MessageContent, Is.EqualTo("Hello from test!"));
        Assert.That(result.SenderName, Is.EqualTo("Test Member"));
        Assert.That(result.SentAt, Is.LessThanOrEqualTo(DateTime.UtcNow));

        // Verify message was saved to database
        var savedMessage = await _context.ClubChatMessages
            .FirstOrDefaultAsync(m => m.MessageContent == "Hello from test!");
        Assert.That(savedMessage, Is.Not.Null);
        Assert.That(savedMessage.ClubId, Is.EqualTo(club.Id));
        Assert.That(savedMessage.SenderUserId, Is.EqualTo(user.Id));

        // Verify real-time broadcast was called
        _mockChatBroadcastService.Verify(
            s => s.BroadcastMessageToClubAsync(club.Id, It.Is<ChatMessageResponse>(m =>
                m.MessageContent == "Hello from test!" &&
                m.SenderName == "Test Member")),
            Times.Once);
    }

    [Test]
    public async Task SendMessageAsync_WithEmptyMessage_ThrowsArgumentException()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        var request = new SendMessageRequest
        {
            MessageContent = ""
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _chatService.SendMessageAsync(club.Id, user.Id, request));

        Assert.That(exception.Message, Does.Contain("Message content cannot be empty"));
    }

    [Test]
    public async Task SendMessageAsync_WithUnauthorizedUser_ThrowsUnauthorized()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        var unauthorizedUser = new User
        {
            FullName = "Unauthorized",
            Email = "unauthorized@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(unauthorizedUser);
        await _context.SaveChangesAsync();

        var request = new SendMessageRequest
        {
            MessageContent = "Unauthorized message"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _chatService.SendMessageAsync(club.Id, unauthorizedUser.Id, request));

        Assert.That(exception.Message, Does.Contain("does not have access"));

        // Verify no broadcast was attempted
        _mockChatBroadcastService.Verify(
            s => s.BroadcastMessageToClubAsync(It.IsAny<int>(), It.IsAny<ChatMessageResponse>()),
            Times.Never);
    }

    [Test]
    public async Task SendMessageAsync_WithChatDisabled_ThrowsInvalidOperation()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        club.IsChatEnabled = false;
        await _context.SaveChangesAsync();

        var request = new SendMessageRequest
        {
            MessageContent = "Message when chat disabled"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _chatService.SendMessageAsync(club.Id, user.Id, request));

        Assert.That(exception.Message, Does.Contain("Chat is not enabled"));

        // Verify no broadcast was attempted
        _mockChatBroadcastService.Verify(
            s => s.BroadcastMessageToClubAsync(It.IsAny<int>(), It.IsAny<ChatMessageResponse>()),
            Times.Never);
    }

    [Test]
    public async Task SendMessageAsync_BroadcastFailure_DoesNotAffectMessageSaving()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        var request = new SendMessageRequest
        {
            MessageContent = "Test broadcast failure"
        };

        // Setup broadcast service to throw exception
        _mockChatBroadcastService
            .Setup(s => s.BroadcastMessageToClubAsync(It.IsAny<int>(), It.IsAny<ChatMessageResponse>()))
            .ThrowsAsync(new Exception("Broadcast failed"));

        // Act & Assert - Should not throw exception
        var result = await _chatService.SendMessageAsync(club.Id, user.Id, request);

        // Assert message was still saved
        Assert.That(result, Is.Not.Null);
        Assert.That(result.MessageContent, Is.EqualTo("Test broadcast failure"));

        var savedMessage = await _context.ClubChatMessages
            .FirstOrDefaultAsync(m => m.MessageContent == "Test broadcast failure");
        Assert.That(savedMessage, Is.Not.Null);

        // Verify broadcast was attempted
        _mockChatBroadcastService.Verify(
            s => s.BroadcastMessageToClubAsync(It.IsAny<int>(), It.IsAny<ChatMessageResponse>()),
            Times.Once);
    }

    #endregion

    #region IsChatEnabledAsync Tests

    [Test]
    public async Task IsChatEnabledAsync_WithChatEnabled_ReturnsTrue()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        club.IsChatEnabled = true;
        await _context.SaveChangesAsync();

        // Act
        var result = await _chatService.IsChatEnabledAsync(club.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task IsChatEnabledAsync_WithChatDisabled_ReturnsFalse()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        club.IsChatEnabled = false;
        await _context.SaveChangesAsync();

        // Act
        var result = await _chatService.IsChatEnabledAsync(club.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task IsChatEnabledAsync_WithNonExistentClub_ReturnsFalse()
    {
        // Arrange
        var nonExistentClubId = 999;

        // Act
        var result = await _chatService.IsChatEnabledAsync(nonExistentClubId);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region HasChatAccessAsync Tests

    [Test]
    public async Task HasChatAccessAsync_WithClubMember_ReturnsTrue()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();

        // Act
        var result = await _chatService.HasChatAccessAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasChatAccessAsync_WithClubAdmin_ReturnsTrue()
    {
        // Arrange
        var adminUser = new User
        {
            FullName = "Test Admin",
            Email = "admin@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            IsChatEnabled = true
        };

        var clubAdmin = new ClubAdmin
        {
            User = adminUser,
            Club = club
        };

        _context.Users.Add(adminUser);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        // Act
        var result = await _chatService.HasChatAccessAsync(club.Id, adminUser.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasChatAccessAsync_WithUnauthorizedUser_ReturnsFalse()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        var unauthorizedUser = new User
        {
            FullName = "Unauthorized",
            Email = "unauthorized@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(unauthorizedUser);
        await _context.SaveChangesAsync();

        // Act
        var result = await _chatService.HasChatAccessAsync(club.Id, unauthorizedUser.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasChatAccessAsync_WithInactiveMember_ReturnsFalse()
    {
        // Arrange
        var (user, club, member, membershipType) = await CreateTestUserClubAndMember();
        member.Status = "Inactive";
        await _context.SaveChangesAsync();

        // Act
        var result = await _chatService.HasChatAccessAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion
}