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
    /// Test suite for Multi-Session Event Service functionality
    /// Covers multi-session event creation, management, and session handling
    /// </summary>
    [TestFixture]
    public class MultiSessionEventServiceTests
    {
        private Mock<IMultiSessionEventRepository> _mockMultiSessionEventRepository;
        private Mock<IEventRepository> _mockEventRepository;
        private Mock<IEventSessionRepository> _mockEventSessionRepository;
        private Mock<ILogger<MultiSessionEventService>> _mockLogger;
        private MultiSessionEventService _multiSessionEventService;

        [SetUp]
        public void SetUp()
        {
            _mockMultiSessionEventRepository = new Mock<IMultiSessionEventRepository>();
            _mockEventRepository = new Mock<IEventRepository>();
            _mockEventSessionRepository = new Mock<IEventSessionRepository>();
            _mockLogger = new Mock<ILogger<MultiSessionEventService>>();
            _multiSessionEventService = new MultiSessionEventService(
                _mockMultiSessionEventRepository.Object,
                _mockEventRepository.Object,
                _mockEventSessionRepository.Object,
                _mockLogger.Object
            );
        }

        [Test]
        public async Task CreateMultiSessionEvent_ShouldCreateEventWithMultipleSessions()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateMultiSessionEventRequest
            {
                Name = "Advanced Python Workshop",
                Description = "3-part Python workshop series",
                Location = "Tech Hub",
                MaxCapacity = 25,
                RegistrationRequired = true,
                AllowIndividualSessionRegistration = false,
                Sessions = new List<EventSessionRequest>
                {
                    new EventSessionRequest
                    {
                        Name = "Python Basics",
                        Description = "Introduction to Python",
                        StartDateTime = DateTime.Now.AddDays(7),
                        EndDateTime = DateTime.Now.AddDays(7).AddHours(3),
                        SessionNumber = 1
                    },
                    new EventSessionRequest
                    {
                        Name = "Advanced Python",
                        Description = "Advanced Python concepts",
                        StartDateTime = DateTime.Now.AddDays(14),
                        EndDateTime = DateTime.Now.AddDays(14).AddHours(3),
                        SessionNumber = 2
                    },
                    new EventSessionRequest
                    {
                        Name = "Python Projects",
                        Description = "Hands-on Python projects",
                        StartDateTime = DateTime.Now.AddDays(21),
                        EndDateTime = DateTime.Now.AddDays(21).AddHours(3),
                        SessionNumber = 3
                    }
                }
            };

            var expectedMultiSessionEvent = new MultiSessionEvent
            {
                Id = 1,
                ClubId = clubId,
                Name = request.Name,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.CreateAsync(It.IsAny<MultiSessionEvent>()))
                .ReturnsAsync(expectedMultiSessionEvent);

            _mockEventSessionRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventSession>()))
                .ReturnsAsync((EventSession session) => session);

            // Act
            var result = await _multiSessionEventService.CreateMultiSessionEventAsync(clubId, request);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(1);
            result.Name.Should().Be(request.Name);
            result.Sessions.Count.Should().Be(3);
            _mockMultiSessionEventRepository.Verify(x => x.CreateAsync(It.IsAny<MultiSessionEvent>()), Times.Once);
            _mockEventSessionRepository.Verify(x => x.CreateAsync(It.IsAny<EventSession>()), Times.Exactly(3));
        }

        [Test]
        public async Task GetMultiSessionEvent_ShouldReturnEventWithAllSessions()
        {
            // Arrange
            var multiSessionEventId = 1;
            var expectedEvent = new MultiSessionEvent
            {
                Id = multiSessionEventId,
                ClubId = 1,
                Name = "Python Workshop",
                Sessions = new List<EventSession>
                {
                    new EventSession { Id = 1, SessionNumber = 1, Name = "Session 1" },
                    new EventSession { Id = 2, SessionNumber = 2, Name = "Session 2" },
                    new EventSession { Id = 3, SessionNumber = 3, Name = "Session 3" }
                }
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByIdWithSessionsAsync(multiSessionEventId))
                .ReturnsAsync(expectedEvent);

            // Act
            var result = await _multiSessionEventService.GetMultiSessionEventAsync(multiSessionEventId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(multiSessionEventId);
            result.Sessions.Count.Should().Be(3);
            result.Sessions.Should().BeInAscendingOrder(s => s.SessionNumber);
        }

        [Test]
        public async Task RegisterForMultiSessionEvent_ShouldRegisterMemberForAllSessions()
        {
            // Arrange
            var multiSessionEventId = 1;
            var memberId = 1;
            var request = new MultiSessionRegistrationRequest
            {
                MemberId = memberId,
                RegisterForAllSessions = true,
                SelectedSessionIds = null
            };

            var multiSessionEvent = new MultiSessionEvent
            {
                Id = multiSessionEventId,
                AllowIndividualSessionRegistration = false,
                Sessions = new List<EventSession>
                {
                    new EventSession { Id = 1, SessionNumber = 1 },
                    new EventSession { Id = 2, SessionNumber = 2 },
                    new EventSession { Id = 3, SessionNumber = 3 }
                }
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByIdWithSessionsAsync(multiSessionEventId))
                .ReturnsAsync(multiSessionEvent);

            _mockMultiSessionEventRepository
                .Setup(x => x.CreateRegistrationAsync(It.IsAny<MultiSessionEventRegistration>()))
                .ReturnsAsync((MultiSessionEventRegistration reg) => reg);

            // Act
            var result = await _multiSessionEventService.RegisterForMultiSessionEventAsync(multiSessionEventId, request);

            // Assert
            result.Should().NotBeNull();
            result.MemberId.Should().Be(memberId);
            result.SessionRegistrations.Count.Should().Be(3);
            _mockMultiSessionEventRepository.Verify(x => x.CreateRegistrationAsync(It.IsAny<MultiSessionEventRegistration>()), Times.Once);
        }

        [Test]
        public async Task RegisterForMultiSessionEvent_ShouldRegisterMemberForSelectedSessionsOnly()
        {
            // Arrange
            var multiSessionEventId = 1;
            var memberId = 1;
            var request = new MultiSessionRegistrationRequest
            {
                MemberId = memberId,
                RegisterForAllSessions = false,
                SelectedSessionIds = new List<int> { 1, 3 }
            };

            var multiSessionEvent = new MultiSessionEvent
            {
                Id = multiSessionEventId,
                AllowIndividualSessionRegistration = true,
                Sessions = new List<EventSession>
                {
                    new EventSession { Id = 1, SessionNumber = 1 },
                    new EventSession { Id = 2, SessionNumber = 2 },
                    new EventSession { Id = 3, SessionNumber = 3 }
                }
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByIdWithSessionsAsync(multiSessionEventId))
                .ReturnsAsync(multiSessionEvent);

            _mockMultiSessionEventRepository
                .Setup(x => x.CreateRegistrationAsync(It.IsAny<MultiSessionEventRegistration>()))
                .ReturnsAsync((MultiSessionEventRegistration reg) => reg);

            // Act
            var result = await _multiSessionEventService.RegisterForMultiSessionEventAsync(multiSessionEventId, request);

            // Assert
            result.Should().NotBeNull();
            result.MemberId.Should().Be(memberId);
            result.SessionRegistrations.Count.Should().Be(2);
            result.SessionRegistrations.Should().Contain(sr => sr.SessionId == 1);
            result.SessionRegistrations.Should().Contain(sr => sr.SessionId == 3);
            result.SessionRegistrations.Should().NotContain(sr => sr.SessionId == 2);
        }

        [Test]
        public async Task AddSessionToEvent_ShouldAddNewSessionToExistingEvent()
        {
            // Arrange
            var multiSessionEventId = 1;
            var request = new AddEventSessionRequest
            {
                Name = "Bonus Session",
                Description = "Additional bonus content",
                StartDateTime = DateTime.Now.AddDays(28),
                EndDateTime = DateTime.Now.AddDays(28).AddHours(2),
                SessionNumber = 4,
                MaxCapacity = 20
            };

            var multiSessionEvent = new MultiSessionEvent
            {
                Id = multiSessionEventId,
                ClubId = 1,
                Name = "Python Workshop"
            };

            var newSession = new EventSession
            {
                Id = 4,
                MultiSessionEventId = multiSessionEventId,
                Name = request.Name,
                SessionNumber = request.SessionNumber
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByIdAsync(multiSessionEventId))
                .ReturnsAsync(multiSessionEvent);

            _mockEventSessionRepository
                .Setup(x => x.CreateAsync(It.IsAny<EventSession>()))
                .ReturnsAsync(newSession);

            // Act
            var result = await _multiSessionEventService.AddSessionToEventAsync(multiSessionEventId, request);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(4);
            result.SessionNumber.Should().Be(4);
            result.Name.Should().Be(request.Name);
            _mockEventSessionRepository.Verify(x => x.CreateAsync(It.IsAny<EventSession>()), Times.Once);
        }

        [Test]
        public async Task UpdateEventSession_ShouldUpdateExistingSession()
        {
            // Arrange
            var sessionId = 1;
            var request = new UpdateEventSessionRequest
            {
                Name = "Updated Session Name",
                Description = "Updated description",
                StartDateTime = DateTime.Now.AddDays(10),
                EndDateTime = DateTime.Now.AddDays(10).AddHours(3)
            };

            var existingSession = new EventSession
            {
                Id = sessionId,
                Name = "Old Session Name",
                Description = "Old description"
            };

            _mockEventSessionRepository
                .Setup(x => x.GetByIdAsync(sessionId))
                .ReturnsAsync(existingSession);

            _mockEventSessionRepository
                .Setup(x => x.UpdateAsync(It.IsAny<EventSession>()))
                .ReturnsAsync((EventSession session) => session);

            // Act
            var result = await _multiSessionEventService.UpdateEventSessionAsync(sessionId, request);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be(request.Name);
            result.Description.Should().Be(request.Description);
            result.StartDateTime.Should().Be(request.StartDateTime);
            result.EndDateTime.Should().Be(request.EndDateTime);
        }

        [Test]
        public async Task GetSessionAttendance_ShouldReturnAttendanceForSpecificSession()
        {
            // Arrange
            var sessionId = 1;
            var attendanceRecords = new List<EventSessionAttendance>
            {
                new EventSessionAttendance { Id = 1, SessionId = sessionId, MemberId = 1, AttendedAt = DateTime.UtcNow },
                new EventSessionAttendance { Id = 2, SessionId = sessionId, MemberId = 2, AttendedAt = DateTime.UtcNow },
                new EventSessionAttendance { Id = 3, SessionId = sessionId, MemberId = 3, AttendedAt = null }
            };

            _mockEventSessionRepository
                .Setup(x => x.GetSessionAttendanceAsync(sessionId))
                .ReturnsAsync(attendanceRecords);

            // Act
            var result = await _multiSessionEventService.GetSessionAttendanceAsync(sessionId);

            // Assert
            result.Should().NotBeNull();
            result.Count.Should().Be(3);
            result.Count(a => a.AttendedAt.HasValue).Should().Be(2);
            result.Count(a => !a.AttendedAt.HasValue).Should().Be(1);
        }

        [Test]
        public async Task GetMemberProgress_ShouldReturnMemberProgressAcrossAllSessions()
        {
            // Arrange
            var multiSessionEventId = 1;
            var memberId = 1;

            var memberProgress = new MultiSessionMemberProgress
            {
                MemberId = memberId,
                MultiSessionEventId = multiSessionEventId,
                TotalSessions = 3,
                CompletedSessions = 2,
                OverallProgress = 67,
                SessionProgresses = new List<SessionProgress>
                {
                    new SessionProgress { SessionId = 1, SessionNumber = 1, Completed = true },
                    new SessionProgress { SessionId = 2, SessionNumber = 2, Completed = true },
                    new SessionProgress { SessionId = 3, SessionNumber = 3, Completed = false }
                }
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.GetMemberProgressAsync(multiSessionEventId, memberId))
                .ReturnsAsync(memberProgress);

            // Act
            var result = await _multiSessionEventService.GetMemberProgressAsync(multiSessionEventId, memberId);

            // Assert
            result.Should().NotBeNull();
            result.MemberId.Should().Be(memberId);
            result.OverallProgress.Should().Be(67);
            result.CompletedSessions.Should().Be(2);
            result.TotalSessions.Should().Be(3);
        }

        [TestCase(true, true)] // Can register for individual sessions when allowed
        [TestCase(false, false)] // Cannot register for individual sessions when not allowed
        public async Task RegisterForMultiSessionEvent_ShouldRespectIndividualSessionRegistrationPolicy(
            bool allowIndividualRegistration, bool shouldAllowSelectedSessions)
        {
            // Arrange
            var multiSessionEventId = 1;
            var memberId = 1;
            var request = new MultiSessionRegistrationRequest
            {
                MemberId = memberId,
                RegisterForAllSessions = false,
                SelectedSessionIds = new List<int> { 1, 2 }
            };

            var multiSessionEvent = new MultiSessionEvent
            {
                Id = multiSessionEventId,
                AllowIndividualSessionRegistration = allowIndividualRegistration,
                Sessions = new List<EventSession>
                {
                    new EventSession { Id = 1, SessionNumber = 1 },
                    new EventSession { Id = 2, SessionNumber = 2 },
                    new EventSession { Id = 3, SessionNumber = 3 }
                }
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByIdWithSessionsAsync(multiSessionEventId))
                .ReturnsAsync(multiSessionEvent);

            // Act & Assert
            if (shouldAllowSelectedSessions)
            {
                _mockMultiSessionEventRepository
                    .Setup(x => x.CreateRegistrationAsync(It.IsAny<MultiSessionEventRegistration>()))
                    .ReturnsAsync((MultiSessionEventRegistration reg) => reg);

                var result = await _multiSessionEventService.RegisterForMultiSessionEventAsync(multiSessionEventId, request);
                result.Should().NotBeNull();
                result.SessionRegistrations.Count.Should().Be(2);
            }
            else
            {
                var ex = Assert.ThrowsAsync<InvalidOperationException>(
                    () => _multiSessionEventService.RegisterForMultiSessionEventAsync(multiSessionEventId, request));
            }
        }

        #region GetMultiSessionEventsByClubAsync Tests

        [Test]
        public async Task GetMultiSessionEventsByClubAsync_ShouldReturnAllEventsForClub()
        {
            // Arrange
            var clubId = 1;
            var events = new List<MultiSessionEvent>
            {
                new MultiSessionEvent { Id = 1, ClubId = clubId, Name = "Event 1" },
                new MultiSessionEvent { Id = 2, ClubId = clubId, Name = "Event 2" }
            };

            var sessions1 = new List<EventSession>
            {
                new EventSession { Id = 1, MultiSessionEventId = 1, SessionNumber = 1, Name = "Session 1-1" }
            };
            var sessions2 = new List<EventSession>
            {
                new EventSession { Id = 2, MultiSessionEventId = 2, SessionNumber = 1, Name = "Session 2-1" }
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByClubIdAsync(clubId))
                .ReturnsAsync(events);

            _mockEventSessionRepository
                .Setup(x => x.GetByMultiSessionEventIdAsync(1))
                .ReturnsAsync(sessions1);
            _mockEventSessionRepository
                .Setup(x => x.GetByMultiSessionEventIdAsync(2))
                .ReturnsAsync(sessions2);

            // Act
            var result = await _multiSessionEventService.GetMultiSessionEventsByClubAsync(clubId);

            // Assert
            result.Should().NotBeNull();
            result.Count.Should().Be(2);
            result.Should().Contain(e => e.Name == "Event 1");
            result.Should().Contain(e => e.Name == "Event 2");
        }

        [Test]
        public async Task GetMultiSessionEventsByClubAsync_WithNoEvents_ReturnsEmptyList()
        {
            // Arrange
            var clubId = 999;

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByClubIdAsync(clubId))
                .ReturnsAsync(new List<MultiSessionEvent>());

            // Act
            var result = await _multiSessionEventService.GetMultiSessionEventsByClubAsync(clubId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        #endregion

        #region CreateMultiSessionEventAsync Edge Cases

        [Test]
        public void CreateMultiSessionEventAsync_WithEmptySessions_ThrowsArgumentException()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateMultiSessionEventRequest
            {
                Name = "Test Event",
                Sessions = new List<EventSessionRequest>()
            };

            // Act & Assert
            var ex = Assert.ThrowsAsync<ArgumentException>(
                () => _multiSessionEventService.CreateMultiSessionEventAsync(clubId, request));
            ex.Message.Should().Contain("At least one session is required");
        }

        [Test]
        public void CreateMultiSessionEventAsync_WithDuplicateSessionNumbers_ThrowsArgumentException()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateMultiSessionEventRequest
            {
                Name = "Test Event",
                Sessions = new List<EventSessionRequest>
                {
                    new EventSessionRequest
                    {
                        Name = "Session A",
                        SessionNumber = 1,
                        StartDateTime = DateTime.Now.AddDays(1),
                        EndDateTime = DateTime.Now.AddDays(1).AddHours(2)
                    },
                    new EventSessionRequest
                    {
                        Name = "Session B",
                        SessionNumber = 1, // Duplicate session number
                        StartDateTime = DateTime.Now.AddDays(2),
                        EndDateTime = DateTime.Now.AddDays(2).AddHours(2)
                    }
                }
            };

            // Act & Assert
            var ex = Assert.ThrowsAsync<ArgumentException>(
                () => _multiSessionEventService.CreateMultiSessionEventAsync(clubId, request));
            ex.Message.Should().Contain("Duplicate session numbers");
        }

        [Test]
        public void CreateMultiSessionEventAsync_WithInvalidDateOrder_ThrowsArgumentException()
        {
            // Arrange
            var clubId = 1;
            var request = new CreateMultiSessionEventRequest
            {
                Name = "Test Event",
                Sessions = new List<EventSessionRequest>
                {
                    new EventSessionRequest
                    {
                        Name = "Invalid Session",
                        SessionNumber = 1,
                        StartDateTime = DateTime.Now.AddDays(1).AddHours(5), // Start after end
                        EndDateTime = DateTime.Now.AddDays(1).AddHours(2)
                    }
                }
            };

            // Act & Assert
            var ex = Assert.ThrowsAsync<ArgumentException>(
                () => _multiSessionEventService.CreateMultiSessionEventAsync(clubId, request));
            ex.Message.Should().Contain("end time must be after start time");
        }

        #endregion

        #region GetMultiSessionEventAsync Edge Cases

        [Test]
        public async Task GetMultiSessionEventAsync_WhenNotFound_ReturnsNull()
        {
            // Arrange
            var nonExistentId = 9999;

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByIdWithSessionsAsync(nonExistentId))
                .ReturnsAsync((MultiSessionEvent?)null);

            // Act
            var result = await _multiSessionEventService.GetMultiSessionEventAsync(nonExistentId);

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region RegisterForMultiSessionEventAsync Edge Cases

        [Test]
        public void RegisterForMultiSessionEventAsync_WhenEventNotFound_ThrowsArgumentException()
        {
            // Arrange
            var nonExistentEventId = 9999;
            var request = new MultiSessionRegistrationRequest
            {
                MemberId = 1,
                RegisterForAllSessions = true
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByIdWithSessionsAsync(nonExistentEventId))
                .ReturnsAsync((MultiSessionEvent?)null);

            // Act & Assert
            var ex = Assert.ThrowsAsync<ArgumentException>(
                () => _multiSessionEventService.RegisterForMultiSessionEventAsync(nonExistentEventId, request));
            ex.Message.Should().Contain("not found");
        }

        [Test]
        public void RegisterForMultiSessionEventAsync_WithNoValidSessionsSelected_ThrowsArgumentException()
        {
            // Arrange
            var multiSessionEventId = 1;
            var request = new MultiSessionRegistrationRequest
            {
                MemberId = 1,
                RegisterForAllSessions = false,
                SelectedSessionIds = new List<int> { 999 } // Non-existent session ID
            };

            var multiSessionEvent = new MultiSessionEvent
            {
                Id = multiSessionEventId,
                AllowIndividualSessionRegistration = true,
                Sessions = new List<EventSession>
                {
                    new EventSession { Id = 1, SessionNumber = 1 },
                    new EventSession { Id = 2, SessionNumber = 2 }
                }
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByIdWithSessionsAsync(multiSessionEventId))
                .ReturnsAsync(multiSessionEvent);

            // Act & Assert
            var ex = Assert.ThrowsAsync<ArgumentException>(
                () => _multiSessionEventService.RegisterForMultiSessionEventAsync(multiSessionEventId, request));
            ex.Message.Should().Contain("No valid sessions");
        }

        [Test]
        public void RegisterForMultiSessionEventAsync_WhenRegistrationCreationFails_ThrowsInvalidOperationException()
        {
            // Arrange
            var multiSessionEventId = 1;
            var request = new MultiSessionRegistrationRequest
            {
                MemberId = 1,
                RegisterForAllSessions = true
            };

            var multiSessionEvent = new MultiSessionEvent
            {
                Id = multiSessionEventId,
                AllowIndividualSessionRegistration = true,
                Sessions = new List<EventSession>
                {
                    new EventSession { Id = 1, SessionNumber = 1 }
                }
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByIdWithSessionsAsync(multiSessionEventId))
                .ReturnsAsync(multiSessionEvent);

            _mockMultiSessionEventRepository
                .Setup(x => x.CreateRegistrationAsync(It.IsAny<MultiSessionEventRegistration>()))
                .ReturnsAsync((MultiSessionEventRegistration?)null);

            // Act & Assert
            var ex = Assert.ThrowsAsync<InvalidOperationException>(
                () => _multiSessionEventService.RegisterForMultiSessionEventAsync(multiSessionEventId, request));
            ex.Message.Should().Contain("Failed to create");
        }

        #endregion

        #region AddSessionToEventAsync Edge Cases

        [Test]
        public void AddSessionToEventAsync_WhenEventNotFound_ThrowsArgumentException()
        {
            // Arrange
            var nonExistentEventId = 9999;
            var request = new AddEventSessionRequest
            {
                Name = "New Session",
                SessionNumber = 1,
                StartDateTime = DateTime.Now.AddDays(1),
                EndDateTime = DateTime.Now.AddDays(1).AddHours(2)
            };

            _mockMultiSessionEventRepository
                .Setup(x => x.GetByIdAsync(nonExistentEventId))
                .ReturnsAsync((MultiSessionEvent?)null);

            // Act & Assert
            var ex = Assert.ThrowsAsync<ArgumentException>(
                () => _multiSessionEventService.AddSessionToEventAsync(nonExistentEventId, request));
            ex.Message.Should().Contain("not found");
        }

        #endregion

        #region UpdateEventSessionAsync Edge Cases

        [Test]
        public async Task UpdateEventSessionAsync_WhenSessionNotFound_ReturnsNull()
        {
            // Arrange
            var nonExistentSessionId = 9999;
            var request = new UpdateEventSessionRequest
            {
                Name = "Updated Name"
            };

            _mockEventSessionRepository
                .Setup(x => x.GetByIdAsync(nonExistentSessionId))
                .ReturnsAsync((EventSession?)null);

            // Act
            var result = await _multiSessionEventService.UpdateEventSessionAsync(nonExistentSessionId, request);

            // Assert
            result.Should().BeNull();
        }

        [Test]
        public async Task UpdateEventSessionAsync_WithPartialUpdate_OnlyUpdatesProvidedFields()
        {
            // Arrange
            var sessionId = 1;
            var originalSession = new EventSession
            {
                Id = sessionId,
                Name = "Original Name",
                Description = "Original Description",
                StartDateTime = DateTime.Now,
                EndDateTime = DateTime.Now.AddHours(2),
                MaxCapacity = 10,
                IsMandatory = false
            };

            var request = new UpdateEventSessionRequest
            {
                Name = "Updated Name"
                // Only name is being updated
            };

            _mockEventSessionRepository
                .Setup(x => x.GetByIdAsync(sessionId))
                .ReturnsAsync(originalSession);

            _mockEventSessionRepository
                .Setup(x => x.UpdateAsync(It.IsAny<EventSession>()))
                .ReturnsAsync((EventSession session) => session);

            // Act
            var result = await _multiSessionEventService.UpdateEventSessionAsync(sessionId, request);

            // Assert
            result.Should().NotBeNull();
            result!.Name.Should().Be("Updated Name");
            result.Description.Should().Be("Original Description"); // Unchanged
        }

        #endregion

        #region GetMemberProgressAsync Tests

        [Test]
        public async Task GetMemberProgressAsync_WhenNoProgress_ReturnsNull()
        {
            // Arrange
            var multiSessionEventId = 1;
            var memberId = 999;

            _mockMultiSessionEventRepository
                .Setup(x => x.GetMemberProgressAsync(multiSessionEventId, memberId))
                .ReturnsAsync((MultiSessionMemberProgress?)null);

            // Act
            var result = await _multiSessionEventService.GetMemberProgressAsync(multiSessionEventId, memberId);

            // Assert
            result.Should().BeNull();
        }

        #endregion
    }
}