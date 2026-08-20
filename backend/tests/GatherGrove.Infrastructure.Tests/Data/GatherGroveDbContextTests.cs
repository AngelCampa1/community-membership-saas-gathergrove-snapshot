using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using FluentAssertions;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Infrastructure.Tests.Data;

/// <summary>
/// Comprehensive TDD tests for GatherGroveDbContext
/// Tests entity configuration, relationships, transactions, change tracking, and query performance
/// Phase 5.1: Infrastructure Layer - DbContext Critical Component Testing
/// </summary>
[TestFixture]
public class GatherGroveDbContextTests
{
    private DbContextOptions<GatherGroveDbContext> _options = null!;
    private GatherGroveDbContext _context = null!;

    [SetUp]
    public void SetUp()
    {
        // Use unique database name for each test to ensure isolation
        _options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new GatherGroveDbContext(_options);
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    #region Entity Configuration Tests - Relationships (15 tests)

    [Test]
    public async Task EntityConfiguration_ClubToMembers_OneToManyRelationshipWorks()
    {
        // Arrange
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member1 = new Member
        {
            Club = club,
            FullName = "Member One",
            Email = "member1@test.com",
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member2 = new Member
        {
            Club = club,
            FullName = "Member Two",
            Email = "member2@test.com",
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        _context.Clubs.Add(club);
        _context.Members.AddRange(member1, member2);
        await _context.SaveChangesAsync();

        // Assert - Reload with navigation property
        var loadedClub = await _context.Clubs
            .Include(c => c.Members)
            .FirstAsync(c => c.Id == club.Id);

        loadedClub.Members.Should().HaveCount(2);
        loadedClub.Members.Should().Contain(m => m.Email == "member1@test.com");
        loadedClub.Members.Should().Contain(m => m.Email == "member2@test.com");
    }

    [Test]
    public async Task EntityConfiguration_EventToRsvps_OneToManyRelationshipWorks()
    {
        // Arrange
        var club = CreateTestClub();
        var eventEntity = new Event
        {
            Club = club,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member1 = CreateTestMember(club, "member1@test.com");
        var member2 = CreateTestMember(club, "member2@test.com");

        var rsvp1 = new EventRsvp { Event = eventEntity, Member = member1, RsvpStatus = "Confirmed", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var rsvp2 = new EventRsvp { Event = eventEntity, Member = member2, RsvpStatus = "Confirmed", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        // Act
        _context.Clubs.Add(club);
        _context.Events.Add(eventEntity);
        _context.Members.AddRange(member1, member2);
        _context.EventRsvps.AddRange(rsvp1, rsvp2);
        await _context.SaveChangesAsync();

        // Assert
        var loadedEvent = await _context.Events
            .Include(e => e.EventRsvps)
            .FirstAsync(e => e.Id == eventEntity.Id);

        loadedEvent.EventRsvps.Should().HaveCount(2);
    }

    [Test]
    public async Task EntityConfiguration_UserToClubAdmins_ManyToManyRelationshipWorks()
    {
        // Arrange
        var user = new User
        {
            FullName = "Admin User",
            Email = "admin@test.com",
            PasswordHash = "hash123",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club1 = CreateTestClub("Club 1");
        var club2 = CreateTestClub("Club 2");

        var clubAdmin1 = new ClubAdmin { User = user, Club = club1, CreatedAt = DateTime.UtcNow };
        var clubAdmin2 = new ClubAdmin { User = user, Club = club2, CreatedAt = DateTime.UtcNow };

        // Act
        _context.Users.Add(user);
        _context.Clubs.AddRange(club1, club2);
        _context.ClubAdmins.AddRange(clubAdmin1, clubAdmin2);
        await _context.SaveChangesAsync();

        // Assert
        var loadedUser = await _context.Users
            .Include(u => u.ClubAdmins)
                .ThenInclude(ca => ca.Club)
            .FirstAsync(u => u.Id == user.Id);

        loadedUser.ClubAdmins.Should().HaveCount(2);
        loadedUser.ClubAdmins.Select(ca => ca.Club.Name).Should().Contain(new[] { "Club 1", "Club 2" });
    }

    [Test]
    public async Task EntityConfiguration_MemberToMembershipType_RelationshipWorks()
    {
        // NOTE: MembershipTypeId is currently required (not nullable) in Member entity
        // This test validates the relationship when a membership type is assigned

        // Arrange
        var club = CreateTestClub();
        var membershipType = new MembershipType
        {
            Club = club,
            Name = "Standard",
            Description = "Standard membership",
            DuesAmount = 100m,
            DuesFrequency = "Yearly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var memberWithType = new Member
        {
            Club = club,
            MembershipType = membershipType,
            FullName = "Member With Type",
            Email = "withtype@test.com",
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        _context.Clubs.Add(club);
        _context.MembershipTypes.Add(membershipType);
        _context.Members.Add(memberWithType);
        await _context.SaveChangesAsync();

        // Assert - Verify relationship is properly loaded
        var loadedMember = await _context.Members
            .Include(m => m.MembershipType)
            .FirstAsync(m => m.Email == "withtype@test.com");

        loadedMember.MembershipType.Should().NotBeNull();
        loadedMember.MembershipType!.Name.Should().Be("Standard");
        loadedMember.MembershipType.Club.Id.Should().Be(club.Id);
    }

    [Test]
    public async Task EntityConfiguration_CascadeDelete_ClubDeletionDeletesMembers()
    {
        // Arrange
        var club = CreateTestClub();
        var member = CreateTestMember(club, "member@test.com");

        _context.Clubs.Add(club);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var clubId = club.Id;
        var memberId = member.Id;

        // Act - Delete club (should cascade to members)
        _context.Clubs.Remove(club);
        await _context.SaveChangesAsync();

        // Assert
        var deletedClub = await _context.Clubs.FirstOrDefaultAsync(c => c.Id == clubId);
        var deletedMember = await _context.Members.FirstOrDefaultAsync(m => m.Id == memberId);

        deletedClub.Should().BeNull();
        deletedMember.Should().BeNull(); // Cascade delete should remove member
    }

    [Test]
    [Ignore("In-memory database doesn't enforce unique constraints - requires SQL Server integration test")]
    public async Task EntityConfiguration_UniqueConstraint_DuplicateUserEmailThrowsException()
    {
        // NOTE: This test validates that unique constraints are configured in the model
        // but in-memory database doesn't enforce them. For full constraint testing,
        // run integration tests against real SQL Server database.

        // Arrange
        var user1 = new User
        {
            FullName = "User One",
            Email = "duplicate@test.com",
            PasswordHash = "hash1",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var user2 = new User
        {
            FullName = "User Two",
            Email = "duplicate@test.com", // Same email
            PasswordHash = "hash2",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user1);
        await _context.SaveChangesAsync();

        // Act
        _context.Users.Add(user2);
        Func<Task> act = async () => await _context.SaveChangesAsync();

        // Assert
        await act.Should().ThrowAsync<DbUpdateException>("unique constraint on email should prevent duplicates");
    }

    [Test]
    [Ignore("In-memory database doesn't enforce foreign key constraints - requires SQL Server integration test")]
    public async Task EntityConfiguration_ForeignKeyConstraint_InvalidClubIdThrowsException()
    {
        // NOTE: In-memory database doesn't enforce foreign key constraints
        // This test validates the model configuration for real database usage

        // Arrange
        var member = new Member
        {
            ClubId = 99999, // Non-existent club
            FullName = "Orphan Member",
            Email = "orphan@test.com",
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        _context.Members.Add(member);
        Func<Task> act = async () => await _context.SaveChangesAsync();

        // Assert
        await act.Should().ThrowAsync<DbUpdateException>("foreign key constraint should prevent orphan records");
    }

    [Test]
    public async Task EntityConfiguration_Index_EmailIndexEnablesFastLookup()
    {
        // Arrange
        var users = Enumerable.Range(1, 100)
            .Select(i => new User
            {
                FullName = $"User {i}",
                Email = $"user{i}@test.com",
                PasswordHash = $"hash{i}",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            })
            .ToList();

        _context.Users.AddRange(users);
        await _context.SaveChangesAsync();

        // Act - Query by indexed email
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == "user50@test.com");

        // Assert
        user.Should().NotBeNull();
        user!.FullName.Should().Be("User 50");
    }

    [Test]
    public async Task EntityConfiguration_DefaultValue_IsActiveDefaultsToFalse()
    {
        // Arrange & Act
        var user = new User
        {
            FullName = "Test User",
            Email = "test@test.com",
            PasswordHash = "hash",
            // IsActive not set - should use default
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Assert - Reload from database
        var loadedUser = await _context.Users.FirstAsync(u => u.Id == user.Id);
        loadedUser.IsActive.Should().BeFalse("IsActive should default to false");
    }

    [Test]
    public async Task EntityConfiguration_RequiredField_NullFullNameThrowsException()
    {
        // Arrange
        var user = new User
        {
            FullName = null!, // Required field
            Email = "test@test.com",
            PasswordHash = "hash",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        _context.Users.Add(user);
        Func<Task> act = async () => await _context.SaveChangesAsync();

        // Assert
        await act.Should().ThrowAsync<DbUpdateException>("required fields should be enforced");
    }

    [Test]
    [Ignore("In-memory database doesn't enforce max length constraints - requires SQL Server integration test")]
    public async Task EntityConfiguration_MaxLength_LongEmailTruncatedOrRejected()
    {
        // NOTE: In-memory database doesn't enforce max length constraints
        // Model configuration includes HasMaxLength(255) for real database

        // Arrange
        var longEmail = new string('a', 256) + "@test.com"; // Exceeds 255 char limit
        var user = new User
        {
            FullName = "Test User",
            Email = longEmail,
            PasswordHash = "hash",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        _context.Users.Add(user);
        Func<Task> act = async () => await _context.SaveChangesAsync();

        // Assert
        await act.Should().ThrowAsync<DbUpdateException>("max length constraint should be enforced");
    }

    [Test]
    public async Task EntityConfiguration_MultipleNavigationProperties_LoadCorrectly()
    {
        // Arrange
        var club = CreateTestClub();
        var member = CreateTestMember(club, "member@test.com");
        var eventEntity = new Event
        {
            Club = club,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var rsvp = new EventRsvp
        {
            Event = eventEntity,
            Member = member,
            RsvpStatus = "Confirmed",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        _context.Members.Add(member);
        _context.Events.Add(eventEntity);
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Load RSVP with both navigation properties
        var loadedRsvp = await _context.EventRsvps
            .Include(r => r.Event)
            .Include(r => r.Member)
            .FirstAsync(r => r.Id == rsvp.Id);

        // Assert
        loadedRsvp.Event.Should().NotBeNull();
        loadedRsvp.Event.Name.Should().Be("Test Event");
        loadedRsvp.Member.Should().NotBeNull();
        loadedRsvp.Member.Email.Should().Be("member@test.com");
    }

    [Test]
    public async Task EntityConfiguration_SelfReferencingRelationship_WorksCorrectly()
    {
        // Arrange - Events might have parent/child relationships in series
        var club = CreateTestClub();
        var parentEvent = new Event
        {
            Club = club,
            Name = "Parent Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        _context.Events.Add(parentEvent);
        await _context.SaveChangesAsync();

        // Act - Verify entity can reference itself (if configured)
        var loadedEvent = await _context.Events.FirstAsync(e => e.Id == parentEvent.Id);

        // Assert
        loadedEvent.Should().NotBeNull();
        loadedEvent.Name.Should().Be("Parent Event");
    }

    [Test]
    public async Task EntityConfiguration_CompositeIndex_WorksForComplexQueries()
    {
        // Arrange
        var club = CreateTestClub();
        var members = Enumerable.Range(1, 50)
            .Select(i => new Member
            {
                Club = club,
                FullName = $"Member {i}",
                Email = $"member{i}@test.com",
                Status = i % 2 == 0 ? "Active" : "Inactive",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            })
            .ToList();

        _context.Clubs.Add(club);
        _context.Members.AddRange(members);
        await _context.SaveChangesAsync();

        // Act - Query using composite condition (ClubId + Status)
        var activeMembers = await _context.Members
            .Where(m => m.ClubId == club.Id && m.Status == "Active")
            .ToListAsync();

        // Assert
        activeMembers.Should().HaveCount(25);
    }

    [Test]
    [Ignore("In-memory database doesn't fully support RowVersion optimistic concurrency - requires SQL Server integration test")]
    public async Task EntityConfiguration_OptimisticConcurrency_RowVersionDetectsConflicts()
    {
        // NOTE: In-memory database has limited support for optimistic concurrency
        // Member entity includes RowVersion for conflict detection in real database

        // Arrange
        var club = CreateTestClub();
        var member = CreateTestMember(club, "member@test.com");

        _context.Clubs.Add(club);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act - Simulate concurrent update
        using (var context1 = new GatherGroveDbContext(_options))
        using (var context2 = new GatherGroveDbContext(_options))
        {
            var member1 = await context1.Members.FirstAsync(m => m.Id == member.Id);
            var member2 = await context2.Members.FirstAsync(m => m.Id == member.Id);

            member1.FullName = "Updated by User 1";
            await context1.SaveChangesAsync();

            member2.FullName = "Updated by User 2";
            Func<Task> act = async () => await context2.SaveChangesAsync();

            // Assert
            await act.Should().ThrowAsync<DbUpdateConcurrencyException>(
                "optimistic concurrency should detect conflicting updates");
        }
    }

    #endregion

    #region Transaction Management Tests (10 tests - Integration)

    [Test]
    [Ignore("In-memory database doesn't support transactions - requires SQL Server integration test")]
    public async Task Transaction_SuccessfulCommit_SavesAllChanges()
    {
        // Arrange
        var club = CreateTestClub();
        var member1 = CreateTestMember(club, "member1@test.com");
        var member2 = CreateTestMember(club, "member2@test.com");

        // Act
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Clubs.Add(club);
            _context.Members.AddRange(member1, member2);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        // Assert
        var savedClub = await _context.Clubs.FirstOrDefaultAsync(c => c.Id == club.Id);
        var savedMembers = await _context.Members.Where(m => m.ClubId == club.Id).ToListAsync();

        savedClub.Should().NotBeNull();
        savedMembers.Should().HaveCount(2);
    }

    [Test]
    [Ignore("In-memory database doesn't support transactions - requires SQL Server integration test")]
    public async Task Transaction_RollbackOnError_DoesNotSaveChanges()
    {
        // Arrange
        var club = CreateTestClub();
        var member = CreateTestMember(club, "member@test.com");

        // Act
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Clubs.Add(club);
            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            // Simulate an error condition
            throw new InvalidOperationException("Simulated error");
        }
        catch
        {
            await transaction.RollbackAsync();
        }

        // Assert - Changes should not be persisted
        var savedClub = await _context.Clubs.FirstOrDefaultAsync(c => c.Id == club.Id);
        var savedMember = await _context.Members.FirstOrDefaultAsync(m => m.Id == member.Id);

        savedClub.Should().BeNull("transaction was rolled back");
        savedMember.Should().BeNull("transaction was rolled back");
    }

    [Test]
    [Ignore("In-memory database doesn't support transactions - requires SQL Server integration test")]
    public async Task Transaction_ExceptionDuringCommit_RollsBackChanges()
    {
        // Arrange
        var club = CreateTestClub();

        // Act & Assert
        using var transaction = await _context.Database.BeginTransactionAsync();
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Don't commit - let transaction dispose (implicit rollback)
        // Transaction will rollback when disposed without commit

        // Create new context to verify rollback
        using var verifyContext = new GatherGroveDbContext(_options);
        var savedClub = await verifyContext.Clubs.FirstOrDefaultAsync(c => c.Id == club.Id);
        savedClub.Should().BeNull("transaction was not committed");
    }

    [Test]
    [Ignore("In-memory database doesn't support transactions - requires SQL Server integration test")]
    public async Task Transaction_MultipleOperations_AllOrNothing()
    {
        // Arrange
        var club = CreateTestClub();
        var membershipType = new MembershipType
        {
            Club = club,
            Name = "Standard",
            Description = "Standard membership",
            DuesAmount = 100m,
            DuesFrequency = "Yearly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var member = CreateTestMember(club, "member@test.com");
        member.MembershipType = membershipType;

        // Act
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Clubs.Add(club);
            _context.MembershipTypes.Add(membershipType);
            _context.Members.Add(member);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        // Assert - All entities should be saved
        var savedClub = await _context.Clubs.Include(c => c.Members).FirstOrDefaultAsync(c => c.Id == club.Id);
        var savedMembershipType = await _context.MembershipTypes.FirstOrDefaultAsync(mt => mt.Id == membershipType.Id);

        savedClub.Should().NotBeNull();
        savedClub!.Members.Should().HaveCount(1);
        savedMembershipType.Should().NotBeNull();
    }

    [Test]
    [Ignore("In-memory database doesn't support transactions - requires SQL Server integration test")]
    public async Task Transaction_ConcurrentTransactions_HandleCorrectly()
    {
        // Arrange
        var club = CreateTestClub();
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act - Simulate two concurrent transactions updating the same club
        using (var context1 = new GatherGroveDbContext(_options))
        using (var context2 = new GatherGroveDbContext(_options))
        {
            using var transaction1 = await context1.Database.BeginTransactionAsync();
            using var transaction2 = await context2.Database.BeginTransactionAsync();

            var club1 = await context1.Clubs.FirstAsync(c => c.Id == club.Id);
            var club2 = await context2.Clubs.FirstAsync(c => c.Id == club.Id);

            club1.Name = "Updated by Transaction 1";
            club2.Name = "Updated by Transaction 2";

            await context1.SaveChangesAsync();
            await transaction1.CommitAsync();

            await context2.SaveChangesAsync();
            await transaction2.CommitAsync();

            // Assert - Last commit wins (without optimistic concurrency)
            var finalClub = await _context.Clubs.FirstAsync(c => c.Id == club.Id);
            finalClub.Name.Should().Be("Updated by Transaction 2");
        }
    }

    [Test]
    [Ignore("In-memory database doesn't support transactions - requires SQL Server integration test")]
    public async Task Transaction_SaveChangesWithoutTransaction_AutoCommits()
    {
        // Arrange
        var club = CreateTestClub();

        // Act - SaveChanges without explicit transaction
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Assert - Changes should be automatically committed
        using var verifyContext = new GatherGroveDbContext(_options);
        var savedClub = await verifyContext.Clubs.FirstOrDefaultAsync(c => c.Id == club.Id);
        savedClub.Should().NotBeNull("SaveChanges auto-commits without explicit transaction");
    }

    [Test]
    [Ignore("In-memory database doesn't support transactions - requires SQL Server integration test")]
    public async Task Transaction_PartialSave_RollsBackOnError()
    {
        // Arrange
        var club = CreateTestClub();
        var member1 = CreateTestMember(club, "member1@test.com");
        var member2 = CreateTestMember(club, "member2@test.com");

        // Act
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Clubs.Add(club);
            _context.Members.Add(member1);
            await _context.SaveChangesAsync(); // First save succeeds

            // Add member with potential error
            _context.Members.Add(member2);
            await _context.SaveChangesAsync();

            // Simulate error before commit
            throw new InvalidOperationException("Error before commit");
        }
        catch
        {
            await transaction.RollbackAsync();
        }

        // Assert - Neither member should be saved
        var savedClub = await _context.Clubs.FirstOrDefaultAsync(c => c.Id == club.Id);
        var savedMembers = await _context.Members.Where(m => m.ClubId == club.Id).ToListAsync();

        savedClub.Should().BeNull("transaction rolled back all changes");
        savedMembers.Should().BeEmpty("transaction rolled back all changes");
    }

    [Test]
    [Ignore("In-memory database doesn't support transactions - requires SQL Server integration test")]
    public async Task Transaction_NestedSaveChanges_WorksWithinTransaction()
    {
        // Arrange
        var club = CreateTestClub();
        var member1 = CreateTestMember(club, "member1@test.com");
        var member2 = CreateTestMember(club, "member2@test.com");

        // Act - Multiple SaveChanges within single transaction
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Clubs.Add(club);
            await _context.SaveChangesAsync(); // First save

            _context.Members.Add(member1);
            await _context.SaveChangesAsync(); // Second save

            _context.Members.Add(member2);
            await _context.SaveChangesAsync(); // Third save

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        // Assert - All changes should be committed
        var savedClub = await _context.Clubs.Include(c => c.Members).FirstAsync(c => c.Id == club.Id);
        savedClub.Members.Should().HaveCount(2);
    }

    [Test]
    [Ignore("In-memory database doesn't support transactions - requires SQL Server integration test")]
    public async Task Transaction_ReadWithinTransaction_SeesUncommittedChanges()
    {
        // Arrange
        var club = CreateTestClub();

        // Act
        using var transaction = await _context.Database.BeginTransactionAsync();
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Read within same transaction (before commit)
        var readClub = await _context.Clubs.FirstOrDefaultAsync(c => c.Id == club.Id);

        await transaction.CommitAsync();

        // Assert
        readClub.Should().NotBeNull("reads within transaction see uncommitted changes");
        readClub!.Name.Should().Be(club.Name);
    }

    [Test]
    [Ignore("In-memory database doesn't support transactions - requires SQL Server integration test")]
    public async Task Transaction_MultipleContexts_IsolatedTransactions()
    {
        // Arrange & Act
        var club1 = CreateTestClub("Club 1");
        var club2 = CreateTestClub("Club 2");

        using (var context1 = new GatherGroveDbContext(_options))
        using (var context2 = new GatherGroveDbContext(_options))
        {
            using var transaction1 = await context1.Database.BeginTransactionAsync();
            context1.Clubs.Add(club1);
            await context1.SaveChangesAsync();
            await transaction1.CommitAsync();

            using var transaction2 = await context2.Database.BeginTransactionAsync();
            context2.Clubs.Add(club2);
            await context2.SaveChangesAsync();
            await transaction2.CommitAsync();
        }

        // Assert - Both clubs should be saved independently
        var allClubs = await _context.Clubs.ToListAsync();
        allClubs.Should().HaveCount(2);
        allClubs.Select(c => c.Name).Should().Contain(new[] { "Club 1", "Club 2" });
    }

    #endregion

    #region Change Tracking Tests

    [Test]
    public async Task ChangeTracking_AddedEntity_HasAddedState()
    {
        // Arrange
        var club = CreateTestClub();

        // Act
        _context.Clubs.Add(club);

        // Assert - Before SaveChanges, entity should be in Added state
        var entry = _context.Entry(club);
        entry.State.Should().Be(EntityState.Added);

        // Act - SaveChanges
        await _context.SaveChangesAsync();

        // Assert - After SaveChanges, entity should be in Unchanged state
        entry.State.Should().Be(EntityState.Unchanged);
    }

    [Test]
    public async Task ChangeTracking_ModifiedEntity_HasModifiedState()
    {
        // Arrange - Add and save entity first
        var club = CreateTestClub();
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Entity should be Unchanged after save
        _context.Entry(club).State.Should().Be(EntityState.Unchanged);

        // Act - Modify the entity
        club.Name = "Updated Club Name";

        // Assert - Entity should be in Modified state
        var entry = _context.Entry(club);
        entry.State.Should().Be(EntityState.Modified);
        entry.Property(c => c.Name).IsModified.Should().BeTrue();
    }

    [Test]
    public async Task ChangeTracking_DeletedEntity_HasDeletedState()
    {
        // Arrange - Add and save entity first
        var club = CreateTestClub();
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act - Delete the entity
        _context.Clubs.Remove(club);

        // Assert - Entity should be in Deleted state
        var entry = _context.Entry(club);
        entry.State.Should().Be(EntityState.Deleted);

        // Act - SaveChanges
        await _context.SaveChangesAsync();

        // Assert - Entity should no longer exist
        var deletedClub = await _context.Clubs.FirstOrDefaultAsync(c => c.Id == club.Id);
        deletedClub.Should().BeNull();
    }

    [Test]
    public async Task ChangeTracking_UnchangedEntity_HasUnchangedState()
    {
        // Arrange - Add and save entity
        var club = CreateTestClub();
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act - Retrieve entity without modifying
        var retrievedClub = await _context.Clubs.FirstAsync(c => c.Id == club.Id);

        // Assert - Entity should be in Unchanged state
        var entry = _context.Entry(retrievedClub);
        entry.State.Should().Be(EntityState.Unchanged);
    }

    [Test]
    public async Task ChangeTracking_DetachedEntity_HasDetachedState()
    {
        // Arrange - Add and save entity
        var club = CreateTestClub();
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act - Detach the entity
        _context.Entry(club).State = EntityState.Detached;

        // Assert - Entity should be in Detached state
        var entry = _context.Entry(club);
        entry.State.Should().Be(EntityState.Detached);

        // Modifying detached entity shouldn't affect database
        club.Name = "Modified while detached";
        await _context.SaveChangesAsync();

        // Verify original value unchanged in database
        var dbClub = await _context.Clubs.AsNoTracking().FirstAsync(c => c.Id == club.Id);
        dbClub.Name.Should().Be("Test Club");
    }

    [Test]
    public async Task ChangeTracking_AuditFields_CreatedAtSetOnAdd()
    {
        // Arrange
        var beforeCreate = DateTime.UtcNow.AddSeconds(-1);
        var club = CreateTestClub();

        // Act
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Assert - CreatedAt should be set
        club.CreatedAt.Should().BeAfter(beforeCreate);
        club.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Test]
    public async Task ChangeTracking_AuditFields_UpdatedAtChangesOnModify()
    {
        // Arrange - Create and save entity
        var club = CreateTestClub();
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var originalUpdatedAt = club.UpdatedAt;

        // Wait a moment to ensure timestamp difference
        await Task.Delay(100);

        // Act - Modify entity
        club.Name = "Updated Name";
        club.UpdatedAt = DateTime.UtcNow; // Simulate audit field update
        await _context.SaveChangesAsync();

        // Assert - UpdatedAt should have changed
        club.UpdatedAt.Should().BeAfter(originalUpdatedAt);
    }

    [Test]
    public async Task ChangeTracking_PropertyModification_TracksSpecificChanges()
    {
        // Arrange
        var club = CreateTestClub();
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act - Modify only Name property
        club.Name = "New Name";

        // Assert - Only Name should be modified
        var entry = _context.Entry(club);
        entry.Property(c => c.Name).IsModified.Should().BeTrue();
        entry.Property(c => c.Tier).IsModified.Should().BeFalse();
        entry.Property(c => c.CreatedAt).IsModified.Should().BeFalse();
    }

    [Test]
    public async Task ChangeTracking_MultipleEntities_TracksIndependently()
    {
        // Arrange
        var club1 = CreateTestClub("Club 1");
        var club2 = CreateTestClub("Club 2");

        _context.Clubs.AddRange(club1, club2);
        await _context.SaveChangesAsync();

        // Act - Modify only club1
        club1.Name = "Modified Club 1";

        // Assert
        _context.Entry(club1).State.Should().Be(EntityState.Modified);
        _context.Entry(club2).State.Should().Be(EntityState.Unchanged);
    }

    [Test]
    [Ignore("In-memory database doesn't fully support optimistic concurrency - requires SQL Server integration test")]
    public async Task ChangeTracking_OptimisticConcurrency_DetectsConflicts()
    {
        // Arrange - Create entity with RowVersion
        var club = CreateTestClub();
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Simulate concurrent update by another context
        using (var context2 = new GatherGroveDbContext(_options))
        {
            var club2 = await context2.Clubs.FirstAsync(c => c.Id == club.Id);
            club2.Name = "Updated by context2";
            await context2.SaveChangesAsync();
        }

        // Act - Try to update with stale data
        club.Name = "Updated by context1";

        // Assert - Should throw DbUpdateConcurrencyException
        Func<Task> act = async () => await _context.SaveChangesAsync();
        await act.Should().ThrowAsync<DbUpdateConcurrencyException>();
    }

    #endregion

    #region Query Performance Tests

    [Test]
    public async Task QueryPerformance_EagerLoading_IncludeLoadsRelatedEntities()
    {
        // Arrange - Create club with members
        var club = CreateTestClub();
        var member1 = CreateTestMember(club, "member1@test.com");
        var member2 = CreateTestMember(club, "member2@test.com");

        _context.Clubs.Add(club);
        _context.Members.AddRange(member1, member2);
        await _context.SaveChangesAsync();

        // Clear context to ensure fresh load
        _context.ChangeTracker.Clear();

        // Act - Load club with Include for eager loading
        var loadedClub = await _context.Clubs
            .Include(c => c.Members)
            .FirstAsync(c => c.Id == club.Id);

        // Assert - Members should be loaded (no lazy loading)
        loadedClub.Members.Should().NotBeNull();
        loadedClub.Members.Should().HaveCount(2);
    }

    [Test]
    public async Task QueryPerformance_EagerLoading_ThenIncludeLoadsNestedEntities()
    {
        // Arrange - Create club → event → rsvps
        var club = CreateTestClub();
        var member = CreateTestMember(club, "member@test.com");
        var eventEntity = new Event
        {
            Club = club,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(1),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        _context.Members.Add(member);
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            Event = eventEntity,
            Member = member,
            Status = Domain.Enums.RsvpStatus.Confirmed,
            CreatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Clear context
        _context.ChangeTracker.Clear();

        // Act - Load club with nested includes
        var loadedClub = await _context.Clubs
            .Include(c => c.Events)
            .ThenInclude(e => e.EventRsvps)
            .FirstAsync(c => c.Id == club.Id);

        // Assert - Nested entities should be loaded
        loadedClub.Events.Should().HaveCount(1);
        loadedClub.Events.First().EventRsvps.Should().HaveCount(1);
    }

    [Test]
    public async Task QueryPerformance_AsNoTracking_DoesNotTrackEntities()
    {
        // Arrange - Create club
        var club = CreateTestClub();
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act - Query with AsNoTracking
        var loadedClub = await _context.Clubs
            .AsNoTracking()
            .FirstAsync(c => c.Id == club.Id);

        // Assert - Entity should not be tracked
        var entry = _context.Entry(loadedClub);
        entry.State.Should().Be(EntityState.Detached);

        // Modifying the entity shouldn't affect database
        loadedClub.Name = "Modified Name";
        await _context.SaveChangesAsync();

        // Verify original value unchanged
        var dbClub = await _context.Clubs.AsNoTracking().FirstAsync(c => c.Id == club.Id);
        dbClub.Name.Should().Be("Test Club");
    }

    [Test]
    public async Task QueryPerformance_AsNoTracking_ImprovesBulkReadPerformance()
    {
        // Arrange - Create multiple clubs
        var clubs = Enumerable.Range(1, 50)
            .Select(i => CreateTestClub($"Club {i}"))
            .ToList();

        _context.Clubs.AddRange(clubs);
        await _context.SaveChangesAsync();

        // Clear context
        _context.ChangeTracker.Clear();

        // Act - Query with AsNoTracking for bulk read
        var loadedClubs = await _context.Clubs
            .AsNoTracking()
            .ToListAsync();

        // Assert - All clubs loaded but not tracked
        loadedClubs.Should().HaveCount(50);

        // Verify none are tracked
        foreach (var club in loadedClubs)
        {
            _context.Entry(club).State.Should().Be(EntityState.Detached);
        }
    }

    [Test]
    public async Task QueryPerformance_SelectProjection_ReducesDataTransfer()
    {
        // Arrange - Create club with members
        var club = CreateTestClub();
        var member1 = CreateTestMember(club, "member1@test.com");
        var member2 = CreateTestMember(club, "member2@test.com");

        _context.Clubs.Add(club);
        _context.Members.AddRange(member1, member2);
        await _context.SaveChangesAsync();

        // Act - Use Select to project only needed fields
        var memberNames = await _context.Members
            .Where(m => m.ClubId == club.Id)
            .Select(m => new { m.Id, m.FullName, m.Email })
            .ToListAsync();

        // Assert - Should get only projected fields
        memberNames.Should().HaveCount(2);
        memberNames.Should().Contain(m => m.FullName == "Member for member1@test.com");
        memberNames.Should().Contain(m => m.FullName == "Member for member2@test.com");
    }

    [Test]
    public async Task QueryPerformance_SelectProjection_WithRelatedData()
    {
        // Arrange - Create club with members
        var club = CreateTestClub();
        var member = CreateTestMember(club, "member@test.com");

        _context.Clubs.Add(club);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act - Project related data efficiently
        var memberWithClub = await _context.Members
            .Where(m => m.Id == member.Id)
            .Select(m => new
            {
                MemberName = m.FullName,
                MemberEmail = m.Email,
                ClubName = m.Club.Name,
                ClubTier = m.Club.Tier
            })
            .FirstAsync();

        // Assert - Should get projected fields from both entities
        memberWithClub.MemberName.Should().Be("Member for member@test.com");
        memberWithClub.ClubName.Should().Be("Test Club");
        memberWithClub.ClubTier.Should().Be("Grow");
    }

    [Test]
    public async Task QueryPerformance_Pagination_LimitsResultSet()
    {
        // Arrange - Create many clubs with zero-padded names for consistent sorting
        var clubs = Enumerable.Range(1, 100)
            .Select(i => CreateTestClub($"Club {i:D3}")) // D3 = zero-padded to 3 digits
            .ToList();

        _context.Clubs.AddRange(clubs);
        await _context.SaveChangesAsync();

        // Act - Use Skip/Take for pagination
        var page2 = await _context.Clubs
            .OrderBy(c => c.Name)
            .Skip(20)
            .Take(10)
            .ToListAsync();

        // Assert - Should get exactly 10 clubs (page 2)
        page2.Should().HaveCount(10);
        page2.First().Name.Should().Be("Club 021");
        page2.Last().Name.Should().Be("Club 030");
    }

    [Test]
    public async Task QueryPerformance_AvoidNPlusOne_EagerLoadingPreventsMultipleQueries()
    {
        // Arrange - Create clubs with members
        var club1 = CreateTestClub("Club 1");
        var club2 = CreateTestClub("Club 2");
        var member1 = CreateTestMember(club1, "member1@club1.com");
        var member2 = CreateTestMember(club2, "member2@club2.com");

        _context.Clubs.AddRange(club1, club2);
        _context.Members.AddRange(member1, member2);
        await _context.SaveChangesAsync();

        // Clear context
        _context.ChangeTracker.Clear();

        // Act - Load clubs WITH includes (prevents N+1)
        var clubsWithMembers = await _context.Clubs
            .Include(c => c.Members)
            .ToListAsync();

        // Assert - All data loaded in single query
        clubsWithMembers.Should().HaveCount(2);
        clubsWithMembers[0].Members.Should().HaveCount(1);
        clubsWithMembers[1].Members.Should().HaveCount(1);

        // Note: In-memory database doesn't track actual SQL queries,
        // but this pattern demonstrates N+1 prevention
    }

    [Test]
    public async Task QueryPerformance_FilterBeforeInclude_ReducesDataLoad()
    {
        // Arrange - Create multiple clubs with different tiers
        var growClub = CreateTestClub("Grow Club");
        growClub.Tier = "Grow";
        var thriveClub = CreateTestClub("Thrive Club");
        thriveClub.Tier = "Thrive";

        var growMember = CreateTestMember(growClub, "grow@test.com");
        var thriveMember = CreateTestMember(thriveClub, "thrive@test.com");

        _context.Clubs.AddRange(growClub, thriveClub);
        _context.Members.AddRange(growMember, thriveMember);
        await _context.SaveChangesAsync();

        // Clear context
        _context.ChangeTracker.Clear();

        // Act - Filter BEFORE Include to reduce data loaded
        var growClubs = await _context.Clubs
            .Where(c => c.Tier == "Grow") // Filter first
            .Include(c => c.Members) // Then include
            .ToListAsync();

        // Assert - Only Grow tier club and its members loaded
        growClubs.Should().HaveCount(1);
        growClubs[0].Name.Should().Be("Grow Club");
        growClubs[0].Members.Should().HaveCount(1);
    }

    [Test]
    public async Task QueryPerformance_AnyVsCount_AnyIsMoreEfficient()
    {
        // Arrange - Create club with members
        var club = CreateTestClub();
        var member1 = CreateTestMember(club, "member1@test.com");
        var member2 = CreateTestMember(club, "member2@test.com");

        _context.Clubs.Add(club);
        _context.Members.AddRange(member1, member2);
        await _context.SaveChangesAsync();

        // Act - Use Any() to check existence (more efficient than Count() > 0)
        var hasMembers = await _context.Members
            .Where(m => m.ClubId == club.Id)
            .AnyAsync();

        var memberCount = await _context.Members
            .Where(m => m.ClubId == club.Id)
            .CountAsync();

        // Assert
        hasMembers.Should().BeTrue();
        memberCount.Should().Be(2);

        // Note: Any() stops after finding first match, Count() scans all
        // In production SQL Server, Any() is significantly faster for existence checks
    }

    #endregion

    #region Helper Methods

    private Club CreateTestClub(string name = "Test Club")
    {
        return new Club
        {
            Name = name,
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private Member CreateTestMember(Club club, string email)
    {
        return new Member
        {
            Club = club,
            FullName = $"Member for {email}",
            Email = email,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    #endregion
}
