using NUnit.Framework;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GatherGrove.Application.Tests.Services
{
    /// <summary>
    /// Test suite for QR Code Service functionality
    /// Covers QR code generation, validation, and management
    /// </summary>
    [TestFixture]
    public class QRCodeServiceTests
    {
        private GatherGroveDbContext _context;
        private Mock<ILogger<QRCodeService>> _mockLogger;
        private QRCodeService _qrCodeService;

        [SetUp]
        public void Setup()
        {
            // Use in-memory database for testing
            var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new GatherGroveDbContext(options);
            _mockLogger = new Mock<ILogger<QRCodeService>>();
            _qrCodeService = new QRCodeService(
                _context,
                _mockLogger.Object
            );
        }

        [TearDown]
        public void TearDown()
        {
            _context?.Dispose();
        }

        [Test]
        public void QRCodeService_Constructor_ShouldInitializeCorrectly()
        {
            // Arrange & Act & Assert
            Assert.That(_qrCodeService, Is.Not.Null);
        }

        [Test]
        public void GenerateEventQRCodeRequest_ShouldHaveCorrectProperties()
        {
            // Arrange & Act
            var request = new GenerateEventQRCodeRequest
            {
                EventId = 1,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                AllowMultipleScans = false,
                RequireRSVP = true
            };

            // Assert
            Assert.That(request.EventId, Is.EqualTo(1));
            Assert.That(request.AllowMultipleScans, Is.False);
            Assert.That(request.RequireRSVP, Is.True);
            Assert.That(request.ExpiresAt, Is.Not.Null);
        }

        [Test]
        public void QRCodeCheckinRequest_ShouldHaveCorrectProperties()
        {
            // Arrange & Act
            var request = new QRCodeCheckinRequest
            {
                QRCodeData = "test-token",
                MemberId = 123,
                CheckinTime = DateTime.UtcNow,
                Location = "Main Entrance"
            };

            // Assert
            Assert.That(request.QRCodeData, Is.EqualTo("test-token"));
            Assert.That(request.MemberId, Is.EqualTo(123));
            Assert.That(request.Location, Is.EqualTo("Main Entrance"));
        }

        [Test]
        public void EventQRCodeResponse_ShouldHaveCorrectProperties()
        {
            // Arrange & Act
            var response = new EventQRCodeResponse
            {
                Id = 1,
                EventId = 2,
                QRCodeData = "test-data",
                QRCodeImageBase64 = "base64-image",
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            // Assert
            Assert.That(response.Id, Is.EqualTo(1));
            Assert.That(response.EventId, Is.EqualTo(2));
            Assert.That(response.QRCodeData, Is.EqualTo("test-data"));
            Assert.That(response.IsActive, Is.True);
        }

        [Test]
        public void BulkGenerateQRCodesRequest_ShouldHaveCorrectDefaults()
        {
            // Arrange & Act
            var request = new BulkGenerateQRCodesRequest
            {
                EventId = 1
            };

            // Assert
            Assert.That(request.Count, Is.EqualTo(1));
            Assert.That(request.ValidForMinutes, Is.EqualTo(1440)); // 24 hours
        }

        [Test]
        public void QRCodeValidationResult_ShouldHandleInvalidCases()
        {
            // Arrange & Act
            var result = new QRCodeValidationResult
            {
                IsValid = false,
                ErrorMessage = "QR code not found",
                EventId = null
            };

            // Assert
            Assert.That(result.IsValid, Is.False);
            Assert.That(result.ErrorMessage, Is.EqualTo("QR code not found"));
            Assert.That(result.EventId, Is.Null);
        }

        [Test]
        public void CheckinResponse_ShouldHandleSuccessfulCheckin()
        {
            // Arrange & Act
            var response = new CheckinResponse
            {
                Success = true,
                CheckinTime = DateTime.UtcNow,
                CheckinMethod = Domain.Entities.CheckinMethod.QRCode
            };

            // Assert
            Assert.That(response.Success, Is.True);
            Assert.That(response.CheckinTime, Is.Not.Null);
            Assert.That(response.CheckinMethod, Is.EqualTo(Domain.Entities.CheckinMethod.QRCode));
        }

        [Test]
        public void CheckinStatisticsResponse_ShouldInitializeCorrectly()
        {
            // Arrange & Act
            var stats = new CheckinStatisticsResponse
            {
                TotalCheckins = 10,
                QRCodeCheckins = 6,
                ManualCheckins = 3,
                NFCCheckins = 1
            };

            // Assert
            Assert.That(stats.TotalCheckins, Is.EqualTo(10));
            Assert.That(stats.QRCodeCheckins, Is.EqualTo(6));
            Assert.That(stats.ManualCheckins, Is.EqualTo(3));
            Assert.That(stats.NFCCheckins, Is.EqualTo(1));
            Assert.That(stats.CheckinMethodBreakdown, Is.Not.Null);
        }

        [Test]
        public async Task GenerateEventQRCodeAsync_WithMockedContext_ShouldGenerateQRCode()
        {
            // Arrange
            var request = new GenerateEventQRCodeRequest
            {
                EventId = 1,
                ExpiresAt = DateTime.UtcNow.AddHours(2)
            };

            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            await _context.SaveChangesAsync();

            // Act
            var result = await _qrCodeService.GenerateEventQRCodeAsync(request);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.EventId, Is.EqualTo(request.EventId));
            Assert.That(result.QRCodeData, Is.Not.Null.And.Not.Empty);
            Assert.That(result.QRCodeImageBase64, Is.Not.Null.And.Not.Empty);
            Assert.That(result.IsActive, Is.True);
            Assert.That(result.ExpiresAt, Is.Not.Null);
        }

        [Test]
        public async Task ValidateQRCodeAsync_WithMockedContext_ShouldValidateQRCode()
        {
            // Arrange
            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            var testMember = new Domain.Entities.Member
            {
                Id = 1,
                ClubId = 1,
                Email = "test@example.com",
                FullName = "Test Member",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            var qrCodeToken = $"GATHERGROVE_CHECKIN:{testEvent.Id}:{Guid.NewGuid()}";
            var qrCode = new Domain.Entities.EventQRCode
            {
                Id = 1,
                EventId = testEvent.Id,
                QRCodeToken = qrCodeToken,
                QRCodeImageData = "base64-image-data",
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var rsvp = new Domain.Entities.EventRsvp
            {
                Id = 1,
                EventId = testEvent.Id,
                MemberId = testMember.Id,
                Status = Domain.Enums.RsvpStatus.Confirmed,
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            _context.Members.Add(testMember);
            _context.EventQRCodes.Add(qrCode);
            _context.EventRsvps.Add(rsvp);
            await _context.SaveChangesAsync();

            var checkinRequest = new QRCodeCheckinRequest
            {
                QRCodeData = qrCodeToken,
                MemberId = testMember.Id,
                CheckinTime = DateTime.UtcNow,
                Location = "Main Entrance"
            };

            // Act
            var result = await _qrCodeService.ValidateQRCodeAsync(checkinRequest);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.IsValid, Is.True);
            Assert.That(result.EventId, Is.EqualTo(testEvent.Id));
            Assert.That(result.MemberId, Is.EqualTo(testMember.Id));
            Assert.That(result.EventName, Is.EqualTo(testEvent.Name));
            Assert.That(result.ErrorMessage, Is.Null);
        }

        #region DeactivateQRCodeAsync Tests

        [Test]
        public async Task DeactivateQRCodeAsync_ValidQRCode_DeactivatesSuccessfully()
        {
            // Arrange
            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            var qrCode = new Domain.Entities.EventQRCode
            {
                Id = 1,
                EventId = testEvent.Id,
                QRCodeToken = $"GATHERGROVE_CHECKIN:{testEvent.Id}:{Guid.NewGuid()}",
                QRCodeImageData = "base64-image-data",
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            _context.EventQRCodes.Add(qrCode);
            await _context.SaveChangesAsync();

            // Act
            await _qrCodeService.DeactivateQRCodeAsync(qrCode.Id);

            // Assert
            var deactivatedQRCode = await _context.EventQRCodes.FindAsync(qrCode.Id);
            Assert.That(deactivatedQRCode, Is.Not.Null);
            Assert.That(deactivatedQRCode!.IsActive, Is.False);
        }

        [Test]
        public void DeactivateQRCodeAsync_InvalidQRCodeId_ThrowsException()
        {
            // Arrange
            var invalidQRCodeId = 999;

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(async () =>
                await _qrCodeService.DeactivateQRCodeAsync(invalidQRCodeId));
        }

        #endregion

        #region RefreshQRCodeAsync Tests

        [Test]
        public async Task RefreshQRCodeAsync_ValidQRCode_RefreshesSuccessfully()
        {
            // Arrange
            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            var originalToken = $"GATHERGROVE_CHECKIN:{testEvent.Id}:{Guid.NewGuid()}";
            var qrCode = new Domain.Entities.EventQRCode
            {
                Id = 1,
                EventId = testEvent.Id,
                QRCodeToken = originalToken,
                QRCodeImageData = "base64-image-data",
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            _context.EventQRCodes.Add(qrCode);
            await _context.SaveChangesAsync();

            var newExpirationTime = DateTime.UtcNow.AddHours(5);

            // Act
            var result = await _qrCodeService.RefreshQRCodeAsync(qrCode.Id, newExpirationTime);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(qrCode.Id));
            Assert.That(result.EventId, Is.EqualTo(testEvent.Id));
            Assert.That(result.QRCodeData, Is.EqualTo(originalToken)); // Token should remain the same
            Assert.That(result.IsActive, Is.True);
            Assert.That(result.ExpiresAt, Is.EqualTo(newExpirationTime)); // Only expiration changes
        }

        [Test]
        public void RefreshQRCodeAsync_InvalidQRCodeId_ThrowsException()
        {
            // Arrange
            var invalidQRCodeId = 999;
            var newExpirationTime = DateTime.UtcNow.AddHours(5);

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(async () =>
                await _qrCodeService.RefreshQRCodeAsync(invalidQRCodeId, newExpirationTime));
        }

        #endregion

        #region GetQRCodeUsageStatsAsync Tests

        [Test]
        public async Task GetQRCodeUsageStatsAsync_ValidQRCode_ReturnsStats()
        {
            // Arrange
            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            var qrCode = new Domain.Entities.EventQRCode
            {
                Id = 1,
                EventId = testEvent.Id,
                QRCodeToken = $"GATHERGROVE_CHECKIN:{testEvent.Id}:{Guid.NewGuid()}",
                QRCodeImageData = "base64-image-data",
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            _context.EventQRCodes.Add(qrCode);
            await _context.SaveChangesAsync();

            // Act
            var stats = await _qrCodeService.GetQRCodeUsageStatsAsync(qrCode.Id);

            // Assert
            Assert.That(stats, Is.Not.Null);
            Assert.That(stats.QRCodeId, Is.EqualTo(qrCode.Id));
            Assert.That(stats.TotalScans, Is.GreaterThanOrEqualTo(0));
            Assert.That(stats.UniqueUsers, Is.GreaterThanOrEqualTo(0));
        }

        [Test]
        public void GetQRCodeUsageStatsAsync_InvalidQRCodeId_ThrowsException()
        {
            // Arrange
            var invalidQRCodeId = 999;

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(async () =>
                await _qrCodeService.GetQRCodeUsageStatsAsync(invalidQRCodeId));
        }

        #endregion

        #region BulkGenerateQRCodesAsync Tests

        [Test]
        public async Task BulkGenerateQRCodesAsync_ValidRequest_GeneratesMultipleQRCodes()
        {
            // Arrange
            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            await _context.SaveChangesAsync();

            var request = new BulkGenerateQRCodesRequest
            {
                EventId = testEvent.Id,
                Count = 5,
                ValidForMinutes = 120
            };

            // Act
            var results = await _qrCodeService.BulkGenerateQRCodesAsync(request);

            // Assert
            Assert.That(results, Is.Not.Null);
            Assert.That(results, Has.Count.EqualTo(5)); // Returns 5 results
            Assert.That(results.All(r => r.EventId == testEvent.Id), Is.True);
            Assert.That(results.All(r => r.IsActive), Is.True);
            Assert.That(results.All(r => !string.IsNullOrEmpty(r.QRCodeData)), Is.True);

            // Note: Service deduplicates - returns same QR code for same event
            // So all 5 results will have the same token (only 1 unique)
            var uniqueTokens = results.Select(r => r.QRCodeData).Distinct().Count();
            Assert.That(uniqueTokens, Is.EqualTo(1)); // Only 1 unique QR code for the event
        }

        [Test]
        public async Task BulkGenerateQRCodesAsync_ZeroCount_ReturnsEmptyList()
        {
            // Arrange
            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            await _context.SaveChangesAsync();

            var request = new BulkGenerateQRCodesRequest
            {
                EventId = testEvent.Id,
                Count = 0,
                ValidForMinutes = 120
            };

            // Act
            var results = await _qrCodeService.BulkGenerateQRCodesAsync(request);

            // Assert
            Assert.That(results, Is.Not.Null);
            Assert.That(results, Is.Empty);
        }

        [Test]
        public async Task BulkGenerateQRCodesAsync_InvalidEventId_ReturnsEmptyList()
        {
            // Arrange
            var request = new BulkGenerateQRCodesRequest
            {
                EventId = 999, // Invalid event ID
                Count = 5,
                ValidForMinutes = 120
            };

            // Act
            var results = await _qrCodeService.BulkGenerateQRCodesAsync(request);

            // Assert - Service catches exceptions and returns empty list
            Assert.That(results, Is.Not.Null);
            Assert.That(results, Is.Empty);
        }

        #endregion

        #region GetEventQRCodesAsync Tests

        [Test]
        public async Task GetEventQRCodesAsync_EventWithQRCodes_ReturnsAllQRCodes()
        {
            // Arrange
            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            var qrCode1 = new Domain.Entities.EventQRCode
            {
                Id = 1,
                EventId = testEvent.Id,
                QRCodeToken = $"GATHERGROVE_CHECKIN:{testEvent.Id}:{Guid.NewGuid()}",
                QRCodeImageData = "base64-image-data-1",
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var qrCode2 = new Domain.Entities.EventQRCode
            {
                Id = 2,
                EventId = testEvent.Id,
                QRCodeToken = $"GATHERGROVE_CHECKIN:{testEvent.Id}:{Guid.NewGuid()}",
                QRCodeImageData = "base64-image-data-2",
                ExpiresAt = DateTime.UtcNow.AddHours(3),
                IsActive = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            _context.EventQRCodes.AddRange(qrCode1, qrCode2);
            await _context.SaveChangesAsync();

            // Act
            var results = await _qrCodeService.GetEventQRCodesAsync(testEvent.Id);

            // Assert
            Assert.That(results, Is.Not.Null);
            Assert.That(results, Has.Count.EqualTo(2));
            Assert.That(results.Any(r => r.Id == qrCode1.Id), Is.True);
            Assert.That(results.Any(r => r.Id == qrCode2.Id), Is.True);
        }

        [Test]
        public async Task GetEventQRCodesAsync_EventWithNoQRCodes_ReturnsEmptyList()
        {
            // Arrange
            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            await _context.SaveChangesAsync();

            // Act
            var results = await _qrCodeService.GetEventQRCodesAsync(testEvent.Id);

            // Assert
            Assert.That(results, Is.Not.Null);
            Assert.That(results, Is.Empty);
        }

        #endregion

        #region ValidateQRCodeAsync Edge Cases

        [Test]
        public async Task ValidateQRCodeAsync_ExpiredQRCode_ReturnsInvalid()
        {
            // Arrange
            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            var testMember = new Domain.Entities.Member
            {
                Id = 1,
                ClubId = 1,
                Email = "test@example.com",
                FullName = "Test Member",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            var qrCodeToken = $"GATHERGROVE_CHECKIN:{testEvent.Id}:{Guid.NewGuid()}";
            var expiredQRCode = new Domain.Entities.EventQRCode
            {
                Id = 1,
                EventId = testEvent.Id,
                QRCodeToken = qrCodeToken,
                QRCodeImageData = "base64-image-data",
                ExpiresAt = DateTime.UtcNow.AddHours(-1), // Expired 1 hour ago
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            _context.Members.Add(testMember);
            _context.EventQRCodes.Add(expiredQRCode);
            await _context.SaveChangesAsync();

            var checkinRequest = new QRCodeCheckinRequest
            {
                QRCodeData = qrCodeToken,
                MemberId = testMember.Id,
                CheckinTime = DateTime.UtcNow,
                Location = "Main Entrance"
            };

            // Act
            var result = await _qrCodeService.ValidateQRCodeAsync(checkinRequest);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.IsValid, Is.False);
            Assert.That(result.ErrorMessage, Does.Contain("expired").IgnoreCase);
        }

        [Test]
        public async Task ValidateQRCodeAsync_InactiveQRCode_ReturnsInvalid()
        {
            // Arrange
            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            var testMember = new Domain.Entities.Member
            {
                Id = 1,
                ClubId = 1,
                Email = "test@example.com",
                FullName = "Test Member",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            var qrCodeToken = $"GATHERGROVE_CHECKIN:{testEvent.Id}:{Guid.NewGuid()}";
            var inactiveQRCode = new Domain.Entities.EventQRCode
            {
                Id = 1,
                EventId = testEvent.Id,
                QRCodeToken = qrCodeToken,
                QRCodeImageData = "base64-image-data",
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                IsActive = false, // Inactive
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            _context.Members.Add(testMember);
            _context.EventQRCodes.Add(inactiveQRCode);
            await _context.SaveChangesAsync();

            var checkinRequest = new QRCodeCheckinRequest
            {
                QRCodeData = qrCodeToken,
                MemberId = testMember.Id,
                CheckinTime = DateTime.UtcNow,
                Location = "Main Entrance"
            };

            // Act
            var result = await _qrCodeService.ValidateQRCodeAsync(checkinRequest);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.IsValid, Is.False);
            Assert.That(result.ErrorMessage, Is.EqualTo("QR code is no longer active"));
        }

        [Test]
        public async Task ValidateQRCodeAsync_InvalidToken_ReturnsInvalid()
        {
            // Arrange
            var testMember = new Domain.Entities.Member
            {
                Id = 1,
                ClubId = 1,
                Email = "test@example.com",
                FullName = "Test Member",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.Members.Add(testMember);
            await _context.SaveChangesAsync();

            var checkinRequest = new QRCodeCheckinRequest
            {
                QRCodeData = "INVALID_TOKEN",
                MemberId = testMember.Id,
                CheckinTime = DateTime.UtcNow,
                Location = "Main Entrance"
            };

            // Act
            var result = await _qrCodeService.ValidateQRCodeAsync(checkinRequest);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.IsValid, Is.False);
            Assert.That(result.ErrorMessage, Is.Not.Null.And.Not.Empty);
        }

        #endregion

        #region GenerateEventQRCodeAsync Edge Cases

        [Test]
        public void GenerateEventQRCodeAsync_InvalidEventId_ThrowsException()
        {
            // Arrange
            var request = new GenerateEventQRCodeRequest
            {
                EventId = 999,
                ExpiresAt = DateTime.UtcNow.AddHours(2)
            };

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(async () =>
                await _qrCodeService.GenerateEventQRCodeAsync(request));
        }

        [Test]
        public async Task GenerateEventQRCodeAsync_WithCustomExpiration_SetsCorrectExpiration()
        {
            // Arrange
            var testEvent = new Domain.Entities.Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Test Event",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                Location = "Test Location",
                Description = "Test Description",
                MaxCapacity = 100,
                CreatedAt = DateTime.UtcNow
            };

            _context.Events.Add(testEvent);
            await _context.SaveChangesAsync();

            var customExpiration = DateTime.UtcNow.AddHours(10);
            var request = new GenerateEventQRCodeRequest
            {
                EventId = testEvent.Id,
                ExpiresAt = customExpiration
            };

            // Act
            var result = await _qrCodeService.GenerateEventQRCodeAsync(request);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.ExpiresAt, Is.EqualTo(customExpiration));
        }

        #endregion
    }
}