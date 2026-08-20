using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Hubs;
using GatherGrove.Application.Services.Chat;
using FluentAssertions;

namespace GatherGrove.API.Tests.Hubs;

/// <summary>
/// TDD Tests for Real-time Chat Hub
/// Tests real-time messaging, access control, and connection management
/// </summary>
[TestFixture]
public class ChatHubTests
{
    private Mock<IChatService> _mockChatService;
    private Mock<ILogger<ChatHub>> _mockLogger;
    private Mock<IClientProxy> _mockClientProxy;
    private Mock<ISingleClientProxy> _mockSingleClientProxy;
    private Mock<IGroupManager> _mockGroupManager;
    private Mock<IHubCallerClients> _mockClients;
    private Mock<HubCallerContext> _mockContext;
    private ChatHub _hub;

    [SetUp]
    public void Setup()
    {
        _mockChatService = new Mock<IChatService>();
        _mockLogger = new Mock<ILogger<ChatHub>>();
        _mockClientProxy = new Mock<IClientProxy>();
        _mockSingleClientProxy = new Mock<ISingleClientProxy>();
        _mockGroupManager = new Mock<IGroupManager>();
        _mockClients = new Mock<IHubCallerClients>();
        _mockContext = new Mock<HubCallerContext>();

        _hub = new ChatHub(_mockChatService.Object, _mockLogger.Object);

        // Setup Context with user claims
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "123"),
            new Claim(ClaimTypes.Name, "TestUser")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _mockContext.SetupGet(c => c.ConnectionId).Returns("test-connection-id");
        _mockContext.SetupGet(c => c.User).Returns(principal);
        _hub.Context = _mockContext.Object;

        // Setup Clients
        _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);
        _mockClients.SetupGet(c => c.Caller).Returns(_mockSingleClientProxy.Object);
        _hub.Clients = _mockClients.Object;

        _hub.Groups = _mockGroupManager.Object;
    }

    [TearDown]
    public void TearDown()
    {
        _hub?.Dispose();
    }

    #region JoinClubChat Tests

    [Test]
    public async Task JoinClubChat_ValidUserWithAccess_ShouldAddToGroup()
    {
        // Arrange
        var clubId = 1;
        var expectedGroupName = $"Club_{clubId}_Chat";

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 123))
            .ReturnsAsync(true);

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert
        _mockGroupManager.Verify(g => g.AddToGroupAsync("test-connection-id", expectedGroupName, default), Times.Once);
    }

    [Test]
    public async Task JoinClubChat_ValidUserWithAccess_ShouldNotifyCallerOfSuccess()
    {
        // Arrange
        var clubId = 1;

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 123))
            .ReturnsAsync(true);

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert - Caller should receive JoinedClubChat notification
        _mockSingleClientProxy.Verify(
            c => c.SendCoreAsync("JoinedClubChat", It.Is<object[]>(o => o.Length == 1 && (int)o[0] == clubId), default),
            Times.Once);
    }

    [Test]
    public async Task JoinClubChat_UserWithoutAccess_ShouldNotAddToGroup()
    {
        // Arrange
        var clubId = 1;

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 123))
            .ReturnsAsync(false);

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert - User should NOT be added to group
        _mockGroupManager.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Test]
    public async Task JoinClubChat_UserWithoutAccess_ShouldSendAccessDenied()
    {
        // Arrange
        var clubId = 1;

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 123))
            .ReturnsAsync(false);

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert - Caller should receive AccessDenied notification
        _mockSingleClientProxy.Verify(
            c => c.SendCoreAsync("AccessDenied", It.Is<object[]>(o => o.Length > 0), default),
            Times.Once);
    }

    [Test]
    public async Task JoinClubChat_InvalidUserId_ShouldNotAddToGroup()
    {
        // Arrange
        var clubId = 1;

        // Setup context with no user claims
        _mockContext.SetupGet(c => c.User).Returns((ClaimsPrincipal)null!);

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert - Should not add to group or call chat service
        _mockGroupManager.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
        _mockChatService.Verify(s => s.HasChatAccessAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task JoinClubChat_InvalidUserId_ShouldLogWarning()
    {
        // Arrange
        var clubId = 1;
        _mockContext.SetupGet(c => c.User).Returns((ClaimsPrincipal)null!);

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert - Should log warning
        _mockLogger.Verify(
            l => l.Log(LogLevel.Warning, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task JoinClubChat_UnparseableUserId_ShouldNotAddToGroup()
    {
        // Arrange
        var clubId = 1;

        // Setup context with non-numeric user ID
        var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "not-a-number") };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _mockContext.SetupGet(c => c.User).Returns(principal);

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert
        _mockGroupManager.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Test]
    public async Task JoinClubChat_ServiceThrowsException_ShouldSendErrorToCaller()
    {
        // Arrange
        var clubId = 1;

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 123))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert - Should send Error notification to Caller
        _mockSingleClientProxy.Verify(
            c => c.SendCoreAsync("Error", It.Is<object[]>(o => o.Length > 0), default),
            Times.Once);
    }

    [Test]
    public async Task JoinClubChat_ServiceThrowsException_ShouldLogError()
    {
        // Arrange
        var clubId = 1;

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 123))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert - Should log error
        _mockLogger.Verify(
            l => l.Log(LogLevel.Error, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task JoinClubChat_SuccessfulJoin_ShouldLogInformation()
    {
        // Arrange
        var clubId = 1;

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 123))
            .ReturnsAsync(true);

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert - Should log Information level
        _mockLogger.Verify(
            l => l.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task JoinClubChat_DifferentClubs_ShouldUseDifferentGroups()
    {
        // Arrange
        var clubId1 = 1;
        var clubId2 = 2;

        _mockChatService.Setup(s => s.HasChatAccessAsync(It.IsAny<int>(), 123))
            .ReturnsAsync(true);

        // Act - Join two different clubs
        await _hub.JoinClubChat(clubId1);
        await _hub.JoinClubChat(clubId2);

        // Assert - Should use different group names
        _mockGroupManager.Verify(g => g.AddToGroupAsync("test-connection-id", $"Club_{clubId1}_Chat", default), Times.Once);
        _mockGroupManager.Verify(g => g.AddToGroupAsync("test-connection-id", $"Club_{clubId2}_Chat", default), Times.Once);
    }

    #endregion

    #region LeaveClubChat Tests

    [Test]
    public async Task LeaveClubChat_ValidUser_ShouldRemoveFromGroup()
    {
        // Arrange
        var clubId = 1;
        var expectedGroupName = $"Club_{clubId}_Chat";

        // Act
        await _hub.LeaveClubChat(clubId);

        // Assert
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync("test-connection-id", expectedGroupName, default), Times.Once);
    }

    [Test]
    public async Task LeaveClubChat_ValidUser_ShouldNotifyCallerOfSuccess()
    {
        // Arrange
        var clubId = 1;

        // Act
        await _hub.LeaveClubChat(clubId);

        // Assert - Caller should receive LeftClubChat notification
        _mockSingleClientProxy.Verify(
            c => c.SendCoreAsync("LeftClubChat", It.Is<object[]>(o => o.Length == 1 && (int)o[0] == clubId), default),
            Times.Once);
    }

    [Test]
    public async Task LeaveClubChat_InvalidUserId_ShouldNotRemoveFromGroup()
    {
        // Arrange
        var clubId = 1;
        _mockContext.SetupGet(c => c.User).Returns((ClaimsPrincipal)null!);

        // Act
        await _hub.LeaveClubChat(clubId);

        // Assert - Should not remove from group
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Test]
    public async Task LeaveClubChat_InvalidUserId_ShouldLogWarning()
    {
        // Arrange
        var clubId = 1;
        _mockContext.SetupGet(c => c.User).Returns((ClaimsPrincipal)null!);

        // Act
        await _hub.LeaveClubChat(clubId);

        // Assert
        _mockLogger.Verify(
            l => l.Log(LogLevel.Warning, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task LeaveClubChat_MultipleLeaves_ShouldBeIdempotent()
    {
        // Arrange
        var clubId = 1;
        var expectedGroupName = $"Club_{clubId}_Chat";

        // Act - Leave twice
        await _hub.LeaveClubChat(clubId);
        await _hub.LeaveClubChat(clubId);

        // Assert - Both calls should succeed (SignalR handles idempotency)
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync("test-connection-id", expectedGroupName, default), Times.Exactly(2));
    }

    [Test]
    public async Task LeaveClubChat_ServiceThrowsException_ShouldLogError()
    {
        // Arrange
        var clubId = 1;

        _mockGroupManager.Setup(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default))
            .ThrowsAsync(new Exception("Group removal failed"));

        // Act
        await _hub.LeaveClubChat(clubId);

        // Assert - Should log error
        _mockLogger.Verify(
            l => l.Log(LogLevel.Error, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task LeaveClubChat_SuccessfulLeave_ShouldLogInformation()
    {
        // Arrange
        var clubId = 1;

        // Act
        await _hub.LeaveClubChat(clubId);

        // Assert
        _mockLogger.Verify(
            l => l.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion

    #region Broadcast Surface Tests

    [Test]
    public void ChatHub_ShouldNotExposeClientCallableBroadcastMethod()
    {
        typeof(ChatHub).GetMethod("SendMessageToClub").Should().BeNull();
    }

    #endregion

    #region Connection Lifecycle Tests

    [Test]
    public async Task OnConnectedAsync_ValidUser_ShouldLogConnection()
    {
        // Act
        await _hub.OnConnectedAsync();

        // Assert - Should log Information level
        _mockLogger.Verify(
            l => l.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task OnConnectedAsync_InvalidUserId_ShouldNotLog()
    {
        // Arrange
        _mockContext.SetupGet(c => c.User).Returns((ClaimsPrincipal)null!);

        // Act
        await _hub.OnConnectedAsync();

        // Assert - Should not log (no valid user)
        _mockLogger.Verify(
            l => l.Log(It.IsAny<LogLevel>(), It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Never);
    }

    [Test]
    public async Task OnDisconnectedAsync_ValidUser_ShouldLogDisconnection()
    {
        // Act
        await _hub.OnDisconnectedAsync(null);

        // Assert
        _mockLogger.Verify(
            l => l.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task OnDisconnectedAsync_WithException_ShouldLogDisconnection()
    {
        // Arrange
        var exception = new Exception("Network error");

        // Act
        await _hub.OnDisconnectedAsync(exception);

        // Assert - Should still log
        _mockLogger.Verify(
            l => l.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task OnDisconnectedAsync_InvalidUserId_ShouldNotLog()
    {
        // Arrange
        _mockContext.SetupGet(c => c.User).Returns((ClaimsPrincipal)null!);

        // Act
        await _hub.OnDisconnectedAsync(null);

        // Assert
        _mockLogger.Verify(
            l => l.Log(It.IsAny<LogLevel>(), It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Never);
    }

    #endregion

    #region Group Isolation Tests

    [Test]
    public async Task JoinClubChat_MultipleUsers_ShouldIsolateByGroup()
    {
        // Arrange
        var clubId1 = 1;
        var clubId2 = 2;

        _mockChatService.Setup(s => s.HasChatAccessAsync(It.IsAny<int>(), 123))
            .ReturnsAsync(true);

        // Simulate two different connections
        _mockContext.SetupSequence(c => c.ConnectionId)
            .Returns("connection-1")
            .Returns("connection-2");

        // Act - Join different clubs
        await _hub.JoinClubChat(clubId1);
        await _hub.JoinClubChat(clubId2);

        // Assert - Each connection should join different groups
        _mockGroupManager.Verify(g => g.AddToGroupAsync("connection-1", $"Club_{clubId1}_Chat", default), Times.Once);
        _mockGroupManager.Verify(g => g.AddToGroupAsync("connection-2", $"Club_{clubId2}_Chat", default), Times.Once);
    }

    [Test]
    public async Task JoinClubChat_SameUserDifferentConnections_ShouldAllowMultipleMemberships()
    {
        // Arrange
        var clubId = 1;

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 123))
            .ReturnsAsync(true);

        // Simulate two different connections for same user
        var connection1 = "connection-1";
        var connection2 = "connection-2";

        _mockContext.SetupSequence(c => c.ConnectionId)
            .Returns(connection1)
            .Returns(connection2);

        // Act - Same user joins from two different connections
        await _hub.JoinClubChat(clubId);
        await _hub.JoinClubChat(clubId);

        // Assert - Both connections should be added
        _mockGroupManager.Verify(g => g.AddToGroupAsync(connection1, $"Club_{clubId}_Chat", default), Times.Once);
        _mockGroupManager.Verify(g => g.AddToGroupAsync(connection2, $"Club_{clubId}_Chat", default), Times.Once);
    }

    #endregion

    #region Access Control Tests

    [Test]
    public async Task JoinClubChat_UserNotMemberOfClub_ShouldDenyAccess()
    {
        // Arrange
        var clubId = 1;

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 123))
            .ReturnsAsync(false);

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert - Should send AccessDenied
        _mockSingleClientProxy.Verify(
            c => c.SendCoreAsync("AccessDenied", It.IsAny<object[]>(), default),
            Times.Once);

        // Should NOT add to group
        _mockGroupManager.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Test]
    public async Task JoinClubChat_ChatServiceChecksCalled_ShouldPassCorrectParameters()
    {
        // Arrange
        var clubId = 42;
        var userId = 123;

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert - Should call with correct parameters
        _mockChatService.Verify(s => s.HasChatAccessAsync(clubId, userId), Times.Once);
    }

    [Test]
    public async Task JoinClubChat_DifferentUsers_ShouldCheckAccessIndependently()
    {
        // Arrange
        var clubId = 1;

        // User 1 has access
        var claims1 = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "100") };
        var principal1 = new ClaimsPrincipal(new ClaimsIdentity(claims1, "TestAuth"));

        // User 2 doesn't have access
        var claims2 = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "200") };
        var principal2 = new ClaimsPrincipal(new ClaimsIdentity(claims2, "TestAuth"));

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 100)).ReturnsAsync(true);
        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 200)).ReturnsAsync(false);

        // Act - User 1 joins
        _mockContext.SetupGet(c => c.User).Returns(principal1);
        await _hub.JoinClubChat(clubId);

        // User 2 joins
        _mockContext.SetupGet(c => c.User).Returns(principal2);
        await _hub.JoinClubChat(clubId);

        // Assert - Both access checks should be called
        _mockChatService.Verify(s => s.HasChatAccessAsync(clubId, 100), Times.Once);
        _mockChatService.Verify(s => s.HasChatAccessAsync(clubId, 200), Times.Once);

        // Only user 1 should be added to group
        _mockGroupManager.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Once);
    }

    #endregion

    #region Edge Cases and Error Handling

    [Test]
    public async Task JoinClubChat_NegativeClubId_ShouldStillAttemptJoin()
    {
        // Arrange
        var clubId = -1;

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 123))
            .ReturnsAsync(false);

        // Act
        await _hub.JoinClubChat(clubId);

        // Assert - Should still check access (service will handle invalid ID)
        _mockChatService.Verify(s => s.HasChatAccessAsync(clubId, 123), Times.Once);
    }

    [Test]
    public async Task JoinClubChat_ZeroClubId_ShouldHandleGracefully()
    {
        // Arrange
        var clubId = 0;

        _mockChatService.Setup(s => s.HasChatAccessAsync(clubId, 123))
            .ReturnsAsync(false);

        // Act & Assert - Should not throw
        Assert.DoesNotThrowAsync(async () => await _hub.JoinClubChat(clubId));
    }

    [Test]
    public async Task LeaveClubChat_NotInGroup_ShouldStillAttemptRemoval()
    {
        // Arrange
        var clubId = 1;

        // Act - Leave without joining first
        await _hub.LeaveClubChat(clubId);

        // Assert - Should still try to remove (SignalR handles gracefully)
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Once);
    }

    #endregion
}
