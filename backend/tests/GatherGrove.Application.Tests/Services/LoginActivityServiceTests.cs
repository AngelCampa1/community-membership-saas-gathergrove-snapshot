using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

public class LoginActivityServiceTests
{
    private Mock<ILogger<LoginActivityService>> _loggerMock;
    private GatherGroveDbContext _context;
    private LoginActivityService _service;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _loggerMock = new Mock<ILogger<LoginActivityService>>();
        _service = new LoginActivityService(_context, _loggerMock.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    [Test]
    public async Task RecordLoginEventAsync_ShouldCreateAnalyticsSession_WhenSessionDoesNotExist()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var user = new User { Id = 1, Email = "test@example.com", FullName = "Test User" };
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "test@example.com",
            FullName = "Test User",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _context.Clubs.Add(club);
        _context.Users.Add(user);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var sessionId = Guid.NewGuid().ToString();

        // Act
        await _service.RecordLoginEventAsync(1, 1, 1, "web", "desktop", sessionId);

        // Assert
        var session = await _context.AnalyticsSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        Assert.That(session, Is.Not.Null);
        Assert.That(session.IsLoginSession, Is.True);
        Assert.That(session.IsSuccessfulLogin, Is.True);
        Assert.That(session.Platform, Is.EqualTo("web"));
        Assert.That(session.DeviceType, Is.EqualTo("desktop"));
        Assert.That(session.LoginMethod, Is.EqualTo("email"));

        var loginEvent = await _context.AnalyticsEvents
            .FirstOrDefaultAsync(e => e.EventType == "Login" && e.Action == "Login_Success");
        Assert.That(loginEvent, Is.Not.Null);
        Assert.That(loginEvent.SessionId, Is.EqualTo(sessionId));
    }

    [Test]
    public async Task GetClubLoginStatsAsync_ShouldReturnCorrectStats()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var members = new List<Member>
        {
            new() {
                Id = 1,
                ClubId = 1,
                Email = "member1@test.com",
                FullName = "Member 1",
                Status = "Active",
                MembershipTypeId = 1,
                JoinDate = DateTime.UtcNow.AddDays(-30),
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow.AddDays(-30)
            },
            new() {
                Id = 2,
                ClubId = 1,
                Email = "member2@test.com",
                FullName = "Member 2",
                Status = "Active",
                MembershipTypeId = 1,
                JoinDate = DateTime.UtcNow.AddDays(-30),
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow.AddDays(-30)
            }
        };

        _context.Clubs.Add(club);
        _context.Members.AddRange(members);

        // Add login events for the past 30 days
        var baseDate = DateTime.UtcNow.AddDays(-15);
        var loginEvents = new List<AnalyticsEvent>
        {
            new()
            {
                ClubId = 1,
                MemberId = 1,
                EventType = "Login",
                Action = "Login_Success",
                Category = "Authentication",
                Platform = "web",
                SessionId = "session1",
                CreatedAt = baseDate
            },
            new()
            {
                ClubId = 1,
                MemberId = 1,
                EventType = "Login",
                Action = "Login_Success",
                Category = "Authentication",
                Platform = "web",
                SessionId = "session2",
                CreatedAt = baseDate.AddDays(1)
            },
            new()
            {
                ClubId = 1,
                MemberId = 2,
                EventType = "Login",
                Action = "Login_Success",
                Category = "Authentication",
                Platform = "mobile",
                SessionId = "session3",
                CreatedAt = baseDate.AddDays(2)
            }
        };

        _context.AnalyticsEvents.AddRange(loginEvents);
        await _context.SaveChangesAsync();

        // Act
        var stats = await _service.GetClubLoginStatsAsync(1, 30);

        // Assert
        Assert.That(stats.ClubId, Is.EqualTo(1));
        Assert.That(stats.PeriodDays, Is.EqualTo(30));
        Assert.That(stats.TotalMembers, Is.EqualTo(2));
        Assert.That(stats.MembersWithLogins, Is.EqualTo(2));
        Assert.That(stats.TotalLogins, Is.EqualTo(3));
        Assert.That(stats.AverageLoginsPerMember, Is.EqualTo(1.5m));
    }

    [Test]
    public async Task GetMemberLoginActivityAsync_ShouldReturnMemberActivities()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "member1@test.com",
            FullName = "John Doe",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _context.Clubs.Add(club);
        _context.Members.Add(member);

        // Add recent login events
        var recentLogin = DateTime.UtcNow.AddDays(-2);
        var loginEvents = new List<AnalyticsEvent>
        {
            new()
            {
                ClubId = 1,
                MemberId = 1,
                EventType = "Login",
                Action = "Login_Success",
                Category = "Authentication",
                Platform = "web",
                SessionId = "session1",
                CreatedAt = recentLogin
            },
            new()
            {
                ClubId = 1,
                MemberId = 1,
                EventType = "Login",
                Action = "Login_Success",
                Category = "Authentication",
                Platform = "mobile",
                SessionId = "session2",
                CreatedAt = recentLogin.AddHours(2)
            }
        };

        _context.AnalyticsEvents.AddRange(loginEvents);
        await _context.SaveChangesAsync();

        // Act
        var activities = await _service.GetMemberLoginActivityAsync(1, 30);

        // Assert
        Assert.That(activities, Has.Count.EqualTo(1));
        var activity = activities.First();
        Assert.That(activity.MemberId, Is.EqualTo(1));
        Assert.That(activity.MemberName, Is.EqualTo("John Doe"));
        Assert.That(activity.Email, Is.EqualTo("member1@test.com"));
        Assert.That(activity.LoginCount, Is.EqualTo(2));
        Assert.That(activity.IsAtRisk, Is.False);
        Assert.Contains("web", activity.PlatformsUsed);
        Assert.Contains("mobile", activity.PlatformsUsed);
    }

    [Test]
    public async Task GetInactiveMembersAsync_ShouldReturnInactiveMembers()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var inactiveMember = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "inactive@test.com",
            FullName = "Inactive Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-60),
            CreatedAt = DateTime.UtcNow.AddDays(-60),
            UpdatedAt = DateTime.UtcNow.AddDays(-60)
        };
        var activeMember = new Member
        {
            Id = 2,
            ClubId = 1,
            Email = "active@test.com",
            FullName = "Active Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-60),
            CreatedAt = DateTime.UtcNow.AddDays(-60),
            UpdatedAt = DateTime.UtcNow.AddDays(-60)
        };

        _context.Clubs.Add(club);
        _context.Members.AddRange(inactiveMember, activeMember);

        // Add recent login for active member only
        var recentLogin = new AnalyticsEvent
        {
            ClubId = 1,
            MemberId = 2,
            EventType = "Login",
            Action = "Login_Success",
            Category = "Authentication",
            Platform = "web",
            SessionId = "session1",
            CreatedAt = DateTime.UtcNow.AddDays(-5)
        };

        _context.AnalyticsEvents.Add(recentLogin);
        await _context.SaveChangesAsync();

        // Act
        var inactiveMembers = await _service.GetInactiveMembersAsync(1, 30);

        // Assert
        Assert.That(inactiveMembers, Has.Count.EqualTo(1));
        var inactive = inactiveMembers.First();
        Assert.That(inactive.MemberId, Is.EqualTo(1));
        Assert.That(inactive.MemberName, Is.EqualTo("Inactive Member"));
        Assert.That(inactive.IsAtRisk, Is.True);
        Assert.That(inactive.ActivityLevel, Is.EqualTo("Inactive"));
    }

    [Test]
    public async Task UpdateLoginStreakAsync_ShouldCalculateStreakCorrectly()
    {
        // Arrange
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "member@test.com",
            FullName = "Test Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _context.Members.Add(member);

        // Add consecutive login events
        var today = DateTime.UtcNow.Date;
        var loginEvents = new List<AnalyticsEvent>();

        for (int i = 0; i < 5; i++)
        {
            loginEvents.Add(new AnalyticsEvent
            {
                MemberId = 1,
                EventType = "Login",
                Action = "Login_Success",
                Category = "Authentication",
                Platform = "web",
                SessionId = $"session{i}",
                CreatedAt = today.AddDays(-i)
            });
        }

        _context.AnalyticsEvents.AddRange(loginEvents);

        // Add engagement score record
        var engagementScore = new MemberEngagementScore
        {
            MemberId = 1,
            ClubId = 1,
            OverallScore = 50,
            CalculatedDate = today,
            CreatedAt = today,
            UpdatedAt = today
        };

        _context.MemberEngagementScores.Add(engagementScore);
        await _context.SaveChangesAsync();

        // Act
        await _service.UpdateLoginStreakAsync(1);

        // Assert
        var updatedScore = await _context.MemberEngagementScores
            .FirstOrDefaultAsync(s => s.MemberId == 1);

        Assert.That(updatedScore, Is.Not.Null);
        Assert.That(updatedScore.LoginStreakDays, Is.EqualTo(5));
        Assert.That(updatedScore.LastLoginDate, Is.Not.Null);
    }

    [Test]
    public async Task RecordFailedLoginAsync_ShouldCreateFailedLoginEvent()
    {
        // Act
        await _service.RecordFailedLoginAsync("test@example.com", "Invalid password", "web", "desktop");

        // Assert
        var failedEvent = await _context.AnalyticsEvents
            .FirstOrDefaultAsync(e => e.EventType == "Login" && e.Action == "Login_Failed");

        Assert.That(failedEvent, Is.Not.Null);
        Assert.That(failedEvent.Label, Is.EqualTo("Invalid password"));
        Assert.That(failedEvent.Platform, Is.EqualTo("web"));
        Assert.That(failedEvent.DeviceType, Is.EqualTo("desktop"));
        Assert.That(failedEvent.Properties ?? "", Does.Contain("test@example.com"));
    }

    #region RecordLoginEventAsync Extended Tests

    [Test]
    public async Task RecordLoginEventAsync_ShouldUpdateExistingSession_WhenSessionExists()
    {
        // Arrange
        var sessionId = Guid.NewGuid().ToString();
        var existingSession = new AnalyticsSession
        {
            Id = sessionId,
            UserId = 1,
            Platform = "web",
            StartedAt = DateTime.UtcNow.AddHours(-1),
            LastActivityAt = DateTime.UtcNow.AddHours(-1),
            IsLoginSession = false,
            IsSuccessfulLogin = false
        };

        _context.AnalyticsSessions.Add(existingSession);
        await _context.SaveChangesAsync();

        // Act
        await _service.RecordLoginEventAsync(1, null, null, "web", "desktop", sessionId);

        // Assert
        var session = await _context.AnalyticsSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        Assert.That(session, Is.Not.Null);
        Assert.That(session.IsLoginSession, Is.True);
        Assert.That(session.IsSuccessfulLogin, Is.True);
        Assert.That(session.LoginMethod, Is.EqualTo("email"));
        Assert.That(session.LastLoginAt, Is.Not.Null);
    }

    [Test]
    public async Task RecordLoginEventAsync_ShouldRecordLoginEvent_WithCorrectData()
    {
        // Arrange
        var sessionId = Guid.NewGuid().ToString();

        // Act
        await _service.RecordLoginEventAsync(5, 10, 20, "mobile", "ios", sessionId);

        // Assert
        var loginEvent = await _context.AnalyticsEvents
            .FirstOrDefaultAsync(e => e.EventType == "Login" && e.SessionId == sessionId);

        Assert.That(loginEvent, Is.Not.Null);
        Assert.That(loginEvent.UserId, Is.EqualTo(5));
        Assert.That(loginEvent.MemberId, Is.EqualTo(10));
        Assert.That(loginEvent.ClubId, Is.EqualTo(20));
        Assert.That(loginEvent.Platform, Is.EqualTo("mobile"));
        Assert.That(loginEvent.DeviceType, Is.EqualTo("ios"));
        Assert.That(loginEvent.Category, Is.EqualTo("Authentication"));
        Assert.That(loginEvent.Action, Is.EqualTo("Login_Success"));
    }

    [Test]
    public async Task RecordLoginEventAsync_ShouldHandleNullMemberId()
    {
        // Arrange
        var sessionId = Guid.NewGuid().ToString();

        // Act
        await _service.RecordLoginEventAsync(1, null, 1, "web", "desktop", sessionId);

        // Assert
        var session = await _context.AnalyticsSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        Assert.That(session, Is.Not.Null);
        Assert.That(session.MemberId, Is.Null);
    }

    #endregion

    #region GetLoginTrendsAsync Tests

    [Test]
    public async Task GetLoginTrendsAsync_ShouldReturnEmptyDaysWithZeroValues_WhenNoLogins()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act
        var trends = await _service.GetLoginTrendsAsync(1, 7);

        // Assert
        Assert.That(trends, Has.Count.EqualTo(7));
        Assert.That(trends.All(t => t.TotalLogins == 0), Is.True);
        Assert.That(trends.All(t => t.UniqueUsers == 0), Is.True);
    }

    [Test]
    public async Task GetLoginTrendsAsync_ShouldAggregateLoginsByDate()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        _context.Clubs.Add(club);

        // Use a date within the 7-day range (e.g., yesterday or 3 days ago)
        var loginDate = DateTime.UtcNow.AddDays(-3).Date;
        var loginEvents = new List<AnalyticsEvent>
        {
            new()
            {
                ClubId = 1,
                MemberId = 1,
                EventType = "Login",
                Action = "Login_Success",
                Category = "Authentication",
                Platform = "web",
                SessionId = "session1",
                CreatedAt = loginDate.AddHours(9) // Add hours to ensure it's on that date
            },
            new()
            {
                ClubId = 1,
                MemberId = 2,
                EventType = "Login",
                Action = "Login_Success",
                Category = "Authentication",
                Platform = "mobile",
                SessionId = "session2",
                CreatedAt = loginDate.AddHours(10)
            },
            new()
            {
                ClubId = 1,
                MemberId = 1,
                EventType = "Login",
                Action = "Login_Success",
                Category = "Authentication",
                Platform = "web",
                SessionId = "session3",
                CreatedAt = loginDate.AddHours(11)
            }
        };

        _context.AnalyticsEvents.AddRange(loginEvents);
        await _context.SaveChangesAsync();

        // Act
        var trends = await _service.GetLoginTrendsAsync(1, 7);

        // Assert
        var dateTrend = trends.FirstOrDefault(t => t.Date == loginDate);
        Assert.That(dateTrend, Is.Not.Null, $"Expected trend for {loginDate}, but trends only contain: {string.Join(", ", trends.Select(t => t.Date.ToString("yyyy-MM-dd")))}");
        Assert.That(dateTrend.TotalLogins, Is.EqualTo(3));
        Assert.That(dateTrend.UniqueUsers, Is.EqualTo(2)); // 2 unique members
        Assert.That(dateTrend.WebLogins, Is.EqualTo(2));
        Assert.That(dateTrend.MobileLogins, Is.EqualTo(1));
    }

    [Test]
    public async Task GetLoginTrendsAsync_ShouldOrderResultsByDate()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act
        var trends = await _service.GetLoginTrendsAsync(1, 30);

        // Assert
        Assert.That(trends, Is.Ordered.By("Date"));
    }

    #endregion

    #region GetMemberLoginActivityAsync Extended Tests

    [Test]
    public async Task GetMemberLoginActivityAsync_ShouldReturnEmptyList_WhenNoActiveMembers()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act
        var activities = await _service.GetMemberLoginActivityAsync(1, 30);

        // Assert
        Assert.That(activities, Is.Empty);
    }

    [Test]
    public async Task GetMemberLoginActivityAsync_ShouldMarkMemberAsAtRisk_WhenNoLoginsIn30Days()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "member@test.com",
            FullName = "Test Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-60),
            CreatedAt = DateTime.UtcNow.AddDays(-60),
            UpdatedAt = DateTime.UtcNow.AddDays(-60)
        };

        _context.Clubs.Add(club);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var activities = await _service.GetMemberLoginActivityAsync(1, 30);

        // Assert
        Assert.That(activities, Has.Count.EqualTo(1));
        var activity = activities.First();
        Assert.That(activity.IsAtRisk, Is.True);
        Assert.That(activity.LoginCount, Is.EqualTo(0));
    }

    [Test]
    public async Task GetMemberLoginActivityAsync_ShouldCalculateLoginFrequency_Correctly()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "member@test.com",
            FullName = "Test Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-60),
            CreatedAt = DateTime.UtcNow.AddDays(-60),
            UpdatedAt = DateTime.UtcNow.AddDays(-60)
        };

        _context.Clubs.Add(club);
        _context.Members.Add(member);

        // Add daily login events for 30 days
        for (int i = 0; i < 30; i++)
        {
            _context.AnalyticsEvents.Add(new AnalyticsEvent
            {
                ClubId = 1,
                MemberId = 1,
                EventType = "Login",
                Action = "Login_Success",
                Category = "Authentication",
                Platform = "web",
                SessionId = $"session{i}",
                CreatedAt = DateTime.UtcNow.AddDays(-i)
            });
        }

        await _context.SaveChangesAsync();

        // Act
        var activities = await _service.GetMemberLoginActivityAsync(1, 30);

        // Assert
        Assert.That(activities, Has.Count.EqualTo(1));
        var activity = activities.First();
        Assert.That(activity.LoginFrequency, Is.EqualTo("Daily"));
    }

    [Test]
    public async Task GetMemberLoginActivityAsync_ShouldOrderByLastLoginDateDescending()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        _context.Clubs.Add(club);

        var members = new List<Member>
        {
            new()
            {
                Id = 1,
                ClubId = 1,
                Email = "member1@test.com",
                FullName = "Member 1",
                Status = "Active",
                MembershipTypeId = 1,
                JoinDate = DateTime.UtcNow.AddDays(-60),
                CreatedAt = DateTime.UtcNow.AddDays(-60),
                UpdatedAt = DateTime.UtcNow.AddDays(-60)
            },
            new()
            {
                Id = 2,
                ClubId = 1,
                Email = "member2@test.com",
                FullName = "Member 2",
                Status = "Active",
                MembershipTypeId = 1,
                JoinDate = DateTime.UtcNow.AddDays(-60),
                CreatedAt = DateTime.UtcNow.AddDays(-60),
                UpdatedAt = DateTime.UtcNow.AddDays(-60)
            }
        };
        _context.Members.AddRange(members);

        // Member 1 logged in 10 days ago, Member 2 logged in yesterday
        _context.AnalyticsEvents.Add(new AnalyticsEvent
        {
            ClubId = 1,
            MemberId = 1,
            EventType = "Login",
            Action = "Login_Success",
            Category = "Authentication",
            Platform = "web",
            SessionId = "session1",
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        });
        _context.AnalyticsEvents.Add(new AnalyticsEvent
        {
            ClubId = 1,
            MemberId = 2,
            EventType = "Login",
            Action = "Login_Success",
            Category = "Authentication",
            Platform = "web",
            SessionId = "session2",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        });
        await _context.SaveChangesAsync();

        // Act
        var activities = await _service.GetMemberLoginActivityAsync(1, 30);

        // Assert
        Assert.That(activities, Has.Count.EqualTo(2));
        Assert.That(activities[0].MemberId, Is.EqualTo(2)); // Member 2 logged in more recently
        Assert.That(activities[1].MemberId, Is.EqualTo(1));
    }

    #endregion

    #region GetInactiveMembersAsync Extended Tests

    [Test]
    public async Task GetInactiveMembersAsync_ShouldReturnMembersWithNoLoginHistory()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var memberNeverLoggedIn = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "never@test.com",
            FullName = "Never Logged In",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-60),
            CreatedAt = DateTime.UtcNow.AddDays(-60),
            UpdatedAt = DateTime.UtcNow.AddDays(-60)
        };

        _context.Clubs.Add(club);
        _context.Members.Add(memberNeverLoggedIn);
        await _context.SaveChangesAsync();

        // Act
        var inactiveMembers = await _service.GetInactiveMembersAsync(1, 30);

        // Assert
        Assert.That(inactiveMembers, Has.Count.EqualTo(1));
        var inactive = inactiveMembers.First();
        Assert.That(inactive.LastLoginDate, Is.Null);
        Assert.That(inactive.LoginFrequency, Is.EqualTo("Never"));
        Assert.That(inactive.IsAtRisk, Is.True);
    }

    [Test]
    public async Task GetInactiveMembersAsync_ShouldNotIncludeSuspendedMembers()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var suspendedMember = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "suspended@test.com",
            FullName = "Suspended Member",
            Status = "Suspended", // Not active
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-60),
            CreatedAt = DateTime.UtcNow.AddDays(-60),
            UpdatedAt = DateTime.UtcNow.AddDays(-60)
        };

        _context.Clubs.Add(club);
        _context.Members.Add(suspendedMember);
        await _context.SaveChangesAsync();

        // Act
        var inactiveMembers = await _service.GetInactiveMembersAsync(1, 30);

        // Assert
        Assert.That(inactiveMembers, Is.Empty);
    }

    [Test]
    public async Task GetInactiveMembersAsync_ShouldRespectInactiveDaysParameter()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "member@test.com",
            FullName = "Test Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-60),
            CreatedAt = DateTime.UtcNow.AddDays(-60),
            UpdatedAt = DateTime.UtcNow.AddDays(-60)
        };

        _context.Clubs.Add(club);
        _context.Members.Add(member);

        // Member logged in 10 days ago
        _context.AnalyticsEvents.Add(new AnalyticsEvent
        {
            ClubId = 1,
            MemberId = 1,
            EventType = "Login",
            Action = "Login_Success",
            Category = "Authentication",
            Platform = "web",
            SessionId = "session1",
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        });
        await _context.SaveChangesAsync();

        // Act - Check with 7 day cutoff (should be inactive)
        var inactiveWith7Days = await _service.GetInactiveMembersAsync(1, 7);

        // Act - Check with 15 day cutoff (should be active)
        var inactiveWith15Days = await _service.GetInactiveMembersAsync(1, 15);

        // Assert
        Assert.That(inactiveWith7Days, Has.Count.EqualTo(1));
        Assert.That(inactiveWith15Days, Is.Empty);
    }

    #endregion

    #region UpdateLoginStreakAsync Extended Tests

    [Test]
    public async Task UpdateLoginStreakAsync_ShouldNotThrow_WhenMemberNotFound()
    {
        // Act & Assert - Should not throw
        await _service.UpdateLoginStreakAsync(999);
    }

    [Test]
    public async Task UpdateLoginStreakAsync_ShouldHandleNoLoginHistory()
    {
        // Arrange
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "member@test.com",
            FullName = "Test Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act & Assert - Should not throw
        await _service.UpdateLoginStreakAsync(1);
    }

    [Test]
    public async Task UpdateLoginStreakAsync_ShouldCalculateStreakAsOne_WhenSingleLogin()
    {
        // Arrange
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "member@test.com",
            FullName = "Test Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _context.Members.Add(member);
        _context.AnalyticsEvents.Add(new AnalyticsEvent
        {
            MemberId = 1,
            EventType = "Login",
            Action = "Login_Success",
            Category = "Authentication",
            Platform = "web",
            SessionId = "session1",
            CreatedAt = DateTime.UtcNow.Date
        });

        var today = DateTime.UtcNow.Date;
        var engagementScore = new MemberEngagementScore
        {
            MemberId = 1,
            ClubId = 1,
            OverallScore = 50,
            CalculatedDate = today,
            CreatedAt = today,
            UpdatedAt = today
        };

        _context.MemberEngagementScores.Add(engagementScore);
        await _context.SaveChangesAsync();

        // Act
        await _service.UpdateLoginStreakAsync(1);

        // Assert
        var updatedScore = await _context.MemberEngagementScores
            .FirstOrDefaultAsync(s => s.MemberId == 1);

        Assert.That(updatedScore!.LoginStreakDays, Is.EqualTo(1));
    }

    [Test]
    public async Task UpdateLoginStreakAsync_ShouldBreakStreak_WhenDaysMissed()
    {
        // Arrange
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "member@test.com",
            FullName = "Test Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _context.Members.Add(member);

        var today = DateTime.UtcNow.Date;
        // Login today, then skip days, then login 5 days ago
        _context.AnalyticsEvents.Add(new AnalyticsEvent
        {
            MemberId = 1,
            EventType = "Login",
            Action = "Login_Success",
            Category = "Authentication",
            Platform = "web",
            SessionId = "session1",
            CreatedAt = today
        });
        _context.AnalyticsEvents.Add(new AnalyticsEvent
        {
            MemberId = 1,
            EventType = "Login",
            Action = "Login_Success",
            Category = "Authentication",
            Platform = "web",
            SessionId = "session2",
            CreatedAt = today.AddDays(-5) // Gap of 4 days - streak should break
        });

        var engagementScore = new MemberEngagementScore
        {
            MemberId = 1,
            ClubId = 1,
            OverallScore = 50,
            CalculatedDate = today,
            CreatedAt = today,
            UpdatedAt = today
        };

        _context.MemberEngagementScores.Add(engagementScore);
        await _context.SaveChangesAsync();

        // Act
        await _service.UpdateLoginStreakAsync(1);

        // Assert
        var updatedScore = await _context.MemberEngagementScores
            .FirstOrDefaultAsync(s => s.MemberId == 1);

        Assert.That(updatedScore!.LoginStreakDays, Is.EqualTo(1)); // Streak broken, only today counts
    }

    #endregion

    #region UpdateMemberEngagementScoresAsync Tests

    [Test]
    public async Task UpdateMemberEngagementScoresAsync_ShouldCreateNewScores_WhenNoneExist()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "member@test.com",
            FullName = "Test Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _context.Clubs.Add(club);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        await _service.UpdateMemberEngagementScoresAsync(1);

        // Assert
        var score = await _context.MemberEngagementScores
            .FirstOrDefaultAsync(s => s.MemberId == 1);

        Assert.That(score, Is.Not.Null);
        Assert.That(score.ClubId, Is.EqualTo(1));
        Assert.That(score.CalculatedDate.Date, Is.EqualTo(DateTime.UtcNow.Date));
    }

    [Test]
    public async Task UpdateMemberEngagementScoresAsync_ShouldUpdateExistingScores()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "member@test.com",
            FullName = "Test Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _context.Clubs.Add(club);
        _context.Members.Add(member);

        var today = DateTime.UtcNow.Date;
        var existingScore = new MemberEngagementScore
        {
            MemberId = 1,
            ClubId = 1,
            OverallScore = 10,
            LoginScore = 5,
            CalculatedDate = today,
            CreatedAt = today.AddHours(-5),
            UpdatedAt = today.AddHours(-5)
        };

        _context.MemberEngagementScores.Add(existingScore);
        await _context.SaveChangesAsync();

        // Act
        await _service.UpdateMemberEngagementScoresAsync(1);

        // Assert
        var scores = await _context.MemberEngagementScores
            .Where(s => s.MemberId == 1)
            .ToListAsync();

        Assert.That(scores, Has.Count.EqualTo(1));
        Assert.That(scores[0].UpdatedAt, Is.GreaterThan(today.AddHours(-5)));
    }

    [Test]
    public async Task UpdateMemberEngagementScoresAsync_ShouldOnlyProcessActiveMembers()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var activeMember = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "active@test.com",
            FullName = "Active Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-30)
        };
        var inactiveMember = new Member
        {
            Id = 2,
            ClubId = 1,
            Email = "inactive@test.com",
            FullName = "Inactive Member",
            Status = "Suspended",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _context.Clubs.Add(club);
        _context.Members.AddRange(activeMember, inactiveMember);
        await _context.SaveChangesAsync();

        // Act
        await _service.UpdateMemberEngagementScoresAsync(1);

        // Assert
        var scores = await _context.MemberEngagementScores.ToListAsync();
        Assert.That(scores, Has.Count.EqualTo(1));
        Assert.That(scores[0].MemberId, Is.EqualTo(1));
    }

    #endregion

    #region RecordFailedLoginAsync Extended Tests

    [Test]
    public async Task RecordFailedLoginAsync_ShouldIncludeReasonInProperties()
    {
        // Act
        await _service.RecordFailedLoginAsync("test@example.com", "Account locked", "mobile", "android");

        // Assert
        var failedEvent = await _context.AnalyticsEvents
            .FirstOrDefaultAsync(e => e.EventType == "Login" && e.Action == "Login_Failed");

        Assert.That(failedEvent, Is.Not.Null);
        Assert.That(failedEvent.Properties ?? "", Does.Contain("Account locked"));
    }

    [Test]
    public async Task RecordFailedLoginAsync_ShouldHandleNullDeviceType()
    {
        // Act
        await _service.RecordFailedLoginAsync("test@example.com", "Invalid password", "web", null);

        // Assert
        var failedEvent = await _context.AnalyticsEvents
            .FirstOrDefaultAsync(e => e.EventType == "Login" && e.Action == "Login_Failed");

        Assert.That(failedEvent, Is.Not.Null);
        Assert.That(failedEvent.DeviceType, Is.Null);
    }

    #endregion

    #region GetClubLoginStatsAsync Extended Tests

    [Test]
    public async Task GetClubLoginStatsAsync_ShouldCalculateDailyActiveUsersCorrectly()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var members = new List<Member>();
        for (int i = 1; i <= 5; i++)
        {
            members.Add(new Member
            {
                Id = i,
                ClubId = 1,
                Email = $"member{i}@test.com",
                FullName = $"Member {i}",
                Status = "Active",
                MembershipTypeId = 1,
                JoinDate = DateTime.UtcNow.AddDays(-60),
                CreatedAt = DateTime.UtcNow.AddDays(-60),
                UpdatedAt = DateTime.UtcNow.AddDays(-60)
            });
        }

        _context.Clubs.Add(club);
        _context.Members.AddRange(members);

        // 2 members logged in today
        _context.AnalyticsEvents.Add(new AnalyticsEvent
        {
            ClubId = 1,
            MemberId = 1,
            EventType = "Login",
            Action = "Login_Success",
            Category = "Authentication",
            Platform = "web",
            SessionId = "session1",
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        });
        _context.AnalyticsEvents.Add(new AnalyticsEvent
        {
            ClubId = 1,
            MemberId = 2,
            EventType = "Login",
            Action = "Login_Success",
            Category = "Authentication",
            Platform = "web",
            SessionId = "session2",
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        });

        // 1 member logged in 3 days ago
        _context.AnalyticsEvents.Add(new AnalyticsEvent
        {
            ClubId = 1,
            MemberId = 3,
            EventType = "Login",
            Action = "Login_Success",
            Category = "Authentication",
            Platform = "web",
            SessionId = "session3",
            CreatedAt = DateTime.UtcNow.AddDays(-3)
        });

        await _context.SaveChangesAsync();

        // Act
        var stats = await _service.GetClubLoginStatsAsync(1, 30);

        // Assert
        Assert.That(stats.DailyActiveUsers, Is.EqualTo(2));
        Assert.That(stats.WeeklyActiveUsers, Is.EqualTo(3));
        Assert.That(stats.InactiveMembers, Is.EqualTo(2)); // 5 total - 3 with logins in 30 days
    }

    [Test]
    public async Task GetClubLoginStatsAsync_ShouldReturnZeroStats_WhenNoLogins()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club", Tier = "Unlimited" };
        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            Email = "member@test.com",
            FullName = "Test Member",
            Status = "Active",
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow.AddDays(-60),
            CreatedAt = DateTime.UtcNow.AddDays(-60),
            UpdatedAt = DateTime.UtcNow.AddDays(-60)
        };

        _context.Clubs.Add(club);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var stats = await _service.GetClubLoginStatsAsync(1, 30);

        // Assert
        Assert.That(stats.TotalLogins, Is.EqualTo(0));
        Assert.That(stats.MembersWithLogins, Is.EqualTo(0));
        Assert.That(stats.AverageLoginsPerMember, Is.EqualTo(0));
        Assert.That(stats.DailyActiveUsers, Is.EqualTo(0));
        Assert.That(stats.InactiveMembers, Is.EqualTo(1));
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}