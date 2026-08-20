using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using FluentAssertions;

namespace GatherGrove.Tests.Unit.Services
{
    /// <summary>
    /// TDD Tests for WaitlistService - US-009 Advanced Event Management
    /// RED PHASE: Comprehensive test specifications for advanced waitlist management
    /// Tests cover priority-based waitlists, automatic promotion, and edge cases
    /// </summary>
    [TestFixture]
    public class WaitlistServiceTests
    {
        private GatherGroveDbContext _context;
        private WaitlistService _waitlistService;
        private Mock<ILogger<WaitlistService>> _mockLogger;
        private Mock<INotificationService> _mockNotificationService;
        private Mock<IEventService> _mockEventService;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
                .UseInMemoryDatabase(databaseName: $"WaitlistTestDb_{Guid.NewGuid()}")
                .Options;

            _context = new GatherGroveDbContext(options);
            _mockLogger = new Mock<ILogger<WaitlistService>>();
            _mockNotificationService = new Mock<INotificationService>();
            _mockEventService = new Mock<IEventService>();
            
            // This will fail initially as WaitlistService doesn't exist yet (RED phase)
            _waitlistService = new WaitlistService(
                _context,
                _mockLogger.Object,
                _mockNotificationService.Object,
                _mockEventService.Object
            );
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        #region Add to Waitlist Tests

        [Test]
        public async Task AddToWaitlist_EventAtCapacity_AddsWithCorrectPriority()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 2);
            var member = CreateTestMember(memberId, clubId, "John Doe", "john@test.com");
            
            // Add existing RSVPs to fill capacity
            var existingRsvp1 = CreateTestRsvp(1, eventId, 2, RsvpStatus.Attending);
            var existingRsvp2 = CreateTestRsvp(2, eventId, 3, RsvpStatus.Attending);
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddAsync(member);
            await _context.EventRsvps.AddRangeAsync(existingRsvp1, existingRsvp2);
            await _context.SaveChangesAsync();

            var waitlistRequest = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.Standard,
                NotificationPreferences = new WaitlistNotificationPreferences
                {
                    EmailNotification = true,
                    PushNotification = true,
                    SmsNotification = false
                }
            };

            // Act
            var result = await _waitlistService.AddToWaitlist(clubId, eventId, waitlistRequest);

            // Assert
            result.Should().NotBeNull();
            result.Position.Should().Be(1); // First in waitlist
            result.Priority.Should().Be(WaitlistPriority.Standard);
            result.EstimatedPromotionTime.Should().BeNull(); // Cannot estimate with no historical data
            result.EventId.Should().Be(eventId);
            result.MemberId.Should().Be(memberId);
            result.Status.Should().Be(WaitlistStatus.Active);
        }

        [Test]
        public async Task AddToWaitlist_HighPriorityMember_InsertsAtCorrectPosition()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var standardMemberId = 1;
            var highPriorityMemberId = 2;
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 1);
            var standardMember = CreateTestMember(standardMemberId, clubId, "Standard User", "standard@test.com");
            var highPriorityMember = CreateTestMember(highPriorityMemberId, clubId, "VIP User", "vip@test.com");
            
            // Fill capacity
            var existingRsvp = CreateTestRsvp(1, eventId, 3, RsvpStatus.Attending);
            
            // Add standard priority member to waitlist first
            var existingWaitlist = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = standardMemberId,
                Position = 1,
                Priority = WaitlistPriority.Standard,
                Status = WaitlistStatus.Active,
                AddedAt = DateTime.UtcNow.AddMinutes(-5)
            };
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddRangeAsync(standardMember, highPriorityMember);
            await _context.EventRsvps.AddAsync(existingRsvp);
            await _context.EventWaitlists.AddAsync(existingWaitlist);
            await _context.SaveChangesAsync();

            var waitlistRequest = new AddToWaitlistRequest
            {
                MemberId = highPriorityMemberId,
                Priority = WaitlistPriority.High,
                NotificationPreferences = new WaitlistNotificationPreferences
                {
                    EmailNotification = true,
                    PushNotification = true
                }
            };

            // Act
            var result = await _waitlistService.AddToWaitlist(clubId, eventId, waitlistRequest);

            // Assert
            result.Position.Should().Be(1); // Should be first due to high priority
            
            // Verify standard member moved to position 2
            var updatedStandardWaitlist = await _context.EventWaitlists
                .FirstOrDefaultAsync(w => w.MemberId == standardMemberId);
            updatedStandardWaitlist.Position.Should().Be(2);
        }

        [Test]
        public async Task AddToWaitlist_MemberAlreadyOnWaitlist_ThrowsInvalidOperationException()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 1);
            var member = CreateTestMember(memberId, clubId, "Test User", "test@test.com");
            
            // Member already on waitlist
            var existingWaitlist = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Position = 1,
                Priority = WaitlistPriority.Standard,
                Status = WaitlistStatus.Active,
                AddedAt = DateTime.UtcNow
            };
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddAsync(member);
            await _context.EventWaitlists.AddAsync(existingWaitlist);
            await _context.SaveChangesAsync();

            var waitlistRequest = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.Standard
            };

            // Act & Assert
            var action = async () => await _waitlistService.AddToWaitlist(clubId, eventId, waitlistRequest);
            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*already on the waitlist*");
        }

        [Test]
        public async Task AddToWaitlist_MemberAlreadyRSVPd_ThrowsInvalidOperationException()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 10);
            var member = CreateTestMember(memberId, clubId, "Test User", "test@test.com");
            
            // Member already RSVP'd
            var existingRsvp = CreateTestRsvp(1, eventId, memberId, RsvpStatus.Attending);
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddAsync(member);
            await _context.EventRsvps.AddAsync(existingRsvp);
            await _context.SaveChangesAsync();

            var waitlistRequest = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.Standard
            };

            // Act & Assert
            var action = async () => await _waitlistService.AddToWaitlist(clubId, eventId, waitlistRequest);
            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*already RSVP'd*");
        }

        #endregion

        #region Promote from Waitlist Tests

        [Test]
        public async Task PromoteFromWaitlist_SpotAvailable_PromotesHighestPriority()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 2);
            
            // Create waitlist with mixed priorities
            var standardMember1 = CreateTestMember(1, clubId, "Standard 1", "standard1@test.com");
            var highPriorityMember = CreateTestMember(2, clubId, "VIP", "vip@test.com");
            var standardMember2 = CreateTestMember(3, clubId, "Standard 2", "standard2@test.com");
            
            var waitlist1 = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = 1,
                Position = 2,
                Priority = WaitlistPriority.Standard,
                Status = WaitlistStatus.Active,
                AddedAt = DateTime.UtcNow.AddHours(-2)
            };
            
            var waitlist2 = new EventWaitlist
            {
                Id = 2,
                EventId = eventId,
                MemberId = 2,
                Position = 1,
                Priority = WaitlistPriority.High,
                Status = WaitlistStatus.Active,
                AddedAt = DateTime.UtcNow.AddHours(-1)
            };
            
            var waitlist3 = new EventWaitlist
            {
                Id = 3,
                EventId = eventId,
                MemberId = 3,
                Position = 3,
                Priority = WaitlistPriority.Standard,
                Status = WaitlistStatus.Active,
                AddedAt = DateTime.UtcNow.AddMinutes(-30)
            };
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddRangeAsync(standardMember1, highPriorityMember, standardMember2);
            await _context.EventWaitlists.AddRangeAsync(waitlist1, waitlist2, waitlist3);
            await _context.SaveChangesAsync();

            // Act
            var result = await _waitlistService.PromoteFromWaitlist(clubId, eventId, spotsAvailable: 1);

            // Assert
            result.Should().NotBeNull();
            result.PromotedMembers.Should().HaveCount(1);
            result.PromotedMembers[0].MemberId.Should().Be(2); // High priority member
            result.PromotedMembers[0].NewRsvpStatus.Should().Be(RsvpStatus.Attending);
            
            // Verify waitlist positions updated
            var remainingWaitlist = await _context.EventWaitlists
                .Where(w => w.EventId == eventId && w.Status == WaitlistStatus.Active)
                .OrderBy(w => w.Position)
                .ToListAsync();
            
            remainingWaitlist.Should().HaveCount(2);
            remainingWaitlist[0].MemberId.Should().Be(1); // Now position 1
            remainingWaitlist[1].MemberId.Should().Be(3); // Now position 2
        }

        [Test]
        public async Task PromoteFromWaitlist_MultipleSpots_PromotesCorrectOrder()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 5);
            
            // Create waitlist with different priorities and times
            var members = new List<Member>();
            var waitlists = new List<EventWaitlist>();
            
            for (int i = 1; i <= 5; i++)
            {
                members.Add(CreateTestMember(i, clubId, $"Member {i}", $"member{i}@test.com"));
                
                waitlists.Add(new EventWaitlist
                {
                    Id = i,
                    EventId = eventId,
                    MemberId = i,
                    Position = i,
                    Priority = i % 2 == 0 ? WaitlistPriority.High : WaitlistPriority.Standard,
                    Status = WaitlistStatus.Active,
                    AddedAt = DateTime.UtcNow.AddMinutes(-i * 10)
                });
            }
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddRangeAsync(members);
            await _context.EventWaitlists.AddRangeAsync(waitlists);
            await _context.SaveChangesAsync();

            // Act
            var result = await _waitlistService.PromoteFromWaitlist(clubId, eventId, spotsAvailable: 3);

            // Assert
            result.PromotedMembers.Should().HaveCount(3);
            
            // Should promote high priority members first (2, 4), then earliest standard (1)
            var promotedIds = result.PromotedMembers.Select(p => p.MemberId).ToList();
            promotedIds.Should().ContainInOrder(2, 4, 1); // Priority order with tie-breaking by time
        }

        [Test]
        public async Task PromoteFromWaitlist_EmptyWaitlist_ReturnsEmptyResult()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 5);
            await _context.Events.AddAsync(eventEntity);
            await _context.SaveChangesAsync();

            // Act
            var result = await _waitlistService.PromoteFromWaitlist(clubId, eventId, spotsAvailable: 3);

            // Assert
            result.Should().NotBeNull();
            result.PromotedMembers.Should().BeEmpty();
            result.RemainingWaitlistCount.Should().Be(0);
        }

        #endregion

        #region Waitlist Position Management Tests

        [Test]
        public async Task GetWaitlistPosition_ActiveWaitlist_ReturnsAccuratePosition()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 2;
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 1);
            
            // Create waitlist with 3 members
            var waitlists = new List<EventWaitlist>
            {
                new() { Id = 1, EventId = eventId, MemberId = 1, Position = 1, Priority = WaitlistPriority.Standard, Status = WaitlistStatus.Active, AddedAt = DateTime.UtcNow.AddHours(-3) },
                new() { Id = 2, EventId = eventId, MemberId = 2, Position = 2, Priority = WaitlistPriority.Standard, Status = WaitlistStatus.Active, AddedAt = DateTime.UtcNow.AddHours(-2) },
                new() { Id = 3, EventId = eventId, MemberId = 3, Position = 3, Priority = WaitlistPriority.Standard, Status = WaitlistStatus.Active, AddedAt = DateTime.UtcNow.AddHours(-1) }
            };
            
            await _context.Events.AddAsync(eventEntity);
            await _context.EventWaitlists.AddRangeAsync(waitlists);
            await _context.SaveChangesAsync();

            // Act
            var result = await _waitlistService.GetWaitlistPosition(clubId, eventId, memberId);

            // Assert
            result.Should().NotBeNull();
            result.Position.Should().Be(2);
            result.TotalWaitlistSize.Should().Be(3);
            result.Priority.Should().Be(WaitlistPriority.Standard);
            result.EstimatedWaitTime.Should().BeNull(); // No historical data
        }

        [Test]
        public async Task GetWaitlistPosition_MemberNotOnWaitlist_ReturnsNull()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 99; // Not on waitlist
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 1);
            await _context.Events.AddAsync(eventEntity);
            await _context.SaveChangesAsync();

            // Act
            var result = await _waitlistService.GetWaitlistPosition(clubId, eventId, memberId);

            // Assert
            result.Should().BeNull();
        }

        [Test]
        public async Task UpdateWaitlistPriority_ValidRequest_UpdatesPositionCorrectly()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 2;
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 1);
            
            // Create waitlist with standard priority members
            var waitlists = new List<EventWaitlist>
            {
                new() { Id = 1, EventId = eventId, MemberId = 1, Position = 1, Priority = WaitlistPriority.Standard, Status = WaitlistStatus.Active },
                new() { Id = 2, EventId = eventId, MemberId = 2, Position = 2, Priority = WaitlistPriority.Standard, Status = WaitlistStatus.Active },
                new() { Id = 3, EventId = eventId, MemberId = 3, Position = 3, Priority = WaitlistPriority.Standard, Status = WaitlistStatus.Active }
            };
            
            await _context.Events.AddAsync(eventEntity);
            await _context.EventWaitlists.AddRangeAsync(waitlists);
            await _context.SaveChangesAsync();

            // Act
            var result = await _waitlistService.UpdateWaitlistPriority(clubId, eventId, memberId, WaitlistPriority.High);

            // Assert
            result.Should().NotBeNull();
            result.NewPosition.Should().Be(1); // Should move to front due to high priority
            result.PreviousPosition.Should().Be(2);
            result.Priority.Should().Be(WaitlistPriority.High);
            
            // Verify other positions updated
            var updatedWaitlist = await _context.EventWaitlists
                .Where(w => w.EventId == eventId)
                .OrderBy(w => w.Position)
                .ToListAsync();
            
            updatedWaitlist[0].MemberId.Should().Be(2); // High priority member now first
            updatedWaitlist[1].MemberId.Should().Be(1); // Previous first now second
            updatedWaitlist[2].MemberId.Should().Be(3); // Third remains third
        }

        #endregion

        #region RSVP Cancellation Handling Tests

        [Test]
        public async Task HandleRSVPCancellation_WaitlistExists_PromotesNextMember()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var cancelingMemberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 2);
            
            // Existing RSVP that will be canceled
            var existingRsvp = CreateTestRsvp(1, eventId, cancelingMemberId, RsvpStatus.Attending);
            
            // Member on waitlist
            var waitlistMember = CreateTestMember(2, clubId, "Waitlist Member", "waitlist@test.com");
            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = 2,
                Position = 1,
                Priority = WaitlistPriority.Standard,
                Status = WaitlistStatus.Active,
                AddedAt = DateTime.UtcNow.AddHours(-1)
            };
            
            await _context.Events.AddAsync(eventEntity);
            await _context.EventRsvps.AddAsync(existingRsvp);
            await _context.Members.AddAsync(waitlistMember);
            await _context.EventWaitlists.AddAsync(waitlistEntry);
            await _context.SaveChangesAsync();

            // Act
            var result = await _waitlistService.HandleRSVPCancellation(clubId, eventId, cancelingMemberId);

            // Assert
            result.Should().NotBeNull();
            result.WasPromotionTriggered.Should().BeTrue();
            result.PromotedMember.Should().NotBeNull();
            result.PromotedMember.MemberId.Should().Be(2);
            
            // Verify waitlist entry was removed and RSVP created
            var promotedWaitlist = await _context.EventWaitlists.FirstOrDefaultAsync(w => w.MemberId == 2);
            promotedWaitlist.Status.Should().Be(WaitlistStatus.Promoted);
            
            var newRsvp = await _context.EventRsvps.FirstOrDefaultAsync(r => r.MemberId == 2 && r.EventId == eventId);
            newRsvp.Should().NotBeNull();
            newRsvp.RsvpStatus.Should().Be(RsvpStatus.Attending);
            
            // Verify notification was sent
            _mockNotificationService.Verify(
                x => x.SendWaitlistPromotionNotification(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()),
                Times.Once
            );
        }

        [Test]
        public async Task HandleRSVPCancellation_EmptyWaitlist_NoPromotion()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var cancelingMemberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, maxCapacity: 2);
            var existingRsvp = CreateTestRsvp(1, eventId, cancelingMemberId, RsvpStatus.Attending);
            
            await _context.Events.AddAsync(eventEntity);
            await _context.EventRsvps.AddAsync(existingRsvp);
            await _context.SaveChangesAsync();

            // Act
            var result = await _waitlistService.HandleRSVPCancellation(clubId, eventId, cancelingMemberId);

            // Assert
            result.Should().NotBeNull();
            result.WasPromotionTriggered.Should().BeFalse();
            result.PromotedMember.Should().BeNull();
            
            // Verify no notifications sent
            _mockNotificationService.Verify(
                x => x.SendWaitlistPromotionNotification(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()),
                Times.Never
            );
        }

        #endregion

        #region Helper Methods

        private Event CreateTestEvent(int eventId, int clubId, int maxCapacity = 10)
        {
            return new Event
            {
                Id = eventId,
                ClubId = clubId,
                Name = $"Test Event {eventId}",
                Location = "Test Location",
                Description = "Test Description",
                EventDateTime = DateTime.UtcNow.AddDays(7),
                MaxCapacity = maxCapacity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        private Member CreateTestMember(int memberId, int clubId, string fullName, string email)
        {
            return new Member
            {
                Id = memberId,
                ClubId = clubId,
                FullName = fullName,
                Email = email,
                Phone = "555-0123",
                JoinDate = DateTime.UtcNow.AddMonths(-6),
                MembershipStatusId = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        private EventRsvp CreateTestRsvp(int rsvpId, int eventId, int memberId, RsvpStatus status)
        {
            return new EventRsvp
            {
                Id = rsvpId,
                EventId = eventId,
                MemberId = memberId,
                RsvpStatus = status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        #endregion
    }

    #region Supporting DTOs and Enums

    public class AddToWaitlistRequest
    {
        public int MemberId { get; set; }
        public WaitlistPriority Priority { get; set; }
        public WaitlistNotificationPreferences NotificationPreferences { get; set; } = new();
    }

    public class WaitlistNotificationPreferences
    {
        public bool EmailNotification { get; set; }
        public bool PushNotification { get; set; }
        public bool SmsNotification { get; set; }
    }

    public class WaitlistEntryResponse
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int MemberId { get; set; }
        public int Position { get; set; }
        public WaitlistPriority Priority { get; set; }
        public WaitlistStatus Status { get; set; }
        public DateTime AddedAt { get; set; }
        public TimeSpan? EstimatedPromotionTime { get; set; }
    }

    public class WaitlistPromotionResult
    {
        public List<PromotedMember> PromotedMembers { get; set; } = new();
        public int RemainingWaitlistCount { get; set; }
    }

    public class PromotedMember
    {
        public int MemberId { get; set; }
        public string MemberName { get; set; } = string.Empty;
        public string MemberEmail { get; set; } = string.Empty;
        public RsvpStatus NewRsvpStatus { get; set; }
        public DateTime PromotedAt { get; set; }
    }

    public class WaitlistPositionResponse
    {
        public int Position { get; set; }
        public int TotalWaitlistSize { get; set; }
        public WaitlistPriority Priority { get; set; }
        public TimeSpan? EstimatedWaitTime { get; set; }
    }

    public class WaitlistPriorityUpdateResult
    {
        public int PreviousPosition { get; set; }
        public int NewPosition { get; set; }
        public WaitlistPriority Priority { get; set; }
    }

    public class RSVPCancellationResult
    {
        public bool WasPromotionTriggered { get; set; }
        public PromotedMember? PromotedMember { get; set; }
    }

    public enum WaitlistPriority
    {
        Low = 1,
        Standard = 2,
        High = 3,
        VIP = 4
    }

    public enum WaitlistStatus
    {
        Active,
        Promoted,
        Expired,
        Cancelled
    }

    public enum RsvpStatus
    {
        Attending,
        NotAttending,
        Maybe,
        NoResponse
    }

    // Domain entity for waitlist
    public class EventWaitlist
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int MemberId { get; set; }
        public int Position { get; set; }
        public WaitlistPriority Priority { get; set; }
        public WaitlistStatus Status { get; set; }
        public DateTime AddedAt { get; set; }
        public DateTime? PromotedAt { get; set; }
        public virtual Event Event { get; set; } = null!;
        public virtual Member Member { get; set; } = null!;
    }

    #endregion
}