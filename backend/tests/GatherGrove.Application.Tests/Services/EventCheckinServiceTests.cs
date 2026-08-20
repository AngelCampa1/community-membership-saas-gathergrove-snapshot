using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace GatherGrove.Application.Tests.Services
{
    /// <summary>
    /// Test suite for Event Check-in Service functionality
    /// Covers QR code generation, validation, and check-in processes
    /// </summary>
    [TestFixture]
    public class EventCheckinServiceTests
    {
        private Mock<ILogger<EventCheckinService>> _mockLogger;
        private GatherGroveDbContext _context;
        private Mock<IQRCodeService> _mockQRCodeService;
        private EventCheckinService _eventCheckinService;

        [SetUp]
        public void Setup()
        {
            _mockLogger = new Mock<ILogger<EventCheckinService>>();

            // Use InMemoryDatabase for DbContext
            var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new GatherGroveDbContext(options);

            _mockQRCodeService = new Mock<IQRCodeService>();

            _eventCheckinService = new EventCheckinService(
                _context,
                _mockQRCodeService.Object,
                _mockLogger.Object
            );
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Test]
        public async Task GenerateEventCheckinQRCode_ShouldCreateQRCodeForEvent()
        {
            // Arrange
            const int eventId = 100;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 1
            };
            await _context.Events.AddAsync(testEvent);
            await _context.SaveChangesAsync();

            var request = new GenerateEventQRCodeRequest
            {
                ClubId = 1,
                EventId = eventId,
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                AllowMultipleScans = false,
                RequireRSVP = true
            };

            var expectedResponse = new EventQRCodeResponse
            {
                Id = 1,
                EventId = eventId,
                QRCodeData = "TEST_QR_CODE_DATA",
                QRCodeImageBase64 = "BASE64_IMAGE_DATA",
                QRCodeType = QRCodeType.EventCheckin,
                ExpiresAt = request.ExpiresAt,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _mockQRCodeService
                .Setup(x => x.GenerateEventQRCodeAsync(It.Is<GenerateEventQRCodeRequest>(r => r.EventId == eventId)))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _eventCheckinService.GenerateEventCheckinQRCodeAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.EventId.Should().Be(eventId);
            result.QRCodeData.Should().Be(expectedResponse.QRCodeData);
            result.IsActive.Should().BeTrue();
            _mockQRCodeService.Verify(x => x.GenerateEventQRCodeAsync(It.IsAny<GenerateEventQRCodeRequest>()), Times.Once);
        }

        [Test]
        public async Task GenerateEventCheckinQRCode_ShouldFailWhenEventDoesNotBelongToExpectedClub()
        {
            // Arrange
            const int eventId = 101;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Wrong Club Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 2
            };
            await _context.Events.AddAsync(testEvent);
            await _context.SaveChangesAsync();

            var request = new GenerateEventQRCodeRequest
            {
                ClubId = 1,
                EventId = eventId
            };

            // Act
            var act = async () => await _eventCheckinService.GenerateEventCheckinQRCodeAsync(request);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage("Event does not belong to the specified club");
            _mockQRCodeService.Verify(x => x.GenerateEventQRCodeAsync(It.IsAny<GenerateEventQRCodeRequest>()), Times.Never);
        }

        [Test]
        public async Task CheckinWithQRCode_ShouldCheckInMemberSuccessfully()
        {
            // Arrange
            const int eventId = 200;
            const int memberId = 10;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 1
            };
            var testRsvp = new EventRsvp
            {
                EventId = eventId,
                MemberId = memberId,
                Status = Domain.Enums.RsvpStatus.Confirmed
            };
            var testMember = new Member
            {
                Id = memberId,
                ClubId = 1,
                MembershipTypeId = 1,
                FullName = "Manual Checkin Member",
                Email = "manual-checkin-member@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow
            };

            await _context.Events.AddAsync(testEvent);
            await _context.Members.AddAsync(testMember);
            await _context.EventRsvps.AddAsync(testRsvp);
            await _context.SaveChangesAsync();

            var checkinRequest = new QRCodeCheckinRequest
            {
                ClubId = 1,
                EventId = eventId,
                QRCodeData = "VALID_QR_CODE",
                MemberId = memberId,
                CheckinTime = DateTime.UtcNow,
                Location = "Main Entrance"
            };

            var validationResult = new QRCodeValidationResult
            {
                IsValid = true,
                EventId = eventId,
                EventName = "Test Event",
                MemberId = memberId,
                ValidatedAt = DateTime.UtcNow
            };

            _mockQRCodeService
                .Setup(x => x.ValidateQRCodeAsync(It.IsAny<QRCodeCheckinRequest>()))
                .ReturnsAsync(validationResult);

            // Act
            var result = await _eventCheckinService.CheckinWithQRCodeAsync(checkinRequest);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue(result.ErrorMessage);
            result.CheckinTime.Should().NotBeNull();
            result.CheckinMethod.Should().Be(CheckinMethod.QRCode);

            // Verify checkin was saved to database
            var savedCheckin = await _context.EventCheckins
                .FirstOrDefaultAsync(c => c.EventId == eventId && c.MemberId == memberId);
            savedCheckin.Should().NotBeNull();
            savedCheckin!.CheckinMethod.Should().Be(CheckinMethod.QRCode);
        }

        [Test]
        public async Task CheckinWithQRCode_ShouldFailWhenTokenEventDoesNotMatchExpectedEvent()
        {
            // Arrange
            const int expectedEventId = 200;
            const int tokenEventId = 201;
            const int memberId = 10;
            var checkinRequest = new QRCodeCheckinRequest
            {
                EventId = expectedEventId,
                QRCodeData = "VALID_OTHER_EVENT_QR_CODE",
                MemberId = memberId,
                CheckinTime = DateTime.UtcNow
            };

            var validationResult = new QRCodeValidationResult
            {
                IsValid = true,
                EventId = tokenEventId,
                EventName = "Other Event",
                MemberId = memberId,
                ValidatedAt = DateTime.UtcNow
            };

            _mockQRCodeService
                .Setup(x => x.ValidateQRCodeAsync(It.IsAny<QRCodeCheckinRequest>()))
                .ReturnsAsync(validationResult);

            // Act
            var result = await _eventCheckinService.CheckinWithQRCodeAsync(checkinRequest);

            // Assert
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Be("QR code is not valid for this event");
            var savedCheckin = await _context.EventCheckins.FirstOrDefaultAsync();
            savedCheckin.Should().BeNull();
        }

        [Test]
        public async Task CheckinWithQRCode_ShouldFailWhenEventDoesNotBelongToExpectedClub()
        {
            // Arrange
            const int expectedClubId = 1;
            const int actualClubId = 2;
            const int eventId = 202;
            const int memberId = 10;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Wrong Club Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = actualClubId
            };

            await _context.Events.AddAsync(testEvent);
            await _context.SaveChangesAsync();

            var checkinRequest = new QRCodeCheckinRequest
            {
                ClubId = expectedClubId,
                EventId = eventId,
                QRCodeData = "VALID_WRONG_CLUB_QR_CODE",
                MemberId = memberId,
                CheckinTime = DateTime.UtcNow
            };

            var validationResult = new QRCodeValidationResult
            {
                IsValid = true,
                EventId = eventId,
                EventName = "Wrong Club Event",
                MemberId = memberId,
                ValidatedAt = DateTime.UtcNow
            };

            _mockQRCodeService
                .Setup(x => x.ValidateQRCodeAsync(It.IsAny<QRCodeCheckinRequest>()))
                .ReturnsAsync(validationResult);

            // Act
            var result = await _eventCheckinService.CheckinWithQRCodeAsync(checkinRequest);

            // Assert
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Be("QR code is not valid for this event");
            var savedCheckin = await _context.EventCheckins.FirstOrDefaultAsync();
            savedCheckin.Should().BeNull();
        }

        [Test]
        public async Task CheckinWithQRCode_ShouldFailWhenMemberBelongsToDifferentClub()
        {
            // Arrange
            const int eventId = 203;
            const int memberId = 10;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Cross Club Member Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 1
            };
            var testMember = new Member
            {
                Id = memberId,
                ClubId = 2,
                MembershipTypeId = 1,
                FullName = "Other Club Member",
                Email = "other-club-member@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow
            };
            var testRsvp = new EventRsvp
            {
                EventId = eventId,
                MemberId = memberId,
                Status = Domain.Enums.RsvpStatus.Confirmed
            };

            await _context.Events.AddAsync(testEvent);
            await _context.Members.AddAsync(testMember);
            await _context.EventRsvps.AddAsync(testRsvp);
            await _context.SaveChangesAsync();

            var checkinRequest = new QRCodeCheckinRequest
            {
                ClubId = 1,
                EventId = eventId,
                QRCodeData = "VALID_CROSS_CLUB_QR_CODE",
                MemberId = memberId,
                CheckinTime = DateTime.UtcNow
            };

            var validationResult = new QRCodeValidationResult
            {
                IsValid = true,
                EventId = eventId,
                MemberId = memberId
            };

            _mockQRCodeService
                .Setup(x => x.ValidateQRCodeAsync(It.IsAny<QRCodeCheckinRequest>()))
                .ReturnsAsync(validationResult);

            // Act
            var result = await _eventCheckinService.CheckinWithQRCodeAsync(checkinRequest);

            // Assert
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Contain("event club");
            var savedCheckin = await _context.EventCheckins
                .FirstOrDefaultAsync(c => c.EventId == eventId && c.MemberId == memberId);
            savedCheckin.Should().BeNull();
        }

        [Test]
        public async Task CheckinWithQRCode_ShouldFailWhenQRCodeExpired()
        {
            // Arrange
            const int memberId = 20;
            var checkinRequest = new QRCodeCheckinRequest
            {
                QRCodeData = "EXPIRED_QR_CODE",
                MemberId = memberId,
                CheckinTime = DateTime.UtcNow
            };

            var validationResult = new QRCodeValidationResult
            {
                IsValid = false,
                ErrorMessage = "QR code has expired"
            };

            _mockQRCodeService
                .Setup(x => x.ValidateQRCodeAsync(It.IsAny<QRCodeCheckinRequest>()))
                .ReturnsAsync(validationResult);

            // Act
            var result = await _eventCheckinService.CheckinWithQRCodeAsync(checkinRequest);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Contain("expired");

            // Verify no checkin was saved
            var checkins = await _context.EventCheckins.ToListAsync();
            checkins.Should().BeEmpty();
        }

        [Test]
        public async Task CheckinWithQRCode_ShouldFailWhenRSVPRequiredButNotFound()
        {
            // Arrange
            const int eventId = 300;
            const int memberId = 30;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 1
            };
            var testMember = new Member
            {
                Id = memberId,
                ClubId = 1,
                MembershipTypeId = 1,
                FullName = "No RSVP Member",
                Email = "no-rsvp-member@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow
            };

            await _context.Events.AddAsync(testEvent);
            await _context.Members.AddAsync(testMember);
            await _context.SaveChangesAsync();

            var checkinRequest = new QRCodeCheckinRequest
            {
                QRCodeData = "VALID_QR_CODE",
                MemberId = memberId,
                CheckinTime = DateTime.UtcNow
            };

            var validationResult = new QRCodeValidationResult
            {
                IsValid = true,
                EventId = eventId,
                MemberId = memberId
            };

            _mockQRCodeService
                .Setup(x => x.ValidateQRCodeAsync(It.IsAny<QRCodeCheckinRequest>()))
                .ReturnsAsync(validationResult);

            // Act
            var result = await _eventCheckinService.CheckinWithQRCodeAsync(checkinRequest);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Contain("RSVP");

            // Verify no checkin was saved
            var checkins = await _context.EventCheckins
                .Where(c => c.EventId == eventId && c.MemberId == memberId)
                .ToListAsync();
            checkins.Should().BeEmpty();
        }

        [Test]
        public async Task CheckinWithQRCode_ShouldFailWhenMemberAlreadyCheckedIn()
        {
            // Arrange
            const int eventId = 400;
            const int memberId = 40;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 1
            };
            var testRsvp = new EventRsvp
            {
                EventId = eventId,
                MemberId = memberId,
                Status = Domain.Enums.RsvpStatus.Confirmed
            };
            var existingCheckin = new EventCheckin
            {
                EventId = eventId,
                MemberId = memberId,
                CheckinTime = DateTime.UtcNow.AddMinutes(-30),
                CheckinMethod = CheckinMethod.QRCode
            };
            var testMember = new Member
            {
                Id = memberId,
                ClubId = 1,
                MembershipTypeId = 1,
                FullName = "Already Checked In Member",
                Email = "already-checked-in-member@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow
            };

            await _context.Events.AddAsync(testEvent);
            await _context.Members.AddAsync(testMember);
            await _context.EventRsvps.AddAsync(testRsvp);
            await _context.EventCheckins.AddAsync(existingCheckin);
            await _context.SaveChangesAsync();

            var checkinRequest = new QRCodeCheckinRequest
            {
                QRCodeData = "VALID_QR_CODE",
                MemberId = memberId,
                CheckinTime = DateTime.UtcNow
            };

            var validationResult = new QRCodeValidationResult
            {
                IsValid = true,
                EventId = eventId,
                MemberId = memberId
            };

            _mockQRCodeService
                .Setup(x => x.ValidateQRCodeAsync(It.IsAny<QRCodeCheckinRequest>()))
                .ReturnsAsync(validationResult);

            // Act
            var result = await _eventCheckinService.CheckinWithQRCodeAsync(checkinRequest);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Contain("already checked in");

            // Verify only one checkin exists
            var checkins = await _context.EventCheckins
                .Where(c => c.EventId == eventId && c.MemberId == memberId)
                .ToListAsync();
            checkins.Should().HaveCount(1);
        }

        [Test]
        public async Task GetEventCheckins_ShouldReturnAllCheckinsForEvent()
        {
            // Arrange
            const int eventId = 500;
            var checkin1 = new EventCheckin
            {
                EventId = eventId,
                MemberId = 51,
                CheckinTime = DateTime.UtcNow.AddMinutes(-60),
                CheckinMethod = CheckinMethod.QRCode
            };
            var checkin2 = new EventCheckin
            {
                EventId = eventId,
                MemberId = 52,
                CheckinTime = DateTime.UtcNow.AddMinutes(-30),
                CheckinMethod = CheckinMethod.Manual
            };
            var checkin3 = new EventCheckin
            {
                EventId = eventId,
                MemberId = 53,
                CheckinTime = DateTime.UtcNow.AddMinutes(-15),
                CheckinMethod = CheckinMethod.QRCode
            };
            // Different event - should not be returned
            var otherEventCheckin = new EventCheckin
            {
                EventId = 999,
                MemberId = 54,
                CheckinTime = DateTime.UtcNow,
                CheckinMethod = CheckinMethod.QRCode
            };

            await _context.EventCheckins.AddRangeAsync(checkin1, checkin2, checkin3, otherEventCheckin);
            await _context.SaveChangesAsync();

            // Act
            var result = await _eventCheckinService.GetEventCheckinsAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(3);
            result.All(c => c.EventId == eventId).Should().BeTrue();
            result.Should().BeInDescendingOrder(c => c.CheckinTime);
        }

        [Test]
        public async Task CheckoutMember_ShouldCheckOutMemberSuccessfully()
        {
            // Arrange
            const int eventId = 600;
            const int memberId = 60;
            var checkinTime = DateTime.UtcNow.AddHours(-2);
            var checkoutTime = DateTime.UtcNow;

            var activeCheckin = new EventCheckin
            {
                EventId = eventId,
                MemberId = memberId,
                CheckinTime = checkinTime,
                CheckinMethod = CheckinMethod.QRCode,
                CheckoutTime = null // Active checkin
            };

            await _context.EventCheckins.AddAsync(activeCheckin);
            await _context.SaveChangesAsync();

            // Act
            var result = await _eventCheckinService.CheckoutMemberAsync(eventId, memberId, checkoutTime);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.CheckinTime.Should().Be(checkinTime);
            result.CheckoutTime.Should().Be(checkoutTime);
            result.Duration.Should().NotBeNull();
            result.Duration!.Value.TotalHours.Should().BeApproximately(2, 0.1);

            // Verify checkout was saved
            var updatedCheckin = await _context.EventCheckins
                .FirstOrDefaultAsync(c => c.EventId == eventId && c.MemberId == memberId);
            updatedCheckin.Should().NotBeNull();
            updatedCheckin!.CheckoutTime.Should().Be(checkoutTime);
        }

        [Test]
        public async Task GenerateMemberQRCode_ShouldCreatePersonalizedQRCodeForMember()
        {
            // Arrange
            const int eventId = 700;
            const int memberId = 70;

            var request = new GenerateMemberQRCodeRequest
            {
                EventId = eventId,
                MemberId = memberId,
                ValidForHours = 24,
                CustomData = new Dictionary<string, string>
                {
                    { "vipAccess", "true" },
                    { "seatNumber", "A-101" }
                }
            };

            // Act
            var result = await _eventCheckinService.GenerateMemberQRCodeAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.EventId.Should().Be(eventId);
            result.MemberId.Should().Be(memberId);
            result.QRCodeData.Should().NotBeNullOrEmpty();
            result.QRCodeData.Should().Contain($"{eventId}");
            result.QRCodeData.Should().Contain($"{memberId}");
            result.IsActive.Should().BeTrue();
            result.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddHours(24), TimeSpan.FromMinutes(1));
        }

        #region GetCheckinStatisticsAsync Tests

        [Test]
        public async Task GetCheckinStatisticsAsync_ShouldReturnStatisticsForEvent()
        {
            // Arrange
            const int eventId = 800;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Stats Event",
                EventDateTime = DateTime.UtcNow.AddDays(-1),
                ClubId = 1
            };

            var checkins = new[]
            {
                new EventCheckin
                {
                    EventId = eventId,
                    MemberId = 81,
                    CheckinTime = DateTime.UtcNow.AddHours(-3),
                    CheckoutTime = DateTime.UtcNow.AddHours(-1),
                    CheckinMethod = CheckinMethod.QRCode
                },
                new EventCheckin
                {
                    EventId = eventId,
                    MemberId = 82,
                    CheckinTime = DateTime.UtcNow.AddHours(-2),
                    CheckoutTime = DateTime.UtcNow.AddMinutes(-30),
                    CheckinMethod = CheckinMethod.Manual
                },
                new EventCheckin
                {
                    EventId = eventId,
                    MemberId = 83,
                    CheckinTime = DateTime.UtcNow.AddHours(-1),
                    CheckoutTime = null, // Still active
                    CheckinMethod = CheckinMethod.QRCode
                }
            };

            await _context.Events.AddAsync(testEvent);
            await _context.EventCheckins.AddRangeAsync(checkins);
            await _context.SaveChangesAsync();

            // Act
            var result = await _eventCheckinService.GetCheckinStatisticsAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.TotalCheckins.Should().Be(3);
            result.QRCodeCheckins.Should().Be(2);
            result.ManualCheckins.Should().Be(1);
        }

        [Test]
        public async Task GetCheckinStatisticsAsync_WithNoCheckins_ReturnsEmptyStats()
        {
            // Arrange
            const int eventId = 801;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Empty Stats Event",
                EventDateTime = DateTime.UtcNow.AddDays(-1),
                ClubId = 1
            };

            await _context.Events.AddAsync(testEvent);
            await _context.SaveChangesAsync();

            // Act
            var result = await _eventCheckinService.GetCheckinStatisticsAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.TotalCheckins.Should().Be(0);
            result.QRCodeCheckins.Should().Be(0);
            result.ManualCheckins.Should().Be(0);
        }

        #endregion

        #region ManualCheckinAsync Tests

        [Test]
        public async Task ManualCheckinAsync_ShouldCheckInMemberSuccessfully()
        {
            // Arrange
            const int eventId = 900;
            const int memberId = 90;
            var checkinTime = DateTime.UtcNow;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Manual Checkin Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 1
            };
            var testRsvp = new EventRsvp
            {
                EventId = eventId,
                MemberId = memberId,
                Status = Domain.Enums.RsvpStatus.Confirmed
            };
            var testMember = new Member
            {
                Id = memberId,
                ClubId = 1,
                MembershipTypeId = 1,
                FullName = "Manual Checkin Member",
                Email = "manual-checkin-member@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow
            };

            await _context.Events.AddAsync(testEvent);
            await _context.Members.AddAsync(testMember);
            await _context.EventRsvps.AddAsync(testRsvp);
            await _context.SaveChangesAsync();

            // Act
            var result = await _eventCheckinService.ManualCheckinAsync(eventId, memberId, checkinTime, "Lobby");

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue(result.ErrorMessage);
            result.CheckinMethod.Should().Be(CheckinMethod.Manual);
            result.CheckinTime.Should().NotBeNull();

            // Verify checkin was saved with Manual method
            var savedCheckin = await _context.EventCheckins
                .FirstOrDefaultAsync(c => c.EventId == eventId && c.MemberId == memberId);
            savedCheckin.Should().NotBeNull();
            savedCheckin!.CheckinMethod.Should().Be(CheckinMethod.Manual);
            savedCheckin.CheckinLocation.Should().Be("Lobby");
        }

        [Test]
        public async Task ManualCheckinAsync_WithAlreadyCheckedIn_ShouldFail()
        {
            // Arrange
            const int eventId = 901;
            const int memberId = 91;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Duplicate Checkin Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 1
            };
            var existingCheckin = new EventCheckin
            {
                EventId = eventId,
                MemberId = memberId,
                CheckinTime = DateTime.UtcNow.AddHours(-1),
                CheckinMethod = CheckinMethod.QRCode
            };
            var testMember = new Member
            {
                Id = memberId,
                ClubId = 1,
                MembershipTypeId = 1,
                FullName = "Duplicate Checkin Member",
                Email = "duplicate-checkin-member@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow
            };

            await _context.Events.AddAsync(testEvent);
            await _context.Members.AddAsync(testMember);
            await _context.EventCheckins.AddAsync(existingCheckin);
            await _context.SaveChangesAsync();

            // Act
            var result = await _eventCheckinService.ManualCheckinAsync(eventId, memberId, DateTime.UtcNow);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Contain("already checked in");
        }

        [Test]
        public async Task ManualCheckinAsync_WithoutLocation_ShouldSucceed()
        {
            // Arrange
            const int eventId = 902;
            const int memberId = 92;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "No Location Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 1
            };
            var testRsvp = new EventRsvp
            {
                EventId = eventId,
                MemberId = memberId,
                Status = Domain.Enums.RsvpStatus.Confirmed
            };
            var testMember = new Member
            {
                Id = memberId,
                ClubId = 1,
                MembershipTypeId = 1,
                FullName = "No Location Member",
                Email = "no-location-member@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow
            };

            await _context.Events.AddAsync(testEvent);
            await _context.Members.AddAsync(testMember);
            await _context.EventRsvps.AddAsync(testRsvp);
            await _context.SaveChangesAsync();

            // Act - No location provided
            var result = await _eventCheckinService.ManualCheckinAsync(eventId, memberId, DateTime.UtcNow);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.CheckinMethod.Should().Be(CheckinMethod.Manual);
        }

        [Test]
        public async Task ManualCheckinAsync_WithMemberFromDifferentClub_ShouldFail()
        {
            // Arrange
            const int eventId = 903;
            const int memberId = 93;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Cross Club Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 1
            };
            var testMember = new Member
            {
                Id = memberId,
                ClubId = 2,
                MembershipTypeId = 1,
                FullName = "Other Club Member",
                Email = "other-club-member@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow
            };

            await _context.Events.AddAsync(testEvent);
            await _context.Members.AddAsync(testMember);
            await _context.SaveChangesAsync();

            // Act
            var result = await _eventCheckinService.ManualCheckinAsync(eventId, memberId, DateTime.UtcNow);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Contain("event club");
            var savedCheckin = await _context.EventCheckins
                .FirstOrDefaultAsync(c => c.EventId == eventId && c.MemberId == memberId);
            savedCheckin.Should().BeNull();
        }

        #endregion

        #region GetMemberCheckinHistoryAsync Tests

        [Test]
        public async Task GetMemberCheckinHistoryAsync_ShouldReturnAllCheckinsForMember()
        {
            // Arrange
            const int memberId = 100;
            var checkins = new[]
            {
                new EventCheckin
                {
                    EventId = 1001,
                    MemberId = memberId,
                    CheckinTime = DateTime.UtcNow.AddDays(-10),
                    CheckinMethod = CheckinMethod.QRCode
                },
                new EventCheckin
                {
                    EventId = 1002,
                    MemberId = memberId,
                    CheckinTime = DateTime.UtcNow.AddDays(-5),
                    CheckinMethod = CheckinMethod.Manual
                },
                new EventCheckin
                {
                    EventId = 1003,
                    MemberId = memberId,
                    CheckinTime = DateTime.UtcNow.AddDays(-1),
                    CheckinMethod = CheckinMethod.QRCode
                },
                // Different member - should not be returned
                new EventCheckin
                {
                    EventId = 1004,
                    MemberId = 999,
                    CheckinTime = DateTime.UtcNow,
                    CheckinMethod = CheckinMethod.QRCode
                }
            };

            await _context.EventCheckins.AddRangeAsync(checkins);
            await _context.SaveChangesAsync();

            // Act
            var result = await _eventCheckinService.GetMemberCheckinHistoryAsync(memberId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(3);
            result.All(c => c.MemberId == memberId).Should().BeTrue();
        }

        [Test]
        public async Task GetMemberCheckinHistoryAsync_FilteredByEvent_ShouldReturnMatchingCheckins()
        {
            // Arrange
            const int memberId = 101;
            const int targetEventId = 1100;
            var checkins = new[]
            {
                new EventCheckin
                {
                    EventId = targetEventId,
                    MemberId = memberId,
                    CheckinTime = DateTime.UtcNow.AddDays(-5),
                    CheckinMethod = CheckinMethod.QRCode
                },
                new EventCheckin
                {
                    EventId = 1101, // Different event
                    MemberId = memberId,
                    CheckinTime = DateTime.UtcNow.AddDays(-3),
                    CheckinMethod = CheckinMethod.Manual
                }
            };

            await _context.EventCheckins.AddRangeAsync(checkins);
            await _context.SaveChangesAsync();

            // Act - Filter by specific event
            var result = await _eventCheckinService.GetMemberCheckinHistoryAsync(memberId, targetEventId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result.First().EventId.Should().Be(targetEventId);
        }

        [Test]
        public async Task GetMemberCheckinHistoryAsync_NoHistory_ReturnsEmptyList()
        {
            // Arrange
            const int memberId = 102;

            // Act
            var result = await _eventCheckinService.GetMemberCheckinHistoryAsync(memberId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        #endregion

        #region ValidateCheckinEligibilityAsync Tests

        [Test]
        public async Task ValidateCheckinEligibilityAsync_WithValidRSVP_ReturnsCanCheckin()
        {
            // Arrange
            const int eventId = 1200;
            const int memberId = 120;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Valid Event",
                EventDateTime = DateTime.UtcNow.AddHours(-1), // Event has started
                ClubId = 1
            };
            var testRsvp = new EventRsvp
            {
                EventId = eventId,
                MemberId = memberId,
                Status = Domain.Enums.RsvpStatus.Confirmed
            };

            await _context.Events.AddAsync(testEvent);
            await _context.EventRsvps.AddAsync(testRsvp);
            await _context.SaveChangesAsync();

            // Act
            var (canCheckin, reason) = await _eventCheckinService.ValidateCheckinEligibilityAsync(eventId, memberId);

            // Assert
            canCheckin.Should().BeTrue();
            reason.Should().BeNull();
        }

        [Test]
        public async Task ValidateCheckinEligibilityAsync_AlreadyCheckedIn_ReturnsCannotCheckin()
        {
            // Arrange
            const int eventId = 1201;
            const int memberId = 121;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Already Checked In Event",
                EventDateTime = DateTime.UtcNow.AddHours(-1), // Event has started
                ClubId = 1
            };
            var testRsvp = new EventRsvp
            {
                EventId = eventId,
                MemberId = memberId,
                Status = Domain.Enums.RsvpStatus.Confirmed
            };
            var existingCheckin = new EventCheckin
            {
                EventId = eventId,
                MemberId = memberId,
                CheckinTime = DateTime.UtcNow.AddMinutes(-30),
                CheckinMethod = CheckinMethod.QRCode
            };

            await _context.Events.AddAsync(testEvent);
            await _context.EventRsvps.AddAsync(testRsvp);
            await _context.EventCheckins.AddAsync(existingCheckin);
            await _context.SaveChangesAsync();

            // Act
            var (canCheckin, reason) = await _eventCheckinService.ValidateCheckinEligibilityAsync(eventId, memberId);

            // Assert
            canCheckin.Should().BeFalse();
            reason.Should().Contain("already checked in");
        }

        [Test]
        public async Task ValidateCheckinEligibilityAsync_EventNotFound_ReturnsCannotCheckin()
        {
            // Arrange
            const int nonExistentEventId = 9999;
            const int memberId = 122;

            // Act
            var (canCheckin, reason) = await _eventCheckinService.ValidateCheckinEligibilityAsync(nonExistentEventId, memberId);

            // Assert
            canCheckin.Should().BeFalse();
            reason.Should().Contain("Event not found");
        }

        [Test]
        public async Task ValidateCheckinEligibilityAsync_CapacityReached_ReturnsCannotCheckin()
        {
            // Arrange
            const int eventId = 1203;
            const int memberId = 123;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Full Capacity Event",
                EventDateTime = DateTime.UtcNow.AddHours(-1), // Event has started
                ClubId = 1,
                MaxCapacity = 2 // Only 2 spots
            };
            // Fill up the event
            var checkin1 = new EventCheckin
            {
                EventId = eventId,
                MemberId = 1001,
                CheckinTime = DateTime.UtcNow.AddMinutes(-30),
                CheckinMethod = CheckinMethod.QRCode
            };
            var checkin2 = new EventCheckin
            {
                EventId = eventId,
                MemberId = 1002,
                CheckinTime = DateTime.UtcNow.AddMinutes(-20),
                CheckinMethod = CheckinMethod.Manual
            };

            await _context.Events.AddAsync(testEvent);
            await _context.EventCheckins.AddRangeAsync(checkin1, checkin2);
            await _context.SaveChangesAsync();

            // Act - try to check in a new member when capacity is full
            var (canCheckin, reason) = await _eventCheckinService.ValidateCheckinEligibilityAsync(eventId, memberId);

            // Assert
            canCheckin.Should().BeFalse();
            reason.Should().Contain("capacity");
        }

        #endregion

        #region GetEventAttendeesAsync Tests

        [Test]
        public async Task GetEventAttendeesAsync_ShouldReturnAllAttendees()
        {
            // Arrange
            const int eventId = 1300;
            var club = new Club
            {
                Id = 130,
                Name = "Test Club",
                Tier = "Grow",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            var members = new[]
            {
                new Member { Id = 131, ClubId = 130, FullName = "John Doe", Email = "john@example.com", Status = "Active", JoinDate = DateTime.UtcNow },
                new Member { Id = 132, ClubId = 130, FullName = "Jane Smith", Email = "jane@example.com", Status = "Active", JoinDate = DateTime.UtcNow },
                new Member { Id = 133, ClubId = 130, FullName = "Bob Wilson", Email = "bob@example.com", Status = "Active", JoinDate = DateTime.UtcNow }
            };
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Attendees Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 130
            };
            var rsvps = new[]
            {
                new EventRsvp { EventId = eventId, MemberId = 131, Status = Domain.Enums.RsvpStatus.Confirmed },
                new EventRsvp { EventId = eventId, MemberId = 132, Status = Domain.Enums.RsvpStatus.Confirmed },
                new EventRsvp { EventId = eventId, MemberId = 133, Status = Domain.Enums.RsvpStatus.Cancelled } // Cancelled - should not appear
            };
            var checkins = new[]
            {
                new EventCheckin { EventId = eventId, MemberId = 131, CheckinTime = DateTime.UtcNow.AddMinutes(-30), CheckinMethod = CheckinMethod.QRCode }
                // Member 132 has not checked in yet
            };

            await _context.Clubs.AddAsync(club);
            await _context.Members.AddRangeAsync(members);
            await _context.Events.AddAsync(testEvent);
            await _context.EventRsvps.AddRangeAsync(rsvps);
            await _context.EventCheckins.AddRangeAsync(checkins);
            await _context.SaveChangesAsync();

            // Act
            var result = await _eventCheckinService.GetEventAttendeesAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2); // Only confirmed RSVPs
            result.Should().Contain(a => a.MemberId == 131 && a.CheckedIn == true);
            result.Should().Contain(a => a.MemberId == 132 && a.CheckedIn == false);
        }

        [Test]
        public async Task GetEventAttendeesAsync_NoAttendees_ReturnsEmptyList()
        {
            // Arrange
            const int eventId = 1301;
            var testEvent = new Event
            {
                Id = eventId,
                Name = "Empty Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                ClubId = 1
            };

            await _context.Events.AddAsync(testEvent);
            await _context.SaveChangesAsync();

            // Act
            var result = await _eventCheckinService.GetEventAttendeesAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        #endregion

        #region Checkout Edge Cases

        [Test]
        public async Task CheckoutMember_WhenNotCheckedIn_ShouldFail()
        {
            // Arrange
            const int eventId = 1400;
            const int memberId = 140;

            // No checkin exists

            // Act
            var result = await _eventCheckinService.CheckoutMemberAsync(eventId, memberId, DateTime.UtcNow);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Contain("No active check-in found");
        }

        [Test]
        public async Task CheckoutMember_WhenAlreadyCheckedOut_ShouldFail()
        {
            // Arrange
            const int eventId = 1401;
            const int memberId = 141;
            var checkin = new EventCheckin
            {
                EventId = eventId,
                MemberId = memberId,
                CheckinTime = DateTime.UtcNow.AddHours(-2),
                CheckoutTime = DateTime.UtcNow.AddHours(-1), // Already checked out
                CheckinMethod = CheckinMethod.QRCode
            };

            await _context.EventCheckins.AddAsync(checkin);
            await _context.SaveChangesAsync();

            // Act
            var result = await _eventCheckinService.CheckoutMemberAsync(eventId, memberId, DateTime.UtcNow);

            // Assert - Service returns "No active check-in" because checked-out check-ins are not active
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Contain("No active check-in found");
        }

        #endregion
    }
}
