using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Tests.TestUtilities;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Tests.Repositories;

/// <summary>
/// Comprehensive tests for MemberRepository
/// Tests member data access patterns including filtering, custom fields, and attendance tracking
/// </summary>
public class MemberRepositoryTests : RepositoryTestBase
{
    private MemberRepository _repository = null!;

    [SetUp]
    public void Setup()
    {
        // Create a fresh database context for each test to ensure isolation
        CreateContext();
        _repository = new MemberRepository(Context, NullLogger<MemberRepository>.Instance);
    }

    [TearDown]
    public void TearDown()
    {
        // Dispose the context after each test
        Context?.Dispose();
    }

    #region GetMembersByClubIdAsync Tests (6 tests)

    [Test]
    public async Task GetMembersByClubIdAsync_ValidClubId_ReturnsMembers()
    {
        // Arrange
        var club = await SeedClubAsync();
        var members = await SeedMembersAsync(club.Id, 5);

        // Act
        var result = await _repository.GetMembersByClubIdAsync(club.Id, null, null);

        // Assert
        Assert.That(result.Count, Is.EqualTo(5));
        Assert.That(result, Is.All.Property(nameof(Member.ClubId)).EqualTo(club.Id));
        Assert.That(result, Is.Ordered.By(nameof(Member.FullName)));
    }

    [Test]
    public async Task GetMembersByClubIdAsync_WithDateFrom_FiltersCorrectly()
    {
        // Arrange
        var club = await SeedClubAsync();
        var members = await SeedMembersAsync(club.Id, 10); // Members have staggered join dates

        var dateFrom = DateTime.UtcNow.AddDays(-90); // Filter to last 90 days

        // Act
        var result = await _repository.GetMembersByClubIdAsync(club.Id, dateFrom, null);

        // Assert
        Assert.That(result.Count, Is.LessThan(10)); // Some members filtered out
        Assert.That(result, Is.All.Matches<Member>(m => m.JoinDate >= dateFrom));
    }

    [Test]
    public async Task GetMembersByClubIdAsync_WithDateTo_FiltersCorrectly()
    {
        // Arrange
        var club = await SeedClubAsync();
        await SeedMembersAsync(club.Id, 10);

        var dateTo = DateTime.UtcNow.AddDays(-60); // Only members before 60 days ago

        // Act
        var result = await _repository.GetMembersByClubIdAsync(club.Id, null, dateTo);

        // Assert
        Assert.That(result, Is.All.Matches<Member>(m => m.JoinDate <= dateTo));
    }

    [Test]
    public async Task GetMembersByClubIdAsync_WithDateRange_FiltersCorrectly()
    {
        // Arrange
        var club = await SeedClubAsync();
        await SeedMembersAsync(club.Id, 10);

        var dateFrom = DateTime.UtcNow.AddDays(-180);
        var dateTo = DateTime.UtcNow.AddDays(-90);

        // Act
        var result = await _repository.GetMembersByClubIdAsync(club.Id, dateFrom, dateTo);

        // Assert
        Assert.That(result, Is.All.Matches<Member>(m =>
            m.JoinDate >= dateFrom && m.JoinDate <= dateTo));
    }

    [Test]
    public async Task GetMembersByClubIdAsync_NonExistentClubId_ReturnsEmptyList()
    {
        // Arrange
        await SeedClubAsync();

        // Act
        var result = await _repository.GetMembersByClubIdAsync(999, null, null);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetMembersByClubIdAsync_IncludesMembershipTypeAndLocation()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Seed membership type
        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = club.Id,
            Name = "Premium",
            DuesAmount = 100m
        };
        Context.MembershipTypes.Add(membershipType);

        // Seed location
        var location = TestDataFactory.CreateClubLocation(1, club.Id, "Main Office");
        Context.ClubLocations.Add(location);
        await Context.SaveChangesAsync();

        // Seed member with relationships
        var member = new Member
        {
            Id = 1,
            ClubId = club.Id,
            FullName = "Test Member",
            Email = "test@test.com",
            MembershipTypeId = membershipType.Id,
            LocationId = location.Id,
            JoinedAt = DateTime.UtcNow
        };
        Context.Members.Add(member);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetMembersByClubIdAsync(club.Id, null, null);

        // Assert
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].MembershipType, Is.Not.Null);
        Assert.That(result[0].MembershipType!.Name, Is.EqualTo("Premium"));
        Assert.That(result[0].ClubLocation, Is.Not.Null);
        Assert.That(result[0].ClubLocation!.LocationName, Is.EqualTo("Main Office"));
    }

    #endregion

    #region GetMembersWithCustomFieldsAsync Tests (6 tests)

    [Test]
    public async Task GetMembersWithCustomFieldsAsync_NoFilter_ReturnsAllMembers()
    {
        // Arrange
        var club = await SeedClubAsync();
        await SeedMembersAsync(club.Id, 5);

        // Act
        var result = await _repository.GetMembersWithCustomFieldsAsync(club.Id, new List<int>());

        // Assert
        Assert.That(result.Count, Is.EqualTo(5));
    }

    [Test]
    public async Task GetMembersWithCustomFieldsAsync_WithCustomFieldFilter_FiltersCorrectly()
    {
        // Arrange
        var club = await SeedClubAsync();
        var members = await SeedMembersAsync(club.Id, 3);

        // Create custom field
        var customField = new MemberCustomField
        {
            Id = 1,
            ClubId = club.Id,
            FieldName = "Dietary Restrictions",
            FieldType = "Text"
        };
        Context.MemberCustomFields.Add(customField);
        await Context.SaveChangesAsync();

        // Assign custom field value to member 1 only
        var customValue = new MemberCustomFieldValue
        {
            Id = 1,
            MemberId = members[0].Id,
            CustomFieldId = customField.Id,
            Value = "Vegetarian"
        };
        Context.MemberCustomFieldValues.Add(customValue);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetMembersWithCustomFieldsAsync(club.Id, new List<int> { customField.Id });

        // Assert
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].Id, Is.EqualTo(members[0].Id));
    }

    [Test]
    public async Task GetMembersWithCustomFieldsAsync_IncludesCustomValues()
    {
        // Arrange
        var club = await SeedClubAsync();
        var members = await SeedMembersAsync(club.Id, 1);

        var customField = new MemberCustomField
        {
            Id = 1,
            ClubId = club.Id,
            FieldName = "Department",
            FieldType = "Text"
        };
        Context.MemberCustomFields.Add(customField);

        var customValue = new MemberCustomFieldValue
        {
            Id = 1,
            MemberId = members[0].Id,
            CustomFieldId = customField.Id,
            Value = "Engineering"
        };
        Context.MemberCustomFieldValues.Add(customValue);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetMembersWithCustomFieldsAsync(club.Id, new List<int>());

        // Assert
        Assert.That(result[0].CustomFieldValues, Is.Not.Empty);
        Assert.That(result[0].CustomFieldValues.First().CustomField, Is.Not.Null);
        Assert.That(result[0].CustomFieldValues.First().CustomField!.FieldName, Is.EqualTo("Department"));
    }

    [Test]
    public async Task GetMembersWithCustomFieldsAsync_MultipleCustomFields_FiltersCorrectly()
    {
        // Arrange
        var club = await SeedClubAsync();
        var members = await SeedMembersAsync(club.Id, 5);

        var field1 = new MemberCustomField { Id = 1, ClubId = club.Id, FieldName = "Skill", FieldType = "Text" };
        var field2 = new MemberCustomField { Id = 2, ClubId = club.Id, FieldName = "Experience", FieldType = "Number" };
        Context.MemberCustomFields.AddRange(field1, field2);
        await Context.SaveChangesAsync();

        // Member 1 has field 1
        Context.MemberCustomFieldValues.Add(new MemberCustomFieldValue
        {
            Id = 1,
            MemberId = members[0].Id,
            CustomFieldId = field1.Id,
            Value = "C#"
        });

        // Member 2 has field 2
        Context.MemberCustomFieldValues.Add(new MemberCustomFieldValue
        {
            Id = 2,
            MemberId = members[1].Id,
            CustomFieldId = field2.Id,
            Value = "5"
        });

        // Member 3 has both fields
        Context.MemberCustomFieldValues.AddRange(
            new MemberCustomFieldValue
            {
                Id = 3,
                MemberId = members[2].Id,
                CustomFieldId = field1.Id,
                Value = "Python"
            },
            new MemberCustomFieldValue
            {
                Id = 4,
                MemberId = members[2].Id,
                CustomFieldId = field2.Id,
                Value = "3"
            }
        );
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetMembersWithCustomFieldsAsync(
            club.Id,
            new List<int> { field1.Id, field2.Id });

        // Assert
        Assert.That(result.Count, Is.EqualTo(3)); // Members 1, 2, and 3
    }

    [Test]
    public async Task GetMembersWithCustomFieldsAsync_NullCustomFieldIds_ReturnsAllMembers()
    {
        // Arrange
        var club = await SeedClubAsync();
        await SeedMembersAsync(club.Id, 5);

        // Act
        var result = await _repository.GetMembersWithCustomFieldsAsync(club.Id, null!);

        // Assert
        Assert.That(result.Count, Is.EqualTo(5));
    }

    [Test]
    public async Task GetMembersWithCustomFieldsAsync_OrdersByFullName()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Create membership type
        var membershipType = new MembershipType { Id = 1, ClubId = club.Id, Name = "Standard", DuesAmount = 100m, IsActive = true };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        // Create members with specific names for ordering test
        var memberC = new Member { Id = 1, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Charlie", Email = "c@test.com", Status = "Active", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var memberA = new Member { Id = 2, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Alice", Email = "a@test.com", Status = "Active", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var memberB = new Member { Id = 3, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Bob", Email = "b@test.com", Status = "Active", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        Context.Members.AddRange(memberC, memberA, memberB);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetMembersWithCustomFieldsAsync(club.Id, new List<int>());

        // Assert
        Assert.That(result, Is.Ordered.By(nameof(Member.FullName)));
        Assert.That(result[0].FullName, Is.EqualTo("Alice"));
        Assert.That(result[1].FullName, Is.EqualTo("Bob"));
        Assert.That(result[2].FullName, Is.EqualTo("Charlie"));
    }

    #endregion

    #region GetMembersWithAttendanceAsync Tests (5 tests)

    [Test]
    public async Task GetMembersWithAttendanceAsync_IncludesAttendanceData()
    {
        // Arrange
        var club = await SeedClubAsync();
        var members = await SeedMembersAsync(club.Id, 2);
        var events = await SeedEventsAsync(club.Id, 1);

        await SeedAttendanceAsync(events[0].Id, new List<int> { members[0].Id, members[1].Id });

        // Act
        var result = await _repository.GetMembersWithAttendanceAsync(club.Id);

        // Assert
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result[0].EventAttendances, Is.Not.Empty);
        Assert.That(result[0].EventAttendances.First().Event, Is.Not.Null);
    }

    [Test]
    public async Task GetMembersWithAttendanceAsync_IncludesRsvpData()
    {
        // Arrange
        var club = await SeedClubAsync();
        var members = await SeedMembersAsync(club.Id, 2);
        var events = await SeedEventsAsync(club.Id, 1);

        await SeedRsvpsAsync(events[0].Id, new List<int> { members[0].Id, members[1].Id });

        // Act
        var result = await _repository.GetMembersWithAttendanceAsync(club.Id);

        // Assert
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result[0].EventRsvps, Is.Not.Empty);
        Assert.That(result[0].EventRsvps.First().Event, Is.Not.Null);
    }

    [Test]
    public async Task GetMembersWithAttendanceAsync_NoAttendance_ReturnsMembers()
    {
        // Arrange
        var club = await SeedClubAsync();
        await SeedMembersAsync(club.Id, 3);

        // Act
        var result = await _repository.GetMembersWithAttendanceAsync(club.Id);

        // Assert
        Assert.That(result.Count, Is.EqualTo(3));
        Assert.That(result, Is.All.Property(nameof(Member.EventAttendances)).Empty);
    }

    [Test]
    public async Task GetMembersWithAttendanceAsync_MultipleEvents_IncludesAllAttendance()
    {
        // Arrange
        var club = await SeedClubAsync();
        var members = await SeedMembersAsync(club.Id, 1);
        var events = await SeedEventsAsync(club.Id, 3);

        // Member attended all 3 events
        foreach (var evt in events)
        {
            await SeedAttendanceAsync(evt.Id, new List<int> { members[0].Id });
        }

        // Act
        var result = await _repository.GetMembersWithAttendanceAsync(club.Id);

        // Assert
        Assert.That(result[0].EventAttendances.Count, Is.EqualTo(3));
    }

    [Test]
    public async Task GetMembersWithAttendanceAsync_OrdersByFullName()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Create membership type
        var membershipType = new MembershipType { Id = 1, ClubId = club.Id, Name = "Standard", DuesAmount = 100m, IsActive = true };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        var memberZ = new Member { Id = 1, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Zoe", Email = "z@test.com", Status = "Active", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var memberM = new Member { Id = 2, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Mike", Email = "m@test.com", Status = "Active", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        Context.Members.AddRange(memberZ, memberM);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetMembersWithAttendanceAsync(club.Id);

        // Assert
        Assert.That(result, Is.Ordered.By(nameof(Member.FullName)));
        Assert.That(result[0].FullName, Is.EqualTo("Mike"));
        Assert.That(result[1].FullName, Is.EqualTo("Zoe"));
    }

    #endregion

    #region GetFilteredMembersAsync Tests (8 tests)

    [Test]
    public async Task GetFilteredMembersAsync_NoFilters_ReturnsAllMembers()
    {
        // Arrange
        var club = await SeedClubAsync();
        await SeedMembersAsync(club.Id, 5);

        // Act
        var result = await _repository.GetFilteredMembersAsync(
            club.Id,
            dateFrom: null,
            dateTo: null,
            membershipTypeFilter: null,
            statusFilter: null,
            includeCustomFields: false,
            customFieldIds: new List<int>(),
            includeAttendanceStats: false);

        // Assert
        Assert.That(result.Count, Is.EqualTo(5));
    }

    [Test]
    public async Task GetFilteredMembersAsync_WithMembershipTypeFilter_FiltersCorrectly()
    {
        // Arrange
        var club = await SeedClubAsync();

        var membershipType1 = new MembershipType { Id = 1, ClubId = club.Id, Name = "Premium", DuesAmount = 100m };
        var membershipType2 = new MembershipType { Id = 2, ClubId = club.Id, Name = "Basic", DuesAmount = 50m };
        Context.MembershipTypes.AddRange(membershipType1, membershipType2);
        await Context.SaveChangesAsync();

        var member1 = new Member { Id = 1, ClubId = club.Id, FullName = "Premium User", Email = "premium@test.com", MembershipTypeId = 1, JoinedAt = DateTime.UtcNow };
        var member2 = new Member { Id = 2, ClubId = club.Id, FullName = "Basic User", Email = "basic@test.com", MembershipTypeId = 2, JoinedAt = DateTime.UtcNow };
        Context.Members.AddRange(member1, member2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFilteredMembersAsync(
            club.Id,
            null, null,
            membershipTypeFilter: "Premium",
            null,
            false,
            new List<int>(),
            false);

        // Assert
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].MembershipType!.Name, Is.EqualTo("Premium"));
    }

    [Test]
    public async Task GetFilteredMembersAsync_WithStatusFilter_FiltersCorrectly()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Create membership type
        var membershipType = new MembershipType { Id = 1, ClubId = club.Id, Name = "Standard", DuesAmount = 100m, IsActive = true };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        var activeM = new Member { Id = 1, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Active", Email = "a@test.com", Status = "Active", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var inactiveM = new Member { Id = 2, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Inactive", Email = "i@test.com", Status = "Inactive", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        Context.Members.AddRange(activeM, inactiveM);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFilteredMembersAsync(
            club.Id,
            null, null,
            null,
            statusFilter: "Active",
            false,
            new List<int>(),
            false);

        // Assert
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].Status, Is.EqualTo("Active"));
    }

    [Test]
    public async Task GetFilteredMembersAsync_WithIncludeCustomFields_IncludesCustomFieldData()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Create membership type
        var membershipType = new MembershipType { Id = 1, ClubId = club.Id, Name = "Standard", DuesAmount = 100m, IsActive = true };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        var member = new Member { Id = 1, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Test", Email = "test@test.com", Status = "Active", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        Context.Members.Add(member);

        var customField = new MemberCustomField { Id = 1, ClubId = club.Id, FieldName = "Role", FieldType = "Text" };
        Context.MemberCustomFields.Add(customField);

        var customValue = new MemberCustomFieldValue
        {
            Id = 1,
            MemberId = member.Id,
            CustomFieldId = customField.Id,
            Value = "Developer"
        };
        Context.MemberCustomFieldValues.Add(customValue);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFilteredMembersAsync(
            club.Id,
            null, null,
            null, null,
            includeCustomFields: true,
            customFieldIds: new List<int> { customField.Id },
            false);

        // Assert
        Assert.That(result[0].CustomFieldValues, Is.Not.Empty);
        Assert.That(result[0].CustomFieldValues.First().CustomField, Is.Not.Null);
    }

    [Test]
    public async Task GetFilteredMembersAsync_WithIncludeAttendanceStats_IncludesAttendanceData()
    {
        // Arrange
        var club = await SeedClubAsync();
        var members = await SeedMembersAsync(club.Id, 1);
        var events = await SeedEventsAsync(club.Id, 1);
        await SeedAttendanceAsync(events[0].Id, new List<int> { members[0].Id });

        // Act
        var result = await _repository.GetFilteredMembersAsync(
            club.Id,
            null, null,
            null, null,
            false,
            new List<int>(),
            includeAttendanceStats: true);

        // Assert
        Assert.That(result[0].EventAttendances, Is.Not.Empty);
        Assert.That(result[0].EventAttendances.First().Event, Is.Not.Null);
    }

    [Test]
    public async Task GetFilteredMembersAsync_WithDateRange_FiltersCorrectly()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Create membership type
        var membershipType = new MembershipType { Id = 1, ClubId = club.Id, Name = "Standard", DuesAmount = 100m, IsActive = true };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        var oldMember = new Member { Id = 1, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Old", Email = "old@test.com", Status = "Active", JoinDate = DateTime.UtcNow.AddDays(-200), JoinedAt = DateTime.UtcNow.AddDays(-200), CreatedAt = DateTime.UtcNow.AddDays(-200), UpdatedAt = DateTime.UtcNow };
        var newMember = new Member { Id = 2, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "New", Email = "new@test.com", Status = "Active", JoinDate = DateTime.UtcNow.AddDays(-50), JoinedAt = DateTime.UtcNow.AddDays(-50), CreatedAt = DateTime.UtcNow.AddDays(-50), UpdatedAt = DateTime.UtcNow };
        Context.Members.AddRange(oldMember, newMember);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFilteredMembersAsync(
            club.Id,
            dateFrom: DateTime.UtcNow.AddDays(-100),
            dateTo: DateTime.UtcNow,
            null, null,
            false,
            new List<int>(),
            false);

        // Assert
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].FullName, Is.EqualTo("New"));
    }

    [Test]
    public async Task GetFilteredMembersAsync_CombinedFilters_AppliesAll()
    {
        // Arrange
        var club = await SeedClubAsync();

        var membershipType = new MembershipType { Id = 1, ClubId = club.Id, Name = "Premium", DuesAmount = 100m };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        // Matching member (Premium, Active, recent join)
        var matchingMember = new Member
        {
            Id = 1,
            ClubId = club.Id,
            FullName = "Match",
            Email = "match@test.com",
            MembershipTypeId = 1,
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddDays(-30),
            JoinedAt = DateTime.UtcNow.AddDays(-30)
        };

        // Non-matching member (Premium but Inactive)
        var nonMatchingMember = new Member
        {
            Id = 2,
            ClubId = club.Id,
            FullName = "No Match",
            Email = "nomatch@test.com",
            MembershipTypeId = 1,
            Status = "Inactive",
            JoinDate = DateTime.UtcNow.AddDays(-30),
            JoinedAt = DateTime.UtcNow.AddDays(-30)
        };

        Context.Members.AddRange(matchingMember, nonMatchingMember);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFilteredMembersAsync(
            club.Id,
            dateFrom: DateTime.UtcNow.AddDays(-60),
            dateTo: DateTime.UtcNow,
            membershipTypeFilter: "Premium",
            statusFilter: "Active",
            false,
            new List<int>(),
            false);

        // Assert
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].FullName, Is.EqualTo("Match"));
    }

    [Test]
    public async Task GetFilteredMembersAsync_OrdersByFullName()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Create membership type
        var membershipType = new MembershipType { Id = 1, ClubId = club.Id, Name = "Standard", DuesAmount = 100m, IsActive = true };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        var memberB = new Member { Id = 1, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Beta", Email = "b@test.com", Status = "Active", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var memberA = new Member { Id = 2, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Alpha", Email = "a@test.com", Status = "Active", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        Context.Members.AddRange(memberB, memberA);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFilteredMembersAsync(
            club.Id,
            null, null,
            null, null,
            false,
            new List<int>(),
            false);

        // Assert
        Assert.That(result, Is.Ordered.By(nameof(Member.FullName)));
        Assert.That(result[0].FullName, Is.EqualTo("Alpha"));
    }

    #endregion

    #region GetMemberStatisticsAsync Tests (5 tests)

    [Test]
    public async Task GetMemberStatisticsAsync_WithMembers_ReturnsCorrectCounts()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Create membership type
        var membershipType = new MembershipType { Id = 1, ClubId = club.Id, Name = "Standard", DuesAmount = 100m, IsActive = true };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        var activeMember = new Member { Id = 1, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Active", Email = "a@test.com", Status = "Active", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var inactiveMember = new Member { Id = 2, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Inactive", Email = "i@test.com", Status = "Inactive", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var suspendedMember = new Member { Id = 3, ClubId = club.Id, MembershipTypeId = membershipType.Id, FullName = "Suspended", Email = "s@test.com", Status = "Suspended", JoinDate = DateTime.UtcNow, JoinedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        Context.Members.AddRange(activeMember, inactiveMember, suspendedMember);
        await Context.SaveChangesAsync();

        // Act
        var resultObj = await _repository.GetMemberStatisticsAsync(club.Id);
        dynamic result = resultObj;

        // Assert - Use reflection to access anonymous type properties
        var totalMembers = (int)resultObj.GetType().GetProperty("TotalMembers")!.GetValue(resultObj)!;
        var activeMembers = (int)resultObj.GetType().GetProperty("ActiveMembers")!.GetValue(resultObj)!;
        var inactiveMembers = (int)resultObj.GetType().GetProperty("InactiveMembers")!.GetValue(resultObj)!;
        var suspendedMembers = (int)resultObj.GetType().GetProperty("SuspendedMembers")!.GetValue(resultObj)!;

        Assert.That(totalMembers, Is.EqualTo(3));
        Assert.That(activeMembers, Is.EqualTo(1));
        Assert.That(inactiveMembers, Is.EqualTo(1));
        Assert.That(suspendedMembers, Is.EqualTo(1));
    }

    [Test]
    public async Task GetMemberStatisticsAsync_NewMembersThisMonth_CountsCorrectly()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Create membership type
        var membershipType = new MembershipType { Id = 1, ClubId = club.Id, Name = "Standard", DuesAmount = 100m, IsActive = true };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        var thisMonthMember = new Member
        {
            Id = 1,
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "This Month",
            Email = "tm@test.com",
            JoinDate = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var lastMonthMember = new Member
        {
            Id = 2,
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Last Month",
            Email = "lm@test.com",
            JoinDate = DateTime.UtcNow.AddMonths(-1),
            JoinedAt = DateTime.UtcNow.AddMonths(-1),
            Status = "Active",
            CreatedAt = DateTime.UtcNow.AddMonths(-1),
            UpdatedAt = DateTime.UtcNow.AddMonths(-1)
        };

        Context.Members.AddRange(thisMonthMember, lastMonthMember);
        await Context.SaveChangesAsync();

        // Act
        var resultObj = await _repository.GetMemberStatisticsAsync(club.Id);

        // Assert
        var newMembersThisMonth = (int)resultObj.GetType().GetProperty("NewMembersThisMonth")!.GetValue(resultObj)!;
        Assert.That(newMembersThisMonth, Is.EqualTo(1));
    }

    [Test]
    public async Task GetMemberStatisticsAsync_DuesPaid_CountsCorrectly()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Create membership type
        var membershipType = new MembershipType { Id = 1, ClubId = club.Id, Name = "Standard", DuesAmount = 100m, IsActive = true };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        var paidMember = new Member
        {
            Id = 1,
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Paid",
            Email = "paid@test.com",
            DuesPaidUntil = DateTime.UtcNow.AddMonths(1),
            JoinDate = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var overdueMember = new Member
        {
            Id = 2,
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Overdue",
            Email = "overdue@test.com",
            DuesPaidUntil = DateTime.UtcNow.AddDays(-1),
            JoinDate = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var noDuesMember = new Member
        {
            Id = 3,
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "No Dues",
            Email = "nodues@test.com",
            DuesPaidUntil = null,
            JoinDate = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Context.Members.AddRange(paidMember, overdueMember, noDuesMember);
        await Context.SaveChangesAsync();

        // Act
        var resultObj = await _repository.GetMemberStatisticsAsync(club.Id);

        // Assert
        var membersWithDuesPaid = (int)resultObj.GetType().GetProperty("MembersWithDuesPaid")!.GetValue(resultObj)!;
        var membersWithDuesOverdue = (int)resultObj.GetType().GetProperty("MembersWithDuesOverdue")!.GetValue(resultObj)!;
        Assert.That(membersWithDuesPaid, Is.EqualTo(1));
        Assert.That(membersWithDuesOverdue, Is.EqualTo(2));
    }

    [Test]
    public async Task GetMemberStatisticsAsync_AverageMembershipDuration_CalculatesCorrectly()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Create membership type
        var membershipType = new MembershipType { Id = 1, ClubId = club.Id, Name = "Standard", DuesAmount = 100m, IsActive = true };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        var member1 = new Member
        {
            Id = 1,
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Old",
            Email = "old@test.com",
            JoinDate = DateTime.UtcNow.AddDays(-100),
            JoinedAt = DateTime.UtcNow.AddDays(-100),
            Status = "Active",
            CreatedAt = DateTime.UtcNow.AddDays(-100),
            UpdatedAt = DateTime.UtcNow
        };

        var member2 = new Member
        {
            Id = 2,
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "New",
            Email = "new@test.com",
            JoinDate = DateTime.UtcNow.AddDays(-50),
            JoinedAt = DateTime.UtcNow.AddDays(-50),
            Status = "Active",
            CreatedAt = DateTime.UtcNow.AddDays(-50),
            UpdatedAt = DateTime.UtcNow
        };

        Context.Members.AddRange(member1, member2);
        await Context.SaveChangesAsync();

        // Act
        var resultObj = await _repository.GetMemberStatisticsAsync(club.Id);

        // Assert
        var avgDuration = (double)resultObj.GetType().GetProperty("AverageMembershipDurationDays")!.GetValue(resultObj)!;
        var expected = (100 + 50) / 2.0; // Average of 100 and 50 days
        Assert.That(avgDuration, Is.EqualTo(expected).Within(1)); // Within 1 day tolerance
    }

    [Test]
    public async Task GetMemberStatisticsAsync_NoMembers_ReturnsZeros()
    {
        // Arrange
        var club = await SeedClubAsync();

        // Act
        var resultObj = await _repository.GetMemberStatisticsAsync(club.Id);

        // Assert
        var totalMembers = (int)resultObj.GetType().GetProperty("TotalMembers")!.GetValue(resultObj)!;
        var activeMembers = (int)resultObj.GetType().GetProperty("ActiveMembers")!.GetValue(resultObj)!;
        var inactiveMembers = (int)resultObj.GetType().GetProperty("InactiveMembers")!.GetValue(resultObj)!;
        var suspendedMembers = (int)resultObj.GetType().GetProperty("SuspendedMembers")!.GetValue(resultObj)!;
        var newMembersThisMonth = (int)resultObj.GetType().GetProperty("NewMembersThisMonth")!.GetValue(resultObj)!;
        var avgDuration = (double)resultObj.GetType().GetProperty("AverageMembershipDurationDays")!.GetValue(resultObj)!;

        Assert.That(totalMembers, Is.EqualTo(0));
        Assert.That(activeMembers, Is.EqualTo(0));
        Assert.That(inactiveMembers, Is.EqualTo(0));
        Assert.That(suspendedMembers, Is.EqualTo(0));
        Assert.That(newMembersThisMonth, Is.EqualTo(0));
        Assert.That(avgDuration, Is.EqualTo(0));
    }

    #endregion
}
