using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging.Abstractions;
using GatherGrove.Application.Services;
using GatherGrove.Application.Configuration;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Unit tests for ResendWebhookService
/// Tests webhook signature verification and email forwarding logic
/// </summary>
[TestFixture]
public class ResendWebhookServiceTests
{
    private Mock<IEmailService> _mockEmailService;
    private ResendSettings _settings;
    private ResendWebhookService _service;

    [SetUp]
    public void SetUp()
    {
        _mockEmailService = new Mock<IEmailService>();
        _settings = new ResendSettings
        {
            // Use valid base64-encoded secret (whsec_ prefix + base64 encoded "test_secret_key_12345")
            WebhookSecret = "whsec_dGVzdF9zZWNyZXRfa2V5XzEyMzQ1",
            AdminEmailAddress = "admin@test.com",
            ApiToken = "re_test_token"
        };
        var options = Options.Create(_settings);

        _service = new ResendWebhookService(
            _mockEmailService.Object,
            options,
            NullLogger<ResendWebhookService>.Instance);
    }

    [Test]
    public void Constructor_MissingAdminEmail_ThrowsInvalidOperationException()
    {
        // Arrange
        var invalidSettings = Options.Create(new ResendSettings
        {
            WebhookSecret = "test_secret",
            AdminEmailAddress = "", // Missing
            ApiToken = "re_test"
        });

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => new ResendWebhookService(
            _mockEmailService.Object,
            invalidSettings,
            NullLogger<ResendWebhookService>.Instance));
    }

    [Test]
    public async Task ProcessInboundEmailWebhookAsync_MissingHeaders_ThrowsArgumentException()
    {
        // Arrange
        var payload = CreateTestPayload("email.received");
        var headers = new Dictionary<string, string>
        {
            // Missing svix-signature header
            ["svix-id"] = "msg_test123",
            ["svix-timestamp"] = "1234567890"
        };

        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.ProcessInboundEmailWebhookAsync(payload, headers));
    }

    [Test]
    public async Task ProcessInboundEmailWebhookAsync_InvalidSignature_HandlesGracefully()
    {
        // Arrange
        var payload = CreateTestPayload("email.received");
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var headers = new Dictionary<string, string>
        {
            ["svix-id"] = "msg_test123",
            ["svix-timestamp"] = timestamp,
            // Use properly formatted but invalid signature (v1,{wrong_base64})
            ["svix-signature"] = "v1,aW52YWxpZF9zaWduYXR1cmU="
        };

        // Act
        // Note: Svix library handles invalid signatures internally
        // Our service catches any exceptions and returns true to prevent retries
        var result = await _service.ProcessInboundEmailWebhookAsync(payload, headers);

        // Assert
        // Service should handle invalid signatures gracefully
        // Either throws ArgumentException (caught by controller) or returns true
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ProcessInboundEmailWebhookAsync_NonEmailReceivedEvent_IgnoresEvent()
    {
        // Arrange
        var payload = CreateTestPayload("email.delivered");
        var headers = CreateValidHeaders(payload);

        // Act
        var result = await _service.ProcessInboundEmailWebhookAsync(payload, headers);

        // Assert
        Assert.That(result, Is.True);
        _mockEmailService.Verify(x => x.SendEmailAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string?>()), Times.Never);
    }

    [Test]
    public async Task ProcessInboundEmailWebhookAsync_InvalidJson_ReturnsTrue()
    {
        // Arrange
        var invalidPayload = "{ invalid json }";
        var headers = CreateValidHeaders(invalidPayload);

        // Act
        var result = await _service.ProcessInboundEmailWebhookAsync(invalidPayload, headers);

        // Assert
        Assert.That(result, Is.True); // Returns true to prevent retries
    }

    [Test]
    public async Task ProcessInboundEmailWebhookAsync_SimpleEmail_ForwardsWithMetadata()
    {
        // Arrange
        var payload = CreateTestPayload("email.received", includeHtml: true);
        var headers = CreateValidHeaders(payload);

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.ProcessInboundEmailWebhookAsync(payload, headers);

        // Assert
        Assert.That(result, Is.True);
        _mockEmailService.Verify(x => x.SendEmailAsync(
            "admin@test.com",
            It.Is<string>(s => s.Contains("[Forwarded]") && s.Contains("Test Subject")),
            It.Is<string>(b => b.Contains("Forwarded Email") && b.Contains("test@example.com")),
            It.IsAny<string?>()), Times.Once);
    }

    [Test]
    public async Task ProcessInboundEmailWebhookAsync_TextEmail_ConvertsToHtml()
    {
        // Arrange
        var payload = CreateTestPayload("email.received", includeHtml: false);
        var headers = CreateValidHeaders(payload);

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.ProcessInboundEmailWebhookAsync(payload, headers);

        // Assert
        Assert.That(result, Is.True);
        _mockEmailService.Verify(x => x.SendEmailAsync(
            "admin@test.com",
            It.IsAny<string>(),
            It.Is<string>(b => b.Contains("<pre") && b.Contains("This is plain text")),
            It.IsAny<string?>()), Times.Once);
    }

    [Test]
    public async Task ProcessInboundEmailWebhookAsync_WithAttachment_ForwardsWithAttachment()
    {
        // Arrange
        var payload = CreateTestPayloadWithAttachment();
        var headers = CreateValidHeaders(payload);

        _mockEmailService
            .Setup(x => x.SendEmailWithAttachmentAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.ProcessInboundEmailWebhookAsync(payload, headers);

        // Assert
        Assert.That(result, Is.True);
        _mockEmailService.Verify(x => x.SendEmailWithAttachmentAsync(
            "admin@test.com",
            It.Is<string>(s => s.Contains("[Forwarded]")),
            It.IsAny<string>(),
            It.IsAny<byte[]>(),
            "document.pdf",
            It.IsAny<string?>()), Times.Once);
    }

    [Test]
    public async Task ProcessInboundEmailWebhookAsync_EmailServiceFails_ReturnsTrue()
    {
        // Arrange
        var payload = CreateTestPayload("email.received");
        var headers = CreateValidHeaders(payload);

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ThrowsAsync(new Exception("Email service error"));

        // Act
        var result = await _service.ProcessInboundEmailWebhookAsync(payload, headers);

        // Assert
        Assert.That(result, Is.True); // Still returns true to prevent retries
    }

    [Test]
    public async Task ProcessInboundEmailWebhookAsync_PreservesOriginalSender()
    {
        // Arrange
        var payload = CreateTestPayload("email.received");
        var headers = CreateValidHeaders(payload);

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        await _service.ProcessInboundEmailWebhookAsync(payload, headers);

        // Assert
        _mockEmailService.Verify(x => x.SendEmailAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.Is<string>(body => body.Contains("test@example.com")),
            It.IsAny<string?>()), Times.Once);
    }

    [Test]
    public async Task ProcessInboundEmailWebhookAsync_NonGatherGroveDomain_IgnoresEmail()
    {
        // Arrange
        var payload = CreateTestPayloadWithRecipient("support@geoleap.app");
        var headers = CreateValidHeaders(payload);

        // Act
        var result = await _service.ProcessInboundEmailWebhookAsync(payload, headers);

        // Assert
        Assert.That(result, Is.True);
        _mockEmailService.Verify(x => x.SendEmailAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string?>()), Times.Never);
    }

    [Test]
    public async Task ProcessInboundEmailWebhookAsync_MixedDomainsWithGatherGrove_ProcessesEmail()
    {
        // Arrange
        var payload = CreateTestPayloadWithRecipients(new[] { "user@geoleap.app", "admin@gathergrove.club" });
        var headers = CreateValidHeaders(payload);

        _mockEmailService
            .Setup(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.ProcessInboundEmailWebhookAsync(payload, headers);

        // Assert
        Assert.That(result, Is.True);
        _mockEmailService.Verify(x => x.SendEmailAsync(
            "admin@test.com",
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string?>()), Times.Once);
    }

    // Helper methods

    private string CreateTestPayload(string eventType, bool includeHtml = true)
    {
        var webhookEvent = new
        {
            type = eventType,
            created_at = DateTime.UtcNow,
            data = new
            {
                email_id = "email_123",
                from = "test@example.com",
                to = new[] { "support@gathergrove.club" },
                subject = "Test Subject",
                text = "This is plain text",
                html = includeHtml ? "<p>This is HTML content</p>" : null,
                headers = new Dictionary<string, string>(),
                attachments = new List<object>()
            }
        };

        return JsonSerializer.Serialize(webhookEvent);
    }

    private string CreateTestPayloadWithAttachment()
    {
        var webhookEvent = new
        {
            type = "email.received",
            created_at = DateTime.UtcNow,
            data = new
            {
                email_id = "email_123",
                from = "test@example.com",
                to = new[] { "support@gathergrove.club" },
                subject = "Email with Attachment",
                text = "See attached document",
                html = "<p>See attached document</p>",
                headers = new Dictionary<string, string>(),
                attachments = new[]
                {
                    new
                    {
                        filename = "document.pdf",
                        content_type = "application/pdf",
                        content = Convert.ToBase64String(new byte[] { 0x25, 0x50, 0x44, 0x46 }) // %PDF header
                    }
                }
            }
        };

        return JsonSerializer.Serialize(webhookEvent);
    }

    private string CreateTestPayloadWithRecipient(string recipient)
    {
        return CreateTestPayloadWithRecipients(new[] { recipient });
    }

    private string CreateTestPayloadWithRecipients(string[] recipients)
    {
        var webhookEvent = new
        {
            type = "email.received",
            created_at = DateTime.UtcNow,
            data = new
            {
                email_id = "email_123",
                from = "test@example.com",
                to = recipients,
                subject = "Test Subject",
                text = "This is plain text",
                html = "<p>This is HTML content</p>",
                headers = new Dictionary<string, string>(),
                attachments = new List<object>()
            }
        };

        return JsonSerializer.Serialize(webhookEvent);
    }

    private Dictionary<string, string> CreateValidHeaders(string payload = "")
    {
        // Generate valid Svix HMAC signature for testing
        var msgId = "msg_test123";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

        // If no payload provided, use a default test payload
        if (string.IsNullOrEmpty(payload))
        {
            payload = CreateTestPayload("email.received");
        }

        // Svix signature format: v1,base64(hmac_sha256(secret, msgId.timestamp.payload))
        var signedContent = $"{msgId}.{timestamp}.{payload}";
        var secret = _settings.WebhookSecret.Replace("whsec_", ""); // Remove prefix if present

        // Base64 decode the secret after removing whsec_ prefix (Svix requirement)
        var secretBytes = Convert.FromBase64String(secret);
        using var hmac = new HMACSHA256(secretBytes);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedContent));
        var signature = Convert.ToBase64String(hash);

        return new Dictionary<string, string>
        {
            ["svix-id"] = msgId,
            ["svix-timestamp"] = timestamp,
            ["svix-signature"] = $"v1,{signature}"
        };
    }
}
