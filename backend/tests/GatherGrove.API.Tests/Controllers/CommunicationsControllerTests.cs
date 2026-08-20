using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs.Communications;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using GatherGrove.Domain.Entities;

namespace GatherGrove.API.Tests.Controllers
{
    [TestFixture]
    public class CommunicationsControllerTests
    {
        private CommunicationsController _controller = null!;
        private Mock<ICommunicationsService> _mockCommunicationsService = null!;
        private Mock<ILogger<CommunicationsController>> _mockLogger = null!;
        private GatherGroveDbContext _context = null!;

        [SetUp]
        public void Setup()
        {
            _mockCommunicationsService = new Mock<ICommunicationsService>();
            _mockLogger = new Mock<ILogger<CommunicationsController>>();

            // Create an in-memory database context
            var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new GatherGroveDbContext(options);

            _controller = new CommunicationsController(_mockCommunicationsService.Object, _mockLogger.Object, _context);

            // Set up user context with claims
            SetupAuthenticatedUser(userId: 1, clubId: 1);
        }

        [TearDown]
        public void TearDown()
        {
            _context?.Dispose();
        }

        private void SetupAuthenticatedUser(int userId, int clubId)
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim("ClubId", clubId.ToString())
            }));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        private void SetupUnauthenticatedUser()
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity());
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        #region SendBulkEmail Tests

        [Test]
        public async Task SendBulkEmail_ValidRequest_ReturnsOkResult()
        {
            // Arrange
            var clubId = 1;
            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            var serviceResponse = new SendBulkEmailResponse
            {
                Success = true,
                Message = "Email successfully sent to all 5 active members",
                RecipientCount = 5,
                CommunicationLogId = 123
            };

            _mockCommunicationsService
                .Setup(x => x.SendBulkEmailAsync(clubId, 1, request))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.SendBulkEmail(clubId, request);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().Be(serviceResponse);

            _mockCommunicationsService.Verify(x => x.SendBulkEmailAsync(clubId, 1, request), Times.Once);
        }

        [Test]
        public async Task SendBulkEmail_ServiceReturnsFailure_Returns429ForRateLimit()
        {
            // Arrange
            var clubId = 1;
            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            var serviceResponse = new SendBulkEmailResponse
            {
                Success = false,
                Message = "Sending this email (10 recipients) would exceed your monthly allowance"
            };

            _mockCommunicationsService
                .Setup(x => x.SendBulkEmailAsync(clubId, 1, request))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.SendBulkEmail(clubId, request);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(429);

            var response = objectResult.Value as SendBulkEmailResponse;
            response!.Success.Should().BeFalse();
            response.Message.Should().Contain("exceed your monthly allowance");
        }

        [Test]
        public async Task SendBulkEmail_ServiceThrowsException_ReturnsInternalServerError()
        {
            // Arrange
            var clubId = 1;
            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            _mockCommunicationsService
                .Setup(x => x.SendBulkEmailAsync(clubId, 1, request))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.SendBulkEmail(clubId, request);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);

            var response = objectResult.Value as SendBulkEmailResponse;
            response!.Success.Should().BeFalse();
            response.Message.Should().Contain("internal error occurred");
        }

        [Test]
        public async Task SendBulkEmail_InvalidModelState_ReturnsBadRequest()
        {
            // Arrange
            var clubId = 1;
            var request = new SendBulkEmailRequest();

            _controller.ModelState.AddModelError("Subject", "Subject is required");

            // Act
            var result = await _controller.SendBulkEmail(clubId, request);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task SendBulkEmail_WrongClubId_ReturnsForbid()
        {
            // Arrange
            var clubId = 999; // Different from user's ClubId (1)
            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            // Act
            var result = await _controller.SendBulkEmail(clubId, request);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(403);
        }

        [Test]
        public async Task SendBulkEmail_NoUserIdClaim_ReturnsUnauthorized()
        {
            // Arrange
            SetupUnauthenticatedUser();
            var clubId = 1;
            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            // Act
            var result = await _controller.SendBulkEmail(clubId, request);

            // Assert
            result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        [Test]
        public async Task SendBulkEmail_ClubNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            var serviceResponse = new SendBulkEmailResponse
            {
                Success = false,
                Message = "Club not found: 1"
            };

            _mockCommunicationsService
                .Setup(x => x.SendBulkEmailAsync(clubId, 1, request))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.SendBulkEmail(clubId, request);

            // Assert
            result.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        #endregion

        #region GetEmailUsageStats Tests

        [Test]
        public async Task GetEmailUsageStats_ValidClubId_ReturnsOkResult()
        {
            // Arrange
            var clubId = 1;
            var serviceResponse = new EmailUsageStatsResponse
            {
                ClubTier = "Sprout",
                EmailsSentThisMonth = 75,
                MonthlyEmailLimit = 500,
                ActiveMemberCount = 10,
                RemainingEmails = 425,
                WouldExceedLimit = false
            };

            _mockCommunicationsService
                .Setup(x => x.GetEmailUsageStatsAsync(clubId))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.GetEmailUsageStats(clubId);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().Be(serviceResponse);

            _mockCommunicationsService.Verify(x => x.GetEmailUsageStatsAsync(clubId), Times.Once);
        }

        [Test]
        public async Task GetEmailUsageStats_ServiceThrowsException_ReturnsInternalServerError()
        {
            // Arrange
            var clubId = 1;

            _mockCommunicationsService
                .Setup(x => x.GetEmailUsageStatsAsync(clubId))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.GetEmailUsageStats(clubId);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);
        }

        [Test]
        public async Task GetEmailUsageStats_ClubNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;

            _mockCommunicationsService
                .Setup(x => x.GetEmailUsageStatsAsync(clubId))
                .ThrowsAsync(new InvalidOperationException("Club not found: 1"));

            // Act
            var result = await _controller.GetEmailUsageStats(clubId);

            // Assert
            result.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public async Task GetEmailUsageStats_GrowTier_ReturnsUnlimitedStats()
        {
            // Arrange
            var clubId = 1;
            var serviceResponse = new EmailUsageStatsResponse
            {
                ClubTier = "Grow",
                EmailsSentThisMonth = 1500,
                MonthlyEmailLimit = null,
                ActiveMemberCount = 50,
                RemainingEmails = null,
                WouldExceedLimit = false
            };

            _mockCommunicationsService
                .Setup(x => x.GetEmailUsageStatsAsync(clubId))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.GetEmailUsageStats(clubId);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var response = okResult!.Value as EmailUsageStatsResponse;

            response!.ClubTier.Should().Be("Grow");
            response.MonthlyEmailLimit.Should().BeNull();
            response.RemainingEmails.Should().BeNull();
            response.EmailsSentThisMonth.Should().Be(1500);
        }

        [Test]
        public async Task GetEmailUsageStats_WrongClubId_ReturnsForbid()
        {
            // Arrange
            var clubId = 999; // Different from user's ClubId (1)

            // Act
            var result = await _controller.GetEmailUsageStats(clubId);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(403);
        }

        [Test]
        public async Task GetEmailUsageStats_NoUserIdClaim_ReturnsUnauthorized()
        {
            // Arrange
            SetupUnauthenticatedUser();
            var clubId = 1;

            // Act
            var result = await _controller.GetEmailUsageStats(clubId);

            // Assert
            result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        #endregion

        #region Removed Channel Tests

        [Test]
        public void SendBulkSms_ReturnsGone()
        {
            var result = _controller.SendBulkSms(1);

            var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(StatusCodes.Status410Gone);
        }

        [Test]
        public void GetSmsUsageStats_ReturnsGone()
        {
            var result = _controller.GetSmsUsageStats(1);

            var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(StatusCodes.Status410Gone);
        }

        [Test]
        public void SendBulkWhatsApp_ReturnsGone()
        {
            var result = _controller.SendBulkWhatsApp(1);

            var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(StatusCodes.Status410Gone);
        }

        [Test]
        public void GetWhatsAppTemplates_ReturnsGone()
        {
            var result = _controller.GetWhatsAppTemplates(1);

            var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(StatusCodes.Status410Gone);
        }

        #endregion

        #region GetCommunicationHistory Tests

        [Test]
        public async Task GetCommunicationHistory_ValidRequest_ReturnsOkResult()
        {
            // Arrange
            var clubId = 1;
            var serviceResponse = new GetCommunicationHistoryResponse
            {
                Communications = new List<CommunicationHistoryResponse>
                {
                    new CommunicationHistoryResponse
                    {
                        Id = 1,
                        CommunicationType = "Email",
                        Subject = "Welcome",
                        Body = "Welcome to our club!",
                        RecipientCount = 10,
                        Status = "Sent",
                        SentByUserName = "Admin User",
                        SentAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    }
                },
                TotalCount = 1,
                CurrentPage = 1,
                PageSize = 20,
                TotalPages = 1,
                HasNextPage = false,
                HasPreviousPage = false
            };

            _mockCommunicationsService
                .Setup(x => x.GetCommunicationHistoryAsync(clubId, It.IsAny<GetCommunicationHistoryRequest>()))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.GetCommunicationHistory(clubId);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var response = okResult!.Value as GetCommunicationHistoryResponse;
            response!.Communications.Should().HaveCount(1);
            response.TotalCount.Should().Be(1);
        }

        [Test]
        public async Task GetCommunicationHistory_WithFilters_ReturnsFilteredResults()
        {
            // Arrange
            var clubId = 1;
            var page = 2;
            var pageSize = 10;
            var communicationType = "Email";
            var startDate = new DateTime(2024, 1, 1);
            var endDate = new DateTime(2024, 12, 31);

            var serviceResponse = new GetCommunicationHistoryResponse
            {
                Communications = new List<CommunicationHistoryResponse>(),
                TotalCount = 25,
                CurrentPage = 2,
                PageSize = 10,
                TotalPages = 3,
                HasNextPage = true,
                HasPreviousPage = true
            };

            _mockCommunicationsService
                .Setup(x => x.GetCommunicationHistoryAsync(clubId, It.Is<GetCommunicationHistoryRequest>(r =>
                    r.Page == page &&
                    r.PageSize == pageSize &&
                    r.CommunicationType == communicationType &&
                    r.StartDate == startDate &&
                    r.EndDate == endDate)))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.GetCommunicationHistory(clubId, page, pageSize, communicationType, startDate, endDate);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var response = okResult!.Value as GetCommunicationHistoryResponse;
            response!.CurrentPage.Should().Be(2);
            response.PageSize.Should().Be(10);
            response.HasNextPage.Should().BeTrue();
            response.HasPreviousPage.Should().BeTrue();
        }

        [Test]
        public async Task GetCommunicationHistory_ClubNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;

            _mockCommunicationsService
                .Setup(x => x.GetCommunicationHistoryAsync(clubId, It.IsAny<GetCommunicationHistoryRequest>()))
                .ThrowsAsync(new InvalidOperationException("Club not found: 1"));

            // Act
            var result = await _controller.GetCommunicationHistory(clubId);

            // Assert
            result.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public async Task GetCommunicationHistory_WrongClubId_ReturnsForbid()
        {
            // Arrange
            var clubId = 999;

            // Act
            var result = await _controller.GetCommunicationHistory(clubId);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(403);
        }

        [Test]
        public async Task GetCommunicationHistory_ServiceThrowsException_Returns500()
        {
            // Arrange
            var clubId = 1;

            _mockCommunicationsService
                .Setup(x => x.GetCommunicationHistoryAsync(clubId, It.IsAny<GetCommunicationHistoryRequest>()))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.GetCommunicationHistory(clubId);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);
        }

        [Test]
        public async Task GetCommunicationHistory_NoUserIdClaim_ReturnsUnauthorized()
        {
            // Arrange
            SetupUnauthenticatedUser();
            var clubId = 1;

            // Act
            var result = await _controller.GetCommunicationHistory(clubId);

            // Assert
            result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        #endregion

        #region SendBulkPushNotification Tests

        [Test]
        public async Task SendBulkPushNotification_ValidRequest_ReturnsOkResult()
        {
            // Arrange
            var clubId = 1;
            var request = new SendPushNotificationRequest
            {
                Title = "New Event",
                Body = "Check out our latest event!"
            };

            var serviceResponse = new SendPushNotificationResponse
            {
                Success = true,
                Message = "Push notification sent successfully",
                DeviceCount = 25,
                UserCount = 18,
                CommunicationLogId = 999
            };

            _mockCommunicationsService
                .Setup(x => x.SendBulkPushNotificationAsync(clubId, 1, request))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.SendBulkPushNotification(clubId, request);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().Be(serviceResponse);
        }

        [Test]
        public async Task SendBulkPushNotification_WithMemberTypeIds_ValidatesAndSendsSuccessfully()
        {
            // Arrange
            var clubId = 1;

            // Add membership types to in-memory database
            _context.MembershipTypes.Add(new MembershipType { Id = 1, ClubId = 1, Name = "Gold", IsActive = true });
            _context.MembershipTypes.Add(new MembershipType { Id = 2, ClubId = 1, Name = "Silver", IsActive = true });
            await _context.SaveChangesAsync();

            var request = new SendPushNotificationRequest
            {
                Title = "Premium Event",
                Body = "Exclusive event for premium members",
                MemberTypeIds = new List<int> { 1, 2 }
            };

            var serviceResponse = new SendPushNotificationResponse
            {
                Success = true,
                Message = "Push notification sent",
                DeviceCount = 10,
                UserCount = 8,
                CommunicationLogId = 1000
            };

            _mockCommunicationsService
                .Setup(x => x.SendBulkPushNotificationAsync(clubId, 1, request))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.SendBulkPushNotification(clubId, request);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task SendBulkPushNotification_InvalidMembershipTypeIds_ReturnsBadRequest()
        {
            // Arrange
            var clubId = 1;

            // Add valid membership type
            _context.MembershipTypes.Add(new MembershipType { Id = 1, ClubId = 1, Name = "Gold", IsActive = true });
            await _context.SaveChangesAsync();

            var request = new SendPushNotificationRequest
            {
                Title = "Test",
                Body = "Test",
                MemberTypeIds = new List<int> { 1, 999 } // 999 is invalid
            };

            // Act
            var result = await _controller.SendBulkPushNotification(clubId, request);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task SendBulkPushNotification_ClubNotFound_ReturnsNotFound()
        {
            // Arrange
            var clubId = 1;
            var request = new SendPushNotificationRequest
            {
                Title = "Test",
                Body = "Test"
            };

            var serviceResponse = new SendPushNotificationResponse
            {
                Success = false,
                Message = "Club not found: 1"
            };

            _mockCommunicationsService
                .Setup(x => x.SendBulkPushNotificationAsync(clubId, 1, request))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.SendBulkPushNotification(clubId, request);

            // Assert
            result.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public async Task SendBulkPushNotification_WrongClubId_ReturnsForbid()
        {
            // Arrange
            var clubId = 999;
            var request = new SendPushNotificationRequest
            {
                Title = "Test",
                Body = "Test"
            };

            // Act
            var result = await _controller.SendBulkPushNotification(clubId, request);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(403);
        }

        [Test]
        public async Task SendBulkPushNotification_ServiceThrowsException_Returns500()
        {
            // Arrange
            var clubId = 1;
            var request = new SendPushNotificationRequest
            {
                Title = "Test",
                Body = "Test"
            };

            _mockCommunicationsService
                .Setup(x => x.SendBulkPushNotificationAsync(clubId, 1, request))
                .ThrowsAsync(new Exception("Service error"));

            // Act
            var result = await _controller.SendBulkPushNotification(clubId, request);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);
        }

        [Test]
        public async Task SendBulkPushNotification_NoUserIdClaim_ReturnsUnauthorized()
        {
            // Arrange
            SetupUnauthenticatedUser();
            var clubId = 1;
            var request = new SendPushNotificationRequest
            {
                Title = "Test",
                Body = "Test"
            };

            // Act
            var result = await _controller.SendBulkPushNotification(clubId, request);

            // Assert
            result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        #endregion

        #region GetPushNotificationUsageStats Tests

        [Test]
        public async Task GetPushNotificationUsageStats_ValidClubId_ReturnsOkResult()
        {
            // Arrange
            var clubId = 1;
            var serviceResponse = new PushNotificationUsageStatsResponse
            {
                ClubTier = "Grow",
                MembersWithDeviceTokens = 45,
                TotalActiveMembers = 50,
                TotalDeviceTokens = 62,
                IsGrowTier = true,
                IsAzureConfigured = true,
                CurrentMonth = "December 2024"
            };

            _mockCommunicationsService
                .Setup(x => x.GetPushNotificationUsageStatsAsync(clubId))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.GetPushNotificationUsageStats(clubId);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var response = okResult!.Value as PushNotificationUsageStatsResponse;
            response!.MembersWithDeviceTokens.Should().Be(45);
            response.TotalDeviceTokens.Should().Be(62);
        }

        [Test]
        public async Task GetPushNotificationUsageStats_WrongClubId_ReturnsForbid()
        {
            // Arrange
            var clubId = 999;

            // Act
            var result = await _controller.GetPushNotificationUsageStats(clubId);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(403);
        }

        [Test]
        public async Task GetPushNotificationUsageStats_ServiceThrowsException_Returns500()
        {
            // Arrange
            var clubId = 1;

            _mockCommunicationsService
                .Setup(x => x.GetPushNotificationUsageStatsAsync(clubId))
                .ThrowsAsync(new Exception("Service error"));

            // Act
            var result = await _controller.GetPushNotificationUsageStats(clubId);

            // Assert
            result.Result.Should().BeOfType<ObjectResult>();
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);
        }

        [Test]
        public async Task GetPushNotificationUsageStats_NoUserIdClaim_ReturnsUnauthorized()
        {
            // Arrange
            SetupUnauthenticatedUser();
            var clubId = 1;

            // Act
            var result = await _controller.GetPushNotificationUsageStats(clubId);

            // Assert
            result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        #endregion

        #region SendOutreach Tests

        [Test]
        public async Task SendOutreach_ValidEmailRequest_ReturnsOkResult()
        {
            // Arrange
            var clubId = 1;
            var request = new SendOutreachRequest
            {
                SelectedMemberIds = new List<int> { 1, 2, 3 },
                Subject = "Test Subject",
                Message = "Test message content",
                Type = "email"
            };

            var serviceResponse = new SendOutreachResponse
            {
                Success = true,
                SentCount = 3,
                Message = "Email outreach sent successfully to 3 members",
                CommunicationLogId = 456
            };

            _mockCommunicationsService
                .Setup(x => x.SendOutreachAsync(clubId, 1, request))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.SendOutreach(clubId, request);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var response = okResult!.Value as SendOutreachResponse;
            response!.Success.Should().BeTrue();
            response.SentCount.Should().Be(3);
        }

        [Test]
        public async Task SendOutreach_SmsRequest_ReturnsBadRequest()
        {
            // Arrange
            var clubId = 1;
            var request = new SendOutreachRequest
            {
                SelectedMemberIds = new List<int> { 1, 2 },
                Message = "SMS test message",
                Type = "sms"
            };

            // Act
            var result = await _controller.SendOutreach(clubId, request);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task SendOutreach_ValidNotificationRequest_ReturnsOkResult()
        {
            // Arrange
            var clubId = 1;
            var request = new SendOutreachRequest
            {
                SelectedMemberIds = new List<int> { 1 },
                Message = "Push notification message",
                Type = "notification"
            };

            var serviceResponse = new SendOutreachResponse
            {
                Success = true,
                SentCount = 1,
                Message = "Push notification sent successfully"
            };

            _mockCommunicationsService
                .Setup(x => x.SendOutreachAsync(clubId, 1, request))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.SendOutreach(clubId, request);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task SendOutreach_EmptyMembersList_ReturnsBadRequest()
        {
            // Arrange
            var clubId = 1;
            var request = new SendOutreachRequest
            {
                SelectedMemberIds = new List<int>(),
                Message = "Test message",
                Type = "email"
            };

            // Act
            var result = await _controller.SendOutreach(clubId, request);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task SendOutreach_InvalidType_ReturnsBadRequest()
        {
            // Arrange
            var clubId = 1;
            var request = new SendOutreachRequest
            {
                SelectedMemberIds = new List<int> { 1 },
                Message = "Test message",
                Type = "invalid"
            };

            // Act
            var result = await _controller.SendOutreach(clubId, request);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Test]
        public async Task SendOutreach_UnauthenticatedUser_ReturnsUnauthorized()
        {
            // Arrange
            SetupUnauthenticatedUser();
            var clubId = 1;
            var request = new SendOutreachRequest
            {
                SelectedMemberIds = new List<int> { 1 },
                Message = "Test message",
                Type = "email"
            };

            // Act
            var result = await _controller.SendOutreach(clubId, request);

            // Assert
            result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        [Test]
        public async Task SendOutreach_WrongClub_ReturnsForbidden()
        {
            // Arrange
            SetupAuthenticatedUser(userId: 1, clubId: 2); // User belongs to club 2
            var clubId = 1; // But trying to send to club 1
            var request = new SendOutreachRequest
            {
                SelectedMemberIds = new List<int> { 1 },
                Message = "Test message",
                Type = "email"
            };

            // Act
            var result = await _controller.SendOutreach(clubId, request);

            // Assert
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(403);
        }

        [Test]
        public async Task SendOutreach_ServiceError_ReturnsInternalServerError()
        {
            // Arrange
            var clubId = 1;
            var request = new SendOutreachRequest
            {
                SelectedMemberIds = new List<int> { 1 },
                Subject = "Test",
                Message = "Test message",
                Type = "email"
            };

            _mockCommunicationsService
                .Setup(x => x.SendOutreachAsync(clubId, 1, request))
                .ThrowsAsync(new Exception("Service error"));

            // Act
            var result = await _controller.SendOutreach(clubId, request);

            // Assert
            var objectResult = result.Result as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);
        }

        [Test]
        public async Task SendOutreach_PartialSuccess_ReturnsOkWithErrors()
        {
            // Arrange
            var clubId = 1;
            var request = new SendOutreachRequest
            {
                SelectedMemberIds = new List<int> { 1, 2, 3 },
                Subject = "Test",
                Message = "Test message",
                Type = "email"
            };

            var serviceResponse = new SendOutreachResponse
            {
                Success = true,
                SentCount = 2,
                Message = "Outreach sent with some errors",
                Errors = new List<string> { "Failed to send to member ID 3: invalid email" }
            };

            _mockCommunicationsService
                .Setup(x => x.SendOutreachAsync(clubId, 1, request))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.SendOutreach(clubId, request);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var response = okResult!.Value as SendOutreachResponse;
            response!.SentCount.Should().Be(2);
            response.Errors.Should().HaveCount(1);
        }

        #endregion
    }
}
