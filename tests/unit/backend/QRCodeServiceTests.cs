using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using FluentAssertions;
using System.Security.Cryptography;
using System.Text;

namespace GatherGrove.Tests.Unit.Services
{
    /// <summary>
    /// TDD Tests for QRCodeService - US-009 Advanced Event Management
    /// RED PHASE: Comprehensive test specifications for QR code generation and validation
    /// Tests cover event QR codes, attendance tracking, security, and mobile scanning
    /// </summary>
    [TestFixture]
    public class QRCodeServiceTests
    {
        private GatherGroveDbContext _context;
        private QRCodeService _qrCodeService;
        private Mock<ILogger<QRCodeService>> _mockLogger;
        private Mock<IEventService> _mockEventService;
        private Mock<IAttendanceService> _mockAttendanceService;
        private Mock<IOptions<QRCodeSettings>> _mockQRSettings;
        private QRCodeSettings _qrCodeSettings;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
                .UseInMemoryDatabase(databaseName: $"QRCodeTestDb_{Guid.NewGuid()}")
                .Options;

            _context = new GatherGroveDbContext(options);
            _mockLogger = new Mock<ILogger<QRCodeService>>();
            _mockEventService = new Mock<IEventService>();
            _mockAttendanceService = new Mock<IAttendanceService>();
            
            _qrCodeSettings = new QRCodeSettings
            {
                ExpirationTimeMinutes = 60,
                SecretKey = "test-secret-key-for-qr-codes-12345",
                BaseUrl = "https://app.gathergrove.club",
                MaxScansPerCode = 1,
                EnableTimestampValidation = true
            };
            
            _mockQRSettings = new Mock<IOptions<QRCodeSettings>>();
            _mockQRSettings.Setup(x => x.Value).Returns(_qrCodeSettings);
            
            // This will fail initially as QRCodeService doesn't exist yet (RED phase)
            _qrCodeService = new QRCodeService(
                _context,
                _mockLogger.Object,
                _mockEventService.Object,
                _mockAttendanceService.Object,
                _mockQRSettings.Object
            );
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        #region QR Code Generation Tests

        [Test]
        public async Task GenerateEventQRCode_ValidEvent_ReturnsUniqueCode()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var adminUserId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Tech Meetup", DateTime.UtcNow.AddDays(1));
            await _context.Events.AddAsync(eventEntity);
            await _context.SaveChangesAsync();

            var request = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.EventInfo,
                ExpirationMinutes = 60,
                UsageLimit = null, // Unlimited scans for event info
                AdminUserId = adminUserId
            };

            // Act
            var result = await _qrCodeService.GenerateEventQRCode(clubId, request);

            // Assert
            result.Should().NotBeNull();
            result.QRCodeId.Should().NotBeEmpty();
            result.QRCodeData.Should().NotBeNullOrEmpty();
            result.QRCodeUrl.Should().StartWith(_qrCodeSettings.BaseUrl);
            result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
            result.ExpiresAt.Should().BeBefore(DateTime.UtcNow.AddMinutes(61));
            result.EventId.Should().Be(eventId);
            result.QRCodeType.Should().Be(QRCodeType.EventInfo);
            result.IsActive.Should().BeTrue();
            result.ScanCount.Should().Be(0);
        }

        [Test]
        public async Task GenerateEventQRCode_EventNotFound_ThrowsArgumentException()
        {
            // Arrange
            var clubId = 1;
            var nonExistentEventId = 999;
            
            var request = new GenerateEventQRCodeRequest
            {
                EventId = nonExistentEventId,
                QRCodeType = QRCodeType.EventInfo,
                AdminUserId = 1
            };

            // Act & Assert
            var action = async () => await _qrCodeService.GenerateEventQRCode(clubId, request);
            await action.Should().ThrowAsync<ArgumentException>()
                .WithMessage("*Event not found*");
        }

        [Test]
        public async Task GenerateAttendanceQRCode_ValidEvent_CreatesTimeBasedCode()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var adminUserId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Workshop", DateTime.UtcNow.AddHours(1));
            await _context.Events.AddAsync(eventEntity);
            await _context.SaveChangesAsync();

            var request = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.AttendanceTracking,
                ExpirationMinutes = 30, // Shorter expiration for attendance
                UsageLimit = 100, // Limit for attendance tracking
                AdminUserId = adminUserId
            };

            // Act
            var result = await _qrCodeService.GenerateEventQRCode(clubId, request);

            // Assert
            result.Should().NotBeNull();
            result.QRCodeType.Should().Be(QRCodeType.AttendanceTracking);
            result.UsageLimit.Should().Be(100);
            result.ExpiresAt.Should().BeBefore(DateTime.UtcNow.AddMinutes(31));
            
            // Verify the QR code data contains encrypted event and timestamp info
            result.QRCodeData.Should().NotBeNullOrEmpty();
            result.QRCodeData.Length.Should().BeGreaterThan(20); // Should be encrypted
        }

        [Test]
        public async Task GenerateEventQRCode_MultipleCodesForSameEvent_GeneratesUniqueCodes()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var adminUserId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Conference", DateTime.UtcNow.AddDays(1));
            await _context.Events.AddAsync(eventEntity);
            await _context.SaveChangesAsync();

            var request1 = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.EventInfo,
                AdminUserId = adminUserId
            };
            
            var request2 = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.AttendanceTracking,
                AdminUserId = adminUserId
            };

            // Act
            var result1 = await _qrCodeService.GenerateEventQRCode(clubId, request1);
            var result2 = await _qrCodeService.GenerateEventQRCode(clubId, request2);

            // Assert
            result1.QRCodeId.Should().NotBe(result2.QRCodeId);
            result1.QRCodeData.Should().NotBe(result2.QRCodeData);
            result1.QRCodeType.Should().NotBe(result2.QRCodeType);
        }

        #endregion

        #region QR Code Validation Tests

        [Test]
        public async Task ValidateQRCode_ValidCode_ReturnsEventDetails()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Networking Event", DateTime.UtcNow.AddHours(2));
            var member = CreateTestMember(memberId, clubId, "John Doe", "john@test.com");
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddAsync(member);
            await _context.SaveChangesAsync();
            
            // Generate a QR code first
            var generateRequest = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.EventInfo,
                AdminUserId = 1
            };
            
            var generatedQR = await _qrCodeService.GenerateEventQRCode(clubId, generateRequest);
            
            var validateRequest = new ValidateQRCodeRequest
            {
                QRCodeData = generatedQR.QRCodeData,
                ScannerMemberId = memberId,
                ScanLocation = new GeoLocation { Latitude = 37.7749, Longitude = -122.4194 }
            };

            // Act
            var result = await _qrCodeService.ValidateQRCode(clubId, validateRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue();
            result.EventDetails.Should().NotBeNull();
            result.EventDetails.Id.Should().Be(eventId);
            result.EventDetails.Name.Should().Be("Networking Event");
            result.QRCodeType.Should().Be(QRCodeType.EventInfo);
            result.ValidationMessage.Should().Be("QR code is valid");
            result.CanMarkAttendance.Should().BeFalse(); // Event info QR doesn't mark attendance
        }

        [Test]
        public async Task ValidateQRCode_ExpiredCode_ThrowsQRCodeExpiredException()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Past Event", DateTime.UtcNow.AddHours(-2));
            var member = CreateTestMember(memberId, clubId, "Jane Doe", "jane@test.com");
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddAsync(member);
            await _context.SaveChangesAsync();
            
            // Create an expired QR code in database
            var expiredQRCode = new EventQRCode
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                QRCodeType = QRCodeType.EventInfo,
                QRCodeData = "expired-qr-code-data",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-10), // Expired 10 minutes ago
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddHours(-1),
                CreatedByUserId = 1
            };
            
            await _context.EventQRCodes.AddAsync(expiredQRCode);
            await _context.SaveChangesAsync();
            
            var validateRequest = new ValidateQRCodeRequest
            {
                QRCodeData = "expired-qr-code-data",
                ScannerMemberId = memberId
            };

            // Act & Assert
            var action = async () => await _qrCodeService.ValidateQRCode(clubId, validateRequest);
            await action.Should().ThrowAsync<QRCodeExpiredException>()
                .WithMessage("*QR code has expired*");
        }

        [Test]
        public async Task ValidateQRCode_InvalidCode_ThrowsQRCodeValidationException()
        {
            // Arrange
            var clubId = 1;
            var memberId = 1;
            
            var member = CreateTestMember(memberId, clubId, "Test User", "test@test.com");
            await _context.Members.AddAsync(member);
            await _context.SaveChangesAsync();
            
            var validateRequest = new ValidateQRCodeRequest
            {
                QRCodeData = "invalid-qr-code-data",
                ScannerMemberId = memberId
            };

            // Act & Assert
            var action = async () => await _qrCodeService.ValidateQRCode(clubId, validateRequest);
            await action.Should().ThrowAsync<QRCodeValidationException>()
                .WithMessage("*Invalid QR code*");
        }

        [Test]
        public async Task ValidateQRCode_UsageLimitExceeded_ThrowsQRCodeValidationException()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Limited Use Event", DateTime.UtcNow.AddHours(1));
            var member = CreateTestMember(memberId, clubId, "Test User", "test@test.com");
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddAsync(member);
            await _context.SaveChangesAsync();
            
            // Create QR code with usage limit of 1
            var qrCode = new EventQRCode
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                QRCodeType = QRCodeType.AttendanceTracking,
                QRCodeData = "limited-use-qr-code",
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                UsageLimit = 1,
                ScanCount = 1, // Already at limit
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = 1
            };
            
            await _context.EventQRCodes.AddAsync(qrCode);
            await _context.SaveChangesAsync();
            
            var validateRequest = new ValidateQRCodeRequest
            {
                QRCodeData = "limited-use-qr-code",
                ScannerMemberId = memberId
            };

            // Act & Assert
            var action = async () => await _qrCodeService.ValidateQRCode(clubId, validateRequest);
            await action.Should().ThrowAsync<QRCodeValidationException>()
                .WithMessage("*QR code usage limit exceeded*");
        }

        #endregion

        #region Attendance Marking Tests

        [Test]
        public async Task MarkAttendance_ValidAttendanceQR_RecordsAttendance()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Workshop", DateTime.UtcNow.AddMinutes(30));
            var member = CreateTestMember(memberId, clubId, "Attendee", "attendee@test.com");
            var rsvp = CreateTestRsvp(1, eventId, memberId, RsvpStatus.Attending);
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddAsync(member);
            await _context.EventRsvps.AddAsync(rsvp);
            await _context.SaveChangesAsync();
            
            // Generate attendance QR code
            var generateRequest = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.AttendanceTracking,
                AdminUserId = 1
            };
            
            var generatedQR = await _qrCodeService.GenerateEventQRCode(clubId, generateRequest);
            
            var markAttendanceRequest = new MarkAttendanceRequest
            {
                QRCodeData = generatedQR.QRCodeData,
                MemberId = memberId,
                ScanLocation = new GeoLocation { Latitude = 37.7749, Longitude = -122.4194 },
                ScanTimestamp = DateTime.UtcNow
            };

            // Act
            var result = await _qrCodeService.MarkAttendance(clubId, markAttendanceRequest);

            // Assert
            result.Should().NotBeNull();
            result.AttendanceMarked.Should().BeTrue();
            result.AttendanceTimestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(10));
            result.EventId.Should().Be(eventId);
            result.MemberId.Should().Be(memberId);
            result.AttendanceId.Should().BeGreaterThan(0);
            
            // Verify attendance was recorded in database
            var attendance = await _context.EventAttendances
                .FirstOrDefaultAsync(a => a.EventId == eventId && a.MemberId == memberId);
            
            attendance.Should().NotBeNull();
            attendance.AttendedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(10));
            attendance.AttendanceMethod.Should().Be(AttendanceMethod.QRCodeScan);
        }

        [Test]
        public async Task MarkAttendance_MemberNotRSVPd_AllowsAttendanceWithWarning()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Walk-in Event", DateTime.UtcNow.AddMinutes(15));
            var member = CreateTestMember(memberId, clubId, "Walk-in", "walkin@test.com");
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddAsync(member);
            await _context.SaveChangesAsync();
            
            // Generate attendance QR code
            var generateRequest = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.AttendanceTracking,
                AdminUserId = 1
            };
            
            var generatedQR = await _qrCodeService.GenerateEventQRCode(clubId, generateRequest);
            
            var markAttendanceRequest = new MarkAttendanceRequest
            {
                QRCodeData = generatedQR.QRCodeData,
                MemberId = memberId,
                ScanLocation = new GeoLocation { Latitude = 37.7749, Longitude = -122.4194 }
            };

            // Act
            var result = await _qrCodeService.MarkAttendance(clubId, markAttendanceRequest);

            // Assert
            result.AttendanceMarked.Should().BeTrue();
            result.IsWalkIn.Should().BeTrue();
            result.Warning.Should().Contain("Member did not RSVP");
            
            // Should automatically create RSVP for walk-in
            var autoRsvp = await _context.EventRsvps
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.MemberId == memberId);
            
            autoRsvp.Should().NotBeNull();
            autoRsvp.RsvpStatus.Should().Be(RsvpStatus.Attending);
        }

        [Test]
        public async Task MarkAttendance_EventNotStarted_ThrowsInvalidOperationException()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Future Event", DateTime.UtcNow.AddHours(5));
            var member = CreateTestMember(memberId, clubId, "Early Bird", "early@test.com");
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddAsync(member);
            await _context.SaveChangesAsync();
            
            // Generate attendance QR code
            var generateRequest = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.AttendanceTracking,
                AdminUserId = 1
            };
            
            var generatedQR = await _qrCodeService.GenerateEventQRCode(clubId, generateRequest);
            
            var markAttendanceRequest = new MarkAttendanceRequest
            {
                QRCodeData = generatedQR.QRCodeData,
                MemberId = memberId
            };

            // Act & Assert
            var action = async () => await _qrCodeService.MarkAttendance(clubId, markAttendanceRequest);
            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Event has not started yet*");
        }

        [Test]
        public async Task MarkAttendance_DuplicateAttendance_ThrowsInvalidOperationException()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Current Event", DateTime.UtcNow.AddMinutes(-15));
            var member = CreateTestMember(memberId, clubId, "Duplicate", "duplicate@test.com");
            
            // Existing attendance
            var existingAttendance = new EventAttendance
            {
                Id = 1,
                EventId = eventId,
                MemberId = memberId,
                AttendedAt = DateTime.UtcNow.AddMinutes(-10),
                AttendanceMethod = AttendanceMethod.QRCodeScan
            };
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddAsync(member);
            await _context.EventAttendances.AddAsync(existingAttendance);
            await _context.SaveChangesAsync();
            
            // Generate attendance QR code
            var generateRequest = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.AttendanceTracking,
                AdminUserId = 1
            };
            
            var generatedQR = await _qrCodeService.GenerateEventQRCode(clubId, generateRequest);
            
            var markAttendanceRequest = new MarkAttendanceRequest
            {
                QRCodeData = generatedQR.QRCodeData,
                MemberId = memberId
            };

            // Act & Assert
            var action = async () => await _qrCodeService.MarkAttendance(clubId, markAttendanceRequest);
            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Attendance already recorded*");
        }

        #endregion

        #region QR Code Security Tests

        [Test]
        public async Task ValidateQRCode_TamperedData_ThrowsQRCodeValidationException()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Secure Event", DateTime.UtcNow.AddHours(1));
            var member = CreateTestMember(memberId, clubId, "Security Test", "security@test.com");
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddAsync(member);
            await _context.SaveChangesAsync();
            
            // Generate valid QR code
            var generateRequest = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.EventInfo,
                AdminUserId = 1
            };
            
            var generatedQR = await _qrCodeService.GenerateEventQRCode(clubId, generateRequest);
            
            // Tamper with the QR code data
            var tamperedData = generatedQR.QRCodeData.Substring(0, generatedQR.QRCodeData.Length - 5) + "HACKED";
            
            var validateRequest = new ValidateQRCodeRequest
            {
                QRCodeData = tamperedData,
                ScannerMemberId = memberId
            };

            // Act & Assert
            var action = async () => await _qrCodeService.ValidateQRCode(clubId, validateRequest);
            await action.Should().ThrowAsync<QRCodeValidationException>()
                .WithMessage("*Invalid QR code*");
        }

        [Test]
        public async Task ValidateQRCode_ReplayAttack_DetectsAndBlocks()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            var memberId1 = 1;
            var memberId2 = 2;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Anti-Replay Event", DateTime.UtcNow.AddMinutes(15));
            var member1 = CreateTestMember(memberId1, clubId, "First Scanner", "first@test.com");
            var member2 = CreateTestMember(memberId2, clubId, "Replay Attacker", "replay@test.com");
            
            await _context.Events.AddAsync(eventEntity);
            await _context.Members.AddRangeAsync(member1, member2);
            await _context.SaveChangesAsync();
            
            // Generate attendance QR code with single use limit
            var generateRequest = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.AttendanceTracking,
                UsageLimit = 1,
                AdminUserId = 1
            };
            
            var generatedQR = await _qrCodeService.GenerateEventQRCode(clubId, generateRequest);
            
            // First member scans successfully
            var firstScanRequest = new MarkAttendanceRequest
            {
                QRCodeData = generatedQR.QRCodeData,
                MemberId = memberId1
            };
            
            await _qrCodeService.MarkAttendance(clubId, firstScanRequest);
            
            // Second member tries to use same QR code (replay attack)
            var replayScanRequest = new MarkAttendanceRequest
            {
                QRCodeData = generatedQR.QRCodeData,
                MemberId = memberId2
            };

            // Act & Assert
            var action = async () => await _qrCodeService.MarkAttendance(clubId, replayScanRequest);
            await action.Should().ThrowAsync<QRCodeValidationException>()
                .WithMessage("*QR code usage limit exceeded*");
        }

        #endregion

        #region QR Code Management Tests

        [Test]
        public async Task GetEventQRCodes_ValidEvent_ReturnsAllActiveCodes()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Multi QR Event", DateTime.UtcNow.AddDays(1));
            await _context.Events.AddAsync(eventEntity);
            await _context.SaveChangesAsync();
            
            // Generate multiple QR codes
            var infoRequest = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.EventInfo,
                AdminUserId = 1
            };
            
            var attendanceRequest = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.AttendanceTracking,
                AdminUserId = 1
            };
            
            await _qrCodeService.GenerateEventQRCode(clubId, infoRequest);
            await _qrCodeService.GenerateEventQRCode(clubId, attendanceRequest);

            // Act
            var result = await _qrCodeService.GetEventQRCodes(clubId, eventId);

            // Assert
            result.Should().NotBeNull();
            result.QRCodes.Should().HaveCount(2);
            result.QRCodes.Should().Contain(qr => qr.QRCodeType == QRCodeType.EventInfo);
            result.QRCodes.Should().Contain(qr => qr.QRCodeType == QRCodeType.AttendanceTracking);
            
            foreach (var qrCode in result.QRCodes)
            {
                qrCode.IsActive.Should().BeTrue();
                qrCode.EventId.Should().Be(eventId);
            }
        }

        [Test]
        public async Task DeactivateQRCode_ValidCode_SetsInactive()
        {
            // Arrange
            var clubId = 1;
            var eventId = 1;
            
            var eventEntity = CreateTestEvent(eventId, clubId, "Deactivation Test", DateTime.UtcNow.AddDays(1));
            await _context.Events.AddAsync(eventEntity);
            await _context.SaveChangesAsync();
            
            var generateRequest = new GenerateEventQRCodeRequest
            {
                EventId = eventId,
                QRCodeType = QRCodeType.EventInfo,
                AdminUserId = 1
            };
            
            var generatedQR = await _qrCodeService.GenerateEventQRCode(clubId, generateRequest);

            // Act
            var result = await _qrCodeService.DeactivateQRCode(clubId, generatedQR.QRCodeId);

            // Assert
            result.Should().BeTrue();
            
            // Verify QR code is deactivated
            var qrCode = await _context.EventQRCodes.FindAsync(generatedQR.QRCodeId);
            qrCode.Should().NotBeNull();
            qrCode.IsActive.Should().BeFalse();
        }

        #endregion

        #region Helper Methods

        private Event CreateTestEvent(int eventId, int clubId, string name, DateTime eventDateTime)
        {
            return new Event
            {
                Id = eventId,
                ClubId = clubId,
                Name = name,
                Location = "Test Location",
                Description = "Test Description",
                EventDateTime = eventDateTime,
                MaxCapacity = 50,
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

    #region Supporting DTOs, Enums, and Entities

    public class GenerateEventQRCodeRequest
    {
        public int EventId { get; set; }
        public QRCodeType QRCodeType { get; set; }
        public int? ExpirationMinutes { get; set; }
        public int? UsageLimit { get; set; }
        public int AdminUserId { get; set; }
    }

    public class EventQRCodeResponse
    {
        public Guid QRCodeId { get; set; }
        public int EventId { get; set; }
        public QRCodeType QRCodeType { get; set; }
        public string QRCodeData { get; set; } = string.Empty;
        public string QRCodeUrl { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public int? UsageLimit { get; set; }
        public int ScanCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ValidateQRCodeRequest
    {
        public string QRCodeData { get; set; } = string.Empty;
        public int ScannerMemberId { get; set; }
        public GeoLocation? ScanLocation { get; set; }
        public DateTime? ScanTimestamp { get; set; }
    }

    public class QRCodeValidationResult
    {
        public bool IsValid { get; set; }
        public EventResponse? EventDetails { get; set; }
        public QRCodeType QRCodeType { get; set; }
        public string ValidationMessage { get; set; } = string.Empty;
        public bool CanMarkAttendance { get; set; }
        public string? Warning { get; set; }
    }

    public class MarkAttendanceRequest
    {
        public string QRCodeData { get; set; } = string.Empty;
        public int MemberId { get; set; }
        public GeoLocation? ScanLocation { get; set; }
        public DateTime? ScanTimestamp { get; set; }
    }

    public class AttendanceMarkingResult
    {
        public bool AttendanceMarked { get; set; }
        public int AttendanceId { get; set; }
        public int EventId { get; set; }
        public int MemberId { get; set; }
        public DateTime AttendanceTimestamp { get; set; }
        public bool IsWalkIn { get; set; }
        public string? Warning { get; set; }
    }

    public class EventQRCodesResponse
    {
        public List<EventQRCodeResponse> QRCodes { get; set; } = new();
        public int EventId { get; set; }
        public string EventName { get; set; } = string.Empty;
    }

    public class GeoLocation
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }

    public class QRCodeSettings
    {
        public int ExpirationTimeMinutes { get; set; }
        public string SecretKey { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
        public int MaxScansPerCode { get; set; }
        public bool EnableTimestampValidation { get; set; }
    }

    public enum QRCodeType
    {
        EventInfo,
        AttendanceTracking,
        EventRegistration,
        VIPAccess
    }

    public enum AttendanceMethod
    {
        Manual,
        QRCodeScan,
        CheckIn,
        Automatic
    }

    // Domain entities
    public class EventQRCode
    {
        public Guid Id { get; set; }
        public int EventId { get; set; }
        public QRCodeType QRCodeType { get; set; }
        public string QRCodeData { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public int? UsageLimit { get; set; }
        public int ScanCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int CreatedByUserId { get; set; }
        public virtual Event Event { get; set; } = null!;
    }

    public class EventAttendance
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int MemberId { get; set; }
        public DateTime AttendedAt { get; set; }
        public AttendanceMethod AttendanceMethod { get; set; }
        public string? Notes { get; set; }
        public GeoLocation? ScanLocation { get; set; }
        public virtual Event Event { get; set; } = null!;
        public virtual Member Member { get; set; } = null!;
    }

    // Custom exceptions
    public class QRCodeExpiredException : Exception
    {
        public QRCodeExpiredException(string message) : base(message) { }
    }

    public class QRCodeValidationException : Exception
    {
        public QRCodeValidationException(string message) : base(message) { }
    }

    #endregion
}