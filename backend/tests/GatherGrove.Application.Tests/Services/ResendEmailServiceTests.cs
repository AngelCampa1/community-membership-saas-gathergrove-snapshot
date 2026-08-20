using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging.Abstractions;
using GatherGrove.Application.Services;
using GatherGrove.Application.Configuration;
using Resend;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Unit tests for ResendEmailService - Mock only the external Resend API boundary
/// Tests REAL service logic with mocked external dependencies
/// </summary>
[TestFixture]
public class ResendEmailServiceTests
{
    private Mock<IResend> _mockResendClient;
    private Mock<IUrlService> _mockUrlService;
    private ResendEmailService _service;
    private ResendSettings _settings;

    [SetUp]
    public void SetUp()
    {
        // Mock ONLY external boundary (IResend)
        _mockResendClient = new Mock<IResend>();

        // Mock URL service for predictable test URLs
        _mockUrlService = new Mock<IUrlService>();
        _mockUrlService.Setup(u => u.GenerateActivationUrl(It.IsAny<string>()))
            .Returns((string token) => $"https://gathergrove.club/activate?token={token}");

        // Real configuration
        _settings = new ResendSettings
        {
            ApiToken = "re_test_token",
            FromEmailAddress = "noreply@gathergrove.club",
            FromName = "GatherGrove Test",
            WebhookSecret = "test_webhook_secret"
        };
        var options = Options.Create(_settings);

        // Real service with real logger
        _service = new ResendEmailService(
            _mockResendClient.Object,
            options,
            NullLogger<ResendEmailService>.Instance,
            _mockUrlService.Object
        );
    }

    [Test]
    public async Task SendEmailAsync_ValidParams_CallsResendClient()
    {
        // Arrange
        var toEmail = "test@example.com";
        var subject = "Test Email";
        var body = "<p>Test body</p>";
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        var result = await _service.SendEmailAsync(toEmail, subject, body);

        // Assert
        Assert.That(result, Is.True);
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains(toEmail)), Is.True, $"Expected To field to contain {toEmail}");
        Assert.That(capturedMessage.Subject, Is.EqualTo(subject));
        Assert.That(capturedMessage.HtmlBody, Is.EqualTo(body));
        // Check From field
        Assert.That(capturedMessage.From.ToString().Contains(_settings.FromEmailAddress) || capturedMessage.From.ToString().Contains(_settings.FromName), Is.True, "Expected From field to contain sender info");
    }

    [Test]
    public async Task SendEmailAsync_ResendClientThrows_ReturnsFalse()
    {
        // Arrange
        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("API Error"));

        // Act
        var result = await _service.SendEmailAsync("test@example.com", "Subject", "Body");

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task SendPaymentRequestEmailAsync_ValidParams_ConstructsCorrectEmail()
    {
        // Arrange
        var email = "member@example.com";
        var memberName = "John Doe";
        var clubName = "Test Club";
        var amount = 50.00m;
        var description = "Monthly dues";
        var paymentUrl = "https://gathergrove.club/pay/123";
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        await _service.SendPaymentRequestEmailAsync(email, memberName, clubName, amount, description, paymentUrl);

        // Assert
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains(email)), Is.True);
        Assert.That(capturedMessage.Subject, Does.Contain("Payment Request").IgnoreCase);
        Assert.That(capturedMessage.HtmlBody, Does.Contain(memberName));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(clubName));
        Assert.That(capturedMessage.HtmlBody, Does.Contain("$50.00"));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(description));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(paymentUrl));
    }

    [Test]
    public async Task SendMemberActivationEmailAsync_ValidParams_IncludesActivationUrl()
    {
        // Arrange
        var email = "newmember@example.com";
        var memberName = "Jane Smith";
        var clubName = "Test Club";
        var token = "activation-token-123";
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        await _service.SendMemberActivationEmailAsync(email, memberName, clubName, token);

        // Assert
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains(email)), Is.True);
        Assert.That(capturedMessage.Subject, Does.Contain("Activate").IgnoreCase);
        Assert.That(capturedMessage.HtmlBody, Does.Contain(memberName));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(clubName));
        Assert.That(capturedMessage.HtmlBody, Does.Contain($"https://gathergrove.club/activate?token={token}"));
        _mockUrlService.Verify(u => u.GenerateActivationUrl(token), Times.Once);
    }

    [Test]
    public async Task SendBulkEmailAsync_ValidParams_ConstructsCorrectEmail()
    {
        // Arrange
        var email = "member@example.com";
        var memberName = "John Doe";
        var clubName = "Test Club";
        var subject = "Club Announcement";
        var body = "<p>Important news!</p>";
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        await _service.SendBulkEmailAsync(email, memberName, clubName, subject, body);

        // Assert
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains(email)), Is.True);
        Assert.That(capturedMessage.Subject, Is.EqualTo(subject));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(body));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(memberName));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(clubName));
    }

    [Test]
    public async Task SendEventPaymentConfirmationEmailAsync_ValidParams_IncludesEventDetails()
    {
        // Arrange
        var email = "attendee@example.com";
        var attendeeName = "John Doe";
        var clubName = "Test Club";
        var eventName = "Annual Gala";
        var eventDate = new DateTime(2026, 3, 15, 19, 0, 0);
        var location = "Grand Ballroom";
        var amount = 75.00m;
        var paymentIntentId = "pi_test_123";
        var confirmationNumber = "CONF-2026-001";
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        await _service.SendEventPaymentConfirmationEmailAsync(
            email, attendeeName, clubName, eventName, eventDate, location,
            amount, paymentIntentId, confirmationNumber);

        // Assert
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains(email)), Is.True);
        Assert.That(capturedMessage.Subject, Does.Contain("Confirmation").IgnoreCase);
        Assert.That(capturedMessage.HtmlBody, Does.Contain(attendeeName));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(eventName));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(location));
        Assert.That(capturedMessage.HtmlBody, Does.Contain("$75.00"));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(confirmationNumber));
    }

    [Test]
    public async Task SendLeadMagnetEmailAsync_ValidParams_AttachesPdf()
    {
        // Arrange
        var email = "prospect@example.com";
        var name = "Marketing Lead";
        var leadMagnetType = "club-management-guide";
        var pdfContent = new byte[] { 0x25, 0x50, 0x44, 0x46 }; // %PDF header
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        await _service.SendLeadMagnetEmailAsync(email, name, leadMagnetType, pdfContent);

        // Assert
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains(email)), Is.True);
        Assert.That(capturedMessage.Subject, Does.Contain("Guide").IgnoreCase);
        Assert.That(capturedMessage.HtmlBody, Does.Contain(name));
        Assert.That(capturedMessage.Attachments, Is.Not.Null);
        Assert.That(capturedMessage.Attachments!.Count, Is.EqualTo(1));
        Assert.That(capturedMessage.Attachments[0].Filename, Is.EqualTo($"{leadMagnetType}.pdf"));
        Assert.That(capturedMessage.Attachments[0].ContentType, Is.EqualTo("application/pdf"));
        Assert.That(capturedMessage.Attachments[0].Content, Is.Not.Null);
    }

    [Test]
    public async Task SendScheduledReportAsync_MultipleRecipients_SendsToEach()
    {
        // Arrange
        var recipients = new List<string> { "admin1@example.com", "admin2@example.com" };
        var subject = "Monthly Report";
        var reportData = System.Text.Encoding.UTF8.GetBytes("Name,Status\nJohn,Active");
        var fileName = "report.csv";
        var capturedMessages = new List<EmailMessage>();

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessages.Add(m))
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        await _service.SendScheduledReportAsync(recipients, subject, reportData, fileName);

        // Assert
        Assert.That(capturedMessages.Count, Is.EqualTo(2));

        var message1 = capturedMessages.FirstOrDefault(m => m.To.Contains("admin1@example.com"));
        Assert.That(message1, Is.Not.Null);
        Assert.That(message1!.Attachments, Is.Not.Null);
        Assert.That(message1.Attachments!.Count, Is.EqualTo(1));
        Assert.That(message1.Attachments[0].Filename, Is.EqualTo(fileName));
        Assert.That(message1.Attachments[0].ContentType, Is.EqualTo("text/csv"));

        var message2 = capturedMessages.FirstOrDefault(m => m.To.Contains("admin2@example.com"));
        Assert.That(message2, Is.Not.Null);
    }

    [Test]
    public async Task SendEmailWithAttachmentAsync_ValidParams_AttachesFile()
    {
        // Arrange
        var email = "user@example.com";
        var subject = "Document Attached";
        var body = "<p>Please find attached document.</p>";
        var attachmentData = System.Text.Encoding.UTF8.GetBytes("Test content");
        var fileName = "document.pdf";
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        var result = await _service.SendEmailWithAttachmentAsync(email, subject, body, attachmentData, fileName);

        // Assert
        Assert.That(result, Is.True);
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains(email)), Is.True);
        Assert.That(capturedMessage.Subject, Is.EqualTo(subject));
        Assert.That(capturedMessage.Attachments, Is.Not.Null);
        Assert.That(capturedMessage.Attachments!.Count, Is.EqualTo(1));
        Assert.That(capturedMessage.Attachments[0].Filename, Is.EqualTo(fileName));
        Assert.That(capturedMessage.Attachments[0].Content, Is.Not.Null);
    }

    [Test]
    public async Task SendAdminInvitationEmailAsync_ValidParams_IncludesInvitationUrl()
    {
        // Arrange
        var email = "newadmin@example.com";
        var clubName = "Test Club";
        var inviterName = "Current Admin";
        var invitationToken = "invite-token-123";
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        await _service.SendAdminInvitationEmailAsync(email, clubName, inviterName, invitationToken);

        // Assert
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains(email)), Is.True);
        Assert.That(capturedMessage.Subject, Does.Contain("invited").IgnoreCase);
        Assert.That(capturedMessage.HtmlBody, Does.Contain(clubName));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(inviterName));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(invitationToken));
    }

    [Test]
    public async Task SendGuestEventPaymentConfirmationEmailAsync_WithMembership_IncludesAccountInfo()
    {
        // Arrange
        var email = "guest@example.com";
        var guestName = "Guest Attendee";
        var eventName = "Special Event";
        var eventDate = new DateTime(2026, 4, 20, 18, 30, 0);
        var location = "Rooftop Venue";
        var amount = 120.00m;
        var confirmationNumber = "GUEST-2026-042";
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        await _service.SendGuestEventPaymentConfirmationEmailAsync(
            email, guestName, eventName, eventDate, location, amount,
            membershipIncluded: true, confirmationNumber, accountCreated: true, email);

        // Assert
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains(email)), Is.True);
        Assert.That(capturedMessage.Subject, Does.Contain("Confirmation"));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(guestName));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(eventName));
        Assert.That(capturedMessage.HtmlBody, Does.Contain("membership").IgnoreCase);
        Assert.That(capturedMessage.HtmlBody, Does.Contain("account").IgnoreCase);
    }

    [Test]
    public async Task SendExportCompletionNotificationAsync_ValidParams_IncludesExportId()
    {
        // Arrange
        var email = "admin@example.com";
        var subject = "Export Ready";
        var exportId = "export-12345";
        var fileSizeBytes = 5242880L; // 5MB
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        await _service.SendExportCompletionNotificationAsync(email, subject, exportId, fileSizeBytes);

        // Assert
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains(email)), Is.True);
        Assert.That(capturedMessage.Subject, Is.EqualTo(subject));
        Assert.That(capturedMessage.HtmlBody, Does.Contain(exportId));
        Assert.That(capturedMessage.HtmlBody, Does.Contain("5.00 MB"));
    }

    [Test]
    public async Task SendNotificationEmailAsync_ValidParams_ConstructsCorrectEmail()
    {
        // Arrange
        var email = "user@example.com";
        var subject = "System Notification";
        var body = "<p>You have a new notification.</p>";
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        var result = await _service.SendNotificationEmailAsync(email, subject, body);

        // Assert
        Assert.That(result, Is.True);
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains(email)), Is.True);
        Assert.That(capturedMessage.Subject, Is.EqualTo(subject));
        Assert.That(capturedMessage.HtmlBody, Is.EqualTo(body));
    }

    [Test]
    public async Task SendScheduledFinancialReportAsync_ValidParams_SendsToRecipients()
    {
        // Arrange
        var recipients = new List<string> { "treasurer@example.com" };
        var subject = "Financial Report";
        var reportData = System.Text.Encoding.UTF8.GetBytes("Date,Amount\n2026-01-01,100.00");
        var fileName = "financial-report.csv";
        EmailMessage? capturedMessage = null;

        _mockResendClient.Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((m, ct) => capturedMessage = m)
            .Returns(Task.FromResult(default(ResendResponse<Guid>)!));

        // Act
        await _service.SendScheduledFinancialReportAsync(recipients, subject, reportData, fileName);

        // Assert
        Assert.That(capturedMessage, Is.Not.Null);
        // Check To field contains the email address
        Assert.That(capturedMessage!.To.Any(addr => addr.ToString().Contains("treasurer@example.com")), Is.True);
        Assert.That(capturedMessage.Subject, Is.EqualTo(subject));
        Assert.That(capturedMessage.Attachments, Is.Not.Null);
        Assert.That(capturedMessage.Attachments!.Count, Is.EqualTo(1));
        Assert.That(capturedMessage.Attachments[0].Filename, Is.EqualTo(fileName));
    }

    [Test]
    public void GetMimeType_PdfFile_ReturnsCorrectType()
    {
        // Arrange
        var fileName = "document.pdf";

        // Act - Using reflection to test private static method
        var method = typeof(ResendEmailService).GetMethod("GetMimeType",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        var result = method?.Invoke(null, new object[] { fileName }) as string;

        // Assert
        Assert.That(result, Is.EqualTo("application/pdf"));
    }

    [Test]
    public void GetMimeType_CsvFile_ReturnsCorrectType()
    {
        // Arrange
        var fileName = "report.csv";

        // Act
        var method = typeof(ResendEmailService).GetMethod("GetMimeType",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        var result = method?.Invoke(null, new object[] { fileName }) as string;

        // Assert
        Assert.That(result, Is.EqualTo("text/csv"));
    }

    [Test]
    public void GetMimeType_UnknownExtension_ReturnsOctetStream()
    {
        // Arrange
        var fileName = "file.unknown";

        // Act
        var method = typeof(ResendEmailService).GetMethod("GetMimeType",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        var result = method?.Invoke(null, new object[] { fileName }) as string;

        // Assert
        Assert.That(result, Is.EqualTo("application/octet-stream"));
    }

    [Test]
    public void Constructor_InitializesWithMultiDomainSettings()
    {
        // Arrange
        var mockResend = new Mock<IResend>();
        var mockUrlService = new Mock<IUrlService>();
        var settings = new ResendSettings
        {
            ApiToken = "re_test_token",
            FromEmailAddress = "noreply@gathergrove.club",
            FromName = "GatherGrove",
            VentoraLabsFromAddress = "noreply@ventoralabs.com",
            VentoraLabsFromName = "Ventora Labs",
            WebhookSecret = "test_secret"
        };
        var options = Options.Create(settings);

        // Act
        var service = new ResendEmailService(
            mockResend.Object,
            options,
            NullLogger<ResendEmailService>.Instance,
            mockUrlService.Object
        );

        // Assert - Service should initialize successfully
        Assert.That(service, Is.Not.Null);
    }

    [Test]
    public void Constructor_ThrowsException_WhenApiTokenMissing()
    {
        // Arrange
        var mockResend = new Mock<IResend>();
        var mockUrlService = new Mock<IUrlService>();
        var settings = new ResendSettings
        {
            ApiToken = "", // Empty API token
            FromEmailAddress = "noreply@gathergrove.club",
            FromName = "GatherGrove"
        };
        var options = Options.Create(settings);

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => new ResendEmailService(
            mockResend.Object,
            options,
            NullLogger<ResendEmailService>.Instance,
            mockUrlService.Object
        ));

        Assert.That(ex.Message, Does.Contain("Resend API token is not configured"));
    }

    [Test]
    public void ResendSettings_HasCorrectDefaultValues()
    {
        // Arrange & Act
        var settings = new ResendSettings();

        // Assert
        Assert.That(settings.FromEmailAddress, Is.EqualTo("noreply@gathergrove.club"));
        Assert.That(settings.FromName, Is.EqualTo("GatherGrove"));
        Assert.That(settings.VentoraLabsFromAddress, Is.EqualTo("noreply@ventoralabs.com"));
        Assert.That(settings.VentoraLabsFromName, Is.EqualTo("Ventora Labs"));
        Assert.That(settings.ApiToken, Is.EqualTo(string.Empty));
        Assert.That(settings.WebhookSecret, Is.EqualTo(string.Empty));
    }
}
