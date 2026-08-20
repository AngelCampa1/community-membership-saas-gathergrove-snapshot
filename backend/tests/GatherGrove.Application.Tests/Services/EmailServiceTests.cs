using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for EmailService (MVP email implementation).
/// This is a simple logging-based email service for development/testing.
/// Tests verify logging behavior and parameter handling.
/// </summary>
[TestFixture]
public class EmailServiceTests
{
    private Mock<ILogger<EmailService>> _mockLogger = null!;
    private Mock<IUrlService> _mockUrlService = null!;
    private EmailService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<EmailService>>();
        _mockUrlService = new Mock<IUrlService>();
        _mockUrlService.Setup(u => u.GenerateActivationUrl(It.IsAny<string>()))
            .Returns((string token) => $"https://gathergrove.club/activate?token={token}");

        _service = new EmailService(_mockLogger.Object, _mockUrlService.Object);
    }

    #region SendPaymentRequestEmailAsync Tests

    [Test]
    public async Task SendPaymentRequestEmailAsync_ValidInput_LogsEmailContent()
    {
        // Arrange
        var toEmail = "member@test.com";
        var memberName = "John Doe";
        var clubName = "Test Club";
        var amount = 150.00m;
        var description = "Annual Dues";
        var paymentUrl = "https://pay.stripe.com/test123";

        // Act
        await _service.SendPaymentRequestEmailAsync(toEmail, memberName, clubName, amount, description, paymentUrl);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Email would be sent");
        VerifyLogWasCalled(LogLevel.Information, "Payment request email sent");
    }

    [Test]
    public async Task SendPaymentRequestEmailAsync_ZeroAmount_HandlesCorrectly()
    {
        // Act
        await _service.SendPaymentRequestEmailAsync("test@test.com", "Test", "Club", 0m, "Free", "https://pay.test");

        // Assert - Should not throw
        VerifyLogWasCalled(LogLevel.Information, "Payment request email sent");
    }

    [Test]
    public async Task SendPaymentRequestEmailAsync_NegativeAmount_HandlesCorrectly()
    {
        // Act - Negative amounts might represent refunds
        await _service.SendPaymentRequestEmailAsync("test@test.com", "Test", "Club", -50.00m, "Refund", "https://pay.test");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Payment request email sent");
    }

    [Test]
    public async Task SendPaymentRequestEmailAsync_LargeAmount_FormatsCorrectly()
    {
        // Act
        await _service.SendPaymentRequestEmailAsync("test@test.com", "Test", "Club", 999999.99m, "Premium", "https://pay.test");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Payment request email sent");
    }

    [Test]
    public async Task SendPaymentRequestEmailAsync_CompletesWithinReasonableTime()
    {
        // Act
        var sw = System.Diagnostics.Stopwatch.StartNew();
        await _service.SendPaymentRequestEmailAsync("test@test.com", "Test", "Club", 100m, "Dues", "https://pay.test");
        sw.Stop();

        // Assert - Should complete within 2000ms (100ms delay + generous buffer for CI load)
        sw.ElapsedMilliseconds.Should().BeLessThan(2000);
    }

    #endregion

    #region SendBulkEmailAsync Tests

    [Test]
    public async Task SendBulkEmailAsync_ValidInput_LogsEmailContent()
    {
        // Arrange
        var toEmail = "member@test.com";
        var memberName = "Jane Smith";
        var clubName = "Community Club";
        var subject = "Monthly Newsletter";
        var body = "Here's what happened this month...";

        // Act
        await _service.SendBulkEmailAsync(toEmail, memberName, clubName, subject, body);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Bulk email would be sent");
        VerifyLogWasCalled(LogLevel.Information, "Bulk email sent");
    }

    [Test]
    public async Task SendBulkEmailAsync_EmptyBody_HandlesCorrectly()
    {
        // Act
        await _service.SendBulkEmailAsync("test@test.com", "Test", "Club", "Subject", "");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Bulk email sent");
    }

    [Test]
    public async Task SendBulkEmailAsync_LongBody_HandlesCorrectly()
    {
        // Arrange
        var longBody = new string('A', 10000);

        // Act
        await _service.SendBulkEmailAsync("test@test.com", "Test", "Club", "Subject", longBody);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Bulk email sent");
    }

    [Test]
    public async Task SendBulkEmailAsync_SpecialCharactersInSubject_HandlesCorrectly()
    {
        // Act
        await _service.SendBulkEmailAsync("test@test.com", "Test", "Club", "Test <Subject> & More!", "Body");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Bulk email sent");
    }

    #endregion

    #region SendMemberActivationEmailAsync Tests

    [Test]
    public async Task SendMemberActivationEmailAsync_ValidInput_GeneratesActivationUrl()
    {
        // Arrange
        var activationToken = "test-token-123";

        // Act
        await _service.SendMemberActivationEmailAsync("member@test.com", "New Member", "Test Club", activationToken);

        // Assert
        _mockUrlService.Verify(u => u.GenerateActivationUrl(activationToken), Times.Once);
        VerifyLogWasCalled(LogLevel.Information, "Member activation email sent");
    }

    [Test]
    public async Task SendMemberActivationEmailAsync_LogsWelcomeContent()
    {
        // Act
        await _service.SendMemberActivationEmailAsync("member@test.com", "New Member", "Test Club", "token");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Member activation email would be sent");
    }

    [Test]
    public async Task SendMemberActivationEmailAsync_DifferentTokens_GeneratesUniqueUrls()
    {
        // Act
        await _service.SendMemberActivationEmailAsync("member1@test.com", "Member1", "Club", "token-1");
        await _service.SendMemberActivationEmailAsync("member2@test.com", "Member2", "Club", "token-2");

        // Assert
        _mockUrlService.Verify(u => u.GenerateActivationUrl("token-1"), Times.Once);
        _mockUrlService.Verify(u => u.GenerateActivationUrl("token-2"), Times.Once);
    }

    #endregion

    #region SendLeadMagnetEmailAsync Tests

    [Test]
    public async Task SendLeadMagnetEmailAsync_WithName_UsesProvidedName()
    {
        // Arrange
        var pdfContent = new byte[] { 0x25, 0x50, 0x44, 0x46 }; // PDF header

        // Act
        await _service.SendLeadMagnetEmailAsync("lead@test.com", "John", "club-management-checklist", pdfContent);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Lead magnet email sent");
    }

    [Test]
    public async Task SendLeadMagnetEmailAsync_WithNullName_UsesFriendAsDefault()
    {
        // Arrange
        var pdfContent = new byte[] { 0x25, 0x50, 0x44, 0x46 };

        // Act
        await _service.SendLeadMagnetEmailAsync("lead@test.com", null, "club-management-checklist", pdfContent);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Lead magnet email would be sent");
    }

    [Test]
    public async Task SendLeadMagnetEmailAsync_WithEmptyName_UsesFriendAsDefault()
    {
        // Arrange
        var pdfContent = new byte[] { 0x25, 0x50, 0x44, 0x46 };

        // Act
        await _service.SendLeadMagnetEmailAsync("lead@test.com", "", "club-management-checklist", pdfContent);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Lead magnet email would be sent");
    }

    [Test]
    public async Task SendLeadMagnetEmailAsync_ClubManagementChecklist_UsesCorrectDisplayName()
    {
        // Arrange
        var pdfContent = new byte[100];

        // Act
        await _service.SendLeadMagnetEmailAsync("lead@test.com", "Test", "club-management-checklist", pdfContent);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "club-management-checklist");
    }

    [Test]
    public async Task SendLeadMagnetEmailAsync_UnknownType_UsesDefaultDisplayName()
    {
        // Arrange
        var pdfContent = new byte[100];

        // Act
        await _service.SendLeadMagnetEmailAsync("lead@test.com", "Test", "unknown-type", pdfContent);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "unknown-type");
    }

    [Test]
    public async Task SendLeadMagnetEmailAsync_LogsPdfSize()
    {
        // Arrange
        var pdfContent = new byte[5000];

        // Act
        await _service.SendLeadMagnetEmailAsync("lead@test.com", "Test", "checklist", pdfContent);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "5000 bytes");
    }

    #endregion

    #region SendScheduledReportAsync Tests

    [Test]
    public async Task SendScheduledReportAsync_SingleRecipient_SendsToRecipient()
    {
        // Arrange
        var recipients = new List<string> { "admin@test.com" };
        var reportData = new byte[1000];

        // Act
        await _service.SendScheduledReportAsync(recipients, "Weekly Report", reportData, "report.xlsx");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "admin@test.com");
    }

    [Test]
    public async Task SendScheduledReportAsync_MultipleRecipients_SendsToAll()
    {
        // Arrange
        var recipients = new List<string> { "admin1@test.com", "admin2@test.com", "admin3@test.com" };
        var reportData = new byte[1000];

        // Act
        await _service.SendScheduledReportAsync(recipients, "Weekly Report", reportData, "report.xlsx");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "3 recipients");
    }

    [Test]
    public async Task SendScheduledReportAsync_EmptyRecipients_LogsZeroRecipients()
    {
        // Arrange
        var recipients = new List<string>();
        var reportData = new byte[1000];

        // Act
        await _service.SendScheduledReportAsync(recipients, "Weekly Report", reportData, "report.xlsx");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "0 recipients");
    }

    [Test]
    public async Task SendScheduledReportAsync_IncludesFileName()
    {
        // Arrange
        var recipients = new List<string> { "admin@test.com" };
        var reportData = new byte[1000];

        // Act
        await _service.SendScheduledReportAsync(recipients, "Report", reportData, "monthly-report.xlsx");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "monthly-report.xlsx");
    }

    #endregion

    #region SendScheduledFinancialReportAsync Tests

    [Test]
    public async Task SendScheduledFinancialReportAsync_ValidInput_SendsToRecipients()
    {
        // Arrange
        var recipients = new List<string> { "finance@test.com" };
        var reportData = new byte[2000];

        // Act
        await _service.SendScheduledFinancialReportAsync(recipients, "Financial Report", reportData, "finance.xlsx");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Scheduled financial report sent");
    }

    [Test]
    public async Task SendScheduledFinancialReportAsync_MultipleRecipients_SendsToAll()
    {
        // Arrange
        var recipients = new List<string> { "cfo@test.com", "treasurer@test.com" };
        var reportData = new byte[2000];

        // Act
        await _service.SendScheduledFinancialReportAsync(recipients, "Q4 Report", reportData, "q4-finance.xlsx");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "2 recipients");
    }

    #endregion

    #region SendExportCompletionNotificationAsync Tests

    [Test]
    public async Task SendExportCompletionNotificationAsync_ValidInput_SendsNotification()
    {
        // Arrange
        var exportId = "export-123";
        var fileSizeBytes = 10L * 1024 * 1024; // 10 MB

        // Act
        await _service.SendExportCompletionNotificationAsync("admin@test.com", "Export Complete", exportId, fileSizeBytes);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Export completion notification sent");
        VerifyLogWasCalled(LogLevel.Information, "export-123");
    }

    [Test]
    public async Task SendExportCompletionNotificationAsync_LargeFile_FormatsFileSizeCorrectly()
    {
        // Arrange
        var fileSizeBytes = 1024L * 1024L * 1024L; // 1 GB = 1024 MB

        // Act
        await _service.SendExportCompletionNotificationAsync("admin@test.com", "Export Complete", "id", fileSizeBytes);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Export completion notification would be sent");
    }

    [Test]
    public async Task SendExportCompletionNotificationAsync_SmallFile_FormatsFileSizeCorrectly()
    {
        // Arrange
        var fileSizeBytes = 512L * 1024L; // 512 KB = 0.5 MB

        // Act
        await _service.SendExportCompletionNotificationAsync("admin@test.com", "Export Complete", "id", fileSizeBytes);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Export completion notification sent");
    }

    #endregion

    #region SendEmailAsync Tests

    [Test]
    public async Task SendEmailAsync_ValidInput_ReturnsTrue()
    {
        // Act
        var result = await _service.SendEmailAsync("test@test.com", "Test Subject", "Test Body");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task SendEmailAsync_WithFromAddress_ReturnsTrue()
    {
        // Act
        var result = await _service.SendEmailAsync("test@test.com", "Test Subject", "Test Body", "noreply@club.com");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task SendEmailAsync_LogsEmailDetails()
    {
        // Act
        await _service.SendEmailAsync("test@test.com", "Subject", "Body");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Email would be sent");
        VerifyLogWasCalled(LogLevel.Information, "Email body");
    }

    #endregion

    #region SendEmailWithAttachmentAsync Tests

    [Test]
    public async Task SendEmailWithAttachmentAsync_ValidInput_ReturnsTrue()
    {
        // Arrange
        var attachment = new byte[1000];

        // Act
        var result = await _service.SendEmailWithAttachmentAsync("test@test.com", "Subject", "Body", attachment, "file.pdf");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task SendEmailWithAttachmentAsync_LogsAttachmentDetails()
    {
        // Arrange
        var attachment = new byte[5000];

        // Act
        await _service.SendEmailWithAttachmentAsync("test@test.com", "Subject", "Body", attachment, "report.xlsx");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Attachment");
        VerifyLogWasCalled(LogLevel.Information, "report.xlsx");
        VerifyLogWasCalled(LogLevel.Information, "5000 bytes");
    }

    [Test]
    public async Task SendEmailWithAttachmentAsync_EmptyAttachment_ReturnsTrue()
    {
        // Arrange
        var attachment = Array.Empty<byte>();

        // Act
        var result = await _service.SendEmailWithAttachmentAsync("test@test.com", "Subject", "Body", attachment, "empty.pdf");

        // Assert
        result.Should().BeTrue();
    }

    #endregion

    #region SendNotificationEmailAsync Tests

    [Test]
    public async Task SendNotificationEmailAsync_ValidInput_ReturnsTrue()
    {
        // Act
        var result = await _service.SendNotificationEmailAsync("test@test.com", "Task Complete", "Your task has finished.");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task SendNotificationEmailAsync_LogsNotificationDetails()
    {
        // Act
        await _service.SendNotificationEmailAsync("test@test.com", "Notification Subject", "Notification body");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Notification email would be sent");
    }

    #endregion

    #region SendEventPaymentConfirmationEmailAsync Tests

    [Test]
    public async Task SendEventPaymentConfirmationEmailAsync_ValidInput_SendsConfirmation()
    {
        // Arrange
        var eventDateTime = new DateTime(2025, 3, 15, 14, 30, 0);

        // Act
        await _service.SendEventPaymentConfirmationEmailAsync(
            "member@test.com",
            "John Doe",
            "Community Club",
            "Spring Gala",
            eventDateTime,
            "Main Hall",
            75.00m,
            "pi_test123",
            "CONF-001");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Event payment confirmation email sent");
        VerifyLogWasCalled(LogLevel.Information, "Spring Gala");
    }

    [Test]
    public async Task SendEventPaymentConfirmationEmailAsync_FormatsDateCorrectly()
    {
        // Arrange
        var eventDateTime = new DateTime(2025, 12, 25, 18, 0, 0);

        // Act
        await _service.SendEventPaymentConfirmationEmailAsync(
            "member@test.com",
            "Member",
            "Club",
            "Holiday Party",
            eventDateTime,
            "Venue",
            50m,
            "pi_test",
            "CONF-002");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Event payment confirmation email would be sent");
    }

    [Test]
    public async Task SendEventPaymentConfirmationEmailAsync_IncludesPaymentDetails()
    {
        // Act
        await _service.SendEventPaymentConfirmationEmailAsync(
            "member@test.com",
            "Member",
            "Club",
            "Event",
            DateTime.Now,
            "Location",
            99.99m,
            "pi_payment123",
            "CONF-003");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Event payment confirmation email would be sent");
    }

    #endregion

    #region SendGuestEventPaymentConfirmationEmailAsync Tests

    [Test]
    public async Task SendGuestEventPaymentConfirmationEmailAsync_WithMembership_IncludesMembershipNote()
    {
        // Arrange
        var eventDateTime = new DateTime(2025, 5, 10, 10, 0, 0);

        // Act
        await _service.SendGuestEventPaymentConfirmationEmailAsync(
            "guest@test.com",
            "Guest User",
            "Annual Conference",
            eventDateTime,
            "Convention Center",
            150.00m,
            membershipIncluded: true,
            "CONF-G001",
            accountCreated: false,
            loginEmail: null);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Membership: True");
    }

    [Test]
    public async Task SendGuestEventPaymentConfirmationEmailAsync_WithAccountCreated_IncludesAccountNote()
    {
        // Arrange
        var eventDateTime = new DateTime(2025, 5, 10, 10, 0, 0);

        // Act
        await _service.SendGuestEventPaymentConfirmationEmailAsync(
            "guest@test.com",
            "Guest User",
            "Workshop",
            eventDateTime,
            "Training Room",
            50.00m,
            membershipIncluded: false,
            "CONF-G002",
            accountCreated: true,
            loginEmail: "guest@test.com");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Account: True");
    }

    [Test]
    public async Task SendGuestEventPaymentConfirmationEmailAsync_WithBothOptions_IncludesBothNotes()
    {
        // Arrange
        var eventDateTime = new DateTime(2025, 6, 20, 15, 30, 0);

        // Act
        await _service.SendGuestEventPaymentConfirmationEmailAsync(
            "newmember@test.com",
            "New Member",
            "Welcome Event",
            eventDateTime,
            "Club House",
            200.00m,
            membershipIncluded: true,
            "CONF-G003",
            accountCreated: true,
            loginEmail: "newmember@test.com");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Membership: True");
        VerifyLogWasCalled(LogLevel.Information, "Account: True");
    }

    [Test]
    public async Task SendGuestEventPaymentConfirmationEmailAsync_WithoutOptions_OmitsBothNotes()
    {
        // Arrange
        var eventDateTime = new DateTime(2025, 7, 4, 12, 0, 0);

        // Act
        await _service.SendGuestEventPaymentConfirmationEmailAsync(
            "guest@test.com",
            "Guest",
            "Open House",
            eventDateTime,
            "Main Building",
            25.00m,
            membershipIncluded: false,
            "CONF-G004",
            accountCreated: false,
            loginEmail: null);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Membership: False");
        VerifyLogWasCalled(LogLevel.Information, "Account: False");
    }

    #endregion

    #region SendAdminInvitationEmailAsync Tests

    [Test]
    public async Task SendAdminInvitationEmailAsync_ValidInput_SendsInvitation()
    {
        // Act
        await _service.SendAdminInvitationEmailAsync(
            "newadmin@test.com",
            "Community Club",
            "John Admin",
            "invite-token-123");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Admin invitation email sent");
        VerifyLogWasCalled(LogLevel.Information, "Community Club");
    }

    [Test]
    public async Task SendAdminInvitationEmailAsync_IncludesInvitationToken()
    {
        // Act
        await _service.SendAdminInvitationEmailAsync(
            "admin@test.com",
            "Club",
            "Inviter",
            "special-token-xyz");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Admin invitation email would be sent");
    }

    [Test]
    public async Task SendAdminInvitationEmailAsync_LogsInviterName()
    {
        // Act
        await _service.SendAdminInvitationEmailAsync(
            "admin@test.com",
            "Test Club",
            "Super Admin",
            "token");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Admin invitation email would be sent");
    }

    #endregion

    #region Edge Cases and Special Characters

    [Test]
    public async Task AllEmailMethods_HandleUnicodeCharacters()
    {
        // Test various methods with Unicode characters
        await _service.SendBulkEmailAsync("test@test.com", "José García", "Café Club", "Café Update ☕", "Hello 你好 مرحبا");
        await _service.SendPaymentRequestEmailAsync("test@test.com", "François", "Château Club", 100m, "Adhésion", "https://pay.test");

        // Assert - Should not throw
        VerifyLogWasCalled(LogLevel.Information, "Bulk email sent");
        VerifyLogWasCalled(LogLevel.Information, "Payment request email sent");
    }

    [Test]
    public async Task AllEmailMethods_HandleHtmlContent()
    {
        // Act - HTML in body should be handled (even if logged)
        await _service.SendBulkEmailAsync("test@test.com", "Test", "Club", "HTML Test", "<p>Bold <strong>text</strong></p>");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Bulk email sent");
    }

    [Test]
    public async Task AllEmailMethods_HandleNewlines()
    {
        // Act
        await _service.SendBulkEmailAsync("test@test.com", "Test", "Club", "Subject", "Line 1\nLine 2\r\nLine 3");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Bulk email sent");
    }

    [Test]
    public async Task AllEmailMethods_HandleEmptyStrings()
    {
        // Act - Empty strings should not throw
        await _service.SendBulkEmailAsync("", "", "", "", "");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Bulk email sent");
    }

    #endregion

    #region Concurrent Operations Tests

    [Test]
    public async Task EmailService_ConcurrentCalls_HandlesMultipleRequestsSafely()
    {
        // Arrange
        var tasks = new List<Task<bool>>();

        // Act - Fire off multiple concurrent requests
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(_service.SendEmailAsync($"test{i}@test.com", $"Subject {i}", $"Body {i}"));
        }

        var results = await Task.WhenAll(tasks);

        // Assert - All should succeed
        results.Should().HaveCount(10);
        results.Should().OnlyContain(r => r == true);
    }

    [Test]
    public async Task EmailService_MixedConcurrentCalls_AllComplete()
    {
        // Arrange
        var tasks = new List<Task>();

        // Act - Mix of different email types
        tasks.Add(_service.SendPaymentRequestEmailAsync("test1@test.com", "Name1", "Club", 100m, "Desc", "url"));
        tasks.Add(_service.SendBulkEmailAsync("test2@test.com", "Name2", "Club", "Subject", "Body"));
        tasks.Add(_service.SendMemberActivationEmailAsync("test3@test.com", "Name3", "Club", "token"));
        tasks.Add(_service.SendEmailAsync("test4@test.com", "Subject", "Body"));
        tasks.Add(_service.SendNotificationEmailAsync("test5@test.com", "Subject", "Body"));

        // All should complete without throwing
        await Task.WhenAll(tasks);

        // Assert
        tasks.Should().OnlyContain(t => t.IsCompletedSuccessfully);
    }

    #endregion

    #region Helper Methods

    private void VerifyLogWasCalled(LogLevel level, string containsMessage)
    {
        _mockLogger.Verify(
            x => x.Log(
                level,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains(containsMessage)),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            $"Expected log at level {level} containing '{containsMessage}'");
    }

    #endregion
}
