using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using FluentAssertions;
using GatherGrove.API.Hubs;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Hubs;

[TestFixture]
public class EventEngagementHubTests
{
    private Mock<ILogger<EventEngagementHub>> _mockLogger;
    private Mock<IMemberEngagementService> _mockMemberEngagementService;
    private Mock<IClientProxy> _mockClientProxy;
    private Mock<ISingleClientProxy> _mockSingleClientProxy;
    private Mock<IGroupManager> _mockGroupManager;
    private Mock<IHubCallerClients> _mockClients;
    private Mock<HubCallerContext> _mockContext;
    private GatherGroveDbContext _context;
    private EventEngagementHub _hub;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<EventEngagementHub>>();
        _mockMemberEngagementService = new Mock<IMemberEngagementService>();
        _mockClientProxy = new Mock<IClientProxy>();
        _mockSingleClientProxy = new Mock<ISingleClientProxy>();
        _mockGroupManager = new Mock<IGroupManager>();
        _mockClients = new Mock<IHubCallerClients>();
        _mockContext = new Mock<HubCallerContext>();

        // Setup in-memory database
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new GatherGroveDbContext(options);

        // Setup default claims (user ID 123, club ID 1)
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "123"),
            new Claim("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _mockContext.SetupGet(c => c.User).Returns(principal);
        _mockContext.SetupGet(c => c.UserIdentifier).Returns("123");
        _mockContext.SetupGet(c => c.ConnectionId).Returns("test-connection-id");

        _mockClients.Setup(c => c.Caller).Returns(_mockSingleClientProxy.Object);
        _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);

        _hub = new EventEngagementHub(_context, _mockLogger.Object, _mockMemberEngagementService.Object)
        {
            Context = _mockContext.Object,
            Clients = _mockClients.Object,
            Groups = _mockGroupManager.Object
        };

        // Seed test data
        SeedTestData();
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
        _hub?.Dispose();
    }

    private void SeedTestData()
    {
        var club = new Club { Id = 1, Name = "Test Club" };
        var event1 = new Event { Id = 1, ClubId = 1, Name = "Test Event", EventDateTime = DateTime.UtcNow.AddDays(7) };
        var event2 = new Event { Id = 2, ClubId = 2, Name = "Other Club Event", EventDateTime = DateTime.UtcNow.AddDays(7) };
        var member = new Member { Id = 1, ClubId = 1, FirstName = "Test", LastName = "Member", Email = "test@example.com", Status = "Active" };
        var otherMember = new Member { Id = 2, ClubId = 2, FirstName = "Other", LastName = "Member", Email = "other@example.com", Status = "Active" };

        _context.Clubs.Add(club);
        _context.Events.AddRange(event1, event2);
        _context.Members.AddRange(member, otherMember);
        _context.SaveChanges();
    }

    #region JoinEventEngagementGroup Tests

    [Test]
    public async Task JoinEventEngagementGroup_ValidUserAndEvent_AddsToGroup()
    {
        // Arrange
        var eventId = 1;

        // Act
        await _hub.JoinEventEngagementGroup(eventId);

        // Assert
        _mockGroupManager.Verify(g => g.AddToGroupAsync("test-connection-id", "Event_1_Engagement", default), Times.Once);
    }

    [Test]
    public async Task JoinEventEngagementGroup_ValidUserAndEvent_SendsEngagementSummary()
    {
        // Arrange
        var eventId = 1;

        // Act
        await _hub.JoinEventEngagementGroup(eventId);

        // Assert
        _mockSingleClientProxy.Verify(c => c.SendCoreAsync(
            "EventEngagementSummary",
            It.Is<object[]>(args => args.Length == 1),
            default), Times.Once);
    }

    [Test]
    public async Task JoinEventEngagementGroup_UserWithoutClubMembership_DoesNotAddToGroup()
    {
        // Arrange
        var eventId = 1;
        var claimsWithoutClub = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "999") };
        var identity = new ClaimsIdentity(claimsWithoutClub, "TestAuth");
        _mockContext.SetupGet(c => c.User).Returns(new ClaimsPrincipal(identity));

        // Act
        await _hub.JoinEventEngagementGroup(eventId);

        // Assert
        _mockGroupManager.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Test]
    public async Task JoinEventEngagementGroup_UserWithoutClubMembership_LogsWarning()
    {
        // Arrange
        var eventId = 1;
        var claimsWithoutClub = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "999") };
        var identity = new ClaimsIdentity(claimsWithoutClub, "TestAuth");
        _mockContext.SetupGet(c => c.User).Returns(new ClaimsPrincipal(identity));
        _mockContext.SetupGet(c => c.UserIdentifier).Returns("999");

        // Act
        await _hub.JoinEventEngagementGroup(eventId);

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("without valid club membership")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task JoinEventEngagementGroup_UserWithoutEventAccess_DoesNotAddToGroup()
    {
        // Arrange
        var eventId = 2; // Event from club 2, user is in club 1

        // Act
        await _hub.JoinEventEngagementGroup(eventId);

        // Assert
        _mockGroupManager.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Test]
    public async Task JoinEventEngagementGroup_UserWithoutEventAccess_LogsWarning()
    {
        // Arrange
        var eventId = 2; // Event from club 2, user is in club 1

        // Act
        await _hub.JoinEventEngagementGroup(eventId);

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("without access")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task JoinEventEngagementGroup_SuccessfulJoin_LogsInformation()
    {
        // Arrange
        var eventId = 1;

        // Act
        await _hub.JoinEventEngagementGroup(eventId);

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("joined event engagement group")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task JoinEventEngagementGroup_EngagementSummary_ContainsEventDetails()
    {
        // Arrange
        var eventId = 1;
        object? capturedSummary = null;
        _mockSingleClientProxy
            .Setup(c => c.SendCoreAsync("EventEngagementSummary", It.IsAny<object[]>(), default))
            .Callback<string, object[], CancellationToken>((method, args, token) => capturedSummary = args[0]);

        // Act
        await _hub.JoinEventEngagementGroup(eventId);

        // Assert
        capturedSummary.Should().NotBeNull();
        var summaryType = capturedSummary!.GetType();
        summaryType.GetProperty("EventId")?.GetValue(capturedSummary).Should().Be(1);
        summaryType.GetProperty("EventName")?.GetValue(capturedSummary).Should().Be("Test Event");
    }

    [Test]
    public async Task JoinEventEngagementGroup_EngagementSummary_CalculatesAttendanceRate()
    {
        // Arrange
        var eventId = 1;
        // Add RSVPs and attendances
        _context.EventRsvps.Add(new EventRsvp { EventId = 1, MemberId = 1 });
        _context.EventRsvps.Add(new EventRsvp { EventId = 1, MemberId = 2 });
        _context.EventAttendances.Add(new EventAttendance { EventId = 1, MemberId = 1, CheckInTime = DateTime.UtcNow });
        _context.SaveChanges();

        object? capturedSummary = null;
        _mockSingleClientProxy
            .Setup(c => c.SendCoreAsync("EventEngagementSummary", It.IsAny<object[]>(), default))
            .Callback<string, object[], CancellationToken>((method, args, token) => capturedSummary = args[0]);

        // Act
        await _hub.JoinEventEngagementGroup(eventId);

        // Assert
        var summaryType = capturedSummary!.GetType();
        summaryType.GetProperty("TotalRsvps")?.GetValue(capturedSummary).Should().Be(2);
        summaryType.GetProperty("TotalAttendances")?.GetValue(capturedSummary).Should().Be(1);
        summaryType.GetProperty("AttendanceRate")?.GetValue(capturedSummary).Should().Be(50.00m);
    }

    [Test]
    public async Task JoinEventEngagementGroup_NoRsvps_ReturnsZeroAttendanceRate()
    {
        // Arrange
        var eventId = 1;
        object? capturedSummary = null;
        _mockSingleClientProxy
            .Setup(c => c.SendCoreAsync("EventEngagementSummary", It.IsAny<object[]>(), default))
            .Callback<string, object[], CancellationToken>((method, args, token) => capturedSummary = args[0]);

        // Act
        await _hub.JoinEventEngagementGroup(eventId);

        // Assert
        var summaryType = capturedSummary!.GetType();
        summaryType.GetProperty("AttendanceRate")?.GetValue(capturedSummary).Should().Be(0m);
    }

    [Test]
    public async Task JoinEventEngagementGroup_NegativeEventId_HandlesGracefully()
    {
        // Arrange
        var eventId = -1;

        // Act & Assert
        await _hub.JoinEventEngagementGroup(eventId);
        _mockGroupManager.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    #endregion

    #region LeaveEventEngagementGroup Tests

    [Test]
    public async Task LeaveEventEngagementGroup_ValidEventId_RemovesFromGroup()
    {
        // Arrange
        var eventId = 1;

        // Act
        await _hub.LeaveEventEngagementGroup(eventId);

        // Assert
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync("test-connection-id", "Event_1_Engagement", default), Times.Once);
    }

    [Test]
    public async Task LeaveEventEngagementGroup_ValidEventId_LogsInformation()
    {
        // Arrange
        var eventId = 1;

        // Act
        await _hub.LeaveEventEngagementGroup(eventId);

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("left event engagement group")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task LeaveEventEngagementGroup_GroupManagerThrowsException_LogsError()
    {
        // Arrange
        var eventId = 1;
        _mockGroupManager
            .Setup(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default))
            .ThrowsAsync(new Exception("Test exception"));

        // Act
        await _hub.LeaveEventEngagementGroup(eventId);

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error leaving event engagement group")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task LeaveEventEngagementGroup_Idempotent_CanCallMultipleTimes()
    {
        // Arrange
        var eventId = 1;

        // Act
        await _hub.LeaveEventEngagementGroup(eventId);
        await _hub.LeaveEventEngagementGroup(eventId);

        // Assert
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync("test-connection-id", "Event_1_Engagement", default), Times.Exactly(2));
    }

    [Test]
    public async Task LeaveEventEngagementGroup_NegativeEventId_StillAttempts()
    {
        // Arrange
        var eventId = -1;

        // Act
        await _hub.LeaveEventEngagementGroup(eventId);

        // Assert (negative IDs are allowed, group removal is attempted)
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Once);
    }

    [Test]
    public async Task LeaveEventEngagementGroup_CorrectGroupNameFormat()
    {
        // Arrange
        var eventId = 42;

        // Act
        await _hub.LeaveEventEngagementGroup(eventId);

        // Assert
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync("test-connection-id", "Event_42_Engagement", default), Times.Once);
    }

    #endregion

    #region JoinClubEngagementGroup Tests

    [Test]
    public async Task JoinClubEngagementGroup_ValidUser_AddsToGroup()
    {
        // Act
        await _hub.JoinClubEngagementGroup();

        // Assert
        _mockGroupManager.Verify(g => g.AddToGroupAsync("test-connection-id", "Club_1_EventEngagement", default), Times.Once);
    }

    [Test]
    public async Task JoinClubEngagementGroup_ValidUser_SendsClubOverview()
    {
        // Act
        await _hub.JoinClubEngagementGroup();

        // Assert
        _mockSingleClientProxy.Verify(c => c.SendCoreAsync(
            "ClubEngagementOverview",
            It.Is<object[]>(args => args.Length == 1),
            default), Times.Once);
    }

    [Test]
    public async Task JoinClubEngagementGroup_UserWithoutClubMembership_DoesNotAddToGroup()
    {
        // Arrange
        var claimsWithoutClub = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "999") };
        var identity = new ClaimsIdentity(claimsWithoutClub, "TestAuth");
        _mockContext.SetupGet(c => c.User).Returns(new ClaimsPrincipal(identity));

        // Act
        await _hub.JoinClubEngagementGroup();

        // Assert
        _mockGroupManager.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Test]
    public async Task JoinClubEngagementGroup_UserWithoutClubMembership_LogsWarning()
    {
        // Arrange
        var claimsWithoutClub = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "999") };
        var identity = new ClaimsIdentity(claimsWithoutClub, "TestAuth");
        _mockContext.SetupGet(c => c.User).Returns(new ClaimsPrincipal(identity));
        _mockContext.SetupGet(c => c.UserIdentifier).Returns("999");

        // Act
        await _hub.JoinClubEngagementGroup();

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("without valid club membership")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task JoinClubEngagementGroup_SuccessfulJoin_LogsInformation()
    {
        // Act
        await _hub.JoinClubEngagementGroup();

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("joined club engagement group")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task JoinClubEngagementGroup_ClubOverview_ContainsClubDetails()
    {
        // Arrange
        object? capturedOverview = null;
        _mockSingleClientProxy
            .Setup(c => c.SendCoreAsync("ClubEngagementOverview", It.IsAny<object[]>(), default))
            .Callback<string, object[], CancellationToken>((method, args, token) => capturedOverview = args[0]);

        // Act
        await _hub.JoinClubEngagementGroup();

        // Assert
        capturedOverview.Should().NotBeNull();
        var overviewType = capturedOverview!.GetType();
        overviewType.GetProperty("ClubId")?.GetValue(capturedOverview).Should().Be(1);
        overviewType.GetProperty("ClubName")?.GetValue(capturedOverview).Should().Be("Test Club");
    }

    [Test]
    public async Task JoinClubEngagementGroup_ClubOverview_CalculatesAverageAttendanceRate()
    {
        // Arrange
        _context.EventRsvps.Add(new EventRsvp { EventId = 1, MemberId = 1 });
        _context.EventRsvps.Add(new EventRsvp { EventId = 1, MemberId = 2 });
        _context.EventAttendances.Add(new EventAttendance { EventId = 1, MemberId = 1, CheckInTime = DateTime.UtcNow });
        _context.SaveChanges();

        object? capturedOverview = null;
        _mockSingleClientProxy
            .Setup(c => c.SendCoreAsync("ClubEngagementOverview", It.IsAny<object[]>(), default))
            .Callback<string, object[], CancellationToken>((method, args, token) => capturedOverview = args[0]);

        // Act
        await _hub.JoinClubEngagementGroup();

        // Assert
        var overviewType = capturedOverview!.GetType();
        overviewType.GetProperty("TotalRsvps")?.GetValue(capturedOverview).Should().Be(2);
        overviewType.GetProperty("TotalAttendances")?.GetValue(capturedOverview).Should().Be(1);
        overviewType.GetProperty("AverageAttendanceRate")?.GetValue(capturedOverview).Should().Be(50.00m);
    }

    [Test]
    public async Task JoinClubEngagementGroup_NoRsvps_ReturnsZeroAttendanceRate()
    {
        // Arrange
        object? capturedOverview = null;
        _mockSingleClientProxy
            .Setup(c => c.SendCoreAsync("ClubEngagementOverview", It.IsAny<object[]>(), default))
            .Callback<string, object[], CancellationToken>((method, args, token) => capturedOverview = args[0]);

        // Act
        await _hub.JoinClubEngagementGroup();

        // Assert
        var overviewType = capturedOverview!.GetType();
        overviewType.GetProperty("AverageAttendanceRate")?.GetValue(capturedOverview).Should().Be(0m);
    }

    [Test]
    public async Task JoinClubEngagementGroup_UserIsClubAdmin_UsesClubAdminRelationship()
    {
        // Arrange
        var claimsWithoutClubId = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "123")
            // No ClubId claim
        };
        var identity = new ClaimsIdentity(claimsWithoutClubId, "TestAuth");
        _mockContext.SetupGet(c => c.User).Returns(new ClaimsPrincipal(identity));

        // Add ClubAdmin relationship
        _context.ClubAdmins.Add(new ClubAdmin { UserId = 123, ClubId = 1 });
        _context.SaveChanges();

        // Act
        await _hub.JoinClubEngagementGroup();

        // Assert
        _mockGroupManager.Verify(g => g.AddToGroupAsync("test-connection-id", "Club_1_EventEngagement", default), Times.Once);
    }

    #endregion

    #region LeaveClubEngagementGroup Tests

    [Test]
    public async Task LeaveClubEngagementGroup_ValidUser_RemovesFromGroup()
    {
        // Act
        await _hub.LeaveClubEngagementGroup();

        // Assert
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync("test-connection-id", "Club_1_EventEngagement", default), Times.Once);
    }

    [Test]
    public async Task LeaveClubEngagementGroup_ValidUser_LogsInformation()
    {
        // Act
        await _hub.LeaveClubEngagementGroup();

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("left club engagement group")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task LeaveClubEngagementGroup_UserWithoutClubId_ReturnsEarly()
    {
        // Arrange
        var claimsWithoutClub = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "999") };
        var identity = new ClaimsIdentity(claimsWithoutClub, "TestAuth");
        _mockContext.SetupGet(c => c.User).Returns(new ClaimsPrincipal(identity));

        // Act
        await _hub.LeaveClubEngagementGroup();

        // Assert
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Test]
    public async Task LeaveClubEngagementGroup_GroupManagerThrowsException_LogsError()
    {
        // Arrange
        _mockGroupManager
            .Setup(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default))
            .ThrowsAsync(new Exception("Test exception"));

        // Act
        await _hub.LeaveClubEngagementGroup();

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error leaving club engagement group")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task LeaveClubEngagementGroup_Idempotent_CanCallMultipleTimes()
    {
        // Act
        await _hub.LeaveClubEngagementGroup();
        await _hub.LeaveClubEngagementGroup();

        // Assert
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync("test-connection-id", "Club_1_EventEngagement", default), Times.Exactly(2));
    }

    [Test]
    public async Task LeaveClubEngagementGroup_CorrectGroupNameFormat()
    {
        // Act
        await _hub.LeaveClubEngagementGroup();

        // Assert
        _mockGroupManager.Verify(g => g.RemoveFromGroupAsync("test-connection-id", "Club_1_EventEngagement", default), Times.Once);
    }

    #endregion

    #region RequestEventRecommendations Tests

    [Test]
    public async Task RequestEventRecommendations_ValidMemberInUserClub_SendsProcessingStatus()
    {
        // Arrange
        var memberId = 1;

        // Act
        await _hub.RequestEventRecommendations(memberId);

        // Assert
        _mockSingleClientProxy.Verify(c => c.SendCoreAsync(
            "EventRecommendationsRequested",
            It.Is<object[]>(args => args.Length == 1),
            default), Times.Once);
    }

    [Test]
    public async Task RequestEventRecommendations_ValidMemberInUserClub_LogsInformation()
    {
        // Arrange
        var memberId = 1;

        // Act
        await _hub.RequestEventRecommendations(memberId);

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("requested event recommendations")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task RequestEventRecommendations_UserWithoutClubMembership_SendsError()
    {
        // Arrange
        var memberId = 1;
        var claimsWithoutClub = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "999") };
        var identity = new ClaimsIdentity(claimsWithoutClub, "TestAuth");
        _mockContext.SetupGet(c => c.User).Returns(new ClaimsPrincipal(identity));

        // Act
        await _hub.RequestEventRecommendations(memberId);

        // Assert
        _mockSingleClientProxy.Verify(c => c.SendCoreAsync(
            "Error",
            It.Is<object[]>(args => args[0].ToString() == "Invalid club membership"),
            default), Times.Once);
    }

    [Test]
    public async Task RequestEventRecommendations_MemberNotFound_SendsError()
    {
        // Arrange
        var memberId = 999; // Non-existent member

        // Act
        await _hub.RequestEventRecommendations(memberId);

        // Assert
        _mockSingleClientProxy.Verify(c => c.SendCoreAsync(
            "Error",
            It.Is<object[]>(args => args[0].ToString() == "Member not found or access denied"),
            default), Times.Once);
    }

    [Test]
    public async Task RequestEventRecommendations_MemberInDifferentClub_SendsError()
    {
        // Arrange
        var memberId = 2; // Member in club 2, user is in club 1

        // Act
        await _hub.RequestEventRecommendations(memberId);

        // Assert
        _mockSingleClientProxy.Verify(c => c.SendCoreAsync(
            "Error",
            It.Is<object[]>(args => args[0].ToString() == "Member not found or access denied"),
            default), Times.Once);
    }

    [Test]
    public async Task RequestEventRecommendations_ProcessingStatus_ContainsMemberId()
    {
        // Arrange
        var memberId = 1;
        object? capturedStatus = null;
        _mockSingleClientProxy
            .Setup(c => c.SendCoreAsync("EventRecommendationsRequested", It.IsAny<object[]>(), default))
            .Callback<string, object[], CancellationToken>((method, args, token) => capturedStatus = args[0]);

        // Act
        await _hub.RequestEventRecommendations(memberId);

        // Assert
        capturedStatus.Should().NotBeNull();
        var statusType = capturedStatus!.GetType();
        statusType.GetProperty("MemberId")?.GetValue(capturedStatus).Should().Be(1);
        statusType.GetProperty("Status")?.GetValue(capturedStatus).Should().Be("Processing");
    }

    [Test]
    public async Task RequestEventRecommendations_NegativeMemberId_SendsError()
    {
        // Arrange
        var memberId = -1;

        // Act
        await _hub.RequestEventRecommendations(memberId);

        // Assert
        _mockSingleClientProxy.Verify(c => c.SendCoreAsync(
            "Error",
            It.Is<object[]>(args => args[0].ToString() == "Member not found or access denied"),
            default), Times.Once);
    }

    #endregion

    #region Connection Lifecycle Tests

    [Test]
    public async Task OnConnectedAsync_ValidUser_LogsConnectionInfo()
    {
        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("connected to Event Engagement Hub")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task OnConnectedAsync_UserWithoutClubId_LogsConnectionWithNullClub()
    {
        // Arrange
        var claimsWithoutClub = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "123") };
        var identity = new ClaimsIdentity(claimsWithoutClub, "TestAuth");
        _mockContext.SetupGet(c => c.User).Returns(new ClaimsPrincipal(identity));
        _mockContext.SetupGet(c => c.UserIdentifier).Returns("123");

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("connected to Event Engagement Hub")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task OnDisconnectedAsync_WithoutException_LogsInformation()
    {
        // Act
        await _hub.OnDisconnectedAsync(null);

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("disconnected from Event Engagement Hub")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task OnDisconnectedAsync_WithException_LogsError()
    {
        // Arrange
        var exception = new Exception("Test connection error");

        // Act
        await _hub.OnDisconnectedAsync(exception);

        // Assert
        _mockLogger.Verify(
            l => l.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("disconnected from Event Engagement Hub with error")),
                exception,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion
}
