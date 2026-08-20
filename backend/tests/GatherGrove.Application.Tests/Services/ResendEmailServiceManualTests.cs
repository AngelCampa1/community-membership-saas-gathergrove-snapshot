using NUnit.Framework;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Application.Configuration;
using Moq;
using Resend;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Simple wrapper to convert IOptions to IOptionsSnapshot for testing
/// </summary>
internal class OptionsSnapshotWrapper<T> : IOptionsSnapshot<T> where T : class, new()
{
    private readonly T _value;
    public OptionsSnapshotWrapper(T value) => _value = value;
    public T Value => _value;
    public T Get(string? name) => _value;
}

/// <summary>
/// Manual tests for ResendEmailService - These send real emails
/// Run individually with your Resend API key configured
/// </summary>
[TestFixture]
[Category("Manual")]
[Explicit("These tests send real emails - run manually only")]
public class ResendEmailServiceManualTests
{
    private IConfiguration _configuration;
    private ResendEmailService _service;

    [SetUp]
    public void SetUp()
    {
        // Load configuration
        _configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("../../../../src/GatherGrove.API/appsettings.json", optional: false)
            .AddJsonFile("../../../../src/GatherGrove.API/appsettings.Development.json", optional: true)
            .AddJsonFile("../../../../src/GatherGrove.API/appsettings.Development.local.json", optional: true)
            .Build();

        // Setup Resend service
        var resendSettings = new ResendSettings();
        _configuration.GetSection("Resend").Bind(resendSettings);
        var resendOptions = Options.Create(resendSettings);

        var clientOptions = new OptionsSnapshotWrapper<ResendClientOptions>(new ResendClientOptions { ApiToken = resendSettings.ApiToken });
        var httpClient = new System.Net.Http.HttpClient();
        var resendClient = new ResendClient(clientOptions, httpClient);

        var logger = new LoggerFactory().CreateLogger<ResendEmailService>();
        var mockUrlService = new Mock<IUrlService>();
        mockUrlService.Setup(u => u.GenerateActivationUrl(It.IsAny<string>()))
            .Returns((string token) => $"https://gathergrove.club/activate?token={token}");

        _service = new ResendEmailService(resendClient, resendOptions, logger, mockUrlService.Object);

        Console.WriteLine("✅ ResendEmailService initialized");
        Console.WriteLine($"From Address: {resendSettings.FromEmailAddress}");
        Console.WriteLine($"From Name: {resendSettings.FromName}");
        Console.WriteLine();
    }

    [Test]
    public async Task Test01_SendSimpleEmail()
    {
        Console.WriteLine("=== TEST 1: Simple Email ===");
        Console.WriteLine("This test sends a basic HTML email");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";

        var result = await _service.SendEmailAsync(
            email,
            "Test Email from Resend - GatherGrove",
            "<h1>Success!</h1><p>This is a test email from GatherGrove using Resend.</p><p>If you're reading this, the migration worked! 🎉</p>");

        Assert.That(result, Is.True);
        Console.WriteLine($"\n✅ Email sent to {email}");
        Console.WriteLine("Check your inbox!");
    }

    [Test]
    public async Task Test02_SendPaymentRequestEmail()
    {
        Console.WriteLine("=== TEST 2: Payment Request Email ===");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";

        await _service.SendPaymentRequestEmailAsync(
            email,
            "John Doe",
            "Test Club",
            50.00m,
            "Monthly membership dues",
            "https://gathergrove.club/pay/test123");

        Console.WriteLine($"\n✅ Payment request email sent to {email}");
    }

    [Test]
    public async Task Test03_SendMemberActivationEmail()
    {
        Console.WriteLine("=== TEST 3: Member Activation Email ===");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";

        await _service.SendMemberActivationEmailAsync(
            email,
            "Jane Smith",
            "Test Club",
            "test-token-12345");

        Console.WriteLine($"\n✅ Activation email sent to {email}");
    }

    [Test]
    public async Task Test04_SendEventPaymentConfirmation()
    {
        Console.WriteLine("=== TEST 4: Event Payment Confirmation ===");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";

        await _service.SendEventPaymentConfirmationEmailAsync(
            email,
            "Test Attendee",
            "Test Club",
            "Annual Gala 2026",
            new DateTime(2026, 3, 15, 19, 0, 0),
            "Grand Ballroom, Downtown Hotel",
            75.00m,
            "pi_test_12345",
            "CONF-2026-001");

        Console.WriteLine($"\n✅ Event confirmation email sent to {email}");
    }

    [Test]
    public async Task Test05_SendEmailWithAttachment()
    {
        Console.WriteLine("=== TEST 5: Email with PDF Attachment ===");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";

        // Create a simple PDF (this is just a test, real PDF would be properly formatted)
        var pdfContent = System.Text.Encoding.UTF8.GetBytes("%PDF-1.4\nTest PDF Content");

        var result = await _service.SendEmailWithAttachmentAsync(
            email,
            "Test Email with Attachment",
            "<p>This email includes a test attachment.</p>",
            pdfContent,
            "test-document.pdf");

        Assert.That(result, Is.True);
        Console.WriteLine($"\n✅ Email with attachment sent to {email}");
    }

    [Test]
    public async Task Test06_SendLeadMagnetEmail()
    {
        Console.WriteLine("=== TEST 6: Lead Magnet Email (with PDF) ===");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";

        // Create a test PDF
        var pdfContent = System.Text.Encoding.UTF8.GetBytes("%PDF-1.4\nClub Management Guide Test");

        await _service.SendLeadMagnetEmailAsync(
            email,
            "Marketing Lead",
            "club-management-guide",
            pdfContent);

        Console.WriteLine($"\n✅ Lead magnet email sent to {email}");
    }

    [Test]
    public async Task Test07_SendScheduledReport()
    {
        Console.WriteLine("=== TEST 7: Scheduled Report (with CSV attachment) ===");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";

        // Create a test CSV report
        var csvContent = System.Text.Encoding.UTF8.GetBytes("Name,Email,Status\nJohn Doe,john@test.com,Active\nJane Smith,jane@test.com,Active");

        await _service.SendScheduledReportAsync(
            new List<string> { email },
            "Monthly Member Report",
            csvContent,
            "member-report-january-2026.csv");

        Console.WriteLine($"\n✅ Scheduled report sent to {email}");
    }

    [Test]
    public async Task Test08_SendBulkEmail()
    {
        Console.WriteLine("=== TEST 8: Bulk Email ===");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";

        await _service.SendBulkEmailAsync(
            email,
            "Member Name",
            "Test Club",
            "Important Club Announcement",
            "<h2>Hello Members!</h2><p>This is a test bulk email from your club administration.</p><p>This message demonstrates the bulk email capability of GatherGrove.</p>");

        Console.WriteLine($"\n✅ Bulk email sent to {email}");
    }

    [Test]
    public async Task Test10_SendAdminInvitation()
    {
        Console.WriteLine("=== TEST 10: Admin Invitation Email ===");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";

        await _service.SendAdminInvitationEmailAsync(
            email,
            "Test Club",
            "Current Admin",
            "invite-token-xyz789");

        Console.WriteLine($"\n✅ Admin invitation email sent to {email}");
    }

    [Test]
    public async Task Test11_SendGuestEventPaymentConfirmation()
    {
        Console.WriteLine("=== TEST 11: Guest Event Payment Confirmation ===");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";

        await _service.SendGuestEventPaymentConfirmationEmailAsync(
            email,
            "Guest Attendee",
            "Special Networking Event",
            new DateTime(2026, 4, 20, 18, 30, 0),
            "Rooftop Venue",
            120.00m,
            membershipIncluded: true,
            confirmationNumber: "GUEST-2026-042",
            accountCreated: true,
            loginEmail: email);

        Console.WriteLine($"\n✅ Guest payment confirmation sent to {email}");
    }

    [Test]
    public async Task Test12_SendExportCompletionNotification()
    {
        Console.WriteLine("=== TEST 12: Export Completion Notification ===");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";

        await _service.SendExportCompletionNotificationAsync(
            email,
            "Your Export is Ready",
            "export-12345-67890",
            5242880); // 5MB

        Console.WriteLine($"\n✅ Export notification sent to {email}");
    }

    [Test]
    public async Task Test99_SendAllEmailTypes()
    {
        Console.WriteLine("=== COMPREHENSIVE TEST: All Email Types ===");
        Console.WriteLine("This test sends one example of each email type");
        Console.Write("Enter recipient email: ");
        var email = Console.ReadLine() ?? "test@example.com";
        Console.WriteLine();

        var tests = new List<(string name, Func<Task> action)>
        {
            ("Simple Email", async () => await _service.SendEmailAsync(email, "Test 1/12: Simple Email", "<p>Test email 1 of 12</p>")),
            ("Payment Request", async () => await _service.SendPaymentRequestEmailAsync(email, "Test User", "Test Club", 25.00m, "Test payment", "https://test.com/pay")),
            ("Member Activation", async () => await _service.SendMemberActivationEmailAsync(email, "Test User", "Test Club", "token123")),
            ("Event Confirmation", async () => await _service.SendEventPaymentConfirmationEmailAsync(email, "Test", "Club", "Event", DateTime.Now.AddDays(30), "Location", 50m, "pi_123", "CONF-001")),
            ("With Attachment", async () => await _service.SendEmailWithAttachmentAsync(email, "Test 5/12: Attachment", "<p>Has attachment</p>", new byte[] { 1, 2, 3 }, "test.txt")),
            ("Lead Magnet", async () => await _service.SendLeadMagnetEmailAsync(email, "Lead", "club-management-guide", new byte[] { 0x25, 0x50, 0x44, 0x46 })),
            ("Scheduled Report", async () => await _service.SendScheduledReportAsync(new List<string> { email }, "Test 7/12: Report", new byte[] { 1, 2, 3 }, "report.csv")),
            ("Bulk Email", async () => await _service.SendBulkEmailAsync(email, "Member", "Club", "Test 8/12: Bulk", "<p>Bulk email test</p>")),
            ("Admin Invitation", async () => await _service.SendAdminInvitationEmailAsync(email, "Club", "Admin", "invite123")),
            ("Guest Confirmation", async () => await _service.SendGuestEventPaymentConfirmationEmailAsync(email, "Guest", "Event", DateTime.Now.AddDays(15), "Venue", 75m, true, "G-001", true, email)),
            ("Export Notification", async () => await _service.SendExportCompletionNotificationAsync(email, "Test 12/12: Export Ready", "exp123", 1024000))
        };

        int success = 0;
        int failed = 0;

        foreach (var (name, action) in tests)
        {
            try
            {
                Console.Write($"Sending {name}... ");
                await action();
                Console.WriteLine("✅");
                success++;
                await Task.Delay(500); // Small delay between emails
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed: {ex.Message}");
                failed++;
            }
        }

        Console.WriteLine();
        Console.WriteLine($"===  Results ===");
        Console.WriteLine($"✅ Successful: {success}");
        Console.WriteLine($"❌ Failed: {failed}");
        Console.WriteLine($"📧 Total sent to: {email}");
        Console.WriteLine();
        Console.WriteLine("Check your inbox! You should have 12 emails.");

        Assert.That(success, Is.EqualTo(tests.Count), $"Expected all {tests.Count} emails to send successfully");
    }
}
