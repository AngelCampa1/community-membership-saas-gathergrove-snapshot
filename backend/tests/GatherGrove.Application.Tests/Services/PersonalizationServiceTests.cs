using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class PersonalizationServiceTests
{
    private GatherGroveDbContext _context = null!;
    private Mock<ILogger<PersonalizationService>> _mockLogger = null!;
    private PersonalizationService _service = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<PersonalizationService>>();
        _service = new PersonalizationService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private async Task<(Club club, MembershipType membershipType, Member member)> SetupTestDataAsync(int clubId = 1, string memberName = "Test Member")
    {
        var club = new Club
        {
            Id = clubId,
            Name = "Test Club",
            CreatedAt = DateTime.UtcNow
        };
        var membershipType = new MembershipType
        {
            Id = 1,
            Name = "Regular",
            ClubId = clubId,
            DuesAmount = 0,
            DuesFrequency = "Yearly"
        };
        var member = new Member
        {
            Id = 1,
            FullName = memberName,
            FirstName = memberName.Split(' ').First(),
            LastName = memberName.Split(' ').Last(),
            Email = "test@example.com",
            ClubId = clubId,
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow,
            Status = "Active"
        };
        await _context.Clubs.AddAsync(club);
        await _context.MembershipTypes.AddAsync(membershipType);
        await _context.Members.AddAsync(member);
        await _context.SaveChangesAsync();

        return (club, membershipType, member);
    }

    [Test]
    public async Task ReplaceTokensAsync_MemberName_ReplacesCorrectly()
    {
        // Arrange
        var clubId = 1;
        var club = new Club
        {
            Id = clubId,
            Name = "Test Club",
            CreatedAt = DateTime.UtcNow
        };
        var membershipType = new MembershipType
        {
            Id = 1,
            Name = "Regular",
            ClubId = clubId,
            DuesAmount = 0,
            DuesFrequency = "Yearly"
        };
        var member = new Member
        {
            Id = 1,
            FullName = "John Doe",
            FirstName = "John",
            LastName = "Doe",
            Email = "john@example.com",
            ClubId = clubId,
            MembershipTypeId = 1,
            JoinDate = DateTime.UtcNow,
            Status = "Active"
        };
        await _context.Clubs.AddAsync(club);
        await _context.MembershipTypes.AddAsync(membershipType);
        await _context.Members.AddAsync(member);
        await _context.SaveChangesAsync();

        var content = "Hello {{member_name}}, welcome!";

        // Act
        var result = await _service.ReplaceTokensAsync(clubId, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Hello John Doe, welcome!"));
    }

    [Test]
    public async Task ReplaceTokensAsync_ClubName_ReplacesCorrectly()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        club.Name = "Awesome Club"; // Update to match expected value
        _context.Clubs.Update(club);
        await _context.SaveChangesAsync();

        var content = "Welcome to {{club_name}}!";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Welcome to Awesome Club!"));
    }

    [Test]
    public async Task ReplaceTokensAsync_MultipleTokens_ReplacesAll()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync(memberName: "Jane Smith");
        var content = "Hello {{member_name}}, welcome to {{club_name}}!";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Hello Jane Smith, welcome to Test Club!"));
    }

    [Test]
    public async Task ReplaceTokensAsync_MissingMemberData_UsesFallback()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        var content = "Hello {{member_name}}!";

        // Act - Use non-existent member ID
        var result = await _service.ReplaceTokensAsync(club.Id, 999, content);

        // Assert - Should return original content when member not found
        Assert.That(result, Is.EqualTo(content));
    }

    [Test]
    public async Task ReplaceTokensAsync_CurrentYear_ReplacesWithCurrentYear()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        var content = "Copyright {{current_year}} {{club_name}}";
        var expectedYear = DateTime.UtcNow.Year.ToString();

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Does.Contain(expectedYear));
        Assert.That(result, Does.Contain("Test Club"));
    }

    [Test]
    public async Task ReplaceTokensAsync_NoTokens_ReturnsOriginalContent()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        var content = "This is a plain message with no tokens.";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo(content));
    }

    [Test]
    public async Task GetAvailableTokensAsync_ReturnsStandardTokens()
    {
        // Arrange
        var clubId = 1;
        var club = new Club { Id = clubId, Name = "Test Club", CreatedAt = DateTime.UtcNow };
        await _context.Clubs.AddAsync(club);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetAvailableTokensAsync(clubId);

        // Assert
        Assert.That(result, Is.Not.Null);
        var allTokens = result.SystemTokens.Concat(result.CustomTokens).ToList();
        Assert.That(allTokens, Is.Not.Empty);
        Assert.That(allTokens.Any(t => t.TokenName == "member_name"), Is.True);
        Assert.That(allTokens.Any(t => t.TokenName == "club_name"), Is.True);
        Assert.That(allTokens.Any(t => t.TokenName == "current_year"), Is.True);
    }

    #region ReplaceTokensAsync Extended Tests

    [Test]
    public async Task ReplaceTokensAsync_NullContent_ReturnsNull()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, null!);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task ReplaceTokensAsync_EmptyContent_ReturnsEmpty()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, "");

        // Assert
        Assert.That(result, Is.EqualTo(""));
    }

    [Test]
    public async Task ReplaceTokensAsync_MemberWithNoPhone_UsesFallback()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        member.PhoneNumber = null;
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        var content = "Call {{member_phone}} for more info.";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Call [No phone number] for more info."));
    }

    [Test]
    public async Task ReplaceTokensAsync_MemberWithPhone_ReplacesPhone()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        member.PhoneNumber = "(555) 123-4567";
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        var content = "Call {{member_phone}}.";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Call (555) 123-4567."));
    }

    [Test]
    public async Task ReplaceTokensAsync_DuesStatusCurrent_ReturnsCorrectStatus()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        member.DuesPaidUntil = DateTime.UtcNow.AddDays(30);
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        var content = "Your dues status: {{dues_status}}";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Your dues status: Current"));
    }

    [Test]
    public async Task ReplaceTokensAsync_DuesStatusOverdue_ReturnsCorrectStatus()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        member.DuesPaidUntil = DateTime.UtcNow.AddDays(-30);
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        var content = "Your dues status: {{dues_status}}";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Your dues status: Overdue"));
    }

    [Test]
    public async Task ReplaceTokensAsync_DuesStatusUnknown_ReturnsUnknown()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        member.DuesPaidUntil = null;
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        var content = "Your dues status: {{dues_status}}";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Your dues status: Unknown"));
    }

    [Test]
    public async Task ReplaceTokensAsync_JoinDate_FormatsCorrectly()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        var joinDate = new DateTime(2024, 5, 15);
        member.JoinDate = joinDate;
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        var content = "You joined on {{join_date}}.";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert - Use expected format based on current culture
        var expectedFormattedDate = joinDate.ToString("MMMM dd, yyyy");
        Assert.That(result, Is.EqualTo($"You joined on {expectedFormattedDate}."));
    }

    [Test]
    public async Task ReplaceTokensAsync_EngagementScoreWithData_ReturnsScore()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        var engagementScore = new MemberEventEngagementScores
        {
            MemberId = member.Id,
            AverageEventEngagementScore = 85.5m,
            CalculatedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.MemberEventEngagementScores.AddAsync(engagementScore);
        await _context.SaveChangesAsync();

        var content = "Your engagement score: {{engagement_score}}";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Your engagement score: 86"));
    }

    [Test]
    public async Task ReplaceTokensAsync_EngagementScoreNoData_ReturnsNA()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        var content = "Your engagement score: {{engagement_score}}";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Your engagement score: N/A"));
    }

    [Test]
    public async Task ReplaceTokensAsync_UpcomingEvents_ListsEvents()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        await _context.Events.AddRangeAsync(
            new Event { Id = 1, Name = "Summer Picnic", ClubId = club.Id, EventDateTime = DateTime.UtcNow.AddDays(7), CreatedAt = DateTime.UtcNow },
            new Event { Id = 2, Name = "Monthly Meeting", ClubId = club.Id, EventDateTime = DateTime.UtcNow.AddDays(14), CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var content = "Upcoming: {{upcoming_events}}";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Does.Contain("Summer Picnic"));
        Assert.That(result, Does.Contain("Monthly Meeting"));
    }

    [Test]
    public async Task ReplaceTokensAsync_NoUpcomingEvents_ShowsFallback()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        var content = "Upcoming: {{upcoming_events}}";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Upcoming: No upcoming events"));
    }

    [Test]
    public async Task ReplaceTokensAsync_CurrentDate_ReplacesCorrectly()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        var content = "Today is {{current_date}}.";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        var expectedDate = DateTime.UtcNow.ToString("MMMM dd, yyyy");
        Assert.That(result, Is.EqualTo($"Today is {expectedDate}."));
    }

    [Test]
    public async Task ReplaceTokensAsync_FirstAndLastName_ReplacesCorrectly()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        member.FirstName = "Alice";
        member.LastName = "Johnson";
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        var content = "Hi {{member_first_name}} {{member_last_name}}!";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Hi Alice Johnson!"));
    }

    [Test]
    public async Task ReplaceTokensAsync_MemberEmail_ReplacesCorrectly()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        member.Email = "alice@example.com";
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        var content = "Your email: {{member_email}}";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Your email: alice@example.com"));
    }

    [Test]
    public async Task ReplaceTokensAsync_MembershipType_ReplacesCorrectly()
    {
        // Arrange
        var (club, membershipType, member) = await SetupTestDataAsync();
        membershipType.Name = "Premium";
        _context.MembershipTypes.Update(membershipType);
        await _context.SaveChangesAsync();

        var content = "Your membership: {{membership_type}}";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Your membership: Premium"));
    }

    [Test]
    public async Task ReplaceTokensAsync_CustomToken_ReplacesWithValue()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        var customToken = new PersonalizationToken
        {
            Id = 1,
            ClubId = club.Id,
            TokenName = "custom_greeting",
            DisplayName = "Custom Greeting",
            DefaultValue = "Hello Friend!",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        await _context.PersonalizationTokens.AddAsync(customToken);
        await _context.SaveChangesAsync();

        var content = "Message: {{custom_greeting}}";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Is.EqualTo("Message: Hello Friend!"));
    }

    [Test]
    public async Task ReplaceTokensAsync_InactiveCustomToken_NotReplaced()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        var customToken = new PersonalizationToken
        {
            Id = 1,
            ClubId = club.Id,
            TokenName = "inactive_token",
            DisplayName = "Inactive Token",
            DefaultValue = "Should not appear",
            IsActive = false,
            CreatedAt = DateTime.UtcNow
        };
        await _context.PersonalizationTokens.AddAsync(customToken);
        await _context.SaveChangesAsync();

        var content = "Message: {{inactive_token}}";

        // Act
        var result = await _service.ReplaceTokensAsync(club.Id, member.Id, content);

        // Assert
        Assert.That(result, Does.Contain("{{inactive_token}}"));
    }

    #endregion

    #region PersonalizeContentAsync Tests

    [Test]
    public async Task PersonalizeContentAsync_ValidContent_ReturnsPersonalizedResponse()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        var request = new PersonalizeContentRequest
        {
            MemberId = member.Id,
            Content = "Hello {{member_name}}, welcome to {{club_name}}!"
        };

        // Act
        var result = await _service.PersonalizeContentAsync(club.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Content, Is.EqualTo("Hello Test Member, welcome to Test Club!"));
        Assert.That(result.ReplacedTokens.ContainsKey("member_name"), Is.True);
        Assert.That(result.ReplacedTokens.ContainsKey("club_name"), Is.True);
    }

    [Test]
    public async Task PersonalizeContentAsync_NoTokens_ReturnsOriginalContent()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        var request = new PersonalizeContentRequest
        {
            MemberId = member.Id,
            Content = "Plain text without tokens."
        };

        // Act
        var result = await _service.PersonalizeContentAsync(club.Id, request);

        // Assert
        Assert.That(result.Content, Is.EqualTo("Plain text without tokens."));
        Assert.That(result.ReplacedTokens, Is.Empty);
    }

    [Test]
    public async Task PersonalizeContentAsync_InvalidMember_ReturnsOriginalWithFailedTokens()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        var request = new PersonalizeContentRequest
        {
            MemberId = 999, // Non-existent member
            Content = "Hello {{member_name}}!"
        };

        // Act
        var result = await _service.PersonalizeContentAsync(club.Id, request);

        // Assert
        Assert.That(result.Content, Does.Contain("{{member_name}}"));
        Assert.That(result.FailedTokens, Does.Contain("member_name"));
    }

    #endregion

    #region GetAvailableTokensAsync Extended Tests

    [Test]
    public async Task GetAvailableTokensAsync_SystemTokens_ContainsAllRequired()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();

        // Act
        var result = await _service.GetAvailableTokensAsync(club.Id);

        // Assert
        var systemTokenNames = result.SystemTokens.Select(t => t.TokenName).ToList();
        Assert.That(systemTokenNames, Does.Contain("member_name"));
        Assert.That(systemTokenNames, Does.Contain("member_first_name"));
        Assert.That(systemTokenNames, Does.Contain("member_last_name"));
        Assert.That(systemTokenNames, Does.Contain("member_email"));
        Assert.That(systemTokenNames, Does.Contain("member_phone"));
        Assert.That(systemTokenNames, Does.Contain("club_name"));
        Assert.That(systemTokenNames, Does.Contain("membership_type"));
        Assert.That(systemTokenNames, Does.Contain("dues_status"));
        Assert.That(systemTokenNames, Does.Contain("join_date"));
        Assert.That(systemTokenNames, Does.Contain("engagement_score"));
        Assert.That(systemTokenNames, Does.Contain("upcoming_events"));
        Assert.That(systemTokenNames, Does.Contain("current_year"));
        Assert.That(systemTokenNames, Does.Contain("current_date"));
    }

    [Test]
    public async Task GetAvailableTokensAsync_SystemTokens_HaveCorrectCategories()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();

        // Act
        var result = await _service.GetAvailableTokensAsync(club.Id);

        // Assert
        var memberToken = result.SystemTokens.First(t => t.TokenName == "member_name");
        Assert.That(memberToken.Category, Is.EqualTo("Member"));
        Assert.That(memberToken.IsSystemToken, Is.True);

        var clubToken = result.SystemTokens.First(t => t.TokenName == "club_name");
        Assert.That(clubToken.Category, Is.EqualTo("Club"));

        var systemToken = result.SystemTokens.First(t => t.TokenName == "current_year");
        Assert.That(systemToken.Category, Is.EqualTo("System"));
    }

    [Test]
    public async Task GetAvailableTokensAsync_WithCustomTokens_ReturnsAll()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        await _context.PersonalizationTokens.AddRangeAsync(
            new PersonalizationToken
            {
                Id = 1,
                ClubId = club.Id,
                TokenName = "custom_1",
                DisplayName = "Custom Token 1",
                Category = "Custom",
                IsActive = true,
                SortOrder = 1,
                CreatedAt = DateTime.UtcNow
            },
            new PersonalizationToken
            {
                Id = 2,
                ClubId = club.Id,
                TokenName = "custom_2",
                DisplayName = "Custom Token 2",
                Category = "Custom",
                IsActive = true,
                SortOrder = 2,
                CreatedAt = DateTime.UtcNow
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetAvailableTokensAsync(club.Id);

        // Assert
        Assert.That(result.CustomTokens.Count, Is.EqualTo(2));
        Assert.That(result.CustomTokens.Any(t => t.TokenName == "custom_1"), Is.True);
        Assert.That(result.CustomTokens.Any(t => t.TokenName == "custom_2"), Is.True);
    }

    [Test]
    public async Task GetAvailableTokensAsync_CustomTokens_AreOrdered()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        await _context.PersonalizationTokens.AddRangeAsync(
            new PersonalizationToken
            {
                Id = 1,
                ClubId = club.Id,
                TokenName = "z_token",
                DisplayName = "Z Token",
                IsActive = true,
                SortOrder = 2,
                CreatedAt = DateTime.UtcNow
            },
            new PersonalizationToken
            {
                Id = 2,
                ClubId = club.Id,
                TokenName = "a_token",
                DisplayName = "A Token",
                IsActive = true,
                SortOrder = 1,
                CreatedAt = DateTime.UtcNow
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetAvailableTokensAsync(club.Id);

        // Assert
        Assert.That(result.CustomTokens.First().TokenName, Is.EqualTo("a_token"));
        Assert.That(result.CustomTokens.Last().TokenName, Is.EqualTo("z_token"));
    }

    [Test]
    public async Task GetAvailableTokensAsync_InactiveTokens_NotIncluded()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        await _context.PersonalizationTokens.AddAsync(new PersonalizationToken
        {
            Id = 1,
            ClubId = club.Id,
            TokenName = "inactive_token",
            DisplayName = "Inactive Token",
            IsActive = false,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetAvailableTokensAsync(club.Id);

        // Assert
        Assert.That(result.CustomTokens.Any(t => t.TokenName == "inactive_token"), Is.False);
    }

    [Test]
    public async Task GetAvailableTokensAsync_OtherClubTokens_NotIncluded()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        await _context.PersonalizationTokens.AddAsync(new PersonalizationToken
        {
            Id = 1,
            ClubId = 999, // Different club
            TokenName = "other_club_token",
            DisplayName = "Other Club Token",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetAvailableTokensAsync(club.Id);

        // Assert
        Assert.That(result.CustomTokens.Any(t => t.TokenName == "other_club_token"), Is.False);
    }

    #endregion

    #region CreateCustomTokenAsync Tests

    [Test]
    public async Task CreateCustomTokenAsync_ValidToken_CreatesSuccessfully()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        var userId = 1;
        var request = new CreatePersonalizationTokenRequest
        {
            TokenName = "my_custom_token",
            DisplayName = "My Custom Token",
            Description = "A custom token for testing",
            Category = "Custom",
            DefaultValue = "Default value"
        };

        // Act
        var result = await _service.CreateCustomTokenAsync(club.Id, userId, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TokenName, Is.EqualTo("my_custom_token"));
        Assert.That(result.DisplayName, Is.EqualTo("My Custom Token"));
        Assert.That(result.DefaultValue, Is.EqualTo("Default value"));
        Assert.That(result.IsSystemToken, Is.False);

        // Verify in database
        var dbToken = await _context.PersonalizationTokens.FirstOrDefaultAsync(t => t.TokenName == "my_custom_token");
        Assert.That(dbToken, Is.Not.Null);
        Assert.That(dbToken!.CreatedByUserId, Is.EqualTo(userId));
    }

    [Test]
    public async Task CreateCustomTokenAsync_SystemTokenName_ThrowsException()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        var request = new CreatePersonalizationTokenRequest
        {
            TokenName = "member_name", // Reserved system token
            DisplayName = "My Member Name",
            Description = "Trying to override system token"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.CreateCustomTokenAsync(club.Id, 1, request));

        Assert.That(ex!.Message, Does.Contain("reserved"));
    }

    [Test]
    public async Task CreateCustomTokenAsync_DuplicateTokenName_ThrowsException()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        await _context.PersonalizationTokens.AddAsync(new PersonalizationToken
        {
            Id = 1,
            ClubId = club.Id,
            TokenName = "existing_token",
            DisplayName = "Existing Token",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var request = new CreatePersonalizationTokenRequest
        {
            TokenName = "existing_token", // Already exists
            DisplayName = "Duplicate Token",
            Description = "Trying to create duplicate"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.CreateCustomTokenAsync(club.Id, 1, request));

        Assert.That(ex!.Message, Does.Contain("already exists"));
    }

    [Test]
    public async Task CreateCustomTokenAsync_AllSystemTokenNames_AreProtected()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        var systemTokenNames = new[]
        {
            "member_name", "member_first_name", "member_last_name", "member_email",
            "member_phone", "club_name", "membership_type", "dues_status", "join_date",
            "engagement_score", "upcoming_events", "current_year", "current_date"
        };

        foreach (var tokenName in systemTokenNames)
        {
            var request = new CreatePersonalizationTokenRequest
            {
                TokenName = tokenName,
                DisplayName = $"Override {tokenName}"
            };

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(async () =>
                await _service.CreateCustomTokenAsync(club.Id, 1, request),
                $"Token '{tokenName}' should be protected");
        }
    }

    [Test]
    public async Task CreateCustomTokenAsync_TokenWithNullDefaultValue_CreatesSuccessfully()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        var request = new CreatePersonalizationTokenRequest
        {
            TokenName = "token_no_default",
            DisplayName = "Token No Default",
            DefaultValue = null
        };

        // Act
        var result = await _service.CreateCustomTokenAsync(club.Id, 1, request);

        // Assert
        Assert.That(result.DefaultValue, Is.Null);
        Assert.That(result.ExampleValue, Is.EqualTo("[Custom Value]"));
    }

    #endregion

    #region PreviewPersonalizationAsync Tests

    [Test]
    public async Task PreviewPersonalizationAsync_WithMembers_ReturnsPersonalizedSamples()
    {
        // Arrange
        var (club, membershipType, _) = await SetupTestDataAsync();

        // Add more members
        await _context.Members.AddRangeAsync(
            new Member
            {
                Id = 2,
                FullName = "Alice Smith",
                FirstName = "Alice",
                LastName = "Smith",
                Email = "alice@example.com",
                ClubId = club.Id,
                MembershipTypeId = membershipType.Id,
                JoinDate = DateTime.UtcNow,
                Status = "Active"
            },
            new Member
            {
                Id = 3,
                FullName = "Bob Johnson",
                FirstName = "Bob",
                LastName = "Johnson",
                Email = "bob@example.com",
                ClubId = club.Id,
                MembershipTypeId = membershipType.Id,
                JoinDate = DateTime.UtcNow,
                Status = "Active"
            }
        );
        await _context.SaveChangesAsync();

        var request = new PreviewPersonalizationRequest
        {
            Content = "Hello {{member_name}}!",
            SampleCount = 3
        };

        // Act
        var result = await _service.PreviewPersonalizationAsync(club.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Samples.Count, Is.EqualTo(3));
        foreach (var sample in result.Samples)
        {
            Assert.That(sample.PersonalizedContent, Does.StartWith("Hello "));
            Assert.That(sample.PersonalizedContent, Does.EndWith("!"));
            Assert.That(sample.PersonalizedContent, Does.Not.Contain("{{member_name}}"));
        }
    }

    [Test]
    public async Task PreviewPersonalizationAsync_NoActiveMembers_ReturnsEmptySamples()
    {
        // Arrange
        var (club, _, member) = await SetupTestDataAsync();
        member.Status = "Inactive";
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        var request = new PreviewPersonalizationRequest
        {
            Content = "Hello {{member_name}}!",
            SampleCount = 5
        };

        // Act
        var result = await _service.PreviewPersonalizationAsync(club.Id, request);

        // Assert
        Assert.That(result.Samples, Is.Empty);
    }

    [Test]
    public async Task PreviewPersonalizationAsync_LimitedMembers_ReturnsAvailable()
    {
        // Arrange
        var (club, _, _) = await SetupTestDataAsync();
        // Only 1 member exists

        var request = new PreviewPersonalizationRequest
        {
            Content = "Hello {{member_name}}!",
            SampleCount = 5 // Request more than available
        };

        // Act
        var result = await _service.PreviewPersonalizationAsync(club.Id, request);

        // Assert
        Assert.That(result.Samples.Count, Is.EqualTo(1)); // Only 1 available
    }

    [Test]
    public async Task PreviewPersonalizationAsync_WithSegment_FiltersMembers()
    {
        // Arrange
        var (club, membershipType, member) = await SetupTestDataAsync();

        // Add another member
        var member2 = new Member
        {
            Id = 2,
            FullName = "Bob Smith",
            FirstName = "Bob",
            LastName = "Smith",
            Email = "bob@example.com",
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            JoinDate = DateTime.UtcNow,
            Status = "Active"
        };
        await _context.Members.AddAsync(member2);

        // Create segment with only member 1
        var segment = new GatherGrove.Domain.Entities.MemberSegment
        {
            Id = 1,
            ClubId = club.Id,
            Name = "Test Segment",
            FilterCriteria = "{}",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.MemberSegments.AddAsync(segment);
        await _context.SegmentMembers.AddAsync(new SegmentMember
        {
            SegmentId = 1,
            MemberId = member.Id,
            AddedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var request = new PreviewPersonalizationRequest
        {
            Content = "Hello {{member_name}}!",
            SampleCount = 5,
            SegmentId = 1
        };

        // Act
        var result = await _service.PreviewPersonalizationAsync(club.Id, request);

        // Assert
        Assert.That(result.Samples.Count, Is.EqualTo(1));
        Assert.That(result.Samples.First().MemberName, Is.EqualTo("Test Member"));
    }

    #endregion
}

