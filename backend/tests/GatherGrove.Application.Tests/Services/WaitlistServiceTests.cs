using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Repositories;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services
{

    /// <summary>
    /// Test suite for Waitlist Service functionality
    /// Covers event capacity management and waitlist operations
    /// </summary>
    [TestFixture]
    public class WaitlistServiceTests
    {
        private Mock<ILogger<WaitlistService>> _mockLogger;
        private Mock<IEventRepository> _mockEventRepository;
        private Mock<IWaitlistRepository> _mockWaitlistRepository;
        private Mock<INotificationService> _mockNotificationService;
        private WaitlistService _waitlistService;

        [SetUp]
        public void Setup()
        {
            _mockLogger = new Mock<ILogger<WaitlistService>>();
            _mockEventRepository = new Mock<IEventRepository>();
            _mockWaitlistRepository = new Mock<IWaitlistRepository>();
            _mockNotificationService = new Mock<INotificationService>();

            _waitlistService = new WaitlistService(
                _mockWaitlistRepository.Object,
                _mockEventRepository.Object,
                _mockNotificationService.Object,
                _mockLogger.Object
            );
        }

        [Test]
        public async Task AddToWaitlist_ShouldAddMemberToWaitlistSuccessfully()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var request = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.Normal,
                Notes = "Looking forward to this event"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                ClubId = 1,
                Name = "Test Event",
                MaxCapacity = 10
            };

            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Priority = request.Priority,
                Notes = request.Notes,
                Position = 1,
                CreatedAt = DateTime.UtcNow
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mockWaitlistRepository
                .Setup(x => x.GetNextPositionAsync(eventId))
                .ReturnsAsync(1);

            _mockWaitlistRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventWaitlist>()))
                .ReturnsAsync(waitlistEntry);

            // Act
            var result = await _waitlistService.AddToWaitlistAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Position.Should().Be(1);
            result.EventId.Should().Be(eventId);
            result.MemberId.Should().Be(memberId);
            _mockWaitlistRepository.Verify(x => x.CreateAsync(It.IsAny<EventWaitlist>()), Times.Once);
        }

        [Test]
        public async Task RemoveFromWaitlist_ShouldRemoveMemberFromWaitlistSuccessfully()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;

            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Position = 1
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(waitlistEntry.Id))
                .Returns(Task.CompletedTask);

            // Act
            await _waitlistService.RemoveFromWaitlistAsync(eventId, memberId);

            // Assert
            _mockWaitlistRepository.Verify(x => x.DeleteAsync(waitlistEntry.Id), Times.Once);
            _mockWaitlistRepository.Verify(x => x.ReorderPositionsAsync(eventId, waitlistEntry.Position), Times.Once);
        }

        [Test]
        public async Task GetWaitlistForEvent_ShouldReturnOrderedWaitlistEntries()
        {
            // Arrange
            var eventId = 1;
            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 1, Position = 1, Priority = WaitlistPriority.High },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 2, Position = 2, Priority = WaitlistPriority.Normal },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 3, Position = 3, Priority = WaitlistPriority.Low }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            // Act
            var result = await _waitlistService.GetWaitlistForEventAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Count.Should().Be(3);
            result.Should().BeInAscendingOrder(w => w.Position);
        }

        [Test]
        public async Task ProcessWaitlist_ShouldPromoteMembersWhenSpotsBecomeAvailable()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 2;

            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 1, Position = 1 },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 2, Position = 2 },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 3, Position = 3 }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _mockNotificationService
                .Setup(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.PromotedMembers.Count.Should().Be(2);
            result.PromotedMembers.Should().Contain(m => m.MemberId == 1 || m.MemberId == 2);
            _mockWaitlistRepository.Verify(x => x.DeleteAsync(It.IsAny<int>()), Times.Exactly(2));
            _mockNotificationService.Verify(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Exactly(2));
        }

        [Test]
        public async Task UpdateWaitlistPosition_ShouldReorderWaitlistPositions()
        {
            // Arrange
            var eventId = 1;
            var memberId = 2;
            var newPosition = 1;

            var waitlistEntry = new EventWaitlist
            {
                Id = 2,
                EventId = eventId,
                MemberId = memberId,
                Position = 3
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry);

            _mockWaitlistRepository
                .Setup(x => x.UpdatePositionAsync(waitlistEntry.Id, newPosition))
                .Returns(Task.CompletedTask);

            _mockWaitlistRepository
                .Setup(x => x.ReorderAfterPositionChangeAsync(eventId, 3, newPosition, null))
                .Returns(Task.CompletedTask);

            // Act
            await _waitlistService.UpdateWaitlistPositionAsync(eventId, memberId, newPosition);

            // Assert
            _mockWaitlistRepository.Verify(x => x.UpdatePositionAsync(waitlistEntry.Id, newPosition), Times.Once);
            _mockWaitlistRepository.Verify(x => x.ReorderAfterPositionChangeAsync(eventId, 3, newPosition, null), Times.Once);
        }

        [Test]
        public async Task GetMemberWaitlistStatus_ShouldReturnMemberPositionInWaitlist()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;

            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Position = 5,
                Priority = WaitlistPriority.Normal,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry);

            _mockWaitlistRepository
                .Setup(x => x.GetTotalWaitlistCountAsync(eventId))
                .ReturnsAsync(10);

            // Act
            var result = await _waitlistService.GetMemberWaitlistStatusAsync(eventId, memberId);

            // Assert
            result.Should().NotBeNull();
            result.Position.Should().Be(5);
            result.TotalInWaitlist.Should().Be(10);
            result.EstimatedWaitTime.Should().BeGreaterThan(TimeSpan.Zero);
        }

        [TestCase(WaitlistPriority.High, 1)]
        [TestCase(WaitlistPriority.Normal, 6)]
        [TestCase(WaitlistPriority.Low, 11)]
        public async Task AddToWaitlist_ShouldRespectPriorityOrdering(WaitlistPriority priority, int expectedPosition)
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var request = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = priority
            };

            var existingWaitlist = new List<EventWaitlist>();
            // Add 5 high priority entries (positions 1-5)
            for (int i = 1; i <= 5; i++)
            {
                existingWaitlist.Add(new EventWaitlist { Position = i, Priority = WaitlistPriority.High });
            }
            // Add 5 normal priority entries (positions 6-10)
            for (int i = 6; i <= 10; i++)
            {
                existingWaitlist.Add(new EventWaitlist { Position = i, Priority = WaitlistPriority.Normal });
            }
            // Add 5 low priority entries (positions 11-15)
            for (int i = 11; i <= 15; i++)
            {
                existingWaitlist.Add(new EventWaitlist { Position = i, Priority = WaitlistPriority.Low });
            }

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(new Event { Id = eventId, MaxCapacity = 10 });

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(existingWaitlist);

            if (priority == WaitlistPriority.Normal)
            {
                _mockWaitlistRepository
                    .Setup(x => x.GetNextPositionAsync(eventId))
                    .ReturnsAsync(expectedPosition);
            }
            else
            {
                _mockWaitlistRepository
                    .Setup(x => x.GetNextPositionForPriorityAsync(eventId, priority))
                    .ReturnsAsync(expectedPosition);
            }

            _mockWaitlistRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventWaitlist>()))
                .ReturnsAsync((EventWaitlist entry) => entry);

            // Act
            var result = await _waitlistService.AddToWaitlistAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Position.Should().Be(expectedPosition);
            _mockWaitlistRepository.Verify(x => x.CreateAsync(It.Is<EventWaitlist>(w => w.Position == expectedPosition)), Times.Once);
        }

        #region Error Handling Tests

        [Test]
        public async Task AddToWaitlist_WhenEventNotFound_ShouldThrowArgumentException()
        {
            // Arrange
            var eventId = 999;
            var request = new AddToWaitlistRequest
            {
                MemberId = 1,
                Priority = WaitlistPriority.Normal
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync((Event?)null);

            // Act & Assert
            var exception = Assert.ThrowsAsync<ArgumentException>(
                async () => await _waitlistService.AddToWaitlistAsync(eventId, request));
            exception!.Message.Should().Contain($"Event with ID {eventId} not found");
        }

        [Test]
        public async Task RemoveFromWaitlist_WhenMemberNotOnWaitlist_ShouldThrowArgumentException()
        {
            // Arrange
            var eventId = 1;
            var memberId = 999;

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync((EventWaitlist?)null);

            // Act & Assert
            var exception = Assert.ThrowsAsync<ArgumentException>(
                async () => await _waitlistService.RemoveFromWaitlistAsync(eventId, memberId));
            exception!.Message.Should().Contain($"Member {memberId} is not on the waitlist");
        }

        [Test]
        public async Task UpdateWaitlistPosition_WhenMemberNotOnWaitlist_ShouldThrowArgumentException()
        {
            // Arrange
            var eventId = 1;
            var memberId = 999;
            var newPosition = 1;

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync((EventWaitlist?)null);

            // Act & Assert
            var exception = Assert.ThrowsAsync<ArgumentException>(
                async () => await _waitlistService.UpdateWaitlistPositionAsync(eventId, memberId, newPosition));
            exception!.Message.Should().Contain($"Member {memberId} is not on the waitlist");
        }

        #endregion

        #region Edge Cases Tests

        [Test]
        public async Task GetMemberWaitlistStatus_WhenMemberNotOnWaitlist_ShouldReturnNull()
        {
            // Arrange
            var eventId = 1;
            var memberId = 999;

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync((EventWaitlist?)null);

            // Act
            var result = await _waitlistService.GetMemberWaitlistStatusAsync(eventId, memberId);

            // Assert
            result.Should().BeNull();
        }

        [Test]
        public async Task ProcessWaitlist_WithZeroAvailableSpots_ShouldReturnEmptyPromotedList()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 0;

            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 1, Position = 1 },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 2, Position = 2 }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.PromotedMembers.Should().BeEmpty();
            result.SpotsFilled.Should().Be(0);
            _mockWaitlistRepository.Verify(x => x.DeleteAsync(It.IsAny<int>()), Times.Never);
            _mockNotificationService.Verify(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task ProcessWaitlist_WithMoreSpotsThanWaitlistEntries_ShouldPromoteAllEntries()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 10;

            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 1, Position = 1 },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 2, Position = 2 },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 3, Position = 3 }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _mockNotificationService
                .Setup(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.PromotedMembers.Count.Should().Be(3);
            result.SpotsFilled.Should().Be(3);
            _mockWaitlistRepository.Verify(x => x.DeleteAsync(It.IsAny<int>()), Times.Exactly(3));
            _mockNotificationService.Verify(x => x.SendWaitlistPromotionNotificationAsync(eventId, It.IsAny<int>()), Times.Exactly(3));
        }

        [Test]
        public async Task ProcessWaitlist_WithEmptyWaitlist_ShouldReturnSuccessWithNoPromotions()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 5;

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(new List<EventWaitlist>());

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.PromotedMembers.Should().BeEmpty();
            result.SpotsFilled.Should().Be(0);
            result.RemainingWaitlist.Should().BeEmpty();
        }

        [Test]
        public async Task GetWaitlistForEvent_WithEmptyWaitlist_ShouldReturnEmptyList()
        {
            // Arrange
            var eventId = 1;

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(new List<EventWaitlist>());

            // Act
            var result = await _waitlistService.GetWaitlistForEventAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Test]
        public async Task AddToWaitlist_WithHighPriority_ShouldUseGetNextPositionForPriority()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var request = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.High,
                Notes = "VIP member"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                ClubId = 1,
                Name = "Test Event",
                MaxCapacity = 10
            };

            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Priority = request.Priority,
                Notes = request.Notes,
                Position = 1,
                CreatedAt = DateTime.UtcNow
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mockWaitlistRepository
                .Setup(x => x.GetNextPositionForPriorityAsync(eventId, WaitlistPriority.High))
                .ReturnsAsync(1);

            _mockWaitlistRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventWaitlist>()))
                .ReturnsAsync(waitlistEntry);

            // Act
            var result = await _waitlistService.AddToWaitlistAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Position.Should().Be(1);
            result.Priority.Should().Be(WaitlistPriority.High);
            _mockWaitlistRepository.Verify(x => x.GetNextPositionForPriorityAsync(eventId, WaitlistPriority.High), Times.Once);
            _mockWaitlistRepository.Verify(x => x.GetNextPositionAsync(It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task AddToWaitlist_WithLowPriority_ShouldUseGetNextPositionForPriority()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var request = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.Low,
                Notes = "Low priority request"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                ClubId = 1,
                Name = "Test Event",
                MaxCapacity = 10
            };

            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Priority = request.Priority,
                Notes = request.Notes,
                Position = 15,
                CreatedAt = DateTime.UtcNow
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mockWaitlistRepository
                .Setup(x => x.GetNextPositionForPriorityAsync(eventId, WaitlistPriority.Low))
                .ReturnsAsync(15);

            _mockWaitlistRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventWaitlist>()))
                .ReturnsAsync(waitlistEntry);

            // Act
            var result = await _waitlistService.AddToWaitlistAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Position.Should().Be(15);
            result.Priority.Should().Be(WaitlistPriority.Low);
            _mockWaitlistRepository.Verify(x => x.GetNextPositionForPriorityAsync(eventId, WaitlistPriority.Low), Times.Once);
        }

        [Test]
        public async Task GetMemberWaitlistStatus_ShouldCalculateEstimatedWaitTime()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var position = 3;

            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Position = position,
                Priority = WaitlistPriority.Normal,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry);

            _mockWaitlistRepository
                .Setup(x => x.GetTotalWaitlistCountAsync(eventId))
                .ReturnsAsync(10);

            // Act
            var result = await _waitlistService.GetMemberWaitlistStatusAsync(eventId, memberId);

            // Assert
            result.Should().NotBeNull();
            result!.Position.Should().Be(position);
            result.IsOnWaitlist.Should().BeTrue();
            result.Status.Should().Be(WaitlistStatus.Active);
            // Estimated wait time should be position * 7 days (1 week per position)
            result.EstimatedWaitTime.Should().Be(TimeSpan.FromDays(position * 7));
        }

        [Test]
        public async Task ProcessWaitlist_ShouldPreservePromotionOrder()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 3;

            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 10, Position = 1 },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 20, Position = 2 },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 30, Position = 3 },
                new EventWaitlist { Id = 4, EventId = eventId, MemberId = 40, Position = 4 }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _mockNotificationService
                .Setup(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.PromotedMembers.Should().HaveCount(3);
            result.PromotedMembers[0].MemberId.Should().Be(10);
            result.PromotedMembers[0].FromPosition.Should().Be(1);
            result.PromotedMembers[1].MemberId.Should().Be(20);
            result.PromotedMembers[1].FromPosition.Should().Be(2);
            result.PromotedMembers[2].MemberId.Should().Be(30);
            result.PromotedMembers[2].FromPosition.Should().Be(3);
        }

        [Test]
        public async Task UpdateWaitlistPosition_ShouldPassCorrectOldAndNewPositions()
        {
            // Arrange
            var eventId = 1;
            var memberId = 5;
            var oldPosition = 10;
            var newPosition = 3;

            var waitlistEntry = new EventWaitlist
            {
                Id = 5,
                EventId = eventId,
                MemberId = memberId,
                Position = oldPosition
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry);

            _mockWaitlistRepository
                .Setup(x => x.UpdatePositionAsync(waitlistEntry.Id, newPosition))
                .Returns(Task.CompletedTask);

            _mockWaitlistRepository
                .Setup(x => x.ReorderAfterPositionChangeAsync(eventId, oldPosition, newPosition, null))
                .Returns(Task.CompletedTask);

            // Act
            await _waitlistService.UpdateWaitlistPositionAsync(eventId, memberId, newPosition);

            // Assert
            _mockWaitlistRepository.Verify(
                x => x.ReorderAfterPositionChangeAsync(eventId, oldPosition, newPosition, null),
                Times.Once);
        }

        [Test]
        public async Task RemoveFromWaitlist_ShouldTriggerReorderFromRemovedPosition()
        {
            // Arrange
            var eventId = 1;
            var memberId = 3;
            var removedPosition = 5;

            var waitlistEntry = new EventWaitlist
            {
                Id = 3,
                EventId = eventId,
                MemberId = memberId,
                Position = removedPosition
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(waitlistEntry.Id))
                .Returns(Task.CompletedTask);

            _mockWaitlistRepository
                .Setup(x => x.ReorderPositionsAsync(eventId, removedPosition))
                .Returns(Task.CompletedTask);

            // Act
            await _waitlistService.RemoveFromWaitlistAsync(eventId, memberId);

            // Assert
            _mockWaitlistRepository.Verify(x => x.DeleteAsync(waitlistEntry.Id), Times.Once);
            _mockWaitlistRepository.Verify(x => x.ReorderPositionsAsync(eventId, removedPosition), Times.Once);
        }

        #endregion

        #region Notification Tests

        [Test]
        public async Task ProcessWaitlist_ShouldSendNotificationForEachPromotedMember()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 2;

            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 100, Position = 1 },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 200, Position = 2 },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 300, Position = 3 }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _mockNotificationService
                .Setup(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            _mockNotificationService.Verify(
                x => x.SendWaitlistPromotionNotificationAsync(eventId, 100), Times.Once);
            _mockNotificationService.Verify(
                x => x.SendWaitlistPromotionNotificationAsync(eventId, 200), Times.Once);
            _mockNotificationService.Verify(
                x => x.SendWaitlistPromotionNotificationAsync(eventId, 300), Times.Never);
        }

        #endregion

        #region Data Mapping Tests

        [Test]
        public async Task GetWaitlistForEvent_ShouldReturnCorrectlyMappedEntries()
        {
            // Arrange
            var eventId = 1;
            var createdAt = DateTime.UtcNow.AddDays(-2);
            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist
                {
                    Id = 1,
                    EventId = eventId,
                    MemberId = 1,
                    Position = 1,
                    Priority = WaitlistPriority.High,
                    Notes = "Test note",
                    CreatedAt = createdAt,
                    NotificationSent = true,
                    Member = new Member { FirstName = "John", LastName = "Doe" }
                }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            // Act
            var result = await _waitlistService.GetWaitlistForEventAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            var entry = result.First();
            entry.Id.Should().Be(1);
            entry.EventId.Should().Be(eventId);
            entry.MemberId.Should().Be(1);
            entry.Position.Should().Be(1);
            entry.Priority.Should().Be(WaitlistPriority.High);
            entry.Notes.Should().Be("Test note");
            entry.CreatedAt.Should().Be(createdAt);
            entry.NotificationSent.Should().BeTrue();
            entry.MemberName.Should().Be("John Doe");
        }

        [Test]
        public async Task GetWaitlistForEvent_WithNullMember_ShouldReturnUnknownMemberName()
        {
            // Arrange
            var eventId = 1;
            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist
                {
                    Id = 1,
                    EventId = eventId,
                    MemberId = 1,
                    Position = 1,
                    Priority = WaitlistPriority.Normal,
                    CreatedAt = DateTime.UtcNow,
                    Member = null  // Member not loaded
                }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            // Act
            var result = await _waitlistService.GetWaitlistForEventAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result.First().MemberName.Should().Be("Unknown");
        }

        #endregion

        #region Concurrent Operations Tests

        [Test]
        public async Task ProcessWaitlist_ShouldReturnRemainingWaitlistMemberIds()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 1;

            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 100, Position = 1 },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 200, Position = 2 },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 300, Position = 3 }
            };

            var remainingAfterPromotion = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 200, Position = 1 },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 300, Position = 2 }
            };

            _mockWaitlistRepository
                .SetupSequence(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries)       // First call for processing
                .ReturnsAsync(remainingAfterPromotion); // Second call for remaining list

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _mockNotificationService
                .Setup(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.PromotedMembers.Should().HaveCount(1);
            result.RemainingWaitlist.Should().HaveCount(2);
            result.RemainingWaitlist.Should().Contain(200);
            result.RemainingWaitlist.Should().Contain(300);
            result.RemainingWaitlist.Should().NotContain(100);
        }

        #endregion

        #region AddToWaitlistAsync - Enhanced Coverage

        [Test]
        public async Task AddToWaitlist_WithEmptyNotes_ShouldHandleGracefully()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var request = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.Normal,
                Notes = string.Empty
            };

            var eventEntity = new Event { Id = eventId, MaxCapacity = 10 };
            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Priority = request.Priority,
                Notes = string.Empty,
                Position = 1,
                CreatedAt = DateTime.UtcNow
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mockWaitlistRepository
                .Setup(x => x.GetNextPositionAsync(eventId))
                .ReturnsAsync(1);

            _mockWaitlistRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventWaitlist>()))
                .ReturnsAsync(waitlistEntry);

            // Act
            var result = await _waitlistService.AddToWaitlistAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Notes.Should().BeEmpty();
        }

        [Test]
        public async Task AddToWaitlist_WithVeryLongNotes_ShouldHandleCorrectly()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var longNotes = new string('A', 2000);
            var request = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.Normal,
                Notes = longNotes
            };

            var eventEntity = new Event { Id = eventId, MaxCapacity = 10 };
            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Priority = request.Priority,
                Notes = longNotes,
                Position = 1,
                CreatedAt = DateTime.UtcNow
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mockWaitlistRepository
                .Setup(x => x.GetNextPositionAsync(eventId))
                .ReturnsAsync(1);

            _mockWaitlistRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventWaitlist>()))
                .ReturnsAsync(waitlistEntry);

            // Act
            var result = await _waitlistService.AddToWaitlistAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Notes.Should().HaveLength(2000);
        }

        [Test]
        public async Task AddToWaitlist_WhenWaitlistIsEmpty_ShouldAssignPositionOne()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var request = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.Normal
            };

            var eventEntity = new Event { Id = eventId, MaxCapacity = 10 };
            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Priority = request.Priority,
                Position = 1,
                CreatedAt = DateTime.UtcNow
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(new List<EventWaitlist>());

            _mockWaitlistRepository
                .Setup(x => x.GetNextPositionAsync(eventId))
                .ReturnsAsync(1);

            _mockWaitlistRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventWaitlist>()))
                .ReturnsAsync(waitlistEntry);

            // Act
            var result = await _waitlistService.AddToWaitlistAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Position.Should().Be(1);
        }

        [Test]
        public async Task AddToWaitlist_ShouldPreserveNotesField()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var notes = "Please notify me ASAP if spot opens";
            var request = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.Normal,
                Notes = notes
            };

            var eventEntity = new Event { Id = eventId, MaxCapacity = 10 };
            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Priority = request.Priority,
                Notes = notes,
                Position = 1,
                CreatedAt = DateTime.UtcNow
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mockWaitlistRepository
                .Setup(x => x.GetNextPositionAsync(eventId))
                .ReturnsAsync(1);

            _mockWaitlistRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventWaitlist>()))
                .ReturnsAsync(waitlistEntry);

            // Act
            var result = await _waitlistService.AddToWaitlistAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Notes.Should().Be(notes);
            _mockWaitlistRepository.Verify(
                x => x.CreateAsync(It.Is<EventWaitlist>(w => w.Notes == notes)),
                Times.Once);
        }

        [Test]
        public async Task AddToWaitlist_ShouldSetCreatedAtTimestamp()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var beforeTime = DateTime.UtcNow;
            var request = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.Normal
            };

            var eventEntity = new Event { Id = eventId, MaxCapacity = 10 };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mockWaitlistRepository
                .Setup(x => x.GetNextPositionAsync(eventId))
                .ReturnsAsync(1);

            EventWaitlist? capturedEntry = null;
            _mockWaitlistRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventWaitlist>()))
                .Callback<EventWaitlist>(entry => capturedEntry = entry)
                .ReturnsAsync((EventWaitlist entry) => entry);

            // Act
            await _waitlistService.AddToWaitlistAsync(eventId, request);
            var afterTime = DateTime.UtcNow;

            // Assert
            capturedEntry.Should().NotBeNull();
            capturedEntry!.CreatedAt.Should().BeOnOrAfter(beforeTime);
            capturedEntry.CreatedAt.Should().BeOnOrBefore(afterTime);
        }

        [Test]
        public async Task AddToWaitlist_MultipleMembersWithSamePriority_ShouldIncrementPosition()
        {
            // Arrange
            var eventId = 1;
            var request = new AddToWaitlistRequest
            {
                MemberId = 3,
                Priority = WaitlistPriority.Normal
            };

            var eventEntity = new Event { Id = eventId, MaxCapacity = 10 };
            var existingEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Position = 1, Priority = WaitlistPriority.Normal, MemberId = 1 },
                new EventWaitlist { Position = 2, Priority = WaitlistPriority.Normal, MemberId = 2 }
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(existingEntries);

            _mockWaitlistRepository
                .Setup(x => x.GetNextPositionAsync(eventId))
                .ReturnsAsync(3);

            _mockWaitlistRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventWaitlist>()))
                .ReturnsAsync((EventWaitlist entry) => entry);

            // Act
            var result = await _waitlistService.AddToWaitlistAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Position.Should().Be(3);
        }

        [Test]
        public async Task AddToWaitlist_WithNormalPriority_ShouldUseGetNextPositionAsync()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var request = new AddToWaitlistRequest
            {
                MemberId = memberId,
                Priority = WaitlistPriority.Normal
            };

            var eventEntity = new Event { Id = eventId, MaxCapacity = 10 };
            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Priority = request.Priority,
                Position = 5,
                CreatedAt = DateTime.UtcNow
            };

            _mockEventRepository
                .Setup(x => x.GetByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mockWaitlistRepository
                .Setup(x => x.GetNextPositionAsync(eventId))
                .ReturnsAsync(5);

            _mockWaitlistRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventWaitlist>()))
                .ReturnsAsync(waitlistEntry);

            // Act
            var result = await _waitlistService.AddToWaitlistAsync(eventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Position.Should().Be(5);
            _mockWaitlistRepository.Verify(x => x.GetNextPositionAsync(eventId), Times.Once);
            _mockWaitlistRepository.Verify(
                x => x.GetNextPositionForPriorityAsync(It.IsAny<int>(), It.IsAny<WaitlistPriority>()),
                Times.Never);
        }

        #endregion

        #region RemoveFromWaitlistAsync - Enhanced Coverage

        [Test]
        public async Task RemoveFromWaitlist_FromEmptyWaitlist_ShouldThrowArgumentException()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync((EventWaitlist?)null);

            // Act & Assert
            var exception = Assert.ThrowsAsync<ArgumentException>(
                async () => await _waitlistService.RemoveFromWaitlistAsync(eventId, memberId));
            exception!.Message.Should().Contain("not on the waitlist");
        }

        [Test]
        public async Task RemoveFromWaitlist_LastMember_ShouldClearWaitlist()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Position = 1
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(waitlistEntry.Id))
                .Returns(Task.CompletedTask);

            _mockWaitlistRepository
                .Setup(x => x.ReorderPositionsAsync(eventId, 1))
                .Returns(Task.CompletedTask);

            // Act
            await _waitlistService.RemoveFromWaitlistAsync(eventId, memberId);

            // Assert
            _mockWaitlistRepository.Verify(x => x.DeleteAsync(waitlistEntry.Id), Times.Once);
            _mockWaitlistRepository.Verify(x => x.ReorderPositionsAsync(eventId, 1), Times.Once);
        }

        [Test]
        public async Task RemoveFromWaitlist_FirstMember_ShouldReorderCorrectly()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Position = 1
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(waitlistEntry.Id))
                .Returns(Task.CompletedTask);

            // Act
            await _waitlistService.RemoveFromWaitlistAsync(eventId, memberId);

            // Assert
            _mockWaitlistRepository.Verify(x => x.ReorderPositionsAsync(eventId, 1), Times.Once);
        }

        [Test]
        public async Task RemoveFromWaitlist_MiddleMember_ShouldReorderCorrectly()
        {
            // Arrange
            var eventId = 1;
            var memberId = 2;
            var waitlistEntry = new EventWaitlist
            {
                Id = 2,
                EventId = eventId,
                MemberId = memberId,
                Position = 5
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(waitlistEntry.Id))
                .Returns(Task.CompletedTask);

            // Act
            await _waitlistService.RemoveFromWaitlistAsync(eventId, memberId);

            // Assert
            _mockWaitlistRepository.Verify(x => x.ReorderPositionsAsync(eventId, 5), Times.Once);
        }

        [Test]
        public async Task RemoveFromWaitlist_WithInvalidEventId_ShouldThrowArgumentException()
        {
            // Arrange
            var eventId = 0;
            var memberId = 1;

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync((EventWaitlist?)null);

            // Act & Assert
            var exception = Assert.ThrowsAsync<ArgumentException>(
                async () => await _waitlistService.RemoveFromWaitlistAsync(eventId, memberId));
            exception!.Message.Should().Contain("not on the waitlist");
        }

        [Test]
        public async Task RemoveFromWaitlist_DoubleRemoval_ShouldThrowOnSecondCall()
        {
            // Arrange
            var eventId = 1;
            var memberId = 1;
            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Position = 1
            };

            _mockWaitlistRepository
                .SetupSequence(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry)
                .ReturnsAsync((EventWaitlist?)null);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(waitlistEntry.Id))
                .Returns(Task.CompletedTask);

            // Act
            await _waitlistService.RemoveFromWaitlistAsync(eventId, memberId);

            // Assert - second call should throw
            var exception = Assert.ThrowsAsync<ArgumentException>(
                async () => await _waitlistService.RemoveFromWaitlistAsync(eventId, memberId));
            exception!.Message.Should().Contain("not on the waitlist");
        }

        #endregion

        #region GetWaitlistForEventAsync - Enhanced Coverage

        [Test]
        public async Task GetWaitlistForEvent_LargeWaitlist_ShouldReturnAllEntries()
        {
            // Arrange
            var eventId = 1;
            var largeWaitlist = new List<EventWaitlist>();
            for (int i = 1; i <= 150; i++)
            {
                largeWaitlist.Add(new EventWaitlist
                {
                    Id = i,
                    EventId = eventId,
                    MemberId = i,
                    Position = i,
                    Priority = WaitlistPriority.Normal
                });
            }

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(largeWaitlist);

            // Act
            var result = await _waitlistService.GetWaitlistForEventAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Count.Should().Be(150);
            result.Should().BeInAscendingOrder(w => w.Position);
        }

        [Test]
        public async Task GetWaitlistForEvent_ShouldMaintainPriorityOrdering()
        {
            // Arrange
            var eventId = 1;
            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 1, Position = 1, Priority = WaitlistPriority.High },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 2, Position = 2, Priority = WaitlistPriority.High },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 3, Position = 3, Priority = WaitlistPriority.Normal },
                new EventWaitlist { Id = 4, EventId = eventId, MemberId = 4, Position = 4, Priority = WaitlistPriority.Low }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            // Act
            var result = await _waitlistService.GetWaitlistForEventAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result[0].Priority.Should().Be(WaitlistPriority.High);
            result[1].Priority.Should().Be(WaitlistPriority.High);
            result[2].Priority.Should().Be(WaitlistPriority.Normal);
            result[3].Priority.Should().Be(WaitlistPriority.Low);
        }

        [Test]
        public async Task GetWaitlistForEvent_ShouldMaintainPositionOrdering()
        {
            // Arrange
            var eventId = 1;
            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 3, Position = 5, Priority = WaitlistPriority.Normal },
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 1, Position = 1, Priority = WaitlistPriority.High },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 2, Position = 3, Priority = WaitlistPriority.Normal }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            // Act
            var result = await _waitlistService.GetWaitlistForEventAsync(eventId);

            // Assert
            result.Should().BeInAscendingOrder(w => w.Position);
            result[0].Position.Should().Be(1);
            result[1].Position.Should().Be(3);
            result[2].Position.Should().Be(5);
        }

        [Test]
        public async Task GetWaitlistForEvent_MixedPriorities_ShouldReturnCorrectOrder()
        {
            // Arrange
            var eventId = 1;
            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 1, Position = 1, Priority = WaitlistPriority.High },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 2, Position = 2, Priority = WaitlistPriority.Low },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 3, Position = 3, Priority = WaitlistPriority.Normal },
                new EventWaitlist { Id = 4, EventId = eventId, MemberId = 4, Position = 4, Priority = WaitlistPriority.High },
                new EventWaitlist { Id = 5, EventId = eventId, MemberId = 5, Position = 5, Priority = WaitlistPriority.Low }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            // Act
            var result = await _waitlistService.GetWaitlistForEventAsync(eventId);

            // Assert
            result.Should().HaveCount(5);
            result.Should().BeInAscendingOrder(w => w.Position);
        }

        #endregion

        #region ProcessWaitlistAsync - Enhanced Coverage

        [Test]
        public async Task ProcessWaitlist_WithPriorityOrdering_ShouldPromoteHighPriorityFirst()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 2;

            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 10, Position = 1, Priority = WaitlistPriority.High },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 20, Position = 2, Priority = WaitlistPriority.High },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 30, Position = 3, Priority = WaitlistPriority.Normal }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _mockNotificationService
                .Setup(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.PromotedMembers.Should().HaveCount(2);
            result.PromotedMembers[0].MemberId.Should().Be(10);
            result.PromotedMembers[1].MemberId.Should().Be(20);
        }

        [Test]
        public async Task ProcessWaitlist_MixedPriorities_ShouldPromoteInCorrectOrder()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 4;

            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 1, Position = 1, Priority = WaitlistPriority.High },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 2, Position = 2, Priority = WaitlistPriority.Normal },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 3, Position = 3, Priority = WaitlistPriority.Low },
                new EventWaitlist { Id = 4, EventId = eventId, MemberId = 4, Position = 4, Priority = WaitlistPriority.High }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _mockNotificationService
                .Setup(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.PromotedMembers.Should().HaveCount(4);
            result.PromotedMembers.Select(p => p.MemberId).Should().ContainInOrder(1, 2, 3, 4);
        }

        [Test]
        public async Task ProcessWaitlist_WithNegativeAvailableSpots_ShouldTreatAsZero()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = -5;

            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 1, Position = 1 }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.PromotedMembers.Should().BeEmpty();
            result.SpotsFilled.Should().Be(0);
            _mockWaitlistRepository.Verify(x => x.DeleteAsync(It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task ProcessWaitlist_WithVeryLargeAvailableSpots_ShouldPromoteOnlyActualCount()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 1000;

            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 1, Position = 1 },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 2, Position = 2 }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _mockNotificationService
                .Setup(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.PromotedMembers.Should().HaveCount(2);
            result.SpotsFilled.Should().Be(2);
        }

        [Test]
        public async Task ProcessWaitlist_PromotedMembersList_ShouldContainCorrectData()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 1;

            var waitlistEntries = new List<EventWaitlist>
            {
                new EventWaitlist
                {
                    Id = 1,
                    EventId = eventId,
                    MemberId = 100,
                    Position = 5,
                    Priority = WaitlistPriority.High
                }
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(waitlistEntries);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _mockNotificationService
                .Setup(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.PromotedMembers.Should().HaveCount(1);
            var promoted = result.PromotedMembers[0];
            promoted.MemberId.Should().Be(100);
            promoted.FromPosition.Should().Be(5);
        }

        [Test]
        public async Task ProcessWaitlist_RemainingWaitlist_ShouldExcludePromotedMembers()
        {
            // Arrange
            var eventId = 1;
            var availableSpots = 2;

            var initialWaitlist = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 1, EventId = eventId, MemberId = 1, Position = 1 },
                new EventWaitlist { Id = 2, EventId = eventId, MemberId = 2, Position = 2 },
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 3, Position = 3 },
                new EventWaitlist { Id = 4, EventId = eventId, MemberId = 4, Position = 4 }
            };

            var remainingWaitlist = new List<EventWaitlist>
            {
                new EventWaitlist { Id = 3, EventId = eventId, MemberId = 3, Position = 1 },
                new EventWaitlist { Id = 4, EventId = eventId, MemberId = 4, Position = 2 }
            };

            _mockWaitlistRepository
                .SetupSequence(x => x.GetByEventIdAsync(eventId))
                .ReturnsAsync(initialWaitlist)
                .ReturnsAsync(remainingWaitlist);

            _mockWaitlistRepository
                .Setup(x => x.DeleteAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _mockNotificationService
                .Setup(x => x.SendWaitlistPromotionNotificationAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _waitlistService.ProcessWaitlistAsync(eventId, availableSpots);

            // Assert
            result.Should().NotBeNull();
            result.PromotedMembers.Should().HaveCount(2);
            result.RemainingWaitlist.Should().HaveCount(2);
            result.RemainingWaitlist.Should().NotContain(1);
            result.RemainingWaitlist.Should().NotContain(2);
            result.RemainingWaitlist.Should().Contain(3);
            result.RemainingWaitlist.Should().Contain(4);
        }

        #endregion

        #region UpdateWaitlistPositionAsync - Enhanced Coverage

        #endregion

        #region GetMemberWaitlistStatusAsync - Enhanced Coverage

        [Test]
        public async Task GetMemberWaitlistStatus_MemberOnMultipleEventWaitlists_ShouldReturnCorrectEvent()
        {
            // Arrange
            var eventId = 5;
            var memberId = 1;

            var waitlistEntry = new EventWaitlist
            {
                Id = 10,
                EventId = eventId,
                MemberId = memberId,
                Position = 3,
                Priority = WaitlistPriority.Normal,
                CreatedAt = DateTime.UtcNow
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry);

            _mockWaitlistRepository
                .Setup(x => x.GetTotalWaitlistCountAsync(eventId))
                .ReturnsAsync(10);

            // Act
            var result = await _waitlistService.GetMemberWaitlistStatusAsync(eventId, memberId);

            // Assert
            result.Should().NotBeNull();
            result!.EventId.Should().Be(eventId);
            result.MemberId.Should().Be(memberId);
            result.Position.Should().Be(3);
        }

        [Test]
        public async Task GetMemberWaitlistStatus_WithZeroPosition_ShouldHandleCorrectly()
        {
            // Arrange - This shouldn't happen in practice but test edge case
            var eventId = 1;
            var memberId = 1;

            var waitlistEntry = new EventWaitlist
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                Position = 0, // Edge case - invalid position
                Priority = WaitlistPriority.Normal,
                CreatedAt = DateTime.UtcNow
            };

            _mockWaitlistRepository
                .Setup(x => x.GetByEventAndMemberAsync(eventId, memberId))
                .ReturnsAsync(waitlistEntry);

            _mockWaitlistRepository
                .Setup(x => x.GetTotalWaitlistCountAsync(eventId))
                .ReturnsAsync(5);

            // Act
            var result = await _waitlistService.GetMemberWaitlistStatusAsync(eventId, memberId);

            // Assert
            result.Should().NotBeNull();
            result!.Position.Should().Be(0);
            result.EstimatedWaitTime.Should().Be(TimeSpan.Zero);
        }

        #endregion
    }
}